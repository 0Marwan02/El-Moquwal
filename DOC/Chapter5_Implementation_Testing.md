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
The backend follows a modular directory structure under `backend/src/`, with dedicated subdirectories for configuration (environment loading and database connection), controllers (business logic handlers for authentication, projects, bids, payments, and more), middleware (Express middlewares for JWT authentication, RBAC enforcement, and file upload handling), models (Mongoose schema and discriminator definitions), routes (Express API route declarations), templates (HTML templates including the Arabic contract template), and utilities (shared logic for National ID parsing, AI services, and PDF generation). The application entry point is `server.js`, which initialises the Express application and connects all modules.

### 5.2.3 Environment Configuration
The system relies on a strictly managed environment configuration file to securely store secrets and infrastructure endpoints. This includes the MongoDB connection string, cryptographic keys for JWT token generation, external AI provider credentials (Anthropic and Pollinations.ai), and email service configuration. All sensitive values are loaded at startup and validated to prevent the application from running with missing critical configuration.

## 5.3 Technology Stack Deep Dive

### 5.3.1 Node.js and Express.js
Node.js was selected for its non-blocking, event-driven architecture, ideal for handling numerous concurrent API requests. Express.js acts as the minimal routing framework, applying sequential middleware chains (e.g., `express.json()`, `cors`, `helmet` for security headers, and `express-rate-limit` to thwart DDoS attempts).

### 5.3.2 MongoDB and Mongoose
MongoDB's document-oriented structure natively aligns with JSON, allowing fluid data handling. Mongoose is crucial here; it provides rigorous schema validation at the application layer, preventing unstructured data injection. The implementation heavily utilizes the **Discriminator Pattern** to store all user variants in a single collection while enforcing different required fields.

### 5.3.3 Argon2id Password Security
For cryptographic hashing, the system utilizes Argon2id over legacy bcrypt. Argon2id is highly resistant to both GPU cracking and side-channel attacks. This is applied not only to user passwords but also to the highly sensitive Egyptian National Identification Numbers.

## 5.4 Key Algorithm Implementations

### 5.4.1 Egyptian National ID Parser
The system ensures KYC compliance by mathematically parsing the user's National Identification Number upon registration. The parser accepts the 14-digit NID string and extracts structured demographic information according to Egyptian civil registry rules.

The first digit indicates the century (2 for the 1900s, 3 for the 2000s), followed by two digits for the birth year, two for the month, and two for the day. Digits 8–9 encode the governorate of registration using standardised codes that map to all 27 Egyptian governorates. The 13th digit determines gender — odd numbers indicate male, even numbers indicate female.

The parser validates each component: it rejects NIDs with invalid century digits, impossible date combinations, or unrecognised governorate codes. Valid results return a structured object containing the birth year, month, day, gender, and governorate name. The NID itself is never stored in plaintext — it is hashed using Argon2id, with only the last four digits retained for display purposes. This approach prevents users from registering with syntactically fake NIDs while maintaining strict data protection.

### 5.4.2 PDF Contract Generation
Translating digital agreements into legally structured documents is handled through headless browser rendering using Puppeteer (Chromium). This approach was chosen specifically because it handles complex Arabic Right-to-Left (RTL) text shaping and embedded CSS styles significantly better than legacy PDF libraries.

The generation process follows four steps. First, the system reads a pre-designed Arabic HTML contract template that contains placeholder tokens for dynamic values. Second, it constructs cryptographic signature blocks for both the customer and contractor, each containing an SHA256 hash of the signing context (IP address, User-Agent, and timestamp) to ensure non-repudiation. Third, the template placeholders are replaced with the actual contract data — project details, agreed amount, party information, warranty terms, and the computed signature blocks. Fourth, Puppeteer launches a headless Chrome instance configured with Arabic locale headers, renders the populated HTML, and exports it as an A4-format PDF with professional print margins.

The resulting PDF serves as the binding agreement between both parties, compliant with the structural requirements of Egyptian civil law (Law 131/1948) for service contracts.

### 5.4.3 AI Price Estimation Service
El-Moquwal provides fair-value cost estimates to customers before they commit to publishing a project. The estimation service uses a dual-provider architecture to ensure reliability.

The primary provider is Pollinations.ai, a free OpenAI-compatible endpoint. When a customer requests an estimate, the system constructs a structured prompt containing the project type, governorate, property area in square metres, budget range, and any additional description. The prompt includes a system instruction that constrains the AI model to return its response in a specific JSON format containing minimum and maximum price estimates in Egyptian Pounds, along with Arabic-language reasoning.

If the primary provider fails (due to rate limiting, network issues, or service unavailability), the system automatically falls back to Anthropic Claude as a secondary provider, using the same prompt structure. The raw text response from either provider is processed through a robust JSON extraction function that uses pattern matching to isolate the JSON block even when the model includes conversational preamble or markdown formatting. Successful estimates are cached on the project record for one hour to minimise API costs and ensure consistency across repeated views.

### 5.4.4 Authentication and Authorisation Middleware
Security routing relies on a modular middleware chain that enforces Role-Based Access Control at every API endpoint. The permission middleware accepts a list of required permissions and checks them against the authenticated user's profile.

Super Administrators are granted unrestricted access and bypass all permission checks automatically. For regular administrators, the middleware verifies that each required permission exists in the user's assigned permissions array — if any required permission is missing, the request is rejected with an "insufficient permissions" response. This granular approach means that an administrator with "view_stats" permission cannot access dispute resolution endpoints unless they also hold the "manage_disputes" permission.

The middleware chain is composable: route definitions stack multiple middleware functions in sequence — first verifying authentication (valid JWT token), then verifying role membership, and finally verifying specific permissions — creating a layered security boundary that is both flexible and strict.

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
This chapter detailed the transformation of the system architecture into a working software application. By describing the critical algorithms — such as the Egyptian NID demographic parser, the headless Puppeteer Arabic PDF generator, and the resilient dual-provider LLM estimation service — it demonstrated the platform's technical depth. Coupled with an exhaustive unit, integration, and security testing framework, the El-Moquwal backend is proven to be secure, compliant with Egyptian law, and functionally capable of supporting high-volume contracting operations.
