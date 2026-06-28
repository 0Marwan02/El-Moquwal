# Chapter 3: System Design

## 3.1 Introduction
The system design phase is a critical step in the software development lifecycle, transforming the established requirements into a clear, structured architecture that guides the implementation process. This chapter details the comprehensive system design of the El-Moquwal platform. It provides an in-depth examination of the architectural patterns selected, the database schemas designed to handle the complex relationships within the construction marketplace, the module-level breakdown of the system, and the robust security measures integrated into the core framework. By outlining these design choices, this chapter establishes a solid technical foundation that ensures the application meets its functional and non-functional requirements, specifically emphasizing security, scalability, and performance within the context of the Egyptian contracting industry.

## 3.2 System Architecture

### 3.2.1 High-Level Architecture Overview
El-Moquwal follows a modern three-tier architecture comprising a Presentation Layer (Client), an Application Layer (API), and a Data Layer (Database). This separation of concerns promotes modularity, independent scalability, and maintainability.

The architecture follows a three-tier pattern. The Presentation Layer consists of a client-side Single Page Application built with HTML, CSS, and Vanilla JavaScript. This communicates over HTTP/REST with the Application Layer, which comprises the Node.js/Express REST API server, JWT authentication and RBAC middleware, business logic controllers, and integration services for AI, PDF generation, and payment processing. The Application Layer connects to the Data Layer through Mongoose ODM, with MongoDB serving as the primary data store.

### 3.2.2 Client-Side Architecture
The Presentation Layer is developed as a Vanilla JavaScript Single Page Application (SPA). This approach avoids heavy frameworks, ensuring blazing-fast initial load times and simplicity. Routing is handled client-side via JavaScript History API, updating the DOM dynamically without page reloads. The application maintains authentication state utilizing `localStorage` for access tokens and UI state management, while keeping secure refresh tokens encapsulated in HTTP-only cookies to mitigate Cross-Site Scripting (XSS) vulnerabilities.

### 3.2.3 Backend Architecture
The Application Layer is constructed using Node.js and the Express.js framework, adhering strictly to the Model-View-Controller (MVC) design pattern (adapted for APIs as Model-Route-Controller). The lifecycle of an incoming request flows as follows:

The request lifecycle follows a clear pipeline: the client sends an HTTP request to a route handler, which triggers validation and authentication middleware. Upon successful authentication, the user context is attached to the request object and the route invokes the appropriate controller. The controller executes business logic, queries or updates data through the Mongoose model layer, receives the result from MongoDB, and returns a JSON response to the client.

### 3.2.4 Database Architecture
MongoDB, a NoSQL database, was selected for the Data Layer due to its flexibility in handling unstructured and semi-structured data, which is heavily prevalent in construction project requirements. The database leverages Mongoose as the Object Data Modeling (ODM) library. A critical architectural decision was the use of the Mongoose **Discriminator Pattern** to manage the user hierarchy (Customer, Contractor, Admin, Super Admin) within a single `users` collection, optimizing polymorphic queries while maintaining strict schema validation per role. Comprehensive indexing strategies, such as compound indexes on bids (preventing duplicate contractor bids per project), are employed to ensure O(1) or O(log N) lookup times.

### 3.2.5 External Services Integration
The backend communicates with several external services to augment its capabilities:
- **Artificial Intelligence:** Integrates Pollinations.ai (primary) and Anthropic Claude (fallback) for AI-powered price estimation and a RAG-based policy chatbot.
- **Document Generation:** Utilizes Puppeteer (Headless Chrome) to render dynamic Arabic RTL HTML templates into A4 PDF contracts.
- **Payment Gateway:** Interfaces with external payment providers (like Paymob/Fawry, currently mocked via platform gateway) via webhooks to handle escrow deposits and credit purchases.

## 3.3 Database Design

### 3.3.1 Entity-Relationship Overview
The system relies on 18 deeply interconnected collections. The core relationships revolve around Users (Contractors and Customers), Projects, Bids, and Contracts.

The core data relationships revolve around Users, Projects, Bids, and Contracts. A Customer (User) posts Projects, which receive Bids from Contractors (Users). Each Project can have one Contract, which is secured by an Escrow record. Users also own Portfolio Items and Credit Ledger transactions. Contractors can sell Products through the Material Marketplace. These 18 collections are deeply interconnected through ObjectId references, enabling efficient cross-document queries.

### 3.3.2 Discriminator Pattern: User Hierarchy
Instead of maintaining separate collections for different user types, El-Moquwal uses a single `User` collection with Mongoose Discriminators. The base schema contains common fields (name, email, password, role), while derived schemas (`ContractorProfile`, `CustomerProfile`, `AdminProfile`, `SuperAdminProfile`) append role-specific fields. This allows querying all users easily (`User.find()`) or querying specifically (`Contractor.find({ specialty: 'plumbing' })`).

### 3.3.3 Data Dictionary

#### 1. User (Base Collection)
- **\_id** (ObjectId): Primary Key
- **name** (String): Full name
- **email** (String): Email address
- **phone** (String): Egyptian phone number
- **passwordHash** (String): Argon2 hashed password
- **role** (String): User role indicator
- **status** (String): Account state
- **nationalIdHash** (String): Argon2 hashed NID
- **nationalIdLast4** (String): Masked NID for display
- **loginAttempts** (Number): Security tracking
- **lockUntil** (Date): Account lock timestamp
- **isEmailVerified** (Boolean): Email verification state
- **otp** (String): Verification code
- **resetToken** (String): Password reset token
- **referralCode** (String): Unique referral identifier
#### 2. ContractorProfile (Discriminator)
- **specialty** (String): Contractor discipline
- **yearsOfExperience** (Number): Experience duration
- **bio** (String): Professional summary
- **certificate** (String): Path to qualifications
- **membershipCard** (String): Syndicate card path
- **nationalIdPhoto** (String): Required KYC doc path
- **profilePicture** (String): Avatar path
- **rejectionReason** (String): Admin feedback on rejection
- **adminNotes** (String): Internal admin notes
- **approvedBy** (ObjectId): Admin who approved
- **rating** (Number): Average client rating
- **completedProjects** (Number): Total closed projects
- **creditBalance** (Number): Available bidding credits
- **isPremium** (Boolean): Premium subscription state
- **subscriptionId** (ObjectId): Link to active subscription
- **premiumUntil** (Date): Expiry of premium
- **referredBy** (ObjectId): User who referred them
#### 3. CustomerProfile (Discriminator)
*(Inherits base User fields with minimal additional metadata needed for property owners).*

#### 4. AdminProfile (Discriminator)
- **permissions** (Array of Strings): Granular access control
- **createdBySuperAdmin** (ObjectId): Creator reference
- **notes** (String): Admin metadata
#### 5. Project
- **title** (String): Project headline
- **description** (String): Project details
- **projectType** (String): Category
- **propertyDetails** (Object): Location and metrics
- **requirements** (Mixed): Dynamic requirements
- **budgetRange** (String): Estimated customer budget
- **timeline** (String): Expected execution time
- **requiredEngineers** (Number): Manpower requirement
- **photos** (Array of Strings): Uploaded visuals
- **aiEstimatedPrice** (Object): AI generated estimate
- **status** (String): Lifecycle state
- **postedBy** (ObjectId): Customer reference
- **awardedTo** (ObjectId): Winning contractor
- **awardedBidId** (ObjectId): Winning bid reference
- **closedAt** (Date): Completion timestamp
- **clientRating** (Number): Post-project rating
- **clientReview** (String): Post-project feedback
- **bidsCount** (Number): Denormalized metric
- **isPrivate** (Boolean): Visibility flag
- **invitedContractors** (Array of ObjectIds): For private projects
- **isFeatured** (Boolean): Priority listing flag
- **featuredUntil** (Date): Expiry of featured status
- **isUrgent** (Boolean): Urgent tag
- **closurePhotos** (Array of Strings): Final result visuals
#### 6. Bid
- **project** (ObjectId): Target project
- **contractor** (ObjectId): Bidding contractor
- **amount** (Number): Blind monetary bid
- **currency** (String): Currency code
- **message** (String): Proposal text
- **proposedDurationDays** (Number): Estimated timeframe
- **status** (String): Decision state
- **respondedAt** (Date): Timestamp of decision
- **rejectionReason** (String): Feedback to contractor*(Constraint: Unique compound index on {project, contractor} to prevent multiple bids).*

#### 7. Contract
- **project** (ObjectId): Reference project
- **bid** (ObjectId): Accepted bid reference
- **customer** (ObjectId): Property owner
- **contractor** (ObjectId): Executing contractor
- **bidAmount** (Number): Final agreed price
- **commissionRate** (Number): Platform fee percentage
- **customerSignature** (Object): Digital signing details
- **contractorSignature** (Object): Digital signing details
- **status** (String): Legal state
- **pdfFilename** (String): Path to generated document
#### 8. Escrow
- **project** (ObjectId): Linked project
- **totalAmount** (Number): Full project cost
- **commissionAmount** (Number): Deducted platform fee
- **netAmount** (Number): Amount to contractor
- **status** (String): Financial state
- **milestones** (Array of Objects): Payment tranches
- **disputeResolution** (Object): Admin arbitration details
#### 9. Product (Material Marketplace)
- **seller** (ObjectId): Vendor reference
- **name** (String): Product name
- **description** (String): Product details
- **category** (String): Material category
- **price** (Number): Unit price
- **unit** (String): Measurement unit
- **stockQuantity** (Number): Available inventory
- **images** (Array of Strings): Product photos
- **status** (String): Listing state
#### 10. MaterialOrder
- **buyer** (ObjectId): Purchaser reference
- **seller** (ObjectId): Vendor reference
- **items** (Array of Objects): Purchased products
- **totalAmount** (Number): Full order cost
- **status** (String): Order lifecycle state
- **shippingAddress** (Object): Delivery location
- **paymentMethod** (String): Payment type
#### 11. PortfolioItem
- **contractor** (ObjectId): Owner reference
- **title** (String): Project title
- **description** (String): Work details
- **category** (String): Specialty
- **location** (String): Execution area
- **yearCompleted** (Number): Completion year
- **beforePhotos** (Array of Strings): Initial state images
- **afterPhotos** (Array of Strings): Final state images
- **linkedProject** (ObjectId): El-Moquwal project ID
#### 12. CreditLedger
- **user** (ObjectId): Contractor reference
- **delta** (Number): Credit change amount
- **reason** (String): Action description
- **balanceAfter** (Number): Resulting total credits
- **relatedBid** (ObjectId): Relevant bid reference
- **relatedTransaction** (ObjectId): Relevant payment ref
#### 13. Transaction (Financial Log)
- **user** (ObjectId): Initiator reference
- **type** (String): Transaction type
- **amount** (Number): Monetary value (EGP)
- **paymentGatewayId** (String): External processor ID
- **status** (String): Gateway status
- **referenceModel** (String): Polymorphic ref type
- **referenceId** (ObjectId): Polymorphic ref ID
#### 14. Subscription
- **user** (ObjectId): Contractor reference
- **plan** (String): Tier level
- **status** (String): Billing state
- **startDate** (Date): Billing cycle start
- **endDate** (Date): Billing cycle end
- **autoRenew** (Boolean): Auto-renewal flag
#### 15. PlatformSettings
- **commissionRate** (Number): Global platform fee
- **creditPrice** (Number): Cost per credit
- **premiumMonthlyCost** (Number): Subscription price
- **warrantyDays** (Number): Default warranty period
- **maintenanceMode** (Boolean): System-wide lock
#### 16. AuditLog
- **actor** (ObjectId): User initiating action
- **action** (String): Operation performed
- **entityType** (String): Target collection
- **entityId** (ObjectId): Target document ID
- **ipAddress** (String): Network source
- **userAgent** (String): Client details
- **changes** (Object): Payload diff
#### 17. GuestSession
- **guestId** (String): UUID string
- **visits** (Number): Session count
- **lastActiveAt** (Date): TTL Index field
## 3.4 Module Design

### 3.4.1 Authentication & Authorization Module
- **Purpose:** Handles user registration, JWT generation, OTP validation, and Role-Based Access Control (RBAC).
- **Business Rules:** National IDs must be strictly verified against Egyptian standards. Accounts are locked after repeated failed logins. Passwords are mathematically hashed utilizing Argon2id.
- **Data Flow:** Client sends credentials → Controller hashes and compares → Token is generated and signed (Access in payload, Refresh in HTTP-only cookie).

### 3.4.2 National ID Parsing Module
- **Purpose:** Extracts demographic data from a 14-digit Egyptian National ID to ensure KYC compliance.
- **Inputs:** 14-digit numeric string.
- **Outputs:** `{valid: boolean, dob: date, gender: string, governorate: string}`.
- **Business Rules:** Validates the century digit (2 for 19xx, 3 for 20xx), month/day limits, and specific governorate codes defined by the state.

### 3.4.3 Projects & Blind Bidding Module
- **Purpose:** Core engine for project listing and contractor proposals.
- **Business Rules:** Blind Bidding is enforced at the API level. Contractors cannot access the `amount` field of competitors. Submitting a bid deducts credits dynamically based on the project's budget range.

### 3.4.4 Escrow & Milestone Payments Module
- **Purpose:** Protects financial transactions, holding customer funds safely until milestone delivery is approved.
- **Business Rules:** Splits total payment into standard tranches (e.g., 30% start, 40% structure, 30% handover). The platform's 2% commission is securely deducted during the initial transaction routing.

### 3.4.5 Electronic Contracts & Digital Signatures Module
- **Purpose:** Generates legally binding, Arabic-language PDF contracts.
- **Inputs:** Project details, accepted Bid amount, Customer, and Contractor demographics.
- **Business Rules:** Employs dual-signature validation. Signatures are recorded with an SHA256 cryptographic hash of the user context (IP, User-Agent, Timestamp) to ensure non-repudiation under Egyptian civil law.

### 3.4.6 AI Price Estimation Module
- **Purpose:** Provides fair market value estimates to customers prior to publishing.
- **Business Rules:** Integrates a primary LLM (Pollinations) with a fallback to Anthropic Claude. Results are cached on the project object for exactly one hour to minimize API costs and ensure consistency.

## 3.5 Security Design

### 3.5.1 JWT Authentication Lifecycle
El-Moquwal utilizes a dual-token strategy. The **Access Token** (signed via HS256) is short-lived (15 minutes), containing the user ID and role, to minimize the impact of token interception. The **Refresh Token** (7 days) is exclusively transmitted via strict HTTP-only, secure cookies, shielding it from XSS attacks. 

### 3.5.2 Role-Based Access Control (RBAC)
Middleware orchestrates the endpoints based on discriminator roles.

- **Customer:** Can post projects, view all bids on their projects, and sign contracts.
- **Contractor:** Can submit bids on projects, manage portfolio and materials, and sign contracts.
- **Admin:** Granular permissions based on assigned permission array (e.g., review_contractors, manage_disputes, view_stats).
- **Super Admin:** Unrestricted access across all domains; automatically bypasses granular permission checks.

### 3.5.3 Blind Bidding Enforcement
To ensure fair market competition, the system enforces "Blind Bidding". At the database level, bids are stored openly. However, the API `bid.controller.js` acts as an interceptor. If the requester is the project owner (Customer), the raw Mongoose document is returned. If the requester is a Contractor, the backend invokes the custom `toBlindJSON()` schema method, forcefully deleting the `amount` and `message` properties from competitors' objects before serialization.

### 3.5.4 Data Security
Sensitive information, notably the National ID and Passwords, are cryptographically hashed using **Argon2id**, the winner of the Password Hashing Competition, known for its resistance to GPU-based cracking. Mongoose schemas actively prevent these fields from returning in API queries via the `select: false` configuration.

## 3.6 API Design Overview

- **POST** `/api/auth/register/contractor` — Register new contractor with multipart NID photo upload (no auth required).
- **POST** `/api/auth/login` — Authenticate and issue dual JWTs (no auth required).
- **POST** `/api/projects` — Draft or publish a new construction project (Customer auth required).
- **GET** `/api/projects/:id` — Retrieve project details and denormalised bid counts (optional auth).
- **POST** `/api/projects/:id/bids` — Submit a proposal with credit deduction (Contractor auth required).
- **POST** `/api/payments/deposit-escrow` — Initiate secure fund holding for awarded project (Customer auth required).
- **POST** `/api/contracts/generate` — Auto-trigger PDF creation post bid-acceptance (System).
- **PUT** `/api/admin/contractors/:id` — Approve or reject pending contractor applications (Admin auth required).

## 3.7 UML Diagrams

### 3.7.1 Use Case Diagram

The system supports three primary actor types. Customers can post projects, accept bids, and deposit escrow funds. Contractors can submit bids, sign contracts, and add portfolio items. Administrators can review contractor applications and resolve disputes. A fourth actor, the Super Admin, has unrestricted access across all system functions.

### 3.7.2 Sequence Diagram: Blind Bidding Flow

The blind bidding flow operates as follows: Contractor A submits a bid of EGP 50,000 via the API, which saves the bid to the database and deducts one credit. When Contractor B requests the project's bid list, the API fetches all bids but invokes the toBlindJSON() method, returning the bid count (1) while hiding the amount field. When the project-owning Customer requests the same bid list, the API returns the full data including the bid amount of EGP 50,000, enabling informed comparison while maintaining competitive fairness.

## 3.8 User Interface Design
The design adheres to a "Mobile-First" philosophy, deeply integrating Arabic Right-To-Left (RTL) aesthetics. 
- **Customer Dashboard:** Focuses heavily on active project monitoring, visual escrow milestone progress bars, and transparent bid comparison tables.
- **Contractor Dashboard:** Prioritizes the active credit ledger balance, potential project feed, and portfolio management interface.

## 3.9 Chapter Summary
This chapter has thoroughly documented the structural design of the El-Moquwal system. By employing a scalable Node.js/Express.js backend alongside an inherently flexible MongoDB architecture, the platform effectively mitigates the complexities of multi-role user tracking and transactional security. The implementation of rigorous algorithmic rules, such as Egyptian NID parsing, Blind Bidding logic, and dual-signature PDF generation, ensures that the digital representation aligns seamlessly with local legal constraints and optimal business practices.
