# Chapter 5: Implementation and Testing

## 5.1 Introduction
This chapter bridges the gap between theoretical design and practical realization. It details the precise implementation of the El-Moquwal system architecture, providing direct insights into the source code that powers the core business logic. Furthermore, this chapter outlines the comprehensive testing strategy employed to guarantee system reliability, security, and performance. By examining the actual code excerpts alongside their corresponding test cases, we demonstrate the robustness of the Egyptian construction marketplace.

## 5.2 Development Environment

### 5.2.1 Hardware and Software Requirements
- **Development Machines:** Intel Core i7 / Apple M1 or higher, minimum 16GB RAM.
- **Server Environment:** Node.js (v18.x LTS), NPM (v9.x).
- **Database Server:** MongoDB Community Server (v6.0+).
- **Tools:** Git for version control, Postman for API testing, Visual Studio Code as the primary IDE.

### 5.2.2 Project Structure
The backend adheres to a highly modular directory layout:
```text
backend/
├── src/
│   ├── config/      # Environment loading (env.js), Database connection
│   ├── controllers/ # Business logic handlers (auth, project, bid, payment)
│   ├── middleware/  # Express middlewares (JWT auth, RBAC, file upload)
│   ├── models/      # Mongoose schemas & discriminator definitions
│   ├── routes/      # Express API route declarations
│   ├── templates/   # HTML templates (e.g., Arabic contract template)
│   └── utils/       # Shared logic (nationalId parser, ai.service, pdfGenerator)
└── server.js        # Entry point for the Express application
```

### 5.2.3 Environment Configuration
The system relies on a strictly typed `.env` file to manage secrets and infrastructure endpoints securely. Key variables include:
- `MONGO_URI`: The MongoDB connection string.
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`: Cryptographic keys for token generation.
- `ANTHROPIC_API_KEY` / `HF_API_TOKEN`: External AI provider credentials.

## 5.3 Technology Stack Deep Dive

### 5.3.1 Node.js and Express.js
Node.js was selected for its non-blocking, event-driven architecture, ideal for handling numerous concurrent API requests. Express.js acts as the minimal routing framework, applying sequential middleware chains (e.g., `express.json()`, `cors`, `helmet` for security headers, and `express-rate-limit` to thwart DDoS attempts).

### 5.3.2 MongoDB and Mongoose
MongoDB’s document-oriented structure natively aligns with JSON, allowing fluid data handling. Mongoose is crucial here; it provides rigorous schema validation at the application layer, preventing unstructured data injection. The implementation heavily utilizes the **Discriminator Pattern** to store all user variants in a single collection while enforcing different required fields.

### 5.3.3 Argon2id Password Security
For cryptographic hashing, the system utilizes Argon2id over legacy bcrypt. Argon2id is highly resistant to both GPU cracking and side-channel attacks. This is applied not only to user passwords but also to the highly sensitive Egyptian National Identification Numbers.

## 5.4 Key Algorithm Implementations

### 5.4.1 Egyptian National ID Parser
The system ensures KYC compliance by mathematically parsing the user's NID upon registration.
*Implementation excerpt from `utils/nationalId.js`:*

```javascript
// by3ml parse lel raqam el qawmy el masry (14 raqam)
function parseNID(nid) {
  if (!isFormatValid(nid)) return { valid: false };

  const centuryDigit = nid.charAt(0); // 2 for 1900s, 3 for 2000s
  const yearStr = nid.substring(1, 3);
  const mm = nid.substring(3, 5);
  const dd = nid.substring(5, 7);
  const govCode = nid.substring(7, 9);
  const genderDigit = parseInt(nid.charAt(12), 10);

  // Define Century
  const century = centuryDigit === '2' ? 1900 : centuryDigit === '3' ? 2000 : null;
  if (!century) return { valid: false, reason: 'Invalid century digit' };
  
  const year = century + parseInt(yearStr, 10);

  // Resolve Governorate
  const governorate = GOVERNORATES[govCode] || 'غير معروف';
  if (governorate === 'غير معروف') return { valid: false, reason: 'Invalid governorate code' };

  // Resolve Gender (odd = male, even = female)
  const gender = genderDigit % 2 === 0 ? 'female' : 'male';

  return {
    valid: true,
    year,
    month: mm,
    day: dd,
    gender,
    governorateCode: govCode,
    governorate,
    century,
  };
}
```
**Explanation:** This pure function deconstructs the 14-digit string based on Egyptian registry rules. It prevents users from registering with syntactically fake NIDs, returning structured demographics that are saved to the user profile, while the NID itself is hashed.

### 5.4.2 PDF Contract Generation
Translating digital agreements into legally binding physical documents is handled via headless Chrome.
*Implementation excerpt from `utils/pdfGenerator.js`:*

```javascript
async function generatePDFContract(contract) {
  const filename = `contract_${contract._id}.pdf`;
  const filePath = path.join(CONTRACTS_DIR, filename);

  // 1. Read Arabic HTML Template
  const templatePath = path.resolve(__dirname, '../templates/contract-template.html');
  let html = fs.readFileSync(templatePath, 'utf8');

  // 2. Build Cryptographic Signature Blocks
  const custSig = buildSigBlock(contract.customerSignature);
  const contSig = buildSigBlock(contract.contractorSignature);

  // 3. Inject Values using Placeholders
  html = html
    .replace('{{CONTRACT_ID}}', contract._id.toString())
    .replace('{{DATE}}', safe(contract.generatedAt ? contract.generatedAt.toISOString().split('T')[0] : ''))
    .replace('{{CUSTOMER_SIG}}', custSig)
    .replace('{{CONTRACTOR_SIG}}', contSig);

  // 4. Render to PDF via Puppeteer
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // Set Arabic locale for proper text shaping
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'ar-EG,ar;q=0.9' });
  await page.setContent(html, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: filePath,
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' }
  });

  await browser.close();
  return filename;
}
```
**Explanation:** Puppeteer is chosen specifically because it handles complex Arabic RTL text shaping and embedded CSS styles infinitely better than legacy tools like `wkhtmltopdf`. The script injects an SHA256 signature hash to comply with Egyptian electronic signature laws.

### 5.4.3 AI Price Estimation Service
El-Moquwal provides fair-value estimates via an AI fallback architecture.
*Implementation excerpt from `utils/ai.service.js`:*

```javascript
async function callLLM(prompt, options = {}) {
  // Uses Pollinations AI (free OpenAI compatible endpoint)
  const response = await fetch('https://text.pollinations.ai/openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'openai',
      messages: [{ role: 'system', content: options.systemPrompt }, { role: 'user', content: prompt }],
      temperature: options.temperature,
    }),
  });
  const data = await response.json();
  return data.choices[0].message.content.trim();
}
```
**Explanation:** To reduce operational costs, the system attempts to fetch the estimate via Pollinations.ai. If this fails, the system orchestrator falls back to Anthropic Claude (if the API key is present in `.env`). The raw text response is then piped through `parseJsonResponse` which utilizes Regex to forcefully extract the JSON block, even if the LLM outputted conversational preamble.

### 5.4.4 JWT Middleware Chain
Security routing relies on modular middleware.
*Implementation excerpt from `middleware/auth.js`:*

```javascript
function requirePermission(...perms) {
  return (req, res, next) => {
    if (!req.user) return next(new AppError('غير مصرح', 401, 'UNAUTHORIZED'));
    
    // super_admin has unrestricted access — bypass all permission checks
    if (req.user.role === 'super_admin') return next();
    
    // regular admin — verify each required permission exists in the user's permissions array
    const userPerms = Array.isArray(req.user.permissions) ? req.user.permissions : [];
    const missing = perms.filter(p => !userPerms.includes(p));
    if (missing.length > 0) {
      return next(new AppError(`ليس لديك صلاحية لهذا الإجراء`, 403, 'INSUFFICIENT_PERMISSIONS'));
    }
    next();
  };
}
```
**Explanation:** This snippet demonstrates granular Role-Based Access Control. Super Admins bypass checks, while regular Admins are restricted based on their specific arrays (e.g., `manage_disputes`).

## 5.5 Testing Strategy

### 5.5.1 Overview
Testing was executed across multiple dimensions: Unit tests for core utility algorithms, Integration tests for API endpoint interactions, and Security tests for authorization boundaries.

### 5.5.2 Testing Tools
- **Framework:** Jest (for isolated JavaScript unit tests).
- **API Testing:** Postman Collections with pre-request scripts and assertions.

## 5.6 Unit Testing

### 5.6.1 National ID Parser Tests
| Input NID | Scenario | Expected Output | Result |
|-----------|----------|-----------------|--------|
| `29501010100018` | Valid 1995 Male (Cairo) | `{ valid: true, year: 1995, gender: 'male', governorate: 'القاهرة' }` | Pass |
| `30005050200027` | Valid 2000 Female (Alex) | `{ valid: true, year: 2000, gender: 'female', governorate: 'الإسكندرية' }` | Pass |
| `19501010100018` | Invalid Century Digit (1) | `{ valid: false, reason: 'Invalid century digit' }` | Pass |
| `29501019900018` | Invalid Governorate (99) | `{ valid: false, reason: 'Invalid governorate code' }` | Pass |

### 5.6.2 JSON Parser Tests (parseJsonResponse)
| Input Scenario | Expected Output | Result |
|----------------|-----------------|--------|
| Clean JSON string `{"min":100}` | JavaScript Object | Pass |
| Markdown fences ` ```json {"min":100} ``` ` | JavaScript Object | Pass |
| Arabic Preamble `إليك النتيجة: {"min":100}`| JavaScript Object | Pass |

## 5.7 Integration Testing

### 5.7.1 Authentication Endpoints
| Method | Endpoint | Test Scenario | Expected Status |
|--------|----------|---------------|-----------------|
| POST | `/api/auth/register/customer` | Valid payload | `201 Created` |
| POST | `/api/auth/register/contractor`| Missing NID photo | `400 Bad Request` |
| POST | `/api/auth/login` | Valid Credentials | `200 OK` (Tokens returned) |
| POST | `/api/auth/login` | Invalid Password | `401 Unauthorized` |
| GET | `/api/auth/me` | Valid Access Token | `200 OK` |
| GET | `/api/auth/me` | No Token Provided | `401 Unauthorized` |

### 5.7.2 Project & Bidding Endpoints
| Method | Endpoint | Test Scenario | Expected Status |
|--------|----------|---------------|-----------------|
| POST | `/api/projects` | Customer creates project | `201 Created` |
| POST | `/api/projects` | Contractor attempts creation | `403 Forbidden` |
| POST | `/api/projects/:id/bids` | Active contractor bids | `201 Created` (Credits deducted) |
| POST | `/api/projects/:id/bids` | Contractor bids twice | `409 Conflict` |

## 5.8 System Testing Scenarios

### Scenario 1: Complete Project Lifecycle
**Flow:** Customer registers → Posts new project → Contractor logs in → Submits Blind Bid (deducts 2 credits) → Customer reviews bids → Accepts bid → Escrow deposited (status changes to 'held') → Auto-generates Contract → Both parties sign PDF → First milestone work finishes → Customer releases milestone → Project closed and rated.
**Result:** Passed. Data integrity maintained across 5 linked collections (User, Project, Bid, Escrow, Contract).

### Scenario 2: Contractor Onboarding
**Flow:** Contractor registers (uploads NID) → Status set to 'pending' → Admin logs in → Navigates to pending queue → Approves contractor → Status becomes 'active' → Contractor logs in → Dashboard detects first-login flag → Contractor utilizes initial 5 free credits.
**Result:** Passed. RBAC constraints properly blocked the pending contractor from bidding prior to approval.

## 5.9 Security Testing

### 5.9.1 RBAC Boundary Testing
A strict evaluation of the API boundaries to ensure unauthorized roles cannot escalate privileges.
| Actor Role | Action Attempted | Expected Status | Result |
|------------|------------------|-----------------|--------|
| Contractor | Attempt to Publish a Project | `403 Forbidden` | Pass |
| Customer | Attempt to view opponent bid amounts | `200 OK` (Amounts hidden via `toBlindJSON()`) | Pass |
| Admin (Stats) | Attempt to review contractors | `403 Forbidden` | Pass |

### 5.9.2 Rate Limiting and Brute Force Tests
Scripted attacks were executed against the `/api/auth/login` endpoint to trigger defensive mechanisms.
- **Scenario:** 6 failed logins sequentially within 1 minute.
- **Outcome:** The 6th attempt successfully returned a `423 Locked` HTTP status code. The `lockUntil` field was successfully verified in the MongoDB document.

## 5.10 Chapter Summary
This chapter rigorously detailed the transformation of the system architecture into a living software application. By highlighting critical code segments—such as the complex NID demographic parser, the headless Puppeteer Arabic PDF generator, and the resilient LLM estimation service—it demonstrated the platform's advanced technical depth. Coupled with an exhaustive unit, integration, and security testing framework, the El-Moquwal backend is proven to be secure, compliant with Egyptian law, and functionally capable of supporting high-volume contracting operations.
