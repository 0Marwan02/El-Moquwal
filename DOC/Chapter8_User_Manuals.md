# Chapter 8: User Manuals and Operational Guides
## 8.1 Introduction
This chapter provides step-by-step operational guides for every primary persona on the El-Moquwal platform. Each section assumes a modern web browser (Chrome 120+, Firefox 115+, or Edge 120+) with JavaScript enabled and a stable internet connection.
## 8.2 Customer User Manual
### 8.2.1 Register as Customer

Navigate to auth/register-customer.html. Enter full name, 14-digit National ID, email, phone, and password. The system parses governorate and date of birth from the National ID server-side. Verify email via OTP.

**Expected outcome:** Workflow step completes without error toast; dashboard reflects new state within one refresh cycle.
### 8.2.2 Login

Use auth/login.html. Select customer role. JWT access token stored in localStorage; refresh token in HTTP-only cookie.

**Expected outcome:** Workflow step completes without error toast; dashboard reflects new state within one refresh cycle.
### 8.2.3 Post a Project

Dashboard → Post Project. Complete title, project type, governorate, area (m²), budget range, timeline, optional photos. AI estimate available before publish.

**Expected outcome:** Workflow step completes without error toast; dashboard reflects new state within one refresh cycle.
### 8.2.4 Review Proposals

proposals.html lists blind bids — amounts visible only to customer. Compare contractor specialty and portfolio.

**Expected outcome:** Workflow step completes without error toast; dashboard reflects new state within one refresh cycle.
### 8.2.5 Award Project

Accept winning bid. Project status → awarded. Contractor notified.

**Expected outcome:** Workflow step completes without error toast; dashboard reflects new state within one refresh cycle.
### 8.2.6 Generate Contract

contract.html → Generate Electronic Contract. Review Arabic terms.

**Expected outcome:** Workflow step completes without error toast; dashboard reflects new state within one refresh cycle.
### 8.2.7 Sign Contract

contract-preview.html → draw or upload signature. Status updates per party.

**Expected outcome:** Workflow step completes without error toast; dashboard reflects new state within one refresh cycle.
### 8.2.8 Fund Escrow

escrow.html → deposit total project value. Milestones: 30% / 40% / 30%.

**Expected outcome:** Workflow step completes without error toast; dashboard reflects new state within one refresh cycle.
### 8.2.9 Release Milestones

Approve completed work phases. Funds released to contractor.

**Expected outcome:** Workflow step completes without error toast; dashboard reflects new state within one refresh cycle.
### 8.2.10 Close & Rate

Mark project closed. Rate contractor. Portfolio auto-updated.

**Expected outcome:** Workflow step completes without error toast; dashboard reflects new state within one refresh cycle.
## 8.3 Contractor / Engineer User Manual
### 8.3.1 Register as Contractor

auth/register-contractor.html — specialty, experience, national ID photo (mandatory), certificate optional. Status: pending until admin approval.
### 8.3.2 Browse Projects

browse-projects.html — filter by specialty (default: match my trade), governorate, budget.
### 8.3.3 Submit Blind Bid

project-detail.html — enter amount, duration, message. Credits deducted per budget tier.
### 8.3.4 My Agreements

agreement-detail.html — timeline, contract preview, signature.
### 8.3.5 Portfolio

portfolio-upload.html → profile gallery. Before/after photos supported.
### 8.3.6 Referral Program

referral.html — share code, view stats, apply welcome code.
### 8.3.7 Buy Credits

buy-credits.html — mock Paymob checkout for bid credits.
### 8.3.8 Materials Market

materials.html — B2B product orders for job sites.
## 8.4 Administrator User Manual
### 8.4.1 Admin Login

auth/admin-login.html — separate from public login.
### 8.4.2 Approve Contractors

pending-contractors.html or manager/index.html inline list.
### 8.4.3 Reject with Reason

Modal requires ≥3 character reason; emailed to contractor.
### 8.4.4 Manage Disputes

disputes.html — escrow and warranty claims.
### 8.4.5 Platform Settings

settings.html — commission rate, referral bonuses, warranty caps.
### 8.4.6 Audit Log

audit-log.html — super_admin only immutable action trail.
### 8.4.7 Feature Projects

all-projects.html — isFeatured / isUrgent flags.
## 8.5 Troubleshooting Guide
| Symptom | Resolution |
| --- | --- |
| Cannot submit bid | Verify approvalStatus=approved, sufficient credits, project status=open. |
| Contract not visible | Customer must generate contract first after award. |
| PDF garbled text | Use HTML preview (contract-preview.html); PDF requires Puppeteer/Chromium on server. |
| Portfolio not showing | Refresh profile.html; confirm POST /api/portfolio returned 201. |
| OTP not received | Check SMTP env vars; use demo bypass in development seed. |

## 8.6 Chapter Summary

This chapter operationalises the SRS requirements into actionable user journeys for all four roles, forming the basis for acceptance testing and training materials.
