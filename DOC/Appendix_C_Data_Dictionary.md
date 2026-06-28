# Appendix C: Complete Data Dictionary

This appendix provides a detailed schema dictionary for all MongoDB database collections in the El-Moquwal platform, specifying field names, types, validation rules, defaults, and functional descriptions.

## C.1 User (Base Collection)
**Source File:** `backend/src/models/User.js`  
*Table C.1: User Schema Fields*
| Field Name | Type | Required | Default | Description / Constraints |
|---|---|---|---|---|
| `name` | String | Yes | - | Full name of the user (max length 100 characters). |
| `email` | String | Yes | - | Email address (unique index, lowercased, validated via regex). |
| `phone` | String | Yes | - | Egyptian phone number (unique, validated: `^01[0125]\d{8}$`). |
| `passwordHash` | String | Yes | - | Argon2id cryptographic password hash. |
| `role` | String | Yes | - | Role of the user. Enum: `['customer', 'contractor', 'admin', 'super_admin']`. |
| `status` | String | Yes | `'active'` | Account state. Enum: `['active', 'pending', 'suspended']`. |
| `nationalIdHash` | String | No | - | SHA-256 hash of the 14-digit Egyptian National ID for uniqueness checks. |
| `nationalIdLast4` | String | No | - | Plaintext storage of the last 4 digits of the National ID for identity display. |
| `loginAttempts` | Number | Yes | `0` | Count of failed consecutive login attempts (brute-force protection). |
| `lockUntil` | Date | No | - | Expiry timestamp for account login lock. |
| `isEmailVerified` | Boolean | Yes | `false` | Email verification flag (via OTP verification). |
| `otp` | String | No | - | Temporary 6-digit One-Time Password for email activation. |
| `referralCode` | String | Yes | - | Unique 6-character referral code generated on signup. |

---

## C.2 ContractorProfile (Discriminator)
**Source File:** `backend/src/models/ContractorProfile.js`  
*Table C.2: Contractor Profile Schema Fields*
| Field Name | Type | Required | Default | Description / Constraints |
|---|---|---|---|---|
| `specialty` | String | Yes | - | Trade discipline. Enum: `['civil_engineer', 'architect', 'electrical', 'plumber', 'carpenter', 'painter', 'general_contractor', 'finishing', 'other']`. |
| `yearsOfExperience` | Number | Yes | `0` | Number of years active in the trade (must be non-negative). |
| `bio` | String | No | - | Professional text biography (max 1000 characters). |
| `nationalIdPhoto` | String | Yes | - | Path to the uploaded PDF/image file of the National ID card. |
| `certificate` | String | No | - | Optional path to trade union / graduation certificates. |
| `membershipCard` | String | No | - | Optional path to Syndicate membership card. |
| `profilePicture` | String | No | - | Path to the contractor's profile image. |
| `rejectionReason` | String | No | - | Administrative text feedback if KYC validation is rejected. |
| `adminNotes` | String | No | - | Internal administrative notes. |
| `approvedBy` | ObjectId | No | - | Reference to the `User` (Admin) who approved the profile. |
| `rating` | Number | Yes | `0` | Mean rating score from 1.0 to 5.0. |
| `completedProjects` | Number | Yes | `0` | Denormalized count of successfully closed projects. |
| `creditBalance` | Number | Yes | `5` | Available bidding credits (deducted upon bid submission). |
| `isPremium` | Boolean | Yes | `false` | VIP status offering discounted bid costs and featured badge. |
| `premiumUntil` | Date | No | - | Premium subscription expiry date. |
| `referredBy` | ObjectId | No | - | Reference to the user who referred this contractor. |

---

## C.3 CustomerProfile (Discriminator)
**Source File:** `backend/src/models/CustomerProfile.js`  
*Table C.3: Customer Profile Schema Fields*
| Field Name | Type | Required | Default | Description / Constraints |
|---|---|---|---|---|
| `dob` | Date | No | - | Date of birth, auto-extracted from the National ID. |
| `gender` | String | No | - | Gender. Enum: `['male', 'female']`, auto-extracted from NID. |
| `governorate` | String | No | - | Governorate of residence, auto-extracted from NID. |
| `governorateCode` | String | No | - | 2-digit Egyptian governorate code. |

---

## C.4 AdminProfile (Discriminator)
**Source File:** `backend/src/models/AdminProfile.js`  
*Table C.4: Admin Profile Schema Fields*
| Field Name | Type | Required | Default | Description / Constraints |
|---|---|---|---|---|
| `permissions` | Array | Yes | `[]` | Enum array: `['review_contractors', 'view_projects', 'view_stats', 'manage_disputes', 'manage_featured', 'manage_materials', 'adjust_credits']`. |
| `createdBySuperAdmin` | ObjectId | Yes | - | Reference to the Super Admin creator. |
| `notes` | String | No | - | Notes concerning administrative history. |

---

## C.5 SuperAdminProfile (Discriminator)
**Source File:** `backend/src/models/SuperAdminProfile.js`  
*Table C.5: Super Admin Profile Schema Fields*
| Field Name | Type | Required | Default | Description / Constraints |
|---|---|---|---|---|
| `isSystemOwner` | Boolean | Yes | `true` | Immutable system ownership flag. |

---

## C.6 Project
**Source File:** `backend/src/models/Project.js`  
*Table C.6: Project Schema Fields*
| Field Name | Type | Required | Default | Description / Constraints |
|---|---|---|---|---|
| `title` | String | Yes | - | Project title (max 200 characters). |
| `description` | String | Yes | - | Detailed scope statement (max 2000 characters). |
| `projectType` | String | Yes | - | Matching trade category. Enum matches Contractor specialty. |
| `propertyDetails` | Object | Yes | - | Nested object: `{ governorate, city, district, area, floors, rooms }`. |
| `budgetRange` | String | Yes | - | Cost tier. Enum: `['under_50k', '50k_200k', '200k_500k', '500k_1m', 'above_1m', 'flexible']`. |
| `timeline` | String | Yes | - | Enum: `['within_week', 'within_month', '1_3_months', '3_6_months', 'flexible']`. |
| `photos` | Array | No | `[]` | Array of image URLs/paths uploaded by client (max 20). |
| `aiEstimatedPrice` | Object | No | - | Cached AI result: `{ minEstimate, maxEstimate, reasoning, estimatedAt }`. |
| `status` | String | Yes | `'draft'` | State. Enum: `['draft', 'open', 'awarded', 'closed', 'disputed']`. |
| `postedBy` | ObjectId | Yes | - | Reference to the owner (`User`). |
| `awardedTo` | ObjectId | No | - | Reference to the winning contractor (`User`). |
| `awardedBidId` | ObjectId | No | - | Reference to the accepted `Bid`. |
| `closedAt` | Date | No | - | Project closure timestamp. |
| `clientRating` | Number | No | - | Client score (1-5) given to contractor. |
| `clientReview` | String | No | - | Client feedback text (max 1000 characters). |
| `isFeatured` | Boolean | Yes | `false` | Highlighted homepage listing flag. |
| `isUrgent` | Boolean | Yes | `false` | Urgent indicator tag. |

---

## C.7 Bid
**Source File:** `backend/src/models/Bid.js`  
*Table C.7: Bid Schema Fields*
| Field Name | Type | Required | Default | Description / Constraints |
|---|---|---|---|---|
| `project` | ObjectId | Yes | - | Reference to the target `Project`. |
| `contractor` | ObjectId | Yes | - | Reference to the bidding contractor (`User`). |
| `amount` | Number | Yes | - | Blind proposal amount in EGP (non-negative). |
| `currency` | String | Yes | `'EGP'` | Bidding currency. |
| `message` | String | Yes | - | Proposal description/notes (max 500 characters). |
| `proposedDurationDays` | Number | Yes | - | Duration to complete the project. |
| `status` | String | Yes | `'pending'` | Decision state. Enum: `['pending', 'accepted', 'rejected']`. |
| `respondedAt` | Date | No | - | Timestamp of client approval/rejection. |
| `rejectionReason` | String | No | - | Optional text explanation for rejection. |

---

## C.8 Contract
**Source File:** `backend/src/models/Contract.js`  
*Table C.8: Contract Schema Fields*
| Field Name | Type | Required | Default | Description / Constraints |
|---|---|---|---|---|
| `project` | ObjectId | Yes | - | Reference to the target `Project` (unique). |
| `bid` | ObjectId | Yes | - | Reference to the accepted `Bid`. |
| `customer` | ObjectId | Yes | - | Reference to the client (`User`). |
| `contractor` | ObjectId | Yes | - | Reference to the contractor (`User`). |
| `bidAmount` | Number | Yes | - | Final binding price in EGP. |
| `commissionRate` | Number | Yes | `0.02` | Platform fee rate (default 2%). |
| `warrantyCapEGP` | Number | Yes | - | Maximum warranty claim amount (derived from platform settings). |
| `customerSignature` | Object | Yes | `{}` | Signature record: `{ signed: Boolean, ipAddress: String, signatureHash: String, signedAt: Date }`. |
| `contractorSignature` | Object | Yes | `{}` | Signature record for the contractor. |
| `status` | String | Yes | `'draft'` | Enum: `['draft', 'pending_signatures', 'active', 'completed', 'disputed']`. |
| `pdfFilename` | String | No | - | Relative path to the generated signed PDF file. |
| `warrantyStatus` | String | Yes | `'none'` | Enum: `['none', 'active', 'claimed', 'resolved']`. |
| `warrantyClaim` | Object | No | - | Claim details: `{ reason, claimedAt, resolvedAt, compensationAmount }`. |

---

## C.9 Escrow
**Source File:** `backend/src/models/Escrow.js`  
*Table C.9: Escrow Schema Fields*
| Field Name | Type | Required | Default | Description / Constraints |
|---|---|---|---|---|
| `project` | ObjectId | Yes | - | Reference to the target `Project`. |
| `contract` | ObjectId | Yes | - | Reference to the binding `Contract`. |
| `customer` | ObjectId | Yes | - | Reference to the client (`User`). |
| `contractor` | ObjectId | Yes | - | Reference to the contractor (`User`). |
| `totalAmount` | Number | Yes | - | Total EGP value deposited by client. |
| `commissionAmount` | Number | Yes | - | Derived commission amount (2% of total). |
| `netAmount` | Number | Yes | - | Net EGP to be paid to contractor (98% of total). |
| `status` | String | Yes | `'pending'` | Enum: `['pending', 'held', 'partially_released', 'released', 'disputed', 'refunded']`. |
| `milestones` | Array | Yes | - | Milestone records: `[{ title, percentage, amount, status: ['pending', 'released', 'disputed'] }]`. |
| `depositedAt` | Date | No | - | Timestamp of deposit. |
| `fullyReleasedAt` | Date | No | - | Timestamp of complete payout. |
| `disputeReason` | String | No | - | Client justification for opening dispute. |
| `disputeResolution` | Object | No | - | Resolution details: `{ decision: ['release_to_contractor', 'refund_to_customer', 'split'], ratio, adminNote, resolvedAt }`. |

---

## C.10 CreditLedger
**Source File:** `backend/src/models/CreditLedger.js`  
*Table C.10: Credit Ledger Schema Fields*
| Field Name | Type | Required | Default | Description / Constraints |
|---|---|---|---|---|
| `user` | ObjectId | Yes | - | Reference to the contractor (`User`). |
| `delta` | Number | Yes | - | Integer change in credits (positive or negative). |
| `reason` | String | Yes | - | Enum: `['signup_grant', 'bid_submit', 'bid_submit_refund', 'admin_adjust', 'purchase', 'referral']`. |
| `balanceAfter` | Number | Yes | - | Denormalized credit balance after transaction. |
| `project` | ObjectId | No | - | Reference to related `Project` if bid-related. |
| `meta` | Object | No | - | Extra metadata concerning the transaction (e.g. payment ID). |

---

## C.11 Transaction
**Source File:** `backend/src/models/Transaction.js`  
*Table C.11: Financial Transaction Schema Fields*
| Field Name | Type | Required | Default | Description / Constraints |
|---|---|---|---|---|
| `user` | ObjectId | Yes | - | Reference to the initiator (`User`). |
| `type` | String | Yes | - | Enum: `['credit_purchase', 'escrow_deposit', 'escrow_release', 'commission', 'subscription', 'featured_project', 'refund', 'warranty_payout']`. |
| `amount` | Number | Yes | - | Monetary value of the transaction. |
| `currency` | String | Yes | `'EGP'` | Standard EGP currency indicator. |
| `status` | String | Yes | `'pending'` | Enum: `['pending', 'success', 'failed', 'refunded']`. |
| `gateway` | String | Yes | `'platform'` | Payment channel. Enum: `['platform', 'paymob', 'fawry', 'mock']`. |
| `gatewayTransactionId` | String | No | - | External reference ID returned by gateway. |
| `relatedProject` | ObjectId | No | - | Link to related `Project`. |
| `relatedContract` | ObjectId | No | - | Link to related `Contract`. |

---

## C.12 Subscription
**Source File:** `backend/src/models/Subscription.js`  
*Table C.12: Subscription Schema Fields*
| Field Name | Type | Required | Default | Description / Constraints |
|---|---|---|---|---|
| `user` | ObjectId | Yes | - | Reference to the contractor (`User`). |
| `plan` | String | Yes | `'free'` | Enum: `['free', 'premium']`. |
| `priceEGP` | Number | Yes | `0` | Paid price for the package. |
| `startDate` | Date | Yes | - | Activation date. |
| `endDate` | Date | Yes | - | Expiration date (typically 30 days interval). |
| `autoRenew` | Boolean | Yes | `false` | Auto-renewal permission flag. |
| `status` | String | Yes | `'active'` | State. Enum: `['active', 'cancelled', 'expired']`. |

---

## C.13 MaterialOrder
**Source File:** `backend/src/models/MaterialOrder.js`  
*Table C.13: Material Order Schema Fields*
| Field Name | Type | Required | Default | Description / Constraints |
|---|---|---|---|---|
| `buyer` | ObjectId | Yes | - | Reference to purchasing contractor (`User`). |
| `seller` | ObjectId | Yes | - | Reference to supplying vendor (`User`). |
| `product` | ObjectId | Yes | - | Reference to `Product` item ordered. |
| `quantity` | Number | Yes | `1` | Integer quantity (must be >= 1). |
| `unitPrice` | Number | Yes | - | Snapshot of product price at checkout in EGP. |
| `totalPrice` | Number | Yes | - | Calculated quantity * unitPrice. |
| `status` | String | Yes | `'pending'` | Enum: `['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']`. |
| `buyerNotes` | String | No | - | Delivery guidelines written by buyer. |
| `sellerNotes` | String | No | - | Order processing comments. |

---

## C.14 Product
**Source File:** `backend/src/models/Product.js`  
*Table C.14: Product Schema Fields*
| Field Name | Type | Required | Default | Description / Constraints |
|---|---|---|---|---|
| `name` | String | Yes | - | Product label (max 150 characters). |
| `description` | String | Yes | - | Detailed description (max 1000 characters). |
| `category` | String | Yes | - | Enum: `['cement', 'bricks', 'steel', 'wood', 'paint', 'tiles', 'electrical', 'plumbing', 'insulation', 'glass', 'tools', 'other']`. |
| `price` | Number | Yes | - | Unit selling price in EGP. |
| `unit` | String | Yes | - | Packaging unit (e.g., Tons, Pieces, Meters). |
| `seller` | ObjectId | Yes | - | Reference to contractor/merchant vendor (`User`). |
| `images` | Array | No | `[]` | Array of image URLs/paths of the product. |
| `stock` | Number | Yes | `0` | Available items count. |
| `status` | String | Yes | `'active'` | Listing status. Enum: `['active', 'sold_out', 'hidden']`. |
| `governorate` | String | Yes | - | Governorate of stock storage. |

---

## C.15 AuditLog
**Source File:** `backend/src/models/AuditLog.js`  
*Table C.15: Audit Log Schema Fields*
| Field Name | Type | Required | Default | Description / Constraints |
|---|---|---|---|---|
| `admin` | ObjectId | Yes | - | Reference to the performing admin/super_admin (`User`). |
| `action` | String | Yes | - | Short text tag of action (e.g. `KYC_APPROVAL`). |
| `targetType` | String | Yes | - | Target table/model (e.g., `ContractorProfile`). |
| `targetId` | ObjectId | Yes | - | ID of the target document. |
| `details` | Mixed | Yes | - | Arbitrary object or text containing the operation details/payload. |
| `timestamp` | Date | Yes | `Date.now` | Unmodifiable timestamp of action. |

---

## C.16 PlatformSettings
**Source File:** `backend/src/models/PlatformSettings.js`  
*Table C.16: Platform Settings Schema Fields*
| Field Name | Type | Required | Default | Description / Constraints |
|---|---|---|---|---|
| `key` | String | Yes | - | Configuration parameter key name (unique index). |
| `value` | Mixed | Yes | - | Values (can be number, object, or string). |
| `description` | String | No | - | Internal purpose detail. |
| `lastUpdatedBy` | ObjectId | No | - | Reference to `User` (Super Admin) modifier. |

---

## C.17 PortfolioItem
**Source File:** `backend/src/models/PortfolioItem.js`  
*Table C.17: Portfolio Item Schema Fields*
| Field Name | Type | Required | Default | Description / Constraints |
|---|---|---|---|---|
| `contractor` | ObjectId | Yes | - | Reference to owning contractor (`User`). |
| `title` | String | Yes | - | Work item title (max 100 characters). |
| `description` | String | No | - | Description of work performed. |
| `projectType` | String | Yes | - | Enum matches specialty list. |
| `images` | Array | Yes | `[]` | Photo paths of completed work. |
| `beforePhotos` | Array | No | `[]` | Optional "before" photos for finishing/renovation. |
| `afterPhotos` | Array | No | `[]` | Optional "after" photos. |
| `completedAt` | Date | No | - | Completion date of the project. |
| `sourceProject` | ObjectId | No | - | Link to `Project` if it was completed on-platform. |
| `isAutoGenerated` | Boolean | Yes | `false` | Flag if item was auto-created upon platform contract completion. |

---

## C.18 GuestSession
**Source File:** `backend/src/models/GuestSession.js`  
*Table C.18: Guest Session Schema Fields*
| Field Name | Type | Required | Default | Description / Constraints |
|---|---|---|---|---|
| `guestId` | String | Yes | - | Unique randomly generated UUID stored in cookie. |
| `userAgent` | String | No | - | Browser client info. |
| `visits` | Number | Yes | `1` | Count of page visits. |
| `convertedToUserId` | ObjectId | No | - | Reference to the registered user ID if the guest converts. |
