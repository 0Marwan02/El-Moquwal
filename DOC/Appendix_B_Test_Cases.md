# Appendix B: Comprehensive Test Case Matrix

| ID | Description | Type | Expected Result |
| --- | --- | --- | --- |
| AUTH-01 | Customer registration with valid National ID | P | 201 + parsed governorate |
| AUTH-02 | Duplicate email registration | N | 409 DUPLICATE |
| AUTH-03 | Contractor pending approval cannot bid | N | 403 FORBIDDEN |
| AUTH-04 | JWT refresh rotation | P | New access token issued |
| AUTH-05 | Admin login wrong role | N | 403 |
| PROJ-01 | Create project draft | P | 201 draft status |
| PROJ-02 | Publish project | P | status=open |
| PROJ-03 | Delete project with bids | N | 400 HAS_BIDS |
| PROJ-04 | AI price estimate | P | min/max EGP range returned |
| PROJ-05 | matchMySpecialty filter | P | Only electrical types for electrician |
| BID-01 | Submit blind bid | P | Bid hidden from other contractors |
| BID-02 | Insufficient credits | N | 402 INSUFFICIENT_CREDITS |
| BID-03 | Customer sees all bid amounts | P | Full list on proposals page |
| ESC-01 | Deposit escrow | P | Escrow status=funded |
| ESC-02 | Release milestone 1 (30%) | P | Contractor transaction logged |
| ESC-03 | Open dispute | P | status=disputed, admin notified |
| CON-01 | Generate contract after award | P | pending_signatures |
| CON-02 | Customer signs | P | customerSignature.signed=true |
| CON-03 | Both sign → active | P | PDF regenerated with signatures |
| CON-04 | Warranty claim | P | warrantyStatus=claimed |
| ADM-01 | Approve contractor | P | approvalStatus=approved |
| ADM-02 | Reject without reason | N | 400 validation |
| ADM-03 | Non-super_admin audit log | N | 403 |
| AI-01 | Chatbot policy question | P | Arabic reply re escrow |
| AI-02 | LLM timeout fallback | P | Secondary provider used |
| REF-01 | Apply referral code | P | Inviter + invitee credits |
| POR-01 | Upload portfolio item | P | 201 + visible in GET |
| MAT-01 | Create material order | P | Order pending |

## B.1 Detailed Test Procedures

### AUTH-01: Customer registration with valid National ID

- **Type:** Positive test case
- **Preconditions:** Valid seeded database; demo accounts from DEMO_ACCOUNTS.md
- **Steps:** (1) Authenticate appropriate role. (2) Navigate to module endpoint. (3) Submit request payload per API spec. (4) Verify response code and database state.
- **Expected:** 201 + parsed governorate
- **Postconditions:** Audit log entry created for mutating admin actions.

### AUTH-02: Duplicate email registration

- **Type:** Negative test case
- **Preconditions:** Valid seeded database; demo accounts from DEMO_ACCOUNTS.md
- **Steps:** (1) Authenticate appropriate role. (2) Navigate to module endpoint. (3) Submit request payload per API spec. (4) Verify response code and database state.
- **Expected:** 409 DUPLICATE
- **Postconditions:** Audit log entry created for mutating admin actions.

### AUTH-03: Contractor pending approval cannot bid

- **Type:** Negative test case
- **Preconditions:** Valid seeded database; demo accounts from DEMO_ACCOUNTS.md
- **Steps:** (1) Authenticate appropriate role. (2) Navigate to module endpoint. (3) Submit request payload per API spec. (4) Verify response code and database state.
- **Expected:** 403 FORBIDDEN
- **Postconditions:** Audit log entry created for mutating admin actions.

### AUTH-04: JWT refresh rotation

- **Type:** Positive test case
- **Preconditions:** Valid seeded database; demo accounts from DEMO_ACCOUNTS.md
- **Steps:** (1) Authenticate appropriate role. (2) Navigate to module endpoint. (3) Submit request payload per API spec. (4) Verify response code and database state.
- **Expected:** New access token issued
- **Postconditions:** Audit log entry created for mutating admin actions.

### AUTH-05: Admin login wrong role

- **Type:** Negative test case
- **Preconditions:** Valid seeded database; demo accounts from DEMO_ACCOUNTS.md
- **Steps:** (1) Authenticate appropriate role. (2) Navigate to module endpoint. (3) Submit request payload per API spec. (4) Verify response code and database state.
- **Expected:** 403
- **Postconditions:** Audit log entry created for mutating admin actions.

### PROJ-01: Create project draft

- **Type:** Positive test case
- **Preconditions:** Valid seeded database; demo accounts from DEMO_ACCOUNTS.md
- **Steps:** (1) Authenticate appropriate role. (2) Navigate to module endpoint. (3) Submit request payload per API spec. (4) Verify response code and database state.
- **Expected:** 201 draft status
- **Postconditions:** Audit log entry created for mutating admin actions.

### PROJ-02: Publish project

- **Type:** Positive test case
- **Preconditions:** Valid seeded database; demo accounts from DEMO_ACCOUNTS.md
- **Steps:** (1) Authenticate appropriate role. (2) Navigate to module endpoint. (3) Submit request payload per API spec. (4) Verify response code and database state.
- **Expected:** status=open
- **Postconditions:** Audit log entry created for mutating admin actions.

### PROJ-03: Delete project with bids

- **Type:** Negative test case
- **Preconditions:** Valid seeded database; demo accounts from DEMO_ACCOUNTS.md
- **Steps:** (1) Authenticate appropriate role. (2) Navigate to module endpoint. (3) Submit request payload per API spec. (4) Verify response code and database state.
- **Expected:** 400 HAS_BIDS
- **Postconditions:** Audit log entry created for mutating admin actions.

### PROJ-04: AI price estimate

- **Type:** Positive test case
- **Preconditions:** Valid seeded database; demo accounts from DEMO_ACCOUNTS.md
- **Steps:** (1) Authenticate appropriate role. (2) Navigate to module endpoint. (3) Submit request payload per API spec. (4) Verify response code and database state.
- **Expected:** min/max EGP range returned
- **Postconditions:** Audit log entry created for mutating admin actions.

### PROJ-05: matchMySpecialty filter

- **Type:** Positive test case
- **Preconditions:** Valid seeded database; demo accounts from DEMO_ACCOUNTS.md
- **Steps:** (1) Authenticate appropriate role. (2) Navigate to module endpoint. (3) Submit request payload per API spec. (4) Verify response code and database state.
- **Expected:** Only electrical types for electrician
- **Postconditions:** Audit log entry created for mutating admin actions.

### BID-01: Submit blind bid

- **Type:** Positive test case
- **Preconditions:** Valid seeded database; demo accounts from DEMO_ACCOUNTS.md
- **Steps:** (1) Authenticate appropriate role. (2) Navigate to module endpoint. (3) Submit request payload per API spec. (4) Verify response code and database state.
- **Expected:** Bid hidden from other contractors
- **Postconditions:** Audit log entry created for mutating admin actions.

### BID-02: Insufficient credits

- **Type:** Negative test case
- **Preconditions:** Valid seeded database; demo accounts from DEMO_ACCOUNTS.md
- **Steps:** (1) Authenticate appropriate role. (2) Navigate to module endpoint. (3) Submit request payload per API spec. (4) Verify response code and database state.
- **Expected:** 402 INSUFFICIENT_CREDITS
- **Postconditions:** Audit log entry created for mutating admin actions.

### BID-03: Customer sees all bid amounts

- **Type:** Positive test case
- **Preconditions:** Valid seeded database; demo accounts from DEMO_ACCOUNTS.md
- **Steps:** (1) Authenticate appropriate role. (2) Navigate to module endpoint. (3) Submit request payload per API spec. (4) Verify response code and database state.
- **Expected:** Full list on proposals page
- **Postconditions:** Audit log entry created for mutating admin actions.

### ESC-01: Deposit escrow

- **Type:** Positive test case
- **Preconditions:** Valid seeded database; demo accounts from DEMO_ACCOUNTS.md
- **Steps:** (1) Authenticate appropriate role. (2) Navigate to module endpoint. (3) Submit request payload per API spec. (4) Verify response code and database state.
- **Expected:** Escrow status=funded
- **Postconditions:** Audit log entry created for mutating admin actions.

### ESC-02: Release milestone 1 (30%)

- **Type:** Positive test case
- **Preconditions:** Valid seeded database; demo accounts from DEMO_ACCOUNTS.md
- **Steps:** (1) Authenticate appropriate role. (2) Navigate to module endpoint. (3) Submit request payload per API spec. (4) Verify response code and database state.
- **Expected:** Contractor transaction logged
- **Postconditions:** Audit log entry created for mutating admin actions.

### ESC-03: Open dispute

- **Type:** Positive test case
- **Preconditions:** Valid seeded database; demo accounts from DEMO_ACCOUNTS.md
- **Steps:** (1) Authenticate appropriate role. (2) Navigate to module endpoint. (3) Submit request payload per API spec. (4) Verify response code and database state.
- **Expected:** status=disputed, admin notified
- **Postconditions:** Audit log entry created for mutating admin actions.

### CON-01: Generate contract after award

- **Type:** Positive test case
- **Preconditions:** Valid seeded database; demo accounts from DEMO_ACCOUNTS.md
- **Steps:** (1) Authenticate appropriate role. (2) Navigate to module endpoint. (3) Submit request payload per API spec. (4) Verify response code and database state.
- **Expected:** pending_signatures
- **Postconditions:** Audit log entry created for mutating admin actions.

### CON-02: Customer signs

- **Type:** Positive test case
- **Preconditions:** Valid seeded database; demo accounts from DEMO_ACCOUNTS.md
- **Steps:** (1) Authenticate appropriate role. (2) Navigate to module endpoint. (3) Submit request payload per API spec. (4) Verify response code and database state.
- **Expected:** customerSignature.signed=true
- **Postconditions:** Audit log entry created for mutating admin actions.

### CON-03: Both sign → active

- **Type:** Positive test case
- **Preconditions:** Valid seeded database; demo accounts from DEMO_ACCOUNTS.md
- **Steps:** (1) Authenticate appropriate role. (2) Navigate to module endpoint. (3) Submit request payload per API spec. (4) Verify response code and database state.
- **Expected:** PDF regenerated with signatures
- **Postconditions:** Audit log entry created for mutating admin actions.

### CON-04: Warranty claim

- **Type:** Positive test case
- **Preconditions:** Valid seeded database; demo accounts from DEMO_ACCOUNTS.md
- **Steps:** (1) Authenticate appropriate role. (2) Navigate to module endpoint. (3) Submit request payload per API spec. (4) Verify response code and database state.
- **Expected:** warrantyStatus=claimed
- **Postconditions:** Audit log entry created for mutating admin actions.

### ADM-01: Approve contractor

- **Type:** Positive test case
- **Preconditions:** Valid seeded database; demo accounts from DEMO_ACCOUNTS.md
- **Steps:** (1) Authenticate appropriate role. (2) Navigate to module endpoint. (3) Submit request payload per API spec. (4) Verify response code and database state.
- **Expected:** approvalStatus=approved
- **Postconditions:** Audit log entry created for mutating admin actions.

### ADM-02: Reject without reason

- **Type:** Negative test case
- **Preconditions:** Valid seeded database; demo accounts from DEMO_ACCOUNTS.md
- **Steps:** (1) Authenticate appropriate role. (2) Navigate to module endpoint. (3) Submit request payload per API spec. (4) Verify response code and database state.
- **Expected:** 400 validation
- **Postconditions:** Audit log entry created for mutating admin actions.

### ADM-03: Non-super_admin audit log

- **Type:** Negative test case
- **Preconditions:** Valid seeded database; demo accounts from DEMO_ACCOUNTS.md
- **Steps:** (1) Authenticate appropriate role. (2) Navigate to module endpoint. (3) Submit request payload per API spec. (4) Verify response code and database state.
- **Expected:** 403
- **Postconditions:** Audit log entry created for mutating admin actions.

### AI-01: Chatbot policy question

- **Type:** Positive test case
- **Preconditions:** Valid seeded database; demo accounts from DEMO_ACCOUNTS.md
- **Steps:** (1) Authenticate appropriate role. (2) Navigate to module endpoint. (3) Submit request payload per API spec. (4) Verify response code and database state.
- **Expected:** Arabic reply re escrow
- **Postconditions:** Audit log entry created for mutating admin actions.

### AI-02: LLM timeout fallback

- **Type:** Positive test case
- **Preconditions:** Valid seeded database; demo accounts from DEMO_ACCOUNTS.md
- **Steps:** (1) Authenticate appropriate role. (2) Navigate to module endpoint. (3) Submit request payload per API spec. (4) Verify response code and database state.
- **Expected:** Secondary provider used
- **Postconditions:** Audit log entry created for mutating admin actions.

### REF-01: Apply referral code

- **Type:** Positive test case
- **Preconditions:** Valid seeded database; demo accounts from DEMO_ACCOUNTS.md
- **Steps:** (1) Authenticate appropriate role. (2) Navigate to module endpoint. (3) Submit request payload per API spec. (4) Verify response code and database state.
- **Expected:** Inviter + invitee credits
- **Postconditions:** Audit log entry created for mutating admin actions.

### POR-01: Upload portfolio item

- **Type:** Positive test case
- **Preconditions:** Valid seeded database; demo accounts from DEMO_ACCOUNTS.md
- **Steps:** (1) Authenticate appropriate role. (2) Navigate to module endpoint. (3) Submit request payload per API spec. (4) Verify response code and database state.
- **Expected:** 201 + visible in GET
- **Postconditions:** Audit log entry created for mutating admin actions.

### MAT-01: Create material order

- **Type:** Positive test case
- **Preconditions:** Valid seeded database; demo accounts from DEMO_ACCOUNTS.md
- **Steps:** (1) Authenticate appropriate role. (2) Navigate to module endpoint. (3) Submit request payload per API spec. (4) Verify response code and database state.
- **Expected:** Order pending
- **Postconditions:** Audit log entry created for mutating admin actions.

## B.2 Regression Test Suite

Regression tests are re-executed before each sprint demo and prior to final submission. Priority P0 cases: AUTH-01, BID-01, ESC-01, CON-03, ADM-01.
