# Chapter 9: Project Management and Software Development Lifecycle



## 9.1 Introduction



El-Moquwal was developed using an **Agile-inspired iterative methodology** adapted for an academic graduation timeline. Two-week sprints aligned with faculty milestone reviews (proposal → analysis → design → implementation → testing → documentation).



## 9.2 Team Structure and Responsibilities



| Role | Responsibility |

| --- | --- |

| Project Lead | Architecture decisions, API design, integration |

| Backend Developer | Express routes, Mongoose models, escrow logic |

| Frontend Developer | SPA dashboards, RTL CSS, customer/contractor UX |

| QA / Documentation | Test matrices, SRS traceability, Word deliverable |

| Business Analyst | Feasibility, financial model, competitor benchmarking |



## 9.3 Sprint Timeline (Academic Year 2025–2026)



| Sprint | Duration | Deliverables |

| --- | --- | --- |

| S1 | Weeks 1–2 | Problem statement, literature review, SWOT |

| S2 | Weeks 3–4 | Feasibility study, financial projections |

| S3 | Weeks 5–6 | ERD, architecture diagrams, SRS draft |

| S4 | Weeks 7–8 | Auth module, user registration, National ID parser |

| S5 | Weeks 9–10 | Projects, blind bidding, credit ledger |

| S6 | Weeks 11–12 | Escrow, contracts, PDF generation |

| S7 | Weeks 13–14 | AI estimation, chatbot, materials marketplace |

| S8 | Weeks 15–16 | Admin panel, disputes, audit log |

| S9 | Weeks 17–18 | Integration testing, security hardening |

| S10 | Weeks 19–20 | UI polish, documentation, viva preparation |



## 9.4 Risk Register



| ID | Risk | Probability | Impact | Mitigation |

| --- | --- | --- | --- | --- |

| R1 | Payment gateway delay | Medium | High | Mock Paymob; abstract payment service interface |

| R2 | AI API outage | Medium | Medium | Dual-provider fallback (Pollinations + Claude) |

| R3 | Low contractor adoption | High | High | Referral credits, free signup grants |

| R4 | Legal challenge to e-signatures | Low | High | SHA256 audit trail + PDF archival |

| R5 | MongoDB data loss | Low | Critical | Daily backups, replica set in production |

| R6 | Arabic PDF rendering bugs | Medium | Medium | Puppeteer with Alexandria font; pdfkit fallback |



## 9.5 Quality Assurance Plan



Quality gates were enforced at each sprint review: (1) all new endpoints documented in Chapter 7; (2) RBAC tests for admin boundaries; (3) no critical linter errors in CI; (4) responsive UI check on 375px and 1440px viewports.



## 9.6 Configuration Management



Git branching model: `main` (stable), `develop` (integration), feature branches per module. Pull requests require peer review. Semantic versioning planned post-graduation (v1.0.0 launch).



## 9.7 Chapter Summary



Structured project management ensured timely delivery of a complex multi-stakeholder marketplace while maintaining academic rigour and traceability from requirements to implementation.

