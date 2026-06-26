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

| Req ID | Requirement Name | Module | API Endpoint | Test Type | Priority |
|--------|------------------|--------|--------------|-----------|----------|
| FR-001 | Customer Reg | Auth | `POST /api/auth/register/customer`| Integration | High |
| FR-003 | NID Parsing | Auth | `internal utils/nationalId.js`| Unit | Critical |
| FR-046 | Submit Bid | Bidding | `POST /api/projects/:id/bids` | System | High |
| FR-047 | Blind Bidding | Bidding | `GET /api/projects/:id/bids` | Integration | Critical |
| FR-078 | Escrow Release | Payment| `POST /api/payments/:id/release-milestone` | System | High |
| FR-103 | PDF Generation | Contract| `POST /api/contracts/generate` | Integration | Medium |

## 4.7 Chapter Summary
Chapter 4 establishes the fundamental contractual requirements for the El-Moquwal platform. By explicitly outlining Functional Requirements—including complex localized elements like the Egyptian NID extraction and Arabic PDF contract generation—alongside stringent Security and Performance Non-Functional Requirements, this document ensures the development team maintains a rigid focus on delivering a compliant, highly secure, and functionally robust ecosystem for the Egyptian construction sector.
