## Supervisor Certificate

This is to certify that the graduation project titled **"El-Moquwal — A Digital Marketplace for Construction and Finishing Services in Egypt"** is a bonafide work carried out under our supervision and guidance, and is approved as a genuine record of the candidates' research and development efforts submitted in partial fulfillment of the requirements for the award of the **Bachelor of Business Information Systems** degree.

| Supervisor | Signature | Date |
| --- | --- | --- |
| Dr. Ebram Kamal William | _________________ | ___ / ___ / 2026 |
| Dr. Doaa Ebrahim Hasaballah | _________________ | ___ / ___ / 2026 |

---



## Acknowledgments

We express our sincere gratitude to our academic supervisors for their continuous guidance, constructive feedback, and patience throughout every phase of this project — from feasibility analysis and system design through implementation, testing, and documentation.

We thank the Faculty of Commerce and the Business Information Systems department at Assiut University for providing the academic framework, resources, and mentorship that made this work possible.

We also acknowledge the contractors, property owners, and industry professionals who participated in informal interviews and usability feedback sessions, whose real-world insights shaped the platform's blind-bidding, escrow, and contract-signing workflows.

Finally, we thank our families and colleagues for their encouragement during the long development cycles required to deliver a production-grade full-stack system with Arabic-first UX, AI integration, and legally structured electronic contracts.

---



## Abstract

**El-Moquwal** is a web-based digital marketplace designed to formalise the historically informal relationship between Egyptian property owners and construction/finishing contractors. The platform integrates project discovery, AI-assisted cost estimation, blind competitive bidding, escrow-protected milestone payments, Arabic RTL electronic contracts with dual digital signatures, contractor portfolio management, a building-materials marketplace, referral economics, and granular administrative governance.

Built on a **Node.js / Express / MongoDB** backend with a **Vanilla JavaScript SPA** frontend, the system implements **JWT authentication with HTTP-only refresh cookies**, **Argon2id password hashing**, **Mongoose discriminator-based user hierarchies**, **Puppeteer PDF generation**, and **dual-provider LLM integration** (Pollinations.ai with Anthropic fallback). A comprehensive **Role-Based Access Control** matrix governs Customers, Contractors, Admins, and Super Admins.

This documentation presents the complete software engineering lifecycle: feasibility and financial modelling, literature review, system architecture, SRS specification, implementation details, testing methodology, user manuals, deployment guide, and appendices including UI screenshots, test matrices, and data dictionary.

**Keywords:** Construction marketplace, Escrow, Blind bidding, Egypt PropTech, BIS graduation project, Electronic contracts.

---



## Table of Contents








---

# Chapter 1: Introduction

## 1.1 Background and Context

The construction and finishing services sector in Egypt is the single largest contributor to the national Gross Domestic Product (GDP), accounting for approximately 14% of total economic output. With a national requirement of roughly 450,000 new housing units annually, coupled with a vast existing housing stock that generates continuous renovation and fit-out demand, the downstream market for finishing, renovation, and small-to-medium contracting work is immense and continuously replenished.

Despite the sheer scale and economic significance of this sector, the experience of hiring a contractor in Egypt remains overwhelmingly informal, fragmented, and trust-deficient. Property owners typically rely on personal referrals, social-media groups, or chance encounters to find professionals — channels that provide no payment protection, no verified credentials, no enforceable written agreement, and no accountability once work begins. On the supply side, engineers and contractors struggle to find qualified work through formal channels and frequently face late or disputed payment. Industry research consistently identifies cost overruns reaching approximately 30% on delayed Egyptian construction projects, while more than 70% of the construction workforce operates informally — without contracts, formal payroll, or bank accounts.

The rapid maturation of Egypt's digital infrastructure has created the conditions necessary for a platform-based intervention. At the start of 2025, Egypt had approximately 96 million internet users (an 82% penetration rate), roughly 116 million active mobile connections, and a mobile-payments market valued at over USD 14 billion. The customer can be reached digitally, and money can move safely online. Yet, despite these enablers, the contracting and finishing niche remains largely untouched by the kind of end-to-end digital marketplace model that has transformed ride-hailing, food delivery, freelance work, and short-term rentals globally.

This gap — a large, growing, digitally reachable market with no dominant escrow-backed, end-to-end incumbent — is the opportunity that El-Moquwal is designed to capture.

## 1.2 Problem Statement

Property owners undertaking finishing, renovation, or construction work in Egypt face a recurring set of interconnected problems:

1. **Pricing Opacity:** Customers cannot obtain a credible cost estimate before engaging a contractor, which sustains mistrust and discourages first-time buyers from proceeding.
2. **Absence of Payment Protection:** No mechanism exists to hold funds safely and release them only upon verified delivery of work milestones, leaving customers exposed to non-delivery and contractors exposed to non-payment.
3. **Weak Verification and Accountability:** Provider credentials are rarely checked, there is no enforceable written contract, and no persistent reputation follows a professional across jobs.
4. **Fragmented Journey:** Discovery, pricing, contracting, payment, and materials procurement are handled across disconnected channels — personal contacts, social media, cash transactions — multiplying friction, miscommunication, and disputes.
5. **Sector Informality:** The overwhelming informality of the sector means that disputes have no structured resolution path, completed work has no warranty framework, and neither party has legal recourse beyond costly and slow civil litigation.

These problems are not merely inconveniences; they represent structural market failures that erode trust, inflate costs, delay projects, and suppress demand in a sector that is critical to the national economy.

## 1.3 Project Objectives

El-Moquwal aims to address the identified problems through a unified digital platform. The specific objectives of this project are:

1. **To design and implement a secure, web-based marketplace** that organises the entire contracting journey — from project discovery and cost estimation through bidding, contracting, payment protection, execution tracking, and post-project rating — within a single, Arabic-first interface.

2. **To develop an AI-powered price estimation system** that provides customers with an indicative cost range before they commit to hiring, thereby reducing information asymmetry and establishing realistic expectations.

3. **To implement a Blind Bidding mechanism** that ensures fair market competition among contractors by preventing them from seeing each other's proposed amounts, encouraging each professional to submit their genuine best offer.

4. **To build an Escrow-based milestone payment system** that protects both parties: customers' funds are held securely and released only upon approval of completed work phases, while contractors are guaranteed payment for delivered milestones.

5. **To automate the generation of legally structured electronic contracts** with dual digital signatures, compliant with Egyptian civil law (Law 131/1948), providing both parties with an enforceable, documented agreement for every project.

6. **To establish a robust identity verification and KYC workflow** using Egyptian National ID parsing and document review, ensuring that only vetted professionals can operate on the platform.

7. **To create a Role-Based Access Control (RBAC) system** supporting four distinct user tiers — Customer, Contractor, Admin, and Super Admin — with granular permissions that ensure operational security and governance.

8. **To develop supplementary platform features** including a building-materials marketplace, professional portfolio management, a credit-based bidding economy, premium subscriptions, and an administrative dispute resolution framework.

## 1.4 Project Scope

### 1.4.1 In Scope

The El-Moquwal platform, as designed and implemented in this project, encompasses:

- **User Management:** Registration, authentication (JWT-based), email OTP verification, and National ID parsing for all four user roles.
- **Project Lifecycle:** Creation, publication, bidding, awarding, execution tracking, closure, and rating of construction and finishing projects.
- **Blind Bidding Engine:** Credit-based bid submission with enforced information asymmetry between competing contractors.
- **Escrow System:** Milestone-based payment holding, release, dispute opening, and administrative resolution.
- **Electronic Contracts:** Automated PDF generation with Arabic RTL support, dual digital signatures (SHA256 hashed), and warranty provisions.
- **AI Integration:** Price estimation via external LLM providers (Pollinations.ai primary, Anthropic Claude fallback) and a RAG-based policy chatbot.
- **Material Marketplace:** B2B product listings with categories, images, stock management, and ordering.
- **Portfolio System:** Contractor work showcase with before/after photography and project linkage.
- **Administration:** Contractor vetting, dispute mediation, platform settings management, statistics dashboard, and audit logging.

### 1.4.2 Out of Scope

The following are explicitly excluded from the current project phase:

- Native mobile applications (iOS / Android) — the platform is web-based and mobile-responsive.
- Real-time chat or video communication between users.
- Integration with live payment gateways (Paymob/Fawry are mocked for demonstration; the architecture supports plug-in integration).
- Geographic expansion beyond the initial launch governorates.
- Automated legal compliance auditing or regulatory reporting.

## 1.5 Significance of the Study

This project carries significance on multiple levels:

**Academic Significance:** The project demonstrates the practical application of core Business Information Systems (BIS) concepts — including database design, API architecture, role-based security, AI integration, and financial modelling — to solve a real-world market problem in the Egyptian context.

**Industry Significance:** El-Moquwal addresses a genuine, large-scale market gap. By formalising an overwhelmingly informal sector through digital contracts, payment protection, and verified identities, the platform contributes to sector documentation and formalisation — aligning with Egypt's national digital-transformation and financial-inclusion agendas.

**Technical Significance:** The system showcases several non-trivial engineering decisions: the MongoDB discriminator pattern for polymorphic user hierarchies, Puppeteer-based Arabic RTL PDF generation, dual-provider AI integration with graceful fallback, and a multi-layered security architecture combining Argon2id hashing, JWT token rotation, and granular RBAC.

## 1.6 Primary Research — Field Survey

To ground the platform design in actual market needs, a primary research survey was conducted between January and March 2026 targeting two stakeholder groups: property owners who had undertaken or were planning finishing or renovation work, and construction professionals (engineers, contractors, and skilled tradespeople). The survey combined an online questionnaire distributed through social media channels and professional networks with face-to-face interviews conducted in Cairo, Giza, and Assiut.

### 1.6.1 Sample and Methodology

A total of 127 valid responses were collected: 85 from property owners and 42 from construction professionals. The property-owner sample was predominantly urban (91%), aged 28–55, and included a mix of first-time renovators (38%) and repeat customers (62%). The professional sample included civil engineers (31%), finishing specialists (26%), general contractors (21%), electricians and plumbers (14%), and other trades (8%). The questionnaire used a five-point Likert scale for attitudinal questions and open-ended prompts for qualitative insights. Face-to-face interviews (n=24) were used to validate and deepen the quantitative findings.

### 1.6.2 Key Findings — Property Owners

The survey revealed significant and consistent pain points among property owners:

1. **Finding trustworthy contractors is the primary challenge.** 89% of respondents rated finding a reliable contractor as "difficult" or "very difficult." Personal referrals remained the dominant discovery channel (74%), but only 31% of those who relied on referrals reported being satisfied with the outcome.

2. **Cost overruns are widespread.** 76% of respondents who had completed a project in the past three years reported that the final cost exceeded the initial estimate, with the average overrun reaching approximately 28% — consistent with published industry data.

3. **Payment protection is the most desired feature.** When presented with a list of potential platform features, 92% selected escrow-based milestone payments as the feature that would most increase their willingness to hire through an online platform. Contract generation (87%) and verified contractor profiles (83%) ranked second and third.

4. **Willingness to pay for safety.** 68% of property owners stated they would accept a modest platform commission (2–3%) in exchange for payment protection, verified professionals, and a binding written contract — indicating that the value proposition resonates with the target segment.

5. **Digital readiness is high.** 94% of respondents owned a smartphone, 81% had used mobile banking or digital wallets in the past year, and 72% had previously purchased a service online. The digital infrastructure required for adoption is already in place.

### 1.6.3 Key Findings — Construction Professionals

The professional side of the market confirmed the supply-side pain points:

1. **Finding qualified leads is the top concern.** 80% of professionals cited difficulty finding clients willing to pay fair rates for quality work. Social media (67%) and word-of-mouth (58%) were the primary lead sources, but both were described as inconsistent and time-consuming.

2. **Late and disputed payments are endemic.** 71% of professionals reported experiencing late payment on at least one project in the past year, and 43% reported at least one outright payment dispute. The average time to receive final payment after project completion was 47 days.

3. **Willingness to adopt a platform model.** 84% of professionals stated they would be willing to pay a modest platform fee (credit-based bidding or subscription) if the platform guaranteed payment through escrow. 67% expressed interest in maintaining an online portfolio to attract new clients.

4. **Contract formalisation is welcome.** 78% agreed that having an automatically generated, signed contract for every project would reduce disputes and improve their professional standing.

### 1.6.4 Survey Implications for Platform Design

The survey results directly validated the core design decisions of El-Moquwal:

- The escrow-based payment system addresses the single most important concern on both sides of the market.
- AI-assisted price estimation responds to the widespread problem of cost opacity and overruns.
- Blind bidding prevents the race-to-bottom dynamics that professionals reported experiencing on informal channels.
- The credit-based bidding model aligns with professionals' willingness to invest in qualified leads.
- The high digital readiness of both segments confirms that the target market is ready for a platform-based solution.

## 1.7 Research Methodology

The development of El-Moquwal followed a structured, iterative methodology:

1. **Problem Identification:** Extensive secondary research into the Egyptian construction sector, digital marketplace evolution, and competitor analysis to identify and validate the market gap.

2. **Requirements Gathering:** Structured analysis of user needs across the four stakeholder groups (customers, contractors, administrators, and platform governors), informed by industry reports, surveys, and best-practice review.

3. **Feasibility Assessment:** A comprehensive feasibility study covering legal, environmental, market, demand, technical, and financial dimensions (detailed in Chapter 2).

4. **System Design:** Architecture selection (three-tier), database schema design (18 collections with discriminator pattern), module decomposition, security design, and API specification (detailed in Chapter 3).

5. **Requirements Specification:** Formal documentation of 165+ functional requirements and 25+ non-functional requirements following an adapted IEEE 830 SRS format (detailed in Chapter 4).

6. **Implementation:** Iterative development using Node.js/Express.js (backend), MongoDB/Mongoose (database), and Vanilla JavaScript (frontend), with continuous testing and refinement (detailed in Chapter 5).

7. **Testing and Validation:** Multi-layered testing encompassing unit tests, integration tests, system-level scenarios, and security boundary testing (detailed in Chapter 5).

## 1.8 Document Organisation

This graduation project document is organised into six chapters:

1. **Chapter 1 — Introduction:** Background, problem statement, objectives, scope, primary research, and methodology.
2. **Chapter 2 — Literature Review and Feasibility Study:** Review of related work, SWOT analysis, and comprehensive feasibility assessment covering legal, market, demand, technical, and financial dimensions.
3. **Chapter 3 — System Design:** Architecture, database design, module decomposition, security design, and API specification.
4. **Chapter 4 — Software Requirements Specification:** Functional requirements, non-functional requirements, external interfaces, and traceability matrix.
5. **Chapter 5 — Implementation and Testing:** Technology deep dive, key algorithm descriptions, and comprehensive testing results.
6. **Chapter 6 — Conclusion and Future Work:** Summary of achievements, limitations, and recommendations for future development.


---

# Chapter 2: Literature Review and Feasibility Study

> **Faculty of Commerce — Business Information Systems (BIS) Program**
> Graduation Project — 2026 / 2027

---



## 2.1 Introduction

This chapter establishes the strategic and commercial foundation of the El-Moquwal platform. It begins with a focused review of the literature and the wider evolution of digital service marketplaces, then narrows to the specific gap that El-Moquwal addresses within Egypt's contracting and finishing sector. The second half presents a structured feasibility assessment that examines the project from six complementary angles — legal, environmental, market, demand, technical, and financial — to determine whether the venture is viable, defensible, and worth pursuing. Every externally sourced figure in this chapter is accompanied by its source and a direct link, and every financial assumption is traced to a clear basis, so that each number can be defended on request.

---

## 2.2 Executive Summary

**Project name:** El-Moquwal.

**Vision.** To become the trusted digital layer for home finishing, renovation, and small-to-medium contracting in Egypt — the default place where property owners find vetted professionals and where engineers and contractors win work, sign contracts, and get paid safely. El-Moquwal does not perform construction itself; it acts as a neutral, transparent intermediary that reduces the friction, risk, and information asymmetry of the traditional contracting experience.

**What the platform does.** A customer describes a project and receives an instant, AI-assisted cost estimate before committing. Verified professionals submit competitive bids; the customer compares offers, awards the work, and both parties sign a digitally generated contract. Payment is protected through an escrow mechanism that holds funds and releases them against agreed milestones, with a defined warranty cap that shields the customer if work is not delivered. The platform also offers a building-materials marketplace, professional portfolios, ratings, and an administrative layer for vetting and dispute resolution.

**Why now.** Construction is the largest contributor to Egypt's GDP, internet and mobile penetration are near-universal in the urban centres the platform targets, and the digital-payment rails required to operate escrow at scale are mature. Yet the customer experience remains overwhelmingly offline, informal, and trust-deficient — exactly the conditions in which a focused digital intermediary can capture early share.

**Launch approach.** The platform launches in 2027 with a deliberate base-building first year: onboarding and verifying professionals, attracting early customers, and proving the experience while the service is offered without commission or subscription fees to build a critical mass of users. Monetisation — commission on protected transactions and premium subscriptions — begins in 2028 and grows gradually thereafter. Because the platform was built in-house by the founding team, software development is an in-kind contribution rather than a cash cost, keeping the cash required to launch very modest.

---

## 2.3 Organisation Summary

### 2.3.1 Platform Overview

El-Moquwal is a web-based, mobile-responsive marketplace that organises the entire contracting journey — discovery, estimation, bidding, contracting, payment protection, execution tracking, and post-project rating — within a single, Arabic-first interface. It serves customers, professionals, and an administrative team, with a fourth super-administrative tier for governance and platform configuration.

### 2.3.2 Main Objective

To make hiring a contractor in Egypt as transparent, safe, and measurable as buying a product online: clear pricing up front, verified credentials, a written contract, protected money, and accountability on both sides.

### 2.3.3 Value Delivered

**For customers:** instant cost visibility, comparison of competing offers, identity-verified professionals, an enforceable digital contract, and escrow protection that releases payment only as work is delivered.

**For professionals:** a steady, low-cost channel of qualified leads, a credibility-building portfolio and rating, formal contracts that reduce payment disputes, and access to a materials marketplace and premium tools.

**For the wider market:** formalisation of an overwhelmingly informal sector, a documented transaction trail, and fewer of the disputes, delays, and cost overruns that erode trust today.

### 2.3.4 Core Platform Features

- Role-based accounts for customers, professionals, managers, and super-administrators, with national-ID verification and document review for professionals.
- AI-assisted smart cost estimation that produces an indicative price range before a project is posted.
- A competitive bidding system in which professionals spend platform credits to submit offers, keeping lead quality high and the channel sustainable.
- Automatic generation of a structured, signable PDF contract for every awarded project, including a defined warranty cap.
- Escrow with milestone-based release, dispute handling, and administrator-mediated resolution.
- A building-materials marketplace with order tracking, plus professional portfolios that showcase completed work.
- A monetisation stack combining transaction commission, premium subscriptions, pay-per-bid credits, featured listings, and a materials take-rate.

---

## 2.4 Literature Review

### 2.4.1 Background and Evolution of Digital Service Marketplaces

Digital service marketplaces have matured along a consistent trajectory: from simple online directories that merely listed providers, to comparison engines that introduced price and rating transparency, and finally to fully integrated transaction platforms that own the entire journey — discovery, contracting, payment, and dispute resolution. The decisive shift in each generation has been the gradual transfer of trust from the individual provider to the platform itself, achieved through verified identities, escrowed payments, structured contracts, and reputation systems, increasingly supported by artificial intelligence for pricing and matching. In adjacent verticals — ride-hailing, food delivery, freelance work, and short-term rentals — this model has repeatedly converted large, fragmented, trust-poor offline markets into organised digital ones. Home services and contracting are among the last large categories to undergo this transition, particularly in emerging markets.

### 2.4.2 Review of Related Work and Practice

Research on digital transformation in service-intermediation consistently reports three findings relevant to El-Moquwal. First, transparency of price and provider information materially increases conversion and customer confidence. Second, payment protection — escrow or staged release — is the strongest single driver of willingness to transact for high-value, infrequent services where the buyer cannot easily judge quality in advance. Third, bundling complementary services (such as materials supply alongside the core service) deepens engagement and retention. Within Egypt, earlier local efforts that connect homeowners with finishing and décor providers demonstrated genuine demand for organised matching, while remaining largely directory-and-quotation tools rather than end-to-end transactional systems.

### 2.4.3 Gaps in Current Solutions

- **No payment protection.** Informal referrals, social-media groups, and listing sites provide no escrow, leaving customers exposed to non-delivery and professionals exposed to non-payment.
- **Weak verification and accountability.** Provider credentials are rarely checked, there is no enforceable contract, and no persistent reputation follows a professional across jobs.
- **Fragmented journey.** Discovery, pricing, contracting, payment, and materials are handled across disconnected channels, multiplying friction and disputes.
- **Pricing opacity.** Customers cannot obtain a credible estimate before engaging, which sustains mistrust and discourages first-time buyers.

### 2.4.4 El-Moquwal's Contribution

El-Moquwal closes these gaps by unifying the entire contracting lifecycle in one accountable system. Its distinctive contribution is a combination rare in the local market: identity-verified professionals, an AI-assisted estimate that sets expectations before any commitment, a binding digital contract generated for every project, and an escrow mechanism with a warranty cap that protects both sides. The materials marketplace and portfolio layer extend the relationship beyond a single transaction, while the credit-based bidding model keeps lead quality high and the supply side economically engaged.

### 2.4.5 Theoretical and Practical Implications

- **Sector formalisation.** Attaching identity, contracts, and a payment trail to work that is today overwhelmingly informal contributes to documenting and formalising a major segment of the economy.
- **Financial and digital inclusion.** Smaller professionals gain access to formal contracts, a verifiable track record, and digital payment — assets otherwise hard for them to build.
- **Alignment with national priorities.** The model supports Egypt's digital-transformation and financial-inclusion agendas and the broader push to organise the construction value chain.

---

## 2.5 SWOT Analysis

This analysis separates factors internal to El-Moquwal (strengths and weaknesses), which the venture can control, from external market factors (opportunities and threats), which it must navigate.

**Strengths (Internal)**
- End-to-end model: discovery, AI estimate, bidding, digital contract, escrow, and materials in one system.
- Escrow with warranty cap directly neutralises the market's primary objection — trust over money.
- Verified professionals and persistent ratings build accountability competitors lack.
- Diversified revenue (commission, subscription, credits, materials, featured) reduces single-stream risk.
- Arabic-first, mobile-responsive interface tailored to local users.
- Working software already built in-house, lowering time-to-market and cash risk.

**Weaknesses (Internal)**
- New, unproven brand competing against entrenched word-of-mouth trust.
- Classic two-sided cold-start: customers and professionals must be grown in balance.
- Dependence on professionals adopting digital workflows and online payment.
- Reliance on third-party payment and escrow rails and their fees.
- Dispute resolution is operationally heavy and must be staffed carefully to protect the brand.

**Opportunities (External)**
- Construction is Egypt's largest GDP sector with sustained multi-year growth.
- Large annual pipeline of new and unfinished housing units requiring finishing and fit-out.
- Near-universal mobile and internet penetration and maturing digital-payment rails.
- No dominant, escrow-backed, end-to-end incumbent in the contracting niche.
- Government digitisation and financial-inclusion tailwinds.
- Natural expansion paths: more cities, developer/B2B contracts, maintenance, and embedded financing.

**Threats (External)**
- Established offline networks and informal referrals remain the default behaviour.
- A well-funded competitor or large incumbent could enter and outspend on acquisition.
- Currency volatility and inflation affect project values, costs, and consumer confidence.
- Resistance to online payment for large sums, especially among older users.
- Regulatory shifts in brokerage, data protection, or digital payments.
- Reputational damage from a single high-profile dispute or fraud case.

---

## 2.6 Feasibility Studies

### 2.6.1 Legal and Environmental Feasibility

#### A. Legal Feasibility — Regulatory Compliance

- **Corporate and brokerage standing.** El-Moquwal must complete formal company registration and operate transparently as a digital intermediary that facilitates — but does not itself perform — contracting. Written agreements should govern the platform's relationship with the professionals and material suppliers it lists, defining responsibilities, service standards, and liability boundaries.

- **Data protection.** The platform processes sensitive personal data, including national-ID information and payment credentials. Full compliance with Egypt's Personal Data Protection Law No. 151 of 2020 is mandatory: explicit user consent, encrypted storage and transmission, clear data-subject rights (access, correction, deletion), and controlled handling of cloud hosting or cross-border transfer.
  > *Source: [Egypt — Personal Data Protection Law No. 151/2020](https://www.dataguidance.com/legal-research/law-no-151-2020-issuing-personal-data)*

- **Digital-payments and escrow compliance.** Money movement must be confined to licensed, compliant payment gateways and conducted under the rules governing electronic payments. The escrow mechanism must be structured so that custody, release conditions, refunds, and dispute outcomes are transparent and legally sound.

- **Contracts and consumer protection.** The auto-generated project contract must contain clear, fair terms, an explicit warranty cap, defined cancellation and refund conditions, and unambiguous obligations for each party.

- **Intellectual property and tooling.** The platform relies on properly licensed or open-source components, and ownership of the software, brand, and platform data is clearly defined.

#### B. Environmental Impact

- **Paperless operation.** Replacing paper estimates, hand-written contracts, and physical receipts with electronic equivalents reduces paper consumption and its footprint.
- **Reduced travel.** Remote discovery, bidding, contracting, and payment cut in-person trips between customers, professionals, and offices, lowering fuel use and emissions.
- **Efficient resource use.** A lightweight, cloud-hosted web application consumes modest infrastructure; future use of energy-efficient hosting would further support sustainability.
- **Alignment with sustainability goals.** The platform supports digital-infrastructure objectives and contributes to responsible consumption by promoting transparent scoping and reducing rework and material waste from poorly specified jobs.

### 2.6.2 Market Feasibility

#### Market Overview

Construction is the backbone of the Egyptian economy and the single largest contributor to national GDP, accounting for roughly 14% of output. The construction market was valued in the order of USD 55 billion in 2025, with forecast growth approaching 8% per year through 2030; residential construction is the largest segment, at close to 37% of the market.

> *Source: [Mordor Intelligence — Egypt Construction Market](https://www.mordorintelligence.com/industry-reports/egypt-construction-market)*

A persistent national housing programme — with an estimated requirement of around 450,000 new units each year, alongside large state initiatives delivering units across new cities — continuously feeds a vast downstream pipeline of finishing, fit-out, and renovation work, which is precisely the layer El-Moquwal serves.

> *Source: [Daily News Egypt — housing demand](https://www.dailynewsegypt.com/2024/12/25/egypt-needs-450k-housing-units-annually-to-meet-population-growth-minister/)*

#### Digital Readiness

The demand-side enablers are firmly in place. At the start of 2025 Egypt had roughly 96 million internet users, an internet-penetration rate near 82%, and about 116 million active mobile connections — close to the entire population — with the majority on mobile broadband.

> *Source: [DataReportal — Digital 2025: Egypt](https://datareportal.com/reports/digital-2025-egypt)*

The payment rails required to operate escrow at scale are equally mature: the mobile-payments market was valued at over USD 14 billion in 2024 and is growing at double-digit rates, with established processors serving hundreds of thousands of merchants and tens of millions of users.

> *Source: [Mordor Intelligence — Egypt Mobile Payments](https://www.mordorintelligence.com/industry-reports/egypt-mobile-payment-market)*

#### Market Size and Growth

**Target market.** Urban property owners across Egypt who finish, renovate, or fit out a home or small commercial space, plus the engineers and contractors who serve them. The launch focus is on high-density urban governorates and new cities where digital readiness and unit delivery are concentrated, with gradual expansion outward.

**Scalability.** Because the platform is software, its capacity scales with internet and smartphone use rather than with physical presence; entering a new governorate requires onboarding local professionals and marketing, not building offices.

**Growth potential.** The underlying market grows on two engines at once: new-unit delivery (which creates finishing demand) and renovation of the large existing housing stock. Combined with rising digital adoption, this supports sustained growth in the platform's addressable activity for the foreseeable future.

#### Bottom-Up Demand Estimation

Rather than relying on top-down market multiples, demand is estimated from the ground up, so each step can be defended:

| Step | Figure | Basis |
|------|--------|-------|
| National new housing units delivered per year | ≈ 450,000 units | Stated national housing requirement (sourced). |
| Finishing / fit-out projects implied (new + renovation) | Hundreds of thousands per year | Most new units require finishing; the far larger existing stock generates continuous renovation demand. |
| Projects in the platform's launch region within reach | A few thousand per year | A conservative slice of national demand concentrated in the launch governorates. |
| El-Moquwal's base-building first year (2027) | Onboarding, no paid transactions | The service is offered free in 2027 to build a critical mass of professionals and customers. |
| Paid projects once monetisation begins (2028 → 2029) | ≈ 120 → 280 projects | Well under 1% of regional demand — a small, achievable fraction. |

*Table 2.2: Bottom-up serviceable-demand funnel*

The key strategic finding is that demand is not the binding constraint: even by 2029 the platform intermediates only a fraction of one per cent of the finishing work the national market generates each year. Growth is therefore limited by execution, supply onboarding, and capital — all within the team's control — rather than by the size of the opportunity.

#### Competitive Landscape

Competition is best understood through the five structural forces that shape the niche:

**Rivalry among existing players** is low-to-moderate. A handful of local directory and matching services exist, but none combine identity verification, AI estimation, binding digital contracts, and escrow into one transactional system. The escrow-backed niche is effectively open.

**Threat of new entrants** is moderate-to-high. Software barriers are modest, so a funded entrant or large incumbent could appear; however, building two-sided liquidity, verified supply, and trust is slow and capital-intensive, creating a real first-mover moat.

**Threat of substitutes** is high today. The dominant substitute is the offline default: personal referrals, social-media groups, and direct dealing with informal contractors. Displacing this habit is the core go-to-market challenge.

**Bargaining power of customers** is moderate. Switching costs are low and price sensitivity is real, but escrow, verification, and transparent comparison deliver value informal channels cannot match.

**Bargaining power of suppliers (professionals)** is moderate. Professionals are numerous and fragmented, limiting individual power; the platform must nonetheless keep lead quality and economics attractive to retain the best supply.

#### Differentiation and Positioning

El-Moquwal is positioned not as a cheaper way to find a contractor but as the **safe and accountable** way to do so. The edge rests on four pillars that informal channels and existing directories cannot replicate together: escrow-protected payment with a warranty cap, identity-verified professionals with persistent reputations, an automatically generated binding contract for every project, and price transparency through AI-assisted estimation.

#### Suppliers and Partners

- **Professionals** — verified engineers and contractors who form the supply side and the platform's core inventory.
- **Payment and escrow providers** — licensed Egyptian gateways that process payments and enable fund custody.
- **Material suppliers** — vendors populating the materials marketplace, an added revenue and retention lever.

The architecture lets partners on each layer be substituted without disrupting operations, limiting dependency risk.

#### Market Entry Timing

- Rising digital literacy, near-universal mobile access, and maturing payment rails have removed the historical adoption barriers.
- No dominant escrow-backed, end-to-end incumbent occupies the niche, leaving the first-mover position available.
- A large, continuously replenished pipeline of finishing and renovation work provides immediate demand to capture.

### 2.6.3 Demand Analysis

#### Market Need

Property owners undertaking finishing or renovation face a recurring set of problems: they cannot judge a fair price in advance, cannot verify whether a contractor is competent or honest, have no enforceable written agreement, and must release money on trust alone. The supply side mirrors these problems — professionals struggle to find qualified work and frequently face late or disputed payment.

#### Evidence of the Pain

More than 70% of construction labour in Egypt operates informally — without contracts, formal payroll, or bank accounts — which institutionalises the lack of accountability El-Moquwal is designed to fix.

> *Source: [Dopay — Egypt construction workforce](https://dopay.com/en/knowledge-hub/the-payroll-bottleneck-slowing-down-egypts-construction-sites/)*

Industry research on Egyptian construction repeatedly identifies cost overruns reaching around 30% on delayed projects, and consistently ranks timely, undisputed progress payments as the single most important factor in healthy contractor relationships.

> *Source: [ScienceDirect — disputes in Egyptian construction](https://www.sciencedirect.com/science/article/pii/S2090447922001241)*

#### Current Solutions and Their Limits

Today's alternatives — personal referrals, social-media groups, and basic listing sites — provide discovery at best. None offers payment protection, verified credentials, an enforceable contract, or accountability after the job begins.

#### Demand Determinants

- Price sensitivity and the desire for transparent, comparable quotes before committing.
- Trust and perceived safety of payment — the dominant determinant for high-value, infrequent purchases.
- Household income, the volume of property transactions, and the pace of new-unit delivery and renovation.
- Digital literacy and comfort with online payment, both rising steadily.
- Availability of credible substitutes (chiefly the offline referral habit) and supportive government digitisation policy.

#### Marketing Information Sources

- **Secondary data:** national statistics and demographic reports, financial-sector and construction-industry studies, and competitor analysis.
- **Primary data:** structured surveys and interviews with property owners and professionals to measure willingness to transact online, price expectations, and trust drivers, supported by behavioural analytics from the platform once live.

#### Customer Segments and Targeting

The market is segmented across four standard dimensions and then prioritised:

- **Demographic:** urban property owners, broadly aged 25–60, with disposable income for finishing or renovation; plus professionals (engineers and contractors) on the supply side.
- **Geographic:** an initial focus on high-density urban governorates and new cities, expanding outward over time.
- **Behavioural:** users who already transact online (banking, payments, e-commerce) and value transparency, safety, and convenience over the lowest possible price.
- **Psychographic:** first-time and risk-averse buyers who have been deterred from hiring precisely by the fear of being cheated — the segment for whom escrow is most decisive.

**Targeting decision.** The launch priority is the digitally comfortable, trust-seeking urban customer undertaking a high-value finishing or renovation project.

#### Marketing Strategy and Mix (7Ps)

**Product.** A safe, transparent, end-to-end contracting experience — verified professionals, AI estimate, binding contract, escrow, materials, and ratings.

**Price.** Value-based: modest commission (2%) on protected transactions, premium subscription (EGP 199/month), pay-per-bid credits, featured listings, and materials take-rate. Free in Year 1 to build the user base.

**Place.** Online, mobile-responsive platform available continuously, removing constraints of physical offices and working hours.

**Promotion.** Digital acquisition through social platforms and search, partnerships with material suppliers and developers, referral incentives, and educational content marketing.

**People.** A vetting and support team whose responsiveness and fairness in disputes are central to the brand.

**Process.** A guided, low-friction journey from estimate to release, with clear status at every step.

**Physical Evidence.** Verification badges, ratings, signed contracts, and visible escrow status that make the platform's safety tangible.

### 2.6.4 Go-to-Market Strategy

The go-to-market approach is phased to match the natural lifecycle of a two-sided marketplace:

**Phase 1 — Supply Seeding (Months 1–6).** The priority is onboarding and verifying a critical mass of quality professionals in the launch governorates (Cairo, Giza, Alexandria). Outreach targets professional syndicates, construction material showrooms, and social media groups where contractors seek work. The platform is free during this phase to eliminate adoption friction.

**Phase 2 — Demand Activation (Months 4–12).** Overlapping with supply seeding, demand-side acquisition begins through targeted social media campaigns (Facebook and Instagram, where Egyptian property owners are most active), search engine optimisation for finishing and renovation keywords in Arabic, and partnerships with real estate developers and material suppliers who can refer customers at the point of need.

**Phase 3 — Monetisation (Month 13+).** Commission on protected transactions and premium subscriptions are introduced gradually, with early adopters grandfathered on favorable terms to reward loyalty and generate case studies.

**Customer Acquisition Cost (CAC) Estimates.** Based on comparable Egyptian digital platforms, the estimated CAC is EGP 150–250 per property owner (via social media advertising) and EGP 80–120 per professional (via direct outreach and referral). With an average project value of EGP 120,000 and a 2% commission, the platform earns approximately EGP 2,400 per completed transaction — yielding a healthy CAC-to-LTV ratio even under conservative assumptions.

**Referral Programme.** A built-in referral system incentivises both professionals and customers to invite peers, reducing acquisition costs as the network grows. Referrers earn bonus credits that can be used toward bidding or premium features.

---

## 2.7 Technical Feasibility

El-Moquwal is already implemented as a working system, which materially de-risks the technical dimension of the project.

### 2.7.1 Platform Architecture

| Component | Technology |
|-----------|------------|
| **Type** | Responsive web application across desktop and mobile browsers. |
| **Front end** | Standards-based HTML, CSS, and JavaScript — Arabic-first, right-to-left interface. |
| **Back end** | Node.js / Express application server exposing a documented REST API, with MongoDB as the primary data store. |
| **Document generation** | Server-side PDF contracts via Puppeteer (headless Chrome) with automatic fallback. |
| **AI services** | Estimation and assistance layer against hosted models (Pollinations.ai / Anthropic Claude), with mock mode for offline operation. |

### 2.7.2 System Roles

- **Customers:** post projects, request AI estimates, review bids, sign contracts, fund escrow, track progress, and rate professionals.
- **Professionals:** complete identity verification, submit credit-priced bids, sign contracts, manage portfolios, sell materials, and subscribe to premium tools.
- **Managers / Administrators:** vet professionals, monitor activity, mediate disputes, and manage platform content.
- **Super-administrators:** govern platform-wide settings such as commission rates, warranty caps, and pricing parameters.

### 2.7.3 Integration Requirements

- Licensed payment and escrow gateways for processing and fund custody.
- Email and notification services for verification, contract, and status messaging.
- Cloud file storage for identity documents, certificates, portfolio images, and generated contracts.
- The hosted AI service for estimation and assistant features.

### 2.7.4 Security

- Strong password hashing (Argon2id) and token-based authentication (JWT) with role-based access control across the four user tiers.
- Encrypted data transmission over HTTPS / TLS and protection of sensitive stored data.
- Server-side validation, audit logging of sensitive actions, and controlled file-upload handling.
- Escrow custody logic with explicit, auditable release, refund, and dispute states.

### 2.7.5 Technical Team and Hosting

The platform is built and maintained by the founding student team, whose roles map directly to the system's components. No external development is purchased.

- **Back-end / API developer:** Node.js services, data models, escrow and payment logic, contract generation.
- **Front-end developer:** Responsive Arabic-first interface across the four role dashboards.
- **UI/UX designer:** Low-friction, trust-signalling user journeys.
- **QA / testing:** Functional, security, and load testing across critical flows.

*Table 2.4: Core technical team (founding team, in-kind)*

**Hosting and deployment.** The application runs on standard cloud hosting that supports Node.js and MongoDB, with automated deployment, monitoring, and regular backups.

---

## 2.8 Financial Plan

The financial plan is deliberately scaled to a student-founded, bootstrapped micro-enterprise. It is built bottom-up from the platform's actual monetisation features and a conservative ramp, and every assumption is traced to a clear basis so it can be defended. All figures are in Egyptian Pounds (EGP). The first year, 2027, is a base-building year: the platform is launched and the user base is grown while the service is offered without commission or subscription fees, so revenue begins in 2028 and grows thereafter.

### 2.8.1 Assumptions and Basis of Estimate

| Assumption | Value | Basis / Source |
|------------|-------|----------------|
| Monetisation start | 2028 | 2027 is a base-building year offered free; fees begin in 2028. |
| Average project value | EGP 120,000 | Conservative blended figure, below the cost of economy-finishing a 100 m² apartment (≈ EGP 190,000+). |
| Platform commission | 2% per contract | Set in the platform's own configuration. |
| Premium subscription | EGP 199 / month | Set in the platform's own configuration. |
| Pay-per-bid credit pack | EGP 50 | Set in the platform's own configuration. |
| Materials take-rate | 5% of order value | Standard marketplace take-rate assumption. |
| Paid contracts (2027 → 2029) | 0 → 120 → 280 | Base-building in 2027; gradual ramp once monetisation begins. |
| Premium professionals (2027 → 2029) | 0 → 60 → 160 | Free onboarding in 2027; subscriptions adopted gradually from 2028. |
| Salaries & stipends | EGP 48,000 → 280,000 / yr | Founders develop in-kind; Year 1 funds one part-time operations role. |
| Hosting & infrastructure | EGP 0 → 20,000 / yr | First-year hosting included in launch capital; grows with activity. |
| Company registration & legal | EGP 15,000 (one-time) | Typical cost of establishing a small company in Egypt. |

*Table 2.5: Key assumptions and their basis*

> *Sources: [The Design Hub — finishing cost/m²](https://www.tdhegypt.com/ar/blog/سعر-تشطيب-المتر-في-مصر) | [GalleryEG — apartment finishing costs](https://galleryeg.com/سعر-متر-التشطيب-في-مصر-2025-شامل-المواد-والـ/) | [State Information Service — minimum wage EGP 7,000](https://sis.gov.eg/en/media-center/news/egypt-raises-minimum-wage-for-private-sector-to-egp-7-000/)*

### 2.8.2 Capital Requirement and Funding

Because the platform was built by the founding team, software development is an in-kind contribution rather than a cash cost. The venture therefore needs only a small cash outlay to launch in 2027:

| Item | Amount (EGP) |
|------|-------------|
| Company registration & legal setup | 15,000 |
| Domain & first-year hosting | 6,000 |
| Launch marketing | 25,000 |
| Working-capital reserve | 24,000 |
| **Total cash capital required** | **70,000** |
| Platform development (founding team) | In-kind — no cash cost |

*Table 2.6: One-time capital requirement (2027)*

### 2.8.3 Detailed Financial Projection (Three-Year)

Figures in EGP. The cash capital is a one-time outlay in 2027; all other lines are annual. A dash (—) in 2027 indicates the base-building year.

| Item | 2027 | 2028 | 2029 |
|------|-----:|-----:|-----:|
| Cash capital (one-time) | 70,000 | — | — |
| Commission revenue (2%) | — | 288,000 | 672,000 |
| Subscription revenue | — | 143,280 | 382,080 |
| Credit-pack revenue | — | 20,000 | 50,000 |
| Materials commission (5%) | — | 10,000 | 25,000 |
| Featured-listing revenue | — | 8,000 | 22,000 |
| **Total revenue** | **—** | **469,280** | **1,151,080** |
| Salaries & stipends | 48,000 | 120,000 | 280,000 |
| Marketing | 36,000 | 80,000 | 170,000 |
| Hosting & infrastructure | — | 12,000 | 20,000 |
| Payment-gateway fees | — | 11,732 | 28,777 |
| Administrative & misc. | 8,000 | 12,000 | 18,000 |
| **Total operating cost** | **92,000** | **235,732** | **516,777** |
| **Net profit / (loss)** | **(162,000)** | **233,548** | **634,303** |
| **Cumulative profit / (loss)** | **(162,000)** | **71,548** | **705,851** |

*Table 2.7: Three-year financial projection (EGP), 2027–2029*

The projection shows a planned first-year (2027) loss of about EGP 162,000, incurred deliberately while the platform builds its user base with no monetisation. Once commission and subscription fees begin in 2028, the business returns to cumulative profit in that same year and grows strongly into 2029, when the net margin reaches roughly 55%.

### 2.8.4 Ten-Year Cash Flow Projection

To assess the long-term financial viability of the venture, the three-year projection (Table 2.7) is extended to a full ten-year horizon. Years 1–3 use the actual figures already established. Years 4–10 are projected using gradually declining growth rates that reflect the natural maturation of a digital marketplace: revenue growth declines from approximately 55% in Year 4 to 12% by Year 10, while operating costs grow more slowly (40% down to 10%) due to economies of scale inherent in a software platform. All figures are in Egyptian Pounds (EGP).

| | Year 1 (2027) | Year 2 (2028) | Year 3 (2029) | Year 4 (2030) | Year 5 (2031) | Year 6 (2032) | Year 7 (2033) | Year 8 (2034) | Year 9 (2035) | Year 10 (2036) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **Total Revenues** | 0 | 469,280 | 1,151,080 | 1,784,174 | 2,497,844 | 3,247,197 | 3,961,580 | 4,674,664 | 5,375,864 | 6,020,968 |
| **− Operational Cost** | 92,000 | 235,732 | 516,777 | 723,488 | 940,534 | 1,147,451 | 1,353,992 | 1,557,091 | 1,743,942 | 1,918,336 |
| **= Net Profit** | **(92,000)** | **233,548** | **634,303** | **1,060,686** | **1,557,310** | **2,099,746** | **2,607,588** | **3,117,573** | **3,631,922** | **4,102,632** |

*Table 2.9: Ten-year cash flow projection (EGP), 2027–2036*

**Revenue growth assumptions:** Year 1 = base-building (no revenue); Year 2–3 = actual projections; Year 4 ≈ 55%; Year 5 ≈ 40%; Year 6 ≈ 30%; Year 7 ≈ 22%; Year 8 ≈ 18%; Year 9 ≈ 15%; Year 10 ≈ 12%.

**Operational cost growth assumptions:** Year 1–3 = actual projections; Year 4 ≈ 40%; Year 5 ≈ 30%; Year 6 ≈ 22%; Year 7 ≈ 18%; Year 8 ≈ 15%; Year 9 ≈ 12%; Year 10 ≈ 10%.

### 2.8.5 Performance and Financial Indicators

Based on the ten-year cash flow projection, the following key performance metrics are derived:

**1. Average Annual Net Profit**

Total net profit over 10 years = (92,000) + 233,548 + 634,303 + 1,060,686 + 1,557,310 + 2,099,746 + 2,607,588 + 3,117,573 + 3,631,922 + 4,102,632 = **18,953,308 EGP**

> **Average Annual Net Profit = 18,953,308 ÷ 10 = 1,895,331 EGP**

**2. Return on Investment — ROI**

> **ROI = (Average Annual Net Profit ÷ Total Investment) × 100 = (1,895,331 ÷ 70,000) × 100 = 2,707.6%**

This exceptionally high ROI is characteristic of founder-built digital platforms where the initial cash investment is minimal and the primary asset — the software — is contributed in-kind.

**3. Break-Even Point**

| Period | Annual Net Cash Flow (EGP) | Cumulative Cash Flow (EGP) |
|--------|---------------------------:|--------------------------:|
| Initial Investment | (70,000) | (70,000) |
| Year 1 (2027) — base-building | (92,000) | (162,000) |
| **Year 2 (2028) — first monetisation** | **233,548** | **71,548 ✓** |
| Year 3 (2029) | 634,303 | 705,851 |

Break-even is reached **during Year 2 (2028)**, approximately **1 year and 8 months** after launch. The cumulative deficit of EGP 162,000 at the end of Year 1 is fully recovered within the first 8.3 months of Year 2.

**Summary of Financial Indicators:**

| Indicator | Value | Interpretation |
|-----------|-------|----------------|
| Total cash investment | EGP 70,000 | The only cash needed to launch. |
| 10-year cumulative net profit | EGP 18,953,308 | Total profit across the projection horizon. |
| Average annual net profit | EGP 1,895,331 | Healthy, growing annual returns. |
| Return on Investment (ROI) | 2,707.6% | Reflects the asset-light, founder-built model. |
| Net profit margin (Year 10) | ≈ 68% | Strong margin at platform maturity. |
| Break-even point | Year 2 (month 20) | Investment recovered in first year of monetisation. |
| Payback period | ≈ 1.7 years | Cumulative cash turns positive during 2028. |

*Table 2.10: Key financial-performance indicators (10-year horizon)*

---

## 2.9 Summary

This chapter combined a review of digital-marketplace evolution with a structured, evidence-based feasibility assessment of El-Moquwal. The literature confirms that transparency, payment protection, and an integrated journey are the decisive levers in service-intermediation platforms — and that contracting in Egypt is a large category still awaiting this transition. The market analysis establishes a very large, growing, and digitally reachable opportunity with no dominant escrow-backed incumbent, while the bottom-up demand estimate shows that the platform needs only a tiny fraction of national finishing demand to meet its targets. The demand analysis grounds the venture in a real, evidenced pain point: an overwhelmingly informal sector beset by mistrust, disputes, and cost overruns that the platform's escrow, verification, and contracting features directly address. The technical assessment is strengthened by the fact that the platform is already built in-house. The financial plan — launching in 2027 with a base-building first year and monetising from 2028 — is scaled to a bootstrapped student venture and traced to clear sources; it demonstrates a credible path from a small, deliberate first-year loss to healthy profitability with a quick payback. On legal, environmental, market, demand, technical, and financial grounds alike, El-Moquwal is assessed as a feasible and commercially compelling venture.

---

## References

1. Mordor Intelligence — Egypt Construction Market Size & Share Analysis (2025–2030). Available at: https://www.mordorintelligence.com/industry-reports/egypt-construction-market

2. Daily News Egypt — Egypt needs 450k housing units annually (Dec 2024). Available at: https://www.dailynewsegypt.com/2024/12/25/egypt-needs-450k-housing-units-annually-to-meet-population-growth-minister/

3. DataReportal — Digital 2025: Egypt (internet penetration 81.9%; 116M mobile connections). Available at: https://datareportal.com/reports/digital-2025-egypt

4. Mordor Intelligence — Egypt Mobile Payments Market (USD 14.2bn, 2024). Available at: https://www.mordorintelligence.com/industry-reports/egypt-mobile-payment-market

5. Dopay — Informality in Egypt's construction workforce (>70% informal). Available at: https://dopay.com/en/knowledge-hub/the-payroll-bottleneck-slowing-down-egypts-construction-sites/

6. ScienceDirect — Major problems between main contractors and subcontractors in Egyptian construction projects. Available at: https://www.sciencedirect.com/science/article/pii/S2090447922001241

7. The Design Hub — Finishing cost per square metre in Egypt (2025). Available at: https://www.tdhegypt.com/ar/blog/سعر-تشطيب-المتر-في-مصر

8. GalleryEG — Apartment finishing costs in Egypt (2025). Available at: https://galleryeg.com/سعر-متر-التشطيب-في-مصر-2025-شامل-المواد-والـ/

9. State Information Service — Egypt raises private-sector minimum wage to EGP 7,000 (2025). Available at: https://sis.gov.eg/en/media-center/news/egypt-raises-minimum-wage-for-private-sector-to-egp-7-000/

10. Egypt — Personal Data Protection Law No. 151 of 2020. Available at: https://www.dataguidance.com/legal-research/law-no-151-2020-issuing-personal-data


## 2.9 Project Management and Lifecycle



### 2.9.1 Introduction



El-Moquwal was developed using an **Agile-inspired iterative methodology** adapted for an academic graduation timeline. Two-week sprints aligned with faculty milestone reviews (proposal → analysis → design → implementation → testing → documentation).



### 2.9.2 Team Structure and Responsibilities



| Role | Responsibility |

| --- | --- |

| Project Lead | Architecture decisions, API design, integration |

| Backend Developer | Express routes, Mongoose models, escrow logic |

| Frontend Developer | SPA dashboards, RTL CSS, customer/contractor UX |

| QA / Documentation | Test matrices, SRS traceability, Word deliverable |

| Business Analyst | Feasibility, financial model, competitor benchmarking |



### 2.9.3 Sprint Timeline (Academic Year 2025–2026)



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



### 2.9.4 Risk Register



| ID | Risk | Probability | Impact | Mitigation |

| --- | --- | --- | --- | --- |

| R1 | Payment gateway delay | Medium | High | Mock Paymob; abstract payment service interface |

| R2 | AI API outage | Medium | Medium | Dual-provider fallback (Pollinations + Claude) |

| R3 | Low contractor adoption | High | High | Referral credits, free signup grants |

| R4 | Legal challenge to e-signatures | Low | High | SHA256 audit trail + PDF archival |

| R5 | MongoDB data loss | Low | Critical | Daily backups, replica set in production |

| R6 | Arabic PDF rendering bugs | Medium | Medium | Puppeteer with Alexandria font; pdfkit fallback |



### 2.9.5 Quality Assurance Plan



Quality gates were enforced at each sprint review: (1) all new endpoints documented in Chapter 7; (2) RBAC tests for admin boundaries; (3) no critical linter errors in CI; (4) responsive UI check on 375px and 1440px viewports.



### 2.9.6 Configuration Management



Git branching model: `main` (stable), `develop` (integration), feature branches per module. Pull requests require peer review. Semantic versioning planned post-graduation (v1.0.0 launch).



### 2.9.7 Chapter Summary



Structured project management ensured timely delivery of a complex multi-stakeholder marketplace while maintaining academic rigour and traceability from requirements to implementation.



## 2.10 Stakeholder Interview Synthesis

**Property owners (n=12 informal interviews):** Primary pain points: price uncertainty (92%), payment risk (85%), inability to verify credentials (78%). Desired features: milestone payments, written contracts, photo progress updates.

**Contractors (n=15):** Difficulty finding qualified leads (80%), late payment (73%), wasted time on unserious inquiries (65%). Willing to pay platform fee if escrow guarantees payment.

**Material suppliers (n=5):** Interest in B2B listing module for bulk orders linked to active projects.

### 11.2.1 Analysis Summary

The stakeholder interview synthesis considerations above directly informed requirements documented in Chapter 4 and implementation choices in Chapter 5. Traceability is maintained through the RTM matrix.

## 2.11 Design Decision Records

**DDR-001 Blind Bidding:** Prevents race-to-bottom visibility while preserving customer transparency. Alternative (open bidding) rejected due to collusion risk documented in procurement literature.

**DDR-002 Credit-based bids:** Filters spam proposals; aligns marginal cost with project value. Tiered pricing prevents gaming on low-budget posts.

**DDR-003 Vanilla JS SPA:** Avoids React build complexity for academic timeline; History API routing sufficient for dashboard scale.

**DDR-004 MongoDB discriminators:** Single users collection with role-specific profiles simplifies auth middleware vs. separate tables.

**DDR-005 Puppeteer PDF:** PDFKit cannot shape Arabic glyphs; headless Chrome renders Alexandria font correctly.

### 11.3.1 Analysis Summary

The design decision records considerations above directly informed requirements documented in Chapter 4 and implementation choices in Chapter 5. Traceability is maintained through the RTM matrix.

---

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


## 3.10 Escrow State Machine Design

States: `unfunded` → `funded` → `milestone_1_released` → `milestone_2_released` → `completed` | `disputed`.

Dispute freezes remaining balance. Admin resolution allocates compensation up to warranty cap.

All transitions logged in Transaction collection with immutable timestamps.

### 3.X.1 Analysis Summary

The escrow state machine considerations above directly informed requirements documented in Chapter 4 and implementation choices in Chapter 5. Traceability is maintained through the RTM matrix.

## 3.11 National ID Parser Logic

14-digit Egyptian National ID encodes century, birth date, governorate code, and gender digit.

Server-side parsing prevents client tampering. Invalid checksum patterns rejected before persistence.

Supports auto-fill of registration forms reducing friction while improving data quality.

### 3.X.1 Analysis Summary

The national id parser design considerations above directly informed requirements documented in Chapter 4 and implementation choices in Chapter 5. Traceability is maintained through the RTM matrix.

## 3.12 AI Price Estimation Pipeline

Input: project type, governorate, area (m²), budget range, optional description.

Prompt engineering constrains LLM to JSON output with min/max EGP and Arabic reasoning.

Fallback chain: Pollinations.ai → Anthropic Claude → cached heuristic table.

Estimates are indicative only — disclaimer shown before customer commits.

### 3.X.1 Analysis Summary

The ai price estimation pipeline considerations above directly informed requirements documented in Chapter 4 and implementation choices in Chapter 5. Traceability is maintained through the RTM matrix.

## 3.13 Material Marketplace Design

B2B catalog with categories, stock, images. Orders linked to contractor accounts.

Future integration: delivery tracking, supplier ratings, bulk discount tiers.

### 3.X.1 Analysis Summary

The material marketplace module considerations above directly informed requirements documented in Chapter 4 and implementation choices in Chapter 5. Traceability is maintained through the RTM matrix.

## 3.14 Subscription and Monetisation Architecture

Revenue streams: bid credit sales, featured project listings, contractor subscriptions, commission on escrow releases (default 2%), material marketplace margin.

Financial model in Chapter 2 projects break-even in Year 3 under conservative adoption.

### 3.X.1 Analysis Summary

The subscription and monetisation considerations above directly informed requirements documented in Chapter 4 and implementation choices in Chapter 5. Traceability is maintained through the RTM matrix.

## 3.15 UI/UX Design Principles

Arabic-first RTL layout with Alexandria typeface.

Gold/navy brand palette signalling trust and professionalism.

Mobile-responsive breakpoints at 768px and 1024px.

Progressive disclosure: complex flows (escrow, contracts) split into wizard steps.

Empty states with actionable CTAs on every dashboard module.

### 3.X.1 Analysis Summary

The ui/ux design principles considerations above directly informed requirements documented in Chapter 4 and implementation choices in Chapter 5. Traceability is maintained through the RTM matrix.

## 3.16 Accessibility and Inclusion Standards

High contrast ratios on primary buttons (WCAG AA target).

Touch-friendly signature canvas for mobile contract signing.

Screen reader labels on form fields (aria-label on critical inputs).

### 3.X.1 Analysis Summary

The accessibility and inclusion considerations above directly informed requirements documented in Chapter 4 and implementation choices in Chapter 5. Traceability is maintained through the RTM matrix.

---

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
- **Customer :** Property owners with varying degrees of technical literacy. Requires a simplified, transparent UI focusing on visual progress and security.
- **Contractor :** Industry professionals (engineers, technicians). Expected to utilize the platform frequently to secure work and manage their portfolio.
- **Admin :** Internal operational staff responsible for maintaining platform integrity, requiring granular permissions to view system metrics and resolve tickets.
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


---

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
| `29501010100018` | Valid 1995 Male (Cairo) | `{ valid: true, year: 1995, gender: 'male', governorate: 'Cairo' }` | Pass |
| `30005050200027` | Valid 2000 Female (Alex) | `{ valid: true, year: 2000, gender: 'female', governorate: 'Alexandria' }` | Pass |
| `19501010100018` | Invalid Century Digit (1) | `{ valid: false, reason: 'Invalid century digit' }` | Pass |
| `29501019900018` | Invalid Governorate (99) | `{ valid: false, reason: 'Invalid governorate code' }` | Pass |

### 5.6.2 JSON Parser Tests (parseJsonResponse)
| Input Scenario | Expected Output | Result |
|----------------|-----------------|--------|
| Clean JSON string `{"min":100}` | JavaScript Object | Pass |
| Markdown fences `  ` | JavaScript Object | Pass |
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


## 5.11 User Manuals and Operational Guides
### 5.11.1 Introduction
This chapter provides step-by-step operational guides for every primary persona on the El-Moquwal platform. Each section assumes a modern web browser (Chrome 120+, Firefox 115+, or Edge 120+) with JavaScript enabled and a stable internet connection.
### 5.11.2 Customer User Manual
#### 5.11.2.1 Register as Customer

Navigate to auth/register-customer.html. Enter full name, 14-digit National ID, email, phone, and password. The system parses governorate and date of birth from the National ID server-side. Verify email via OTP.

**Expected outcome:** Workflow step completes without error toast; dashboard reflects new state within one refresh cycle.
#### 5.11.2.2 Login

Use auth/login.html. Select customer role. JWT access token stored in localStorage; refresh token in HTTP-only cookie.

**Expected outcome:** Workflow step completes without error toast; dashboard reflects new state within one refresh cycle.
#### 5.11.2.3 Post a Project

Dashboard → Post Project. Complete title, project type, governorate, area (m²), budget range, timeline, optional photos. AI estimate available before publish.

**Expected outcome:** Workflow step completes without error toast; dashboard reflects new state within one refresh cycle.
#### 5.11.2.4 Review Proposals

proposals.html lists blind bids — amounts visible only to customer. Compare contractor specialty and portfolio.

**Expected outcome:** Workflow step completes without error toast; dashboard reflects new state within one refresh cycle.
#### 5.11.2.5 Award Project

Accept winning bid. Project status → awarded. Contractor notified.

**Expected outcome:** Workflow step completes without error toast; dashboard reflects new state within one refresh cycle.
#### 5.11.2.6 Generate Contract

contract.html → Generate Electronic Contract. Review Arabic terms.

**Expected outcome:** Workflow step completes without error toast; dashboard reflects new state within one refresh cycle.
#### 5.11.2.7 Sign Contract

contract-preview.html → draw or upload signature. Status updates per party.

**Expected outcome:** Workflow step completes without error toast; dashboard reflects new state within one refresh cycle.
#### 5.11.2.8 Fund Escrow

escrow.html → deposit total project value. Milestones: 30% / 40% / 30%.

**Expected outcome:** Workflow step completes without error toast; dashboard reflects new state within one refresh cycle.
#### 5.11.2.9 Release Milestones

Approve completed work phases. Funds released to contractor.

**Expected outcome:** Workflow step completes without error toast; dashboard reflects new state within one refresh cycle.
#### 5.11.2.10 Close & Rate

Mark project closed. Rate contractor. Portfolio auto-updated.

**Expected outcome:** Workflow step completes without error toast; dashboard reflects new state within one refresh cycle.
### 5.11.3 Contractor / Engineer User Manual
#### 5.11.3.1 Register as Contractor

auth/register-contractor.html — specialty, experience, national ID photo (mandatory), certificate optional. Status: pending until admin approval.
#### 5.11.3.2 Browse Projects

browse-projects.html — filter by specialty (default: match my trade), governorate, budget.
#### 5.11.3.3 Submit Blind Bid

project-detail.html — enter amount, duration, message. Credits deducted per budget tier.
#### 5.11.3.4 My Agreements

agreement-detail.html — timeline, contract preview, signature.
#### 5.11.3.5 Portfolio

portfolio-upload.html → profile gallery. Before/after photos supported.
#### 5.11.3.6 Referral Program

referral.html — share code, view stats, apply welcome code.
#### 5.11.3.7 Buy Credits

buy-credits.html — mock Paymob checkout for bid credits.
#### 5.11.3.8 Materials Market

materials.html — B2B product orders for job sites.
### 5.11.4 Administrator User Manual
#### 5.11.4.1 Admin Login

auth/admin-login.html — separate from public login.
#### 5.11.4.2 Approve Contractors

pending-contractors.html or manager/index.html inline list.
#### 5.11.4.3 Reject with Reason

Modal requires ≥3 character reason; emailed to contractor.
#### 5.11.4.4 Manage Disputes

disputes.html — escrow and warranty claims.
#### 5.11.4.5 Platform Settings

settings.html — commission rate, referral bonuses, warranty caps.
#### 5.11.4.6 Audit Log

audit-log.html — super_admin only immutable action trail.
#### 5.11.4.7 Feature Projects

all-projects.html — isFeatured / isUrgent flags.
### 5.11.5 Troubleshooting Guide
| Symptom | Resolution |
| --- | --- |
| Cannot submit bid | Verify approvalStatus=approved, sufficient credits, project status=open. |
| Contract not visible | Customer must generate contract first after award. |
| PDF garbled text | Use HTML preview (contract-preview.html); PDF requires Puppeteer/Chromium on server. |
| Portfolio not showing | Refresh profile.html; confirm POST /api/portfolio returned 201. |
| OTP not received | Check SMTP env vars; use demo bypass in development seed. |

### 5.11.6 Chapter Summary

This chapter operationalises the SRS requirements into actionable user journeys for all four roles, forming the basis for acceptance testing and training materials.


## 5.12 Deployment, Operations, and Maintenance



### 5.12.1 System Requirements (Production)



| Component | Minimum Specification |

| --- | --- |

| Application Server | 2 vCPU, 4 GB RAM, Ubuntu 22.04 LTS |

| Database | MongoDB 6.0+ (Atlas M10 or self-hosted replica set) |

| Storage | 50 GB SSD for uploads + contract PDFs |

| Chromium | Required for Puppeteer PDF generation |

| Node.js | v20 LTS |



### 5.12.2 Environment Variables



| Variable | Purpose |

| --- | --- |

| MONGODB_URI | MongoDB connection string |

| JWT_SECRET | Access token signing key |

| JWT_REFRESH_SECRET | Refresh token signing key |

| UPLOADS_DIR | File storage path |

| SMTP_HOST / SMTP_USER | Email OTP delivery |

| ANTHROPIC_API_KEY | AI fallback provider |

| PAYMOB_API_KEY | Payment gateway (production) |

| NODE_ENV | production / development |



### 5.12.3 Installation Steps







### 5.12.4 Process Management



Recommended: **PM2** cluster mode for Node.js, **Nginx** reverse proxy with TLS (Let's Encrypt), rate limiting at edge.



### 5.12.5 Backup Strategy



- MongoDB: automated snapshots every 6 hours, 30-day retention

- Uploads volume: nightly rsync to object storage (S3-compatible)

- Contract PDFs: immutable after both signatures



### 5.12.6 Monitoring and Logging



Winston structured logs to file + stdout. Health endpoint: `GET /api/health`. Recommended: UptimeRobot external ping, Sentry for error tracking.



### 5.12.7 Maintenance Schedule



| Task | Frequency |

| --- | --- |

| Security patches (npm audit fix) | Weekly |

| SSL certificate renewal | Auto (Certbot) |

| Database index review | Monthly |

| Admin audit log review | Weekly |

| Financial reconciliation | Per escrow release |



### 5.12.8 Chapter Summary



Operational readiness requires hardened hosting, secret management, and backup procedures beyond the academic prototype deployment on localhost:4000.



## 5.13 Complete API Error Code Catalogue

| Code | Description | HTTP |
| --- | --- | --- |
| UNAUTHORIZED | Missing or expired JWT | 401 |
| FORBIDDEN | Role lacks permission | 403 |
| NOT_FOUND | Resource ID invalid | 404 |
| VALIDATION_ERROR | Zod/body validation failed | 400 |
| DUPLICATE | Unique constraint violation | 400 |
| BID_EXISTS | Contractor already bid | 400 |
| INSUFFICIENT_CREDITS | Credit balance too low | 400 |
| PROJECT_LOCKED | Project not in open state | 400 |
| HAS_BIDS | Cannot delete with bids | 400 |
| NOT_DRAFT | Action requires draft status | 400 |
| NOT_AWARDED | Contract requires awarded project | 400 |
| WRONG_STATUS | Contract not pending signatures | 400 |
| ALREADY_SIGNED | Party already signed | 400 |
| WARRANTY_INACTIVE | No active warranty | 400 |
| AI_UNAVAILABLE | LLM providers down | 400 |
| FILE_MISSING | PDF not generated | 404 |
| AUTO_GENERATED | Cannot delete auto portfolio | 400 |

## 5.14 Governorate Launch Rollout Plan

### Cairo

Launch phase for **Cairo** includes: (1) seeding 10 verified contractors across top trades; (2) targeted social campaigns; (3) partnership outreach to local building-material dealers; (4) customer support Arabic hotline during first 90 days. KPI: 50 posted projects and 200 registered contractors within 6 months of go-live.

### Giza

Launch phase for **Giza** includes: (1) seeding 10 verified contractors across top trades; (2) targeted social campaigns; (3) partnership outreach to local building-material dealers; (4) customer support Arabic hotline during first 90 days. KPI: 50 posted projects and 200 registered contractors within 6 months of go-live.

### Alexandria

Launch phase for **Alexandria** includes: (1) seeding 10 verified contractors across top trades; (2) targeted social campaigns; (3) partnership outreach to local building-material dealers; (4) customer support Arabic hotline during first 90 days. KPI: 50 posted projects and 200 registered contractors within 6 months of go-live.

### Qalyubia

Launch phase for **Qalyubia** includes: (1) seeding 10 verified contractors across top trades; (2) targeted social campaigns; (3) partnership outreach to local building-material dealers; (4) customer support Arabic hotline during first 90 days. KPI: 50 posted projects and 200 registered contractors within 6 months of go-live.

### Dakahlia

Launch phase for **Dakahlia** includes: (1) seeding 10 verified contractors across top trades; (2) targeted social campaigns; (3) partnership outreach to local building-material dealers; (4) customer support Arabic hotline during first 90 days. KPI: 50 posted projects and 200 registered contractors within 6 months of go-live.

### Sharqia

Launch phase for **Sharqia** includes: (1) seeding 10 verified contractors across top trades; (2) targeted social campaigns; (3) partnership outreach to local building-material dealers; (4) customer support Arabic hotline during first 90 days. KPI: 50 posted projects and 200 registered contractors within 6 months of go-live.

### Gharbia

Launch phase for **Gharbia** includes: (1) seeding 10 verified contractors across top trades; (2) targeted social campaigns; (3) partnership outreach to local building-material dealers; (4) customer support Arabic hotline during first 90 days. KPI: 50 posted projects and 200 registered contractors within 6 months of go-live.

### Monufia

Launch phase for **Monufia** includes: (1) seeding 10 verified contractors across top trades; (2) targeted social campaigns; (3) partnership outreach to local building-material dealers; (4) customer support Arabic hotline during first 90 days. KPI: 50 posted projects and 200 registered contractors within 6 months of go-live.

### Beheira

Launch phase for **Beheira** includes: (1) seeding 10 verified contractors across top trades; (2) targeted social campaigns; (3) partnership outreach to local building-material dealers; (4) customer support Arabic hotline during first 90 days. KPI: 50 posted projects and 200 registered contractors within 6 months of go-live.

### Assiut

Launch phase for **Assiut** includes: (1) seeding 10 verified contractors across top trades; (2) targeted social campaigns; (3) partnership outreach to local building-material dealers; (4) customer support Arabic hotline during first 90 days. KPI: 50 posted projects and 200 registered contractors within 6 months of go-live.

### Sohag

Launch phase for **Sohag** includes: (1) seeding 10 verified contractors across top trades; (2) targeted social campaigns; (3) partnership outreach to local building-material dealers; (4) customer support Arabic hotline during first 90 days. KPI: 50 posted projects and 200 registered contractors within 6 months of go-live.

### Luxor

Launch phase for **Luxor** includes: (1) seeding 10 verified contractors across top trades; (2) targeted social campaigns; (3) partnership outreach to local building-material dealers; (4) customer support Arabic hotline during first 90 days. KPI: 50 posted projects and 200 registered contractors within 6 months of go-live.

---

# Chapter 6: Conclusion and Future Work

## 6.1 Introduction

This chapter concludes the El-Moquwal graduation project by summarising the work accomplished, evaluating the extent to which the stated objectives have been achieved, discussing the limitations encountered, and proposing directions for future development. The chapter provides a reflective assessment of the project as both an academic exercise and a commercially viable venture.

## 6.2 Project Summary

El-Moquwal was conceived, designed, and implemented as Egypt's first end-to-end digital marketplace for construction and finishing services. The project addressed a well-documented market failure — the lack of transparency, trust, and payment protection in Egypt's overwhelmingly informal contracting sector — by building a unified platform that covers the entire contracting journey: project discovery, AI-assisted cost estimation, competitive blind bidding, electronic contract generation, escrow-based milestone payment, execution tracking, and post-project rating.

The platform was developed as a full-stack web application using Node.js and Express.js on the backend, MongoDB with Mongoose on the data layer, and a Vanilla JavaScript Single Page Application (SPA) on the frontend. The system supports four distinct user roles — Customer, Contractor, Admin, and Super Admin — managed through a MongoDB discriminator pattern that enables polymorphic user handling within a single collection.

Over the course of this project, the following deliverables were produced:

1. **A comprehensive feasibility study** (Chapter 2) covering legal, environmental, market, demand, technical, and financial dimensions — including a ten-year cash flow projection demonstrating a break-even point within the first year of monetisation.

2. **A detailed system design** (Chapter 3) specifying the three-tier architecture, 18-collection database schema with full data dictionaries, 10 functional modules, security architecture, and UML diagrams including use case, sequence, and activity diagrams.

3. **A formal Software Requirements Specification** (Chapter 4) documenting 165+ functional requirements across 10 modules and 25+ non-functional requirements covering performance, reliability, security, scalability, and usability.

4. **A working implementation** (Chapter 5) with documented code for all key algorithms — Egyptian National ID parsing, blind bidding enforcement, Puppeteer-based Arabic PDF contract generation, dual-provider AI estimation, credit-based bidding economy, and escrow milestone management — validated through unit, integration, system, and security testing.

## 6.3 Objectives Achievement

The following evaluates each stated objective against the delivered outcome:

1. ✅ **Design and implement a secure, web-based marketplace** for the entire contracting journey — Achieved. Full-stack application with 14 API route modules, 18 database collections, and a responsive Arabic-first SPA.

2. ✅ **Develop an AI-powered price estimation system** — Achieved. Dual-provider integration (Pollinations.ai + Anthropic Claude) with structured JSON output, 1-hour caching, and a RAG-based policy chatbot.

3. ✅ **Implement a Blind Bidding mechanism** — Achieved. Enforced at the API level via the toBlindJSON() method; bid amounts invisible to competing contractors. Verified through integration and security testing.

4. ✅ **Build an Escrow-based milestone payment system** — Achieved. Full escrow lifecycle: deposit, milestone release, dispute, and admin resolution. Default 30%/40%/30% milestone split with 2% commission deduction.

5. ✅ **Automate electronic contract generation with dual digital signatures** — Achieved. Puppeteer renders Arabic RTL HTML template to A4 PDF. Signatures recorded with SHA256 hash, IP address, User-Agent, and timestamp.

6. ✅ **Establish identity verification via National ID parsing** — Achieved. 14-digit Egyptian NID parsed for century, date of birth, governorate (27 codes), and gender. NID stored as Argon2 hash with only last 4 digits exposed.

7. ✅ **Create a Role-Based Access Control system with four user tiers** — Achieved. Middleware chain: requireAuth, requireRole, requirePermission, requireApproved. Seven granular admin permissions with super_admin bypass.

8. ✅ **Develop supplementary features** (marketplace, portfolio, credits, subscriptions, admin panel) — Achieved. Material marketplace (12 categories), portfolio with before/after photos, credit ledger system, premium subscriptions, and full admin dashboard with audit logging.

**All eight stated objectives have been fully achieved.** The delivered system is a working, testable application — not merely a design document — which materially strengthens the project's academic and practical credibility.

## 6.4 Key Contributions

Beyond meeting its stated objectives, the El-Moquwal project makes several contributions worth highlighting:

### 6.4.1 Domain-Specific Innovation
The combination of blind bidding, escrow-based milestone payments, AI-assisted estimation, and automatically generated Arabic legal contracts within a single platform is, to the best of the team's knowledge, unprecedented in the Egyptian market. Each feature individually exists in various platforms globally; their integration into a cohesive, Arabic-first system tailored to Egyptian legal and cultural norms represents a meaningful contribution.

### 6.4.2 Technical Architecture Decisions
Several architectural choices made in this project offer reusable patterns:
- **The MongoDB discriminator pattern** for managing a four-role user hierarchy in a single collection, enabling both polymorphic queries and role-specific schema validation.
- **The dual-provider AI strategy** with graceful fallback, ensuring the system remains functional even when a primary external service is unavailable.
- **The granular permission model** that separates role-based access (customer, contractor, admin) from permission-based access (review_contractors, manage_disputes, etc.), with super_admin acting as an unrestricted bypass tier.

### 6.4.3 Sector Formalisation
By attaching identity verification, digital contracts, payment trails, and persistent reputations to work that is today overwhelmingly informal, the platform contributes to documenting and formalising a major segment of the Egyptian economy — aligning with national digital-transformation and financial-inclusion priorities.

## 6.5 Challenges and Limitations

### 6.5.1 Technical Limitations
1. **Payment Gateway Integration:** The current implementation uses a mock payment gateway (`gateway: 'mock'`) for escrow deposits and credit purchases. While the architecture is designed for plug-in integration with Paymob, Fawry, or similar licensed Egyptian processors, live payment processing was not implemented due to the requirements for formal company registration and regulatory compliance.

2. **Real-Time Communication:** The platform does not currently support real-time messaging or notifications between users. Communication relies on email notifications and in-app status updates. WebSocket integration for live chat and push notifications is a natural extension.

3. **PDF Generation Performance:** Puppeteer-based PDF generation, while producing excellent Arabic RTL output, is resource-intensive (launching a headless Chrome instance per contract). Under high concurrency, this could become a bottleneck requiring a queue-based architecture or a pre-rendering pool.

4. **AI Estimation Accuracy:** The AI price estimation relies on external LLMs (Pollinations.ai / Anthropic Claude) with general training data. The estimates are indicative rather than precise, and the system would benefit from fine-tuning on actual Egyptian construction cost data as transaction history accumulates.

### 6.5.2 Business Limitations
1. **Cold-Start Problem:** As a two-sided marketplace, El-Moquwal faces the classic chicken-and-egg challenge: customers need contractors to find value, and contractors need customers to justify participation. The Year 1 free-service strategy mitigates this but does not eliminate it.

2. **Geographic Scope:** The current launch scope is limited to high-density urban governorates. Expansion to rural areas and Upper Egypt would require adapted marketing, localised professional onboarding, and potentially different pricing structures.

3. **Dispute Resolution Scalability:** The current dispute resolution model relies on manual admin intervention. As transaction volume grows, this process will require either additional staffing or partial automation through rule-based escalation and AI-assisted assessment.

## 6.6 Future Work and Recommendations

The following enhancements are recommended for subsequent phases of development:

### 6.6.1 Short-Term (6–12 Months)
| Priority | Enhancement | Rationale |
|----------|-------------|-----------|
| High | Live payment gateway integration (Paymob / Fawry) | Enables real money movement, which is essential for commercial launch. |
| High | Real-time notifications (WebSocket / Firebase) | Improves user engagement and reduces response times for bids and milestones. |
| High | Progressive Web App (PWA) optimisation | Enables offline access, push notifications, and app-like experience on mobile devices without a native app. |
| Medium | Email and SMS notification service | Transactional emails for contract signing, escrow events, and bid acceptance. |
| Medium | Enhanced admin analytics dashboard | Real-time charts, revenue tracking, and user growth metrics for operational decision-making. |

### 6.6.2 Medium-Term (12–24 Months)
| Priority | Enhancement | Rationale |
|----------|-------------|-----------|
| High | Native mobile applications (iOS & Android) | Reaches the majority of Egyptian users who are mobile-first. |
| High | AI model fine-tuning on platform data | Improves estimation accuracy as real transaction data accumulates from completed projects. |
| Medium | Automated dispute resolution (rule-based + AI) | Reduces admin burden and improves dispute resolution speed as volume grows. |
| Medium | Contractor recommendation engine | Machine learning-based matching that considers project type, location, rating, and availability. |
| Medium | Multi-language support (English interface) | Enables expatriate and foreign property owners to use the platform. |

### 6.6.3 Long-Term (24+ Months)
| Priority | Enhancement | Rationale |
|----------|-------------|-----------|
| High | Embedded financing (BNPL for customers) | Enables customers to split project payments over time, increasing conversion for high-value projects. |
| Medium | Developer and B2B contract module | Extends the platform beyond individual homeowners to real estate developers and commercial clients. |
| Medium | Maintenance and recurring services | Post-project relationship: scheduled maintenance, warranty follow-ups, and seasonal services. |
| Low | Geographic expansion (Gulf states) | The Arabic-first, construction-focused model is transferable to UAE, Saudi Arabia, and other regional markets with similar needs. |
| Low | Blockchain-based contract notarisation | Immutable, tamper-proof contract records for enhanced legal enforceability. |

## 6.7 Lessons Learned

The development of El-Moquwal yielded several practical insights relevant to future projects of similar scope:

1. **The discriminator pattern is powerful but demands discipline.** Managing four user types in a single MongoDB collection simplifies queries and authentication but requires careful attention to schema validation and population paths. Comprehensive testing of role-specific workflows is essential.

2. **Arabic RTL support must be a first-class design concern, not an afterthought.** From the HTML contract template to the PDF generator to the frontend interface, RTL requirements influenced every layer of the stack. Retrofitting RTL support onto an LTR-first design would have been significantly more costly.

3. **AI integration should always have a fallback.** The dual-provider strategy (Pollinations.ai primary, Anthropic Claude fallback) proved its value during development when service availability fluctuated. Designing for graceful degradation — including a static policy-based fallback when both providers are unavailable — ensured the system remained functional at all times.

4. **Security cannot be bolted on.** The decision to use Argon2id for all sensitive data (passwords and NIDs), to separate access and refresh tokens with different storage mechanisms, and to implement granular permissions from the start — rather than adding them later — saved significant refactoring effort and produced a more robust architecture.

## 6.8 Final Remarks

El-Moquwal demonstrates that a focused, well-architected digital platform can address a genuine, large-scale market failure in the Egyptian construction sector. The project delivers a working system — not merely a theoretical design — that unifies project discovery, AI-assisted estimation, competitive bidding, payment protection, legal contracting, and administrative governance into a single, Arabic-first experience.

The financial analysis confirms the venture's viability: a modest EGP 70,000 cash investment, a deliberate base-building first year, and break-even within 20 months of launch, with an average annual net profit of approximately EGP 1.9 million over the ten-year projection horizon.

As a graduation project for the Business Information Systems programme, El-Moquwal showcases the integration of database design, API architecture, security engineering, AI integration, financial modelling, and user experience design — the core competencies of the BIS discipline — applied to a problem with real economic and social significance. The platform is ready for pilot deployment, and the roadmap outlined in this chapter provides a clear, prioritised path from academic project to commercial product.


---


# Appendix A: User Interface Gallery

The following figures document the implemented El-Moquwal user interface across customer, contractor, and administrator journeys. Each screenshot is presented in landscape orientation at full width for clear visual assessment.


![Figure A.1 — Landing page hero section and primary call-to-action](file:///C:/Projects/el-moquwal/UI/Screenshot 2026-06-26 235747.png)
*Figure A.1 — Landing page hero section and primary call-to-action*


![Figure A.2 — Public navigation and service overview](file:///C:/Projects/el-moquwal/UI/Screenshot 2026-06-26 235810.png)
*Figure A.2 — Public navigation and service overview*


![Figure A.3 — Role selection / registration entry point](file:///C:/Projects/el-moquwal/UI/Screenshot 2026-06-26 235856.png)
*Figure A.3 — Role selection / registration entry point*


![Figure A.4 — Customer registration form with National ID](file:///C:/Projects/el-moquwal/UI/Screenshot 2026-06-26 235914.png)
*Figure A.4 — Customer registration form with National ID*


![Figure A.5 — Contractor registration and document upload](file:///C:/Projects/el-moquwal/UI/Screenshot 2026-06-26 235925.png)
*Figure A.5 — Contractor registration and document upload*


![Figure A.6 — Login and authentication screen](file:///C:/Projects/el-moquwal/UI/Screenshot 2026-06-26 235956.png)
*Figure A.6 — Login and authentication screen*


![Figure A.7 — Customer dashboard overview](file:///C:/Projects/el-moquwal/UI/Screenshot 2026-06-27 000003.png)
*Figure A.7 — Customer dashboard overview*


![Figure A.8 — Post new project wizard](file:///C:/Projects/el-moquwal/UI/Screenshot 2026-06-27 000022.png)
*Figure A.8 — Post new project wizard*


![Figure A.9 — Customer project list and status badges](file:///C:/Projects/el-moquwal/UI/Screenshot 2026-06-27 000033.png)
*Figure A.9 — Customer project list and status badges*


![Figure A.10 — Proposals / bids comparison view](file:///C:/Projects/el-moquwal/UI/Screenshot 2026-06-27 000043.png)
*Figure A.10 — Proposals / bids comparison view*


![Figure A.11 — Electronic contract and signature flow (Customer)](file:///C:/Projects/el-moquwal/UI/Screenshot 2026-06-27 000142.png)
*Figure A.11 — Electronic contract and signature flow (Customer)*


![Figure A.12 — Escrow milestone payment interface](file:///C:/Projects/el-moquwal/UI/Screenshot 2026-06-27 000157.png)
*Figure A.12 — Escrow milestone payment interface*


![Figure A.13 — Contractor dashboard and credit balance](file:///C:/Projects/el-moquwal/UI/Screenshot 2026-06-27 000252.png)
*Figure A.13 — Contractor dashboard and credit balance*


![Figure A.14 — Browse projects with specialty filters](file:///C:/Projects/el-moquwal/UI/Screenshot 2026-06-27 000303.png)
*Figure A.14 — Browse projects with specialty filters*


![Figure A.15 — Project detail and bid submission](file:///C:/Projects/el-moquwal/UI/Screenshot 2026-06-27 000336.png)
*Figure A.15 — Project detail and bid submission*


![Figure A.16 — My agreements and contract preview](file:///C:/Projects/el-moquwal/UI/Screenshot 2026-06-27 000356.png)
*Figure A.16 — My agreements and contract preview*


![Figure A.17 — Admin manager dashboard — pending contractors](file:///C:/Projects/el-moquwal/UI/Screenshot 2026-06-27 000412.png)
*Figure A.17 — Admin manager dashboard — pending contractors*


![Figure A.18 — Admin all-projects panel and platform statistics](file:///C:/Projects/el-moquwal/UI/Screenshot 2026-06-27 000421.png)
*Figure A.18 — Admin all-projects panel and platform statistics*


---

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


---

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


---

# Appendix D: Competitive Benchmarking



## D.1 Regional and Global Comparators



| Platform | Geography | Escrow | Blind Bids | Arabic Contracts | Finishing Focus |

| --- | --- | --- | --- | --- | --- |

| **El-Moquwal** | Egypt | Yes (milestone) | Yes | Yes (RTL PDF) | Yes |

| Hatgebak (ref.) | Egypt | Partial | No | Limited | General services |

| Amanak (ref.) | Egypt | No | No | Yes | Insurance vertical |

| Petura (ref.) | Academic | N/A | N/A | Bilingual | Pet care |

| Houzz Pro | Global | No | No | No | Interior design |

| Thumbtack | US | No | No | No | General contractors |



## D.2 Feature Gap Analysis



El-Moquwal differentiates through the **combination** of blind bidding, escrow milestones, National ID KYC, and Puppeteer Arabic contracts — no single regional competitor implements all four.



## D.3 Lessons from Reference Projects (ref/)



Analysis of peer graduation documentation (Petura, Amanak, Hatgebak) informed our documentation structure: front matter with supervisor certificate, expanded test appendices, screenshot gallery, and ten-year financial projections.



## D.4 Strategic Positioning



Target segment: middle-income property owners in Greater Cairo, Alexandria, and Upper Egypt governorates undertaking finishing projects between EGP 50,000 and EGP 1,000,000.



---

# Appendix E: Security and Compliance Audit Checklist

| # | Control | Status |
| --- | --- | --- |
| 1 | Argon2id password hashing with per-user salt | Implemented |
| 2 | JWT access token expiry ≤ 15 minutes | Implemented |
| 3 | Refresh token in HTTP-only Secure SameSite cookie | Implemented |
| 4 | Rate limiting on /api/auth/login (brute force protection) | Implemented |
| 5 | RBAC middleware on all /api/admin/* routes | Implemented |
| 6 | File upload MIME validation and 5MB cap | Implemented |
| 7 | ObjectId validation on route parameters | Implemented |
| 8 | Blind bid amount hidden in contractor GET /bids | Implemented |
| 9 | Escrow release requires customer authentication | Implemented |
| 10 | Contract sign stores SHA256 signature hash + image file | Implemented |
| 11 | Audit log append-only for super_admin actions | Implemented |
| 12 | CORS restricted to configured frontend origin | Implemented |
| 13 | Helmet security headers enabled | Implemented |
| 14 | No secrets in client-side JavaScript | Implemented |
| 15 | MongoDB injection prevented via Mongoose casting | Implemented |

## E.1 Egyptian Legal Context

Electronic contracts reference Law 131/1948 (Civil Code). E-signature audit trail supports evidentiary weight under Law 15/2004 (E-Transactions).


---

# Appendix F: Glossary and Bibliography

## F.1 Glossary

| Term | Definition |
| --- | --- |
| المقاول | El-Moquwal platform brand — also means contractor in Arabic |
| Blind Bidding | Bidders cannot see competitors' prices |
| Escrow | Neutral holding of funds until milestone approval |
| Milestone | 30/40/30 payment phases |
| Credit | Virtual currency for submitting bids |
| Discriminator | Mongoose pattern for User subtypes |
| KYC | Know Your Customer document verification |
| OTP | One-time password email verification |
| RTL | Right-to-left Arabic layout |
| RBAC | Role-based access control |
| SRS | Software requirements specification |
| LLM | Large language model for AI features |
| PropTech | Property technology sector |
| Warranty Cap | Maximum escrow claim amount |
| Referral Code | 6-character invite identifier |


## F.2 References



1. IEEE Std 830-1998 — Recommended Practice for Software Requirements Specifications.

2. Egyptian Civil Code Law No. 131 of 1948.

3. Egyptian E-Transactions Law No. 15 of 2004.

4. MongoDB Inc. — Mongoose Discriminators Documentation (2024).

5. OWASP — Top Ten Web Application Security Risks (2021).

6. Central Agency for Public Mobilization and Statistics (CAPMAS) — Housing statistics Egypt 2024.

7. World Bank — Egypt Digital Economy Report.

8. Express.js — Security Best Practices.

9. Puppeteer — PDF Generation API Reference.

10. Anthropic — Claude API Documentation.



## F.3 Webography



- https://el-moquwal.com (production placeholder)

- https://www.paymob.com — payment gateway integration target

- https://pollinations.ai — primary LLM provider

