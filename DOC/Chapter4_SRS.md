# Chapter 4: Software Requirements Specification (SRS)

## 4.1 Introduction
### 4.1.1 Purpose
This Software Requirements Specification (SRS) document provides a comprehensive blueprint of the El-Moquwal platform, Egypt’s premier digital construction marketplace. It aims to clearly outline the system's functional boundaries, user interactions, and technical constraints, acting as a definitive contract between stakeholders, developers, and academic evaluators.

### 4.1.2 Document Scope
This document covers the functional requirements, non-functional requirements (NFRs), and external interfaces of the entire El-Moquwal ecosystem. This includes the web-based SPA client, the Node.js REST API backend, the integrated AI microservices, the automated PDF contract generation system, and the robust escrow and dispute resolution infrastructure.

### 4.1.3 Definitions, Acronyms, and Abbreviations
| Term | Definition |
|------|------------|
| SPA | Single Page Application (Client-side rendering) |
| JWT | JSON Web Token (Used for authentication/authorization) |
| NID | National Identification Number (Egyptian 14-digit format) |
| RBAC | Role-Based Access Control |
| API | Application Programming Interface |
| KYC | Know Your Customer (Verification of identity) |
| EGP | Egyptian Pound (Primary currency of the system) |

### 4.1.4 Overview
The remainder of this chapter introduces the operational perspective of the product, followed by an exhaustive list of Functional Requirements (grouped systematically by core modules) and Non-Functional Requirements. A Traceability Matrix concludes the chapter, mapping these requirements strictly to their modules.

## 4.2 Overall Description

### 4.2.1 Product Perspective
El-Moquwal operates as an independent, centralized marketplace that heavily interfaces with distinct external components:
- **Pollinations.ai / Anthropic API:** For intelligent, market-aware budget estimation.
- **Paymob / Mock Gateway:** Handling financial interactions for escrow routing.
- **Local Filesystem/Puppeteer:** Facilitating the legal generation of physical PDF contracts.

### 4.2.2 Product Functions
1. **Customers** can digitize their project scope, receive encrypted bids, release milestone escrow funds, and sign enforceable contracts.
2. **Contractors** can browse localized projects, utilize pre-paid credits to submit blind bids, manage comprehensive portfolios, and list surplus construction materials.
3. **Admins** manage risk through rigorous KYC verification of contractors and neutral arbitration of financial disputes.

### 4.2.3 User Classes and Characteristics
- **Customer (العميل):** Property owners with varying degrees of technical literacy. Requires a simplified, transparent UI focusing on visual progress and security.
- **Contractor (المقاول):** Industry professionals (engineers, technicians). Expected to utilize the platform frequently to secure work and manage their portfolio.
- **Admin (المدير):** Internal operational staff responsible for maintaining platform integrity, requiring granular permissions to view system metrics and resolve tickets.
- **Super Admin:** System administrators with ultimate control over platform economics (adjusting commission rates, bid costs) and staff provisioning.

### 4.2.4 Operating Environment
- **Backend:** Node.js (v18+) hosted on scalable cloud infrastructure.
- **Database:** MongoDB configured with replica sets for high availability.
- **Client:** Modern web browsers (Chrome, Safari, Edge) with full JavaScript support.

### 4.2.5 Design and Implementation Constraints
- **Egyptian Law Compliance:** The PDF generator must adhere strictly to Law 131/1948 structuring for civil contracts.
- **NID Formatting:** NIDs must strictly follow the `C YY MM DD GG SSSS G K` pattern native to Egypt.
- **Phone Formatting:** Must strictly validate the `01[0125]XXXXXXXX` Egyptian mobile operator regex.
- **RTL Support:** The entire UI and all generated PDF contracts must flawlessly support Arabic Right-To-Left text rendering.

## 4.3 Functional Requirements

### 4.3.1 Authentication Module
**FR-001: Customer Registration**
- **Description:** The system shall allow property owners to register an account.
- **Actor:** Customer
- **Preconditions:** Unregistered user.
- **Postconditions:** User document created with 'customer' role.
- **Business Rules:** National ID is validated and mathematically hashed. Only the last 4 digits are stored in plaintext.

**FR-002: Contractor Registration**
- **Description:** The system shall allow professionals to register with a required NID photo upload.
- **Actor:** Contractor
- **Preconditions:** Unregistered user.
- **Postconditions:** User document created with 'contractor' role and 'pending' status.
- **Business Rules:** Must include a valid 5MB max image file. Account remains locked from bidding until Admin approval.

**FR-003: National ID Parsing and Validation**
- **Description:** The system shall extract the Date of Birth, Gender, and Governorate dynamically from the 14-digit NID.
- **Actor:** System
- **Preconditions:** User inputs NID during registration.
- **Postconditions:** Demographic variables appended to user profile.
- **Business Rules:** Fails registration if century digit or governorate code is mathematically invalid.

**FR-004: User Login**
- **Description:** The system shall authenticate users via email, phone, or NID identifier.
- **Actor:** All Users
- **Preconditions:** Valid registered account.
- **Postconditions:** Dual JWT tokens (Access and HTTP-only Refresh) issued to client.
- **Business Rules:** Password verification via Argon2id. Checks if status is 'suspended'.

**FR-005: Account Lockout after Failed Attempts**
- **Description:** The system shall enforce brute-force protection.
- **Actor:** System
- **Preconditions:** 5 consecutive invalid login attempts.
- **Postconditions:** Account `lockUntil` field populated for 15 minutes.

### 4.3.2 Project Management Module
**FR-021: Create Draft Project**
- **Description:** Customers can save incomplete project briefs.
- **Actor:** Customer
- **Preconditions:** Authenticated customer.
- **Postconditions:** Project document saved with status 'draft'.

**FR-022: Publish Project**
- **Description:** Customers can transition a project to public visibility.
- **Actor:** Customer
- **Preconditions:** Draft contains all required parameters (title, description, budgetRange).
- **Postconditions:** Project status changes to 'open'. Bidding allowed.

**FR-023: Upload Project Photos**
- **Description:** The system shall accept visual context for projects.
- **Actor:** Customer
- **Preconditions:** Project in draft or open state.
- **Postconditions:** Array of image URLs appended to project document.
- **Business Rules:** Maximum limit strictly enforced at 20 photos per project.

### 4.3.3 Blind Bidding Module
**FR-046: Submit Bid**
- **Description:** Active contractors can submit a proposed timeline and financial amount.
- **Actor:** Contractor
- **Preconditions:** Contractor `status` is 'active'. Project `status` is 'open'.
- **Postconditions:** Bid document created. Deducts the required credit amount dynamically.
- **Business Rules:** Unique compound index ensures only one active bid per contractor per project.

**FR-047: Blind Bidding Enforcement**
- **Description:** The API shall obfuscate financial details of competing bids.
- **Actor:** System
- **Preconditions:** Contractor fetches list of bids on a project.
- **Postconditions:** API strips the `amount` and `message` properties via the `toBlindJSON()` method.

**FR-048: Accept Bid**
- **Description:** Customer selects the winning proposal.
- **Actor:** Customer
- **Preconditions:** Project status is 'open'.
- **Postconditions:** Bid status changes to 'accepted'. All other bids changed to 'rejected'. Project status changes to 'awarded'.

### 4.3.4 Credit System Module
**FR-061: Signup Grant**
- **Description:** The system shall issue initial bidding currency to new contractors.
- **Actor:** System
- **Preconditions:** Admin approves Contractor KYC.
- **Postconditions:** 5 credits added to balance. `CreditLedger` entry created with reason 'signup_grant'.

**FR-063: Credit Deduction on Bid Submission**
- **Description:** Submitting proposals requires upfront currency.
- **Actor:** System
- **Preconditions:** Contractor has sufficient balance.
- **Postconditions:** Balance decremented by 1, 2, or 3 credits based on the target project's budget range.

### 4.3.5 Escrow & Milestone Payment Module
**FR-076: Deposit Full Project Amount into Escrow**
- **Description:** The system acts as a neutral financial intermediary.
- **Actor:** Customer
- **Preconditions:** Bid accepted.
- **Postconditions:** Escrow document created with status 'held'.

**FR-078: Release Specific Milestone to Contractor**
- **Description:** Upon completion of a project phase, funds are routed to the executor.
- **Actor:** Customer
- **Preconditions:** Escrow status is 'held' or 'partially_released'.
- **Postconditions:** Milestone status updated to 'released'. System deducts 2% commission from the transferred amount.

### 4.3.6 Electronic Contracts Module
**FR-096: Auto-Generate Contract After Bid Acceptance**
- **Description:** The system automatically binds the two parties.
- **Actor:** System
- **Preconditions:** Customer clicks Accept Bid.
- **Postconditions:** A Contract document is spawned inheriting a hard snapshot of the Project requirements and Bid conditions.

**FR-098: Digital Signature Capture**
- **Description:** Both parties cryptographically sign the agreement.
- **Actor:** Customer / Contractor
- **Preconditions:** Contract status is 'pending_signatures'.
- **Postconditions:** Signature object populated with `signed=true`, IP Address, User-Agent, and a secure SHA256 hash.

**FR-103: PDF Generated with Puppeteer**
- **Description:** The finalized contract is compiled into a physical document.
- **Actor:** System
- **Preconditions:** Both parties have signed.
- **Postconditions:** Puppeteer engine renders the Arabic HTML template to a locked A4 PDF file stored in the uploads directory.

### 4.3.7 AI Price Estimation Module
**FR-111: Request AI Estimate for Published Project**
- **Description:** The system queries an external LLM to estimate costs.
- **Actor:** System (triggered on project publish)
- **Preconditions:** Valid project description and parameters.
- **Postconditions:** Structured JSON parsed containing `minEstimate`, `maxEstimate`, and `reasoning`. Cached on the project document for exactly 1 hour.

## 4.4 Use Case Specifications

This section defines the behavior of the key transactional use cases of the El-Moquwal platform in a structured tabular format.

### 4.4.1 UC-01: User Registration and KYC Verification
*Table 4.2: Use Case UC-01: User Registration and KYC Verification*
**Use Case ID:** UC-01

**Use Case Name:** User Registration and KYC Verification

**Primary Actor:** Customer / Contractor

**Description:** Handles user registration, parses demographics from Egyptian National ID, and initiates manual KYC check for contractors.

**Preconditions:** User is not logged in; has a valid unique email, phone number, and 14-digit Egyptian National ID.

**Basic Flow:**
  - 1. User selects registration type (Customer or Contractor).
  - 2. User fills required registration inputs.
  - 3. If Contractor, uploads a photo of their National ID card.
  - 4. System validates input formats (e.g., email regex, phone operator regex).
  - 5. System checks mathematical validity of National ID using birth year, month, day, and governorate checksum algorithms.
  - 6. System hashes password using Argon2id and hashes NID using SHA-256 (to check duplicates).
  - 7. System parses and saves gender, DOB, and governorate from NID digits.
  - 8. System generates and sends an email OTP.
  - 9. User submits OTP to verify their email.
  - 10. Customer account status is set to `active`; Contractor status is set to `pending`.

**Alternative Flow:**
  - *Invalid National ID:* If NID checksum is invalid, system halts registration and displays error message.
  - *Duplicate Credentials:* If email, phone, or NID hash exists, system rejects registration with HTTP 409.
  - *KYC Rejection:* If Admin rejects contractor NID photo, status becomes `rejected` with an explanatory email.

**Postconditions:** User profile created in MongoDB. Bidding is disabled for contractors until status changes to `approved`.
### 4.4.2 UC-02: Project Publication and AI Price Estimation
*Table 4.3: Use Case UC-02: Project Publication and AI Price Estimation*
**Use Case ID:** UC-02

**Use Case Name:** Project Publication and AI Price Estimation

**Primary Actor:** Customer

**Description:** Allows property owners to draft a project, run an AI cost estimation based on finishing parameters, and publish it to the marketplace.

**Preconditions:** Customer is authenticated and profile is active.

**Basic Flow:**
  - 1. Customer enters project details (Title, Type, Area, Location, Governorate, Description).
  - 2. Customer uploads optional reference photos.
  - 3. Customer clicks "Request AI Estimate".
  - 4. System compiles parameters and prompts the LLM service (Pollinations / Anthropic).
  - 5. LLM service computes min/max EGP price ranges and writes structural Arabic explanation.
  - 6. System displays the estimate and saves it to the project document.
  - 7. Customer clicks "Publish Project" to make it public.

**Alternative Flow:**
  - *AI API Down:* System catches timeout and falls back to a cached, static EGP rate-matrix indexed by governorate and finishing specialty to generate an estimated budget range.

**Postconditions:** Project status transitions from `draft` to `open` and is indexed in search queries.
### 4.4.3 UC-03: Blind Bidding Submission
*Table 4.4: Use Case UC-03: Blind Bidding Submission*
**Use Case ID:** UC-03

**Use Case Name:** Blind Bidding Submission

**Primary Actor:** Contractor

**Description:** Allows approved contractors to bid on open projects using platform credits. Bids remain blind to competitors.

**Preconditions:** Contractor is authenticated, approved (KYC status `approved`), and has a positive credit balance.

**Basic Flow:**
  - 1. Contractor browses open projects (filtered by specialty).
  - 2. Contractor selects project details and enters bid amount (EGP), duration (days), and proposal message.
  - 3. Contractor clicks "Submit Bid".
  - 4. System determines credit cost (1 for budget under 50k, 2 for 50k-200k, 3 for above 200k).
  - 5. System checks and decrements Contractor's credit balance.
  - 6. System saves Bid document in `pending` state and increments project's `bidsCount`.

**Alternative Flow:**
  - *Low Credits:* If credit balance < required credits, system blocks submission and redirects to buy-credits page.
  - *Double Bids:* Compound index `{ project, contractor }` prevents double bidding; rejects with HTTP 409.

**Postconditions:** Bid registered. Bidding amount is masked for all other contractors fetching the bids list.
### 4.4.4 UC-04: Digital Contract Signing
*Table 4.5: Use Case UC-04: Digital Contract Signing*
**Use Case ID:** UC-04

**Use Case Name:** Digital Contract Signing

**Primary Actor:** Customer & Contractor

**Description:** Generates an Arabic civil contract upon bid acceptance, which must be signed digitally by both parties to activate the project.

**Preconditions:** Customer has accepted a Contractor's bid; project status is `awarded`.

**Basic Flow:**
  - 1. System automatically creates a Contract document in `pending_signatures` state.
  - 2. Customer reviews terms, draws signature on canvas, and submits signature.
  - 3. System records Customer signature (IP address, timestamp, browser headers, and SHA-256 hash).
  - 4. Contractor is notified via email/SMS.
  - 5. Contractor reviews terms, submits signature.
  - 6. System records Contractor signature details.
  - 7. Once both sign, contract transitions to `active`.
  - 8. System invokes Puppeteer in background to compile the HTML Arabic template, signatures, and stamps into a static A4 PDF contract file.

**Alternative Flow:**
  - *Draft Rejection:* Either party can reject the contract draft, reverting the project status to `open` or initiating admin dispute review.

**Postconditions:** A legally structured, tamper-proof Arabic contract PDF is stored, and the escrow deposit phase is unlocked.
### 4.4.5 UC-05: Escrow Milestone Funding and Payment Release
*Table 4.6: Use Case UC-05: Escrow Milestone Funding and Payment Release*
**Use Case ID:** UC-05

**Use Case Name:** Escrow Milestone Funding and Payment Release

**Primary Actor:** Customer & Contractor

**Description:** Holds project funds in a secure escrow ledger and releases them to the contractor across three major milestones (30% / 40% / 30%) upon approval.

**Preconditions:** Contract status is `active`.

**Basic Flow:**
  - 1. Customer pays total project value via integrated gateway (Paymob / Fawry).
  - 2. Escrow status changes to `held`. Contractor is notified to start work.
  - 3. Contractor completes Phase 1 and requests release.
  - 4. Customer inspects site and clicks "Release Milestone 1".
  - 5. System deducts 2% platform commission and transfers 98% of the milestone value (30% of total) to Contractor's balance.
  - 6. Steps repeat for Phase 2 (40%) and Phase 3 (30%).
  - 7. Once final milestone is released, Contract is updated to `completed`.

**Alternative Flow:**
  - *Milestone Dispute:* If Customer refuses release due to bad execution, Contractor or Customer raises dispute, freezing the remaining escrow amount.

**Postconditions:** Funds are securely distributed to Contractor; platform commissions are logged in the platform ledger.
### 4.4.6 UC-06: Dispute Arbitration
*Table 4.7: Use Case UC-06: Dispute Arbitration*
**Use Case ID:** UC-06

**Use Case Name:** Dispute Arbitration

**Primary Actor:** Admin

**Description:** Provides manual review and settlement of frozen escrow funds by an administrative officer.

**Preconditions:** Escrow status is `disputed`.

**Basic Flow:**
  - 1. Admin logs into manager panel and accesses the disputes queue.
  - 2. Admin inspects the Contract, logs, photo attachments, and chat logs between parties.
  - 3. Admin communicates with both parties or conducts an in-person assessment.
  - 4. Admin makes a split decision (Release to Contractor, Refund to Customer, or Split ratio).
  - 5. Admin inputs decision ratio and mandatory text justification.
  - 6. System transfers EGP values based on decision and changes Escrow status to `resolved`.

**Alternative Flow:**
  - *Warranty Claim:* If project is finished but defects appear within the warranty period, Customer can claim warranty. Admin adjudicates and can deduct compensation from Contractor's held warranty cap.

**Postconditions:** Frozen funds are distributed; audit log records the Admin's action and reasoning.
## 4.5 Non-Functional Requirements

### 4.5.1 Performance Requirements
- **NFR-P01 (API Response Time):** The core REST endpoints shall return a response within 250ms at the 95th percentile under normal load.
- **NFR-P03 (PDF Generation Time):** Puppeteer must generate and save the complex Arabic contract PDF within less than 3 seconds to avoid HTTP timeout.

### 4.5.3 Security Requirements
- **NFR-S01 (Password Hashing):** All passwords must be mathematically derived using Argon2id, avoiding legacy algorithms like MD5 or bcrypt.
- **NFR-S02 (JWT Token Security):** The Refresh Token must never be exposed to JavaScript; it must strictly utilize `HttpOnly`, `Secure`, and `SameSite` flags.
- **NFR-S06 (RBAC Enforcement):** All API mutation routes (`POST`, `PUT`, `DELETE`) must explicitly clear the `requireRole` middleware checks.

### 4.5.5 Usability Requirements
- **NFR-U01 (Arabic RTL Support):** The User Interface MUST flawlessly render Arabic text (Right-to-Left) natively, avoiding visual displacement of numeric values or punctuation.

## 4.6 Requirements Traceability Matrix

- **FR-001** (Customer Reg): Module: Auth | API: `POST /api/auth/register/customer` | Test: Integration | Priority: High
- **FR-003** (NID Parsing): Module: Auth | API: `internal utils/nationalId.js` | Test: Unit | Priority: Critical
- **FR-046** (Submit Bid): Module: Bidding | API: `POST /api/projects/:id/bids` | Test: System | Priority: High
- **FR-047** (Blind Bidding): Module: Bidding | API: `GET /api/projects/:id/bids` | Test: Integration | Priority: Critical
- **FR-078** (Escrow Release): Module: Payment | API: `POST /api/payments/:id/release-milestone` | Test: System | Priority: High
- **FR-103** (PDF Generation): Module: Contract | API: `POST /api/contracts/generate` | Test: Integration | Priority: Medium
## 4.7 Chapter Summary
Chapter 4 establishes the fundamental contractual requirements for the El-Moquwal platform. By explicitly outlining Functional Requirements—including complex localized elements like the Egyptian NID extraction and Arabic PDF contract generation—alongside stringent Security and Performance Non-Functional Requirements, this document ensures the development team maintains a rigid focus on delivering a compliant, highly secure, and functionally robust ecosystem for the Egyptian construction sector.
