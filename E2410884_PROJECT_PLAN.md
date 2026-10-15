## Project Plan

For

# **Tour-Visit Planner (DayTripGO)**

_A Web-Based Visit Planning System for Wadduwa and Surrounding Areas_

Document Version: 1.0

Student Name – De Silva P.K.M &emsp; Registration Number – E2410884 &emsp; Date: 14.10.2026

Module: ITE2953 – Programming Group Project 25S1

---

### **Revision History**

| **Version** | **Date**     | **Author**      | **Description of Change**                        |
| ----------- | ------------ | --------------- | ------------------------------------------------ |
| 1.0         | 14.10.2026   | P.K.M. De Silva | Initial project plan based on approved proposal and final SRS (v2.0). |

---

### **Table of Contents**

| Section | Title |
| ------- | ----- |
| 1       | Introduction |
| 1.1     | Purpose of This Document |
| 1.2     | Project Overview |
| 1.3     | References |
| 2       | Project Organisation |
| 2.1     | Roles and Responsibilities |
| 2.2     | Stakeholders |
| 3       | Project Scope |
| 3.1     | In-Scope Features |
| 3.2     | Out-of-Scope Items |
| 4       | Technology Stack |
| 5       | Project Schedule (12-Week Timeline) |
| 5.1     | Phase 1 – Stakeholder Consultation & Proposal (Weeks 1–2) |
| 5.2     | Phase 2 – Requirements Analysis & SRS (Weeks 2–4) |
| 5.3     | Phase 3 – System Design (Weeks 4–6) |
| 5.4     | Phase 4 – Frontend Implementation – Tourist UI (Weeks 6–8) |
| 5.5     | Phase 5 – Backend & Database Implementation (Weeks 6–8) |
| 5.6     | Phase 6 – Admin Module Implementation (Weeks 8–9) |
| 5.7     | Phase 7 – Integration & Testing (Weeks 9–10) |
| 5.8     | Phase 8 – Bug Fixing & Refinement (Weeks 10–11) |
| 5.9     | Phase 9 – Documentation Finalisation (Weeks 10–12) |
| 5.10    | Phase 10 – Presentation Preparation & Demo (Weeks 11–12) |
| 6       | Gantt Chart |
| 7       | Milestones and Deliverables |
| 8       | Task Breakdown & Requirements Traceability |
| 8.1     | Place Listing & Category Filtering |
| 8.2     | Place Detail View |
| 8.3     | Map View |
| 8.4     | One-Day Visit Plan Builder |
| 8.5     | Administrator Authentication |
| 8.6     | Administrator Place Management |
| 8.7     | Non-Functional Requirements |
| 9       | Risk Management |
| 10      | Quality Assurance Strategy |
| 11      | Communication & Reporting |
| 12      | Assumptions and Dependencies |
| 13      | Appendix A – Work Breakdown Structure (WBS) |
| 14      | Implementation Plan – Step-by-Step Execution Guide |

---

## **1. Introduction**

### **1.1 Purpose of This Document**

This Project Plan defines the schedule, tasks, milestones, deliverables, risk-management strategy and quality-assurance approach for the **DayTripGO – Tour Visit Planner** project. It translates the requirements captured in the SRS document (v2.0, dated 05.09.2026) and the approved project proposal into a structured, time-bound execution plan. This document is intended for the developer, the module supervisor/assessor, and consulted stakeholders.

### **1.2 Project Overview**

DayTripGO is a web-based information and visit-planning system that helps tourists discover places of interest within 25 km of Wadduwa, Sri Lanka, and build a simple one-day visit plan. The system comprises:

- A **public tourist-facing interface** for browsing, filtering, viewing details/maps, and building visit plans.
- A **restricted administrator interface** for managing (add / edit / delete) place-of-interest records.
- A **shared PostgreSQL database** (hosted on Supabase) storing places, categories, visit plans and administrator accounts.

The project is scoped for delivery within a **12-week (3-month)** academic module timeline by a single developer.

### **1.3 References**

| Ref | Document |
| --- | -------- |
| [1] | Project Proposal: "Local Tourist Day-Visit Planner and Information System," ITE2953, E2410884. |
| [2] | SRS Document (v2.0): "Tour-Visit Planner (DayTripGO)," dated 05.09.2026. |
| [3] | IEEE Std 830-1998, IEEE Recommended Practice for Software Requirements Specifications. |

---

## **2. Project Organisation**

### **2.1 Roles and Responsibilities**

| **Role**               | **Person**                | **Responsibilities**                                                                                       |
| ---------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Developer              | P.K.M. De Silva (E2410884)| Full-stack design, development, testing, documentation and deployment of the system.                       |
| Module Supervisor      | (As assigned by UOM)      | Provides guidance, reviews deliverables, assesses submissions.                                             |
| Stakeholders (5 identified; 4 formally consulted) | See Section 2.2 | Provide domain requirements, validate deliverables, and give user-acceptance feedback. |

### **2.2 Stakeholders**

| **Stakeholder**            | **Role**                          | **Key Contribution**                                                            |
| -------------------------- | --------------------------------- | ------------------------------------------------------------------------------- |
| Sara MHS                   | Tourist / Visitor (Public)        | Categories, maps, opening hours, simple trip planning needs.                    |
| De Silva PKM               | Business Owner                    | Local business visibility, nearby recommendations, detailed info cards.         |
| Kumarasiri RDKA            | Tourism Guide                     | Practical travel info, visiting times, distances, route-map needs.              |
| Jayawickrama KKSD          | Site Administrator                | Add/edit/delete places, maintain accurate descriptions and categories.          |
| Dharmawardhana WNL         | Destination Management Org (DMO)  | Accurate tourism info, appropriate categorisation, focused visitor experience.  |

> **Note (15.10.2026):** five stakeholders are listed above, matching Table 1 of the approved proposal. Four of them were formally consulted for requirements elicitation, consistent with SRS §1.1 and Assumption A-3; the developer (De Silva PKM) also appears in the proposal's table in the business-owner role.

---

## **3. Project Scope**

### **3.1 In-Scope Features**

| # | Feature                                  | SRS Reference     |
| - | ---------------------------------------- | ------------------ |
| 1 | Place listing with category filtering    | FR-1 to FR-4     |
| 2 | Place detail view (description, hours, tips, distance, photo) | FR-5 to FR-7 |
| 3 | Map view with embedded map and markers   | FR-8, FR-9       |
| 4 | One-day visit plan builder               | FR-10 to FR-13     |
| 5 | Administrator authentication             | FR-14, FR-15       |
| 6 | Administrator place management (CRUD)    | FR-16 to FR-19     |
| 7 | Minimum 10 verified places within 25 km of Wadduwa | Data Requirement |
| 8 | Non-functional: performance, security, usability, reliability | NFR-1 to NFR-12 |

### **3.2 Out-of-Scope Items**

- Booking, payment, or transaction processing of any kind.
- Hotel or transport reservation functionality.
- Multi-day itinerary planning.
- User account creation for tourists (visit plans are session-based).
- Production-grade hosting (demo/dev environment only).

---

## **4. Technology Stack & System Architecture**

### **4.1 Technology Stack**

| **Layer**            | **Technology**                                     |
| -------------------- | -------------------------------------------------- |
| Frontend             | HTML5, CSS3, React                                 |
| Backend              | Node.js with Express                               |
| Database             | PostgreSQL hosted on Supabase                      |
| Map Service          | Google Maps API or OpenStreetMap / Leaflet (TBD)   |
| Development Tools    | Visual Studio Code, Postman, Figma (UI mockups)    |
| Version Control      | Git, hosted on GitHub                              |
| Communication        | HTTPS (REST API between frontend and backend)      |

### **4.2 System Architecture – 3-Tier Client-Server (MVC Pattern)**

The system follows a **3-Tier Architecture** with an **MVC (Model-View-Controller)** pattern, providing clean separation of concerns across the Presentation, Application, and Data tiers.

```
┌──────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION TIER                             │
│                     (React Frontend — frontend/)                     │
│                                                                      │
│  Pages:  Home/Listing │ Place Detail │ Visit Plan │ Admin Dashboard  │
│  Components: PlaceListing │ MapView │ VisitPlan │ Layout │ Common    │
│  State: React Context (Visit Plan) + Session Storage                 │
│                                                                      │
│                         ▼ HTTPS / REST API ▼                         │
├──────────────────────────────────────────────────────────────────────┤
│                         APPLICATION TIER                             │
│                  (Node.js + Express — backend/)                      │
│                                                                      │
│  Routes ──► Controllers ──► Services ──► Models                      │
│                                                                      │
│  /api/places          (GET list, GET detail, POST, PUT, DELETE)      │
│  /api/categories      (GET all)                                      │
│  /api/visit-plans     (POST create, GET view, PUT update)            │
│  /api/auth            (POST login, POST logout)                      │
│                                                                      │
│  Middleware: Auth (JWT/session) │ Validation │ Error Handler          │
│                                                                      │
│                         ▼ SQL Queries ▼                               │
├──────────────────────────────────────────────────────────────────────┤
│                           DATA TIER                                  │
│                   (PostgreSQL on Supabase)                            │
│                                                                      │
│  Tables: Category │ Place │ VisitPlan │ VisitPlanItem │ Admin        │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                      EXTERNAL SERVICES                               │
│         Google Maps API / OpenStreetMap + Leaflet (Map embed)        │
└──────────────────────────────────────────────────────────────────────┘
```

### **4.3 Data Flow**

1. **Tourist browses places** → React frontend sends `GET /api/places` → Express controller calls place service → service queries Supabase → JSON response returned → React renders the list.
2. **Tourist filters by category** → React sends `GET /api/places?category=nature` → filtered results returned and rendered.
3. **Tourist views place detail** → React sends `GET /api/places/:id` → full detail + coordinates returned → detail page and embedded map rendered.
4. **Tourist builds visit plan** → React sends `POST /api/visit-plans` (create) or `PUT /api/visit-plans/:id` (add/remove/reorder) → session-based plan stored in DB → consolidated view rendered.
5. **Admin manages places** → Admin logs in via `POST /api/auth/login` → JWT/session issued → authenticated requests to `POST/PUT/DELETE /api/places` → CRUD operations on Supabase.

### **4.4 Architecture-to-Folder Mapping**

```
DayTripGo/
├── frontend/                ← PRESENTATION TIER (View)
│   └── src/
│       ├── components/      ← Reusable UI components
│       │   ├── PlaceListing/   (PlaceCard, PlaceGrid, CategoryFilter)
│       │   ├── PlaceDetail/    (DetailView, PhotoGallery)
│       │   ├── MapView/        (MapEmbed, MapMarker)
│       │   ├── VisitPlan/      (PlanList, PlanItem, DragReorder)
│       │   ├── Layout/         (Header, Footer, Navbar, Sidebar)
│       │   └── Common/         (Button, Loader, ErrorMessage, Modal)
│       ├── pages/           ← Route-level page components
│       ├── services/        ← API call functions (axios/fetch wrappers)
│       ├── context/         ← React Context (VisitPlanContext, AuthContext)
│       ├── hooks/           ← Custom React hooks (useVisitPlan, usePlaces)
│       ├── styles/          ← Global CSS, variables, responsive breakpoints
│       ├── utils/           ← Helper functions (formatDistance, formatHours)
│       └── assets/          ← Images, icons, static resources
│
├── backend/                 ← APPLICATION TIER (Controller + Model)
│   └── src/
│       ├── routes/          ← Express route definitions (placeRoutes, authRoutes)
│       ├── controllers/     ← Request/response handling (placeController, authController)
│       ├── services/        ← Business logic layer (placeService, planService)
│       ├── models/          ← Database query layer (Supabase client calls)
│       ├── middleware/      ← Auth verification, input validation, error handler
│       ├── config/          ← DB connection config, environment variables
│       └── utils/           ← Shared helpers (passwordHash, tokenUtils)
│
├── database/                ← DATA TIER
│   ├── schema/              ← Table creation SQL (CREATE TABLE statements)
│   ├── migrations/          ← Schema version changes
│   └── seeds/               ← Initial data (10+ places, 4 categories, admin account)
│
├── docs/                    ← PROJECT DOCUMENTATION
│   ├── design/              ← Architecture diagrams, Figma exports
│   ├── api/                 ← REST API specification
│   ├── user-guide/          ← Tourist + admin user guides
│   ├── test-plan/           ← Test cases and results
│   └── diagrams/            ← UML diagrams (use case, class, sequence, ERD)
│
└── tests/                   ← TESTING
    ├── frontend/            ← Frontend component tests
    ├── backend/             ← API endpoint tests
    └── integration/         ← End-to-end integration tests
```

### **4.5 Architecture Design Decisions**

| **Aspect**       | **Decision**                              | **Rationale**                                                                                  |
| ---------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Pattern**      | 3-Tier + MVC                              | Clean separation of UI, business logic, and data; easy to maintain and test (NFR-10).          |
| **Frontend**     | React SPA                                 | Component-based, reusable UI; matches approved tech stack; supports responsive design.          |
| **Backend**      | Express with Controller → Service → Model | Modular; each layer has a single responsibility; simplifies future feature additions.           |
| **Database**     | Supabase (hosted PostgreSQL)              | Free tier suitable for student project; no server management; built-in REST/auth support.       |
| **Auth**         | JWT or session-based tokens               | Stateless auth for admin; tourists remain unauthenticated and session-based (NFR-7).          |
| **API Style**    | REST over HTTPS                           | Simple, well-understood pattern; matches SRS Section 3.4 requirements.                         |
| **Map Service**  | OpenStreetMap + Leaflet (preferred)       | Free, no quota limits for student project; Leaflet is lightweight and cross-browser compatible. |
| **State Mgmt**   | React Context API                         | Sufficient for visit-plan state; avoids unnecessary complexity of Redux for this project scope. |

---

## **5. Project Schedule (12-Week Timeline)**

### **5.1 Phase 1 – Stakeholder Consultation & Proposal (Weeks 1–2)**

| **Task ID** | **Task**                                          | **Deliverable**                   | **Status**  |
| ----------- | ------------------------------------------------- | --------------------------------- | ----------- |
| T-1.1       | Identify and contact 5 stakeholders               | Stakeholder list                  | ✅ Complete |
| T-1.2       | Conduct structured consultation sessions          | Discussion notes (Appendix A)     | ✅ Complete |
| T-1.3       | Document key requirements from each stakeholder   | Stakeholder analysis table        | ✅ Complete |
| T-1.4       | Draft and submit project proposal                 | Approved project proposal         | ✅ Complete |
| T-1.5       | Identify ≥10 verified places within 25 km         | Preliminary places list (Table 2) | ✅ Complete |

### **5.2 Phase 2 – Requirements Analysis & SRS (Weeks 2–4)**

| **Task ID** | **Task**                                          | **Deliverable**                   | **Status**  |
| ----------- | ------------------------------------------------- | --------------------------------- | ----------- |
| T-2.1       | Analyse stakeholder requirements                  | Requirements categories           | ✅ Complete |
| T-2.2       | Define functional requirements (FR-1 to FR-19)   | SRS Section 4                     | ✅ Complete |
| T-2.3       | Define non-functional requirements (NFR-1 to NFR-12) | SRS Section 5                 | ✅ Complete |
| T-2.4       | Define data requirements and entity schema        | SRS Section 6                     | ✅ Complete |
| T-2.5       | Create Use Case Diagram                           | SRS Appendix B.1                  | ✅ Complete |
| T-2.6       | Create Class Diagram                              | SRS Appendix B.3                  | ✅ Complete |
| T-2.7       | Create Sequence Diagram                           | SRS Appendix B.3                  | ✅ Complete |
| T-2.8       | Create Entity-Relationship Diagram                | SRS Appendix B.4                  | ✅ Complete |
| T-2.9       | Peer review and finalise SRS (v2.0)               | Final SRS document                | ✅ Complete |

### **5.3 Phase 3 – System Design (Weeks 4–6)**

| **Task ID** | **Task**                                          | **Deliverable**                   | **Status**  |
| ----------- | ------------------------------------------------- | --------------------------------- | ----------- |
| T-3.1       | Design database schema in Supabase                | Database tables created           | 🔲 Pending |
| T-3.2       | Create UI wireframes/mockups in Figma             | Figma design file                 | 🔲 Pending |
| T-3.3       | Design system architecture (frontend ↔ backend ↔ DB) | Architecture diagram           | 🔲 Pending |
| T-3.4       | Define REST API endpoints (routes, methods, payloads) | API specification document     | 🔲 Pending |
| T-3.5       | Design component hierarchy (React)                | Component tree diagram            | 🔲 Pending |
| T-3.6       | Set up project repository and folder structure    | GitHub repo with scaffolding      | 🔲 Pending |
| T-3.7       | Set up development environment                    | Working local dev setup           | 🔲 Pending |

### **5.4 Phase 4 – Frontend Implementation – Tourist UI (Weeks 6–8)**

| **Task ID** | **Task**                                              | **Deliverable**                | **Requirement(s)** |
| ----------- | ----------------------------------------------------- | ------------------------------ | ------------------- |
| T-4.1       | Implement Home / Place Listing page                   | Place list page                | FR-1               |
| T-4.2       | Implement category filter controls                    | Filter component               | FR-2, FR-3        |
| T-4.3       | Implement open/closed status indicator                | Status badge                   | FR-4               |
| T-4.4       | Implement Place Detail page                           | Detail page                    | FR-5, FR-7        |
| T-4.5       | Implement "Add to Visit Plan" button on detail page   | Add-to-plan control            | FR-6               |
| T-4.6       | Integrate embedded map on detail page                 | Map component                  | FR-8, FR-9        |
| T-4.7       | Implement Visit Plan page (consolidated view)         | Visit plan page                | FR-12               |
| T-4.8       | Implement add/remove places from visit plan           | Plan management controls       | FR-10, FR-11        |
| T-4.9       | Implement drag-and-drop reorder in visit plan         | Reorder functionality          | FR-13               |
| T-4.10      | Implement responsive design for mobile/desktop        | Responsive layouts             | NFR-11              |
| T-4.11      | Implement error handling UI (network loss, empty states) | Error messages              | NFR-9              |

### **5.5 Phase 5 – Backend & Database Implementation (Weeks 6–8)**

| **Task ID** | **Task**                                              | **Deliverable**                | **Requirement(s)** |
| ----------- | ----------------------------------------------------- | ------------------------------ | ------------------- |
| T-5.1       | Create database tables (Place, Category, VisitPlan, VisitPlanItem, Admin) | DB schema      | Section 6          |
| T-5.2       | Seed database with ≥10 verified places                | Populated database             | FR-1, Section 6.1 |
| T-5.3       | Seed category data (Religious, Nature, Heritage, Cultural) | Category records            | Section 6.2        |
| T-5.4       | Implement GET /places endpoint (list all)              | REST endpoint                  | FR-1              |
| T-5.5       | Implement GET /places?category= endpoint (filter)     | REST endpoint                  | FR-2              |
| T-5.6       | Implement GET /places/:id endpoint (detail)           | REST endpoint                  | FR-5              |
| T-5.7       | Implement POST /visit-plan endpoint (create plan)     | REST endpoint                  | FR-10              |
| T-5.8       | Implement PUT /visit-plan/:id endpoint (add/remove/reorder) | REST endpoint             | FR-10, FR-11, FR-13 |
| T-5.9       | Implement GET /visit-plan/:id endpoint (view plan)    | REST endpoint                  | FR-12              |
| T-5.10      | Implement session-based plan identification           | Session handling               | NFR-7             |
| T-5.11      | Optimise queries for <3 second page load              | Performance tuning             | NFR-1, NFR-3     |

### **5.6 Phase 6 – Admin Module Implementation (Weeks 8–9)**

| **Task ID** | **Task**                                              | **Deliverable**                | **Requirement(s)** |
| ----------- | ----------------------------------------------------- | ------------------------------ | ------------------- |
| T-6.1       | Implement Admin Login page                            | Login page                     | FR-14              |
| T-6.2       | Implement authentication backend (hashed passwords)   | Auth endpoints                 | FR-14, NFR-5      |
| T-6.3       | Implement session/token-based auth middleware          | Auth middleware                | FR-15, NFR-6      |
| T-6.4       | Implement Admin Dashboard page                        | Dashboard page                 | FR-16 – FR-18      |
| T-6.5       | Implement Add Place form with validation              | Add form                       | FR-16, FR-19       |
| T-6.6       | Implement Edit Place form with validation             | Edit form                      | FR-17, FR-19       |
| T-6.7       | Implement Delete Place functionality (with confirmation) | Delete flow                 | FR-18              |
| T-6.8       | Implement admin CRUD REST endpoints                   | REST endpoints                 | FR-16 – FR-18      |
| T-6.9       | Ensure all admin endpoints require authentication     | Secured endpoints              | NFR-6             |

### **5.7 Phase 7 – Integration & Testing (Weeks 9–10)**

| **Task ID** | **Task**                                              | **Deliverable**                |
| ----------- | ----------------------------------------------------- | ------------------------------ |
| T-7.1       | End-to-end integration of frontend ↔ backend ↔ DB    | Working integrated system      |
| T-7.2       | Write and execute functional test cases (FR-1 to FR-19) | Test case document + results |
| T-7.3       | Write and execute non-functional test cases (NFR-1 to NFR-12) | Test case document + results |
| T-7.4       | Cross-browser testing (Chrome, Firefox, Edge, Safari) | Browser compatibility report   |
| T-7.5       | Mobile responsiveness testing                         | Responsive test report         |
| T-7.6       | Performance testing (page load < 3s, filter < 1s)     | Performance test results       |
| T-7.7       | Security testing (auth, hashing, endpoint protection) | Security test results          |
| T-7.8       | Stakeholder acceptance testing / feedback             | Feedback summary               |

### **5.8 Phase 8 – Bug Fixing & Refinement (Weeks 10–11)**

| **Task ID** | **Task**                                              | **Deliverable**                |
| ----------- | ----------------------------------------------------- | ------------------------------ |
| T-8.1       | Fix bugs identified during integration testing        | Bug fix log                    |
| T-8.2       | Refine UI/UX based on stakeholder feedback            | Updated UI                     |
| T-8.3       | Optimise performance bottlenecks                      | Performance improvements       |
| T-8.4       | Regression testing after fixes                        | Regression test results        |

### **5.9 Phase 9 – Documentation Finalisation (Weeks 10–12)**

| **Task ID** | **Task**                                              | **Deliverable**                |
| ----------- | ----------------------------------------------------- | ------------------------------ |
| T-9.1       | Finalise system test plan and test results            | System test plan document      |
| T-9.2       | Write user guide (tourist-facing + admin-facing)      | User guide                     |
| T-9.3       | Write technical documentation (architecture, API docs) | Technical document            |
| T-9.4       | Prepare final project report                          | Project report                 |
| T-9.5       | Ensure SRS traceability (every FR → test case)        | Traceability matrix            |

### **5.10 Phase 10 – Presentation Preparation & Demo (Weeks 11–12)**

| **Task ID** | **Task**                                              | **Deliverable**                |
| ----------- | ----------------------------------------------------- | ------------------------------ |
| T-10.1      | Prepare presentation slides                           | Slide deck                     |
| T-10.2      | Prepare live demonstration script                     | Demo script                    |
| T-10.3      | Rehearse presentation                                 | —                              |
| T-10.4      | Deliver final presentation and demo                   | Assessed presentation          |

---

## **6. Gantt Chart**

```
Week →              1    2    3    4    5    6    7    8    9   10   11   12
                    ─────────────────────────────────────────────────────────
Phase 1: Stakeholder
 & Proposal         ████ ████

Phase 2: Requirements
 Analysis & SRS          ████ ████ ████

Phase 3: System
 Design                            ████ ████ ████

Phase 4: Frontend
 (Tourist UI)                                 ████ ████ ████

Phase 5: Backend &
 Database                                     ████ ████ ████

Phase 6: Admin
 Module                                                 ████ ████

Phase 7: Integration
 & Testing                                                   ████ ████

Phase 8: Bug Fixing
 & Refinement                                                      ████ ████

Phase 9: Documentation
 Finalisation                                                ████ ████ ████

Phase 10: Presentation
 & Demo                                                           ████ ████
                    ─────────────────────────────────────────────────────────
```

> **Note:** Phases 4 and 5 run in parallel (Weeks 6–8). Phases 8 and 9 also overlap (Weeks 10–12).

---

## **7. Milestones and Deliverables**

| **Milestone** | **Target Week** | **Deliverable(s)**                                                                   | **Success Criteria**                                    |
| ------------- | --------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| M1            | Week 2          | Approved project proposal                                                            | Supervisor approval received.                           |
| M2            | Week 4          | Final SRS document (v2.0)                                                            | All FRs and NFRs defined; peer-reviewed.                |
| M3            | Week 6          | System design complete (DB schema, Figma mockups, API spec, architecture)            | Design artefacts reviewed and ready for implementation.  |
| M4            | Week 8          | Tourist-facing UI functional; backend API operational; database seeded with ≥10 places | Tourist can browse, filter, view details, and build plan. |
| M5            | Week 9          | Admin module functional (login, CRUD operations)                                     | Admin can log in and add/edit/delete places.             |
| M6            | Week 10         | Integration and testing complete                                                     | All FRs pass test cases; no critical bugs remaining.     |
| M7            | Week 11         | Bug fixes applied; documentation drafted                                             | Regression tests pass; user guide ready.                 |
| M8            | Week 12         | Final submission (code, documentation, presentation)                                 | All deliverables submitted; demo delivered.               |

---

## **8. Task Breakdown & Requirements Traceability**

This section maps each functional requirement from the SRS to specific implementation tasks, ensuring full traceability.

### **8.1 Place Listing & Category Filtering**

| **Requirement** | **Description**                                                  | **Priority** | **Implementation Task(s)**   | **Test Case(s)** |
| --------------- | ---------------------------------------------------------------- | ------------ | ----------------------------- | ---------------- |
| FR-1           | Display list of all places (photo, name, category, distance)     | Essential    | T-4.1, T-5.4                 | TC-01            |
| FR-2           | Filter places by one category at a time                          | Essential    | T-4.2, T-5.5                 | TC-02            |
| FR-3           | Clear active filter to view all places                           | Desirable    | T-4.2                        | TC-03            |
| FR-4           | Indicate if a place is currently open (based on stored hours)    | Optional     | T-4.3                        | TC-04            |

### **8.2 Place Detail View**

| **Requirement** | **Description**                                                  | **Priority** | **Implementation Task(s)**   | **Test Case(s)** |
| --------------- | ---------------------------------------------------------------- | ------------ | ----------------------------- | ---------------- |
| FR-5           | Display description, opening hours, travel tips, distance        | Essential    | T-4.4, T-5.6                 | TC-05            |
| FR-6           | Add selected place directly to current one-day visit plan        | Essential    | T-4.5                        | TC-06            |
| FR-7           | Display representative photo on detail page                      | Desirable    | T-4.4                        | TC-07            |

### **8.3 Map View**

| **Requirement** | **Description**                                                  | **Priority** | **Implementation Task(s)**   | **Test Case(s)** |
| --------------- | ---------------------------------------------------------------- | ------------ | ----------------------------- | ---------------- |
| FR-8           | Display place location as a marker on embedded map               | Essential    | T-4.6                        | TC-08            |
| FR-9           | Centre and appropriately zoom the map on the place               | Desirable    | T-4.6                        | TC-09            |

### **8.4 One-Day Visit Plan Builder**

| **Requirement** | **Description**                                                  | **Priority** | **Implementation Task(s)**   | **Test Case(s)** |
| --------------- | ---------------------------------------------------------------- | ------------ | ----------------------------- | ---------------- |
| FR-10           | Add multiple places to a single one-day visit plan               | Essential    | T-4.8, T-5.7, T-5.8         | TC-10            |
| FR-11           | Remove a previously added place from the visit plan              | Essential    | T-4.8, T-5.8                 | TC-11            |
| FR-12           | Display all places in the visit plan in one consolidated view    | Essential    | T-4.7, T-5.9                 | TC-12            |
| FR-13           | Reorder places within the visit plan                             | Desirable    | T-4.9, T-5.8                 | TC-13            |

### **8.5 Administrator Authentication**

| **Requirement** | **Description**                                                  | **Priority** | **Implementation Task(s)**   | **Test Case(s)** |
| --------------- | ---------------------------------------------------------------- | ------------ | ----------------------------- | ---------------- |
| FR-14           | Require admin login (username/password) before management access | Essential    | T-6.1, T-6.2                 | TC-14            |
| FR-15           | Deny access to admin functions for unauthenticated requests      | Essential    | T-6.3                        | TC-15            |

### **8.6 Administrator Place Management**

| **Requirement** | **Description**                                                  | **Priority** | **Implementation Task(s)**   | **Test Case(s)** |
| --------------- | ---------------------------------------------------------------- | ------------ | ----------------------------- | ---------------- |
| FR-16           | Add a new place record (all fields including image)              | Essential    | T-6.5, T-6.8                 | TC-16            |
| FR-17           | Edit an existing place record                                    | Essential    | T-6.6, T-6.8                 | TC-17            |
| FR-18           | Delete a place record                                            | Essential    | T-6.7, T-6.8                 | TC-18            |
| FR-19           | Validate required fields before save; show error if invalid      | Desirable    | T-6.5, T-6.6                 | TC-19            |

### **8.7 Non-Functional Requirements**

| **Requirement** | **Description**                                                  | **Priority** | **Implementation Task(s)**   | **Test Case(s)** |
| --------------- | ---------------------------------------------------------------- | ------------ | ----------------------------- | ---------------- |
| NFR-1          | Home page loads within 3 seconds on 4G                           | Essential    | T-5.11                       | TC-NFR-1        |
| NFR-2          | Support ≥50 concurrent users without degradation                 | Desirable    | T-5.11                       | TC-NFR-2        |
| NFR-3          | Category filter updates within 1 second                          | Desirable    | T-5.11                       | TC-NFR-3        |
| NFR-4          | No misleading booking/payment functionality                      | Essential    | Design review                | TC-NFR-4        |
| NFR-5          | Passwords stored with secure hashing                             | Essential    | T-6.2                        | TC-NFR-5        |
| NFR-6          | Admin endpoints verify valid auth session                        | Essential    | T-6.3, T-6.9                 | TC-NFR-6        |
| NFR-7          | No PII collected from tourist users                              | Desirable    | T-5.10                       | TC-NFR-7        |
| NFR-8          | View details and add to plan within 3 clicks from home           | Essential    | T-4.4, T-4.5                 | TC-NFR-8        |
| NFR-9          | Graceful error messages on network failure                       | Desirable    | T-4.11                       | TC-NFR-9        |
| NFR-10          | Modular, reusable codebase (components + services)               | Desirable    | All implementation tasks      | TC-NFR-10        |
| NFR-11          | Accessible on Chrome, Firefox, Safari, Edge                      | Essential    | T-4.10, T-7.4                | TC-NFR-11        |
| NFR-12          | DB schema supports additional categories/radius expansion        | Optional     | T-5.1                        | TC-NFR-12        |

---

## **9. Risk Management**

| **Risk ID** | **Risk Description**                                                           | **Likelihood** | **Impact** | **Mitigation Strategy**                                                                                          |
| ----------- | ------------------------------------------------------------------------------ | -------------- | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| R-01        | Map API (Google Maps) exceeds free-tier quota or is discontinued               | Medium         | High       | Evaluate OpenStreetMap/Leaflet as a free alternative; implement map service as an abstraction layer for easy swap. |
| R-02        | Supabase service outage affects database availability                          | Low            | High       | Maintain local database backup; design graceful error handling for DB connection failures.                         |
| R-03        | Single developer falls behind schedule due to academic workload                | Medium         | High       | Prioritise Essential requirements; defer Desirable/Optional features to later if needed; use weekly progress checks.|
| R-04        | Kosgoda Sea Turtle Conservation Project exceeds 25 km boundary                | Medium         | Low        | Verify exact distance before SRS finalisation; have an alternative place ready.                                    |
| R-05        | Technology stack change required by supervisor                                 | Low            | Medium     | Keep backend framework-agnostic where possible; confirm stack approval early.                                     |
| R-06        | Browser compatibility issues with embedded map component                       | Medium         | Medium     | Test map rendering across target browsers early in Phase 4; use well-supported libraries.                         |
| R-07        | Data accuracy — opening hours or distances change                              | Medium         | Low        | Admin module allows easy updates; encourage stakeholder reviews during UAT.                                       |
| R-08        | Security vulnerability in authentication implementation                        | Low            | High       | Use established libraries (e.g., bcrypt for hashing, JWT/session middleware); follow OWASP guidelines.            |

---

## **10. Quality Assurance Strategy**

| **Aspect**            | **Approach**                                                                                         |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| **Code Quality**      | Modular component-based architecture; ESLint for code linting; meaningful variable/function naming.   |
| **Testing Approach**  | Manual functional testing (per FR/NFR); cross-browser testing; performance profiling (DevTools).      |
| **Traceability**      | Every FR maps to ≥1 test case (Section 8); traceability matrix maintained in SRS Section 7.          |
| **Peer Review**       | SRS reviewed by peers (v1.0 → v2.0); code reviewed before milestone submissions.                    |
| **Stakeholder UAT**   | Stakeholders invited to test the system during Phase 7 and provide structured feedback.              |
| **Version Control**   | Git with feature branches; meaningful commit messages; hosted on GitHub.                             |

---

## **11. Communication & Reporting**

| **Activity**                  | **Frequency**       | **Audience**               | **Method**                  |
| ----------------------------- | ------------------- | -------------------------- | --------------------------- |
| Progress self-check           | Weekly              | Developer                  | Task checklist update        |
| Supervisor check-in           | Bi-weekly / as scheduled | Module Supervisor       | Meeting / email              |
| Milestone submission          | Per milestone        | Module Supervisor          | Submission via LMS / email   |
| Stakeholder feedback session  | Phase 7 (Week 9–10) | Consulted stakeholders     | In-person / online meeting   |

---

## **12. Assumptions and Dependencies**

| **#** | **Assumption / Dependency**                                                                                    |
| ----- | ------------------------------------------------------------------------------------------------------------- |
| A-1   | Opening times and travel tips do not change frequently enough to require real-time synchronisation.            |
| A-2   | The external map-embedding API remains available and free at the tier required for a student project.          |
| A-3   | The four consulted stakeholders are broadly representative of the primary Tourist user class.                  |
| A-4   | The technology stack (Node.js/Express + React + Supabase) is approved by the module supervisor.               |
| A-5   | The developer has access to a stable internet connection for development, testing and Supabase access.        |
| A-6   | The module timeline of 12 weeks is sufficient for delivering all Essential requirements.                      |
| D-1   | **Dependency:** Supabase (PostgreSQL hosting) must remain operational throughout the project.                  |
| D-2   | **Dependency:** Map service API (Google Maps or OpenStreetMap/Leaflet) must be accessible.                    |
| D-3   | **Dependency:** GitHub for version control must be accessible.                                                |

---

## **13. Appendix A – Work Breakdown Structure (WBS)**

```
DayTripGO Project
├── 1. Initiation
│   ├── 1.1 Stakeholder Identification
│   ├── 1.2 Stakeholder Consultation
│   └── 1.3 Project Proposal Submission
│
├── 2. Requirements
│   ├── 2.1 Requirements Elicitation
│   ├── 2.2 SRS Drafting (v1.0)
│   ├── 2.3 Peer Review
│   └── 2.4 SRS Finalisation (v2.0)
│
├── 3. Design
│   ├── 3.1 Database Schema Design
│   ├── 3.2 UI/UX Wireframes & Mockups (Figma)
│   ├── 3.3 Architecture Design
│   ├── 3.4 REST API Specification
│   └── 3.5 Development Environment Setup
│
├── 4. Implementation
│   ├── 4.1 Tourist Frontend
│   │   ├── 4.1.1 Home / Place Listing Page
│   │   ├── 4.1.2 Category Filter Component
│   │   ├── 4.1.3 Place Detail Page
│   │   ├── 4.1.4 Map Component
│   │   ├── 4.1.5 Visit Plan Page
│   │   └── 4.1.6 Responsive Layout & Error Handling
│   │
│   ├── 4.2 Backend API
│   │   ├── 4.2.1 Place Endpoints (list, filter, detail)
│   │   ├── 4.2.2 Visit Plan Endpoints (create, update, view)
│   │   ├── 4.2.3 Auth Endpoints (login, session)
│   │   └── 4.2.4 Admin CRUD Endpoints
│   │
│   ├── 4.3 Database
│   │   ├── 4.3.1 Table Creation
│   │   ├── 4.3.2 Data Seeding (≥10 places)
│   │   └── 4.3.3 Query Optimisation
│   │
│   └── 4.4 Admin Module
│       ├── 4.4.1 Login Page
│       ├── 4.4.2 Dashboard
│       ├── 4.4.3 Add/Edit/Delete Forms
│       └── 4.4.4 Auth Middleware
│
├── 5. Testing
│   ├── 5.1 Functional Testing (FR-1 to FR-19)
│   ├── 5.2 Non-Functional Testing (NFR-1 to NFR-12)
│   ├── 5.3 Cross-Browser Testing
│   ├── 5.4 Security Testing
│   └── 5.5 Stakeholder Acceptance Testing
│
├── 6. Bug Fixing & Refinement
│   ├── 6.1 Bug Resolution
│   ├── 6.2 UI/UX Refinement
│   └── 6.3 Regression Testing
│
├── 7. Documentation
│   ├── 7.1 System Test Plan & Results
│   ├── 7.2 User Guide
│   ├── 7.3 Technical Documentation
│   └── 7.4 Final Project Report
│
└── 8. Presentation & Submission
    ├── 8.1 Presentation Slides
    ├── 8.2 Demo Preparation
    └── 8.3 Final Submission
```

---

> **Document End**
>
> _This project plan is a living document and may be updated as the project progresses. All changes will be recorded in the Revision History table._

---

## **14. Implementation Plan – Step-by-Step Execution Guide**

> **Added:** 14.10.2026 — Covers folder restructure, full frontend & backend build-out, integration wiring, and separate log setup.

### **14.1 Revision to Folder Structure**

As part of Phase 3 (System Design – T-3.6), the project folder names were updated for clarity:

| Old Name | New Name | Reason |
| -------- | -------- | ------ |
| `client/` | `frontend/` | Clearly describes the Presentation Tier role |
| `server/` | `backend/` | Clearly describes the Application Tier role |

All internal references were re-checked on 15.10.2026: `package.json` name fields, README paths, the `index.html` title and the root `.gitignore` now use the new folder names.

---

### **14.2 Implementation Status (as at 15.10.2026)**

> **Correction (15.10.2026):** the first version of this section (14.10.2026) described empty `src/` sub-directories as existing scaffolding. Those directories had **not** actually been created in the repository at that time and were created during the build. The tables below now record the real, completed state.

#### Frontend (`frontend/`) – Status

| Item | File / Folder | State |
| ---- | ------------- | ----- |
| Entry point | `index.html` | ✅ DayTripGO title + meta description |
| React entry | `src/main.jsx` | ✅ Mounted inside Auth + VisitPlan context providers |
| App root | `src/App.jsx` | ✅ Full React Router setup (5 routes + 404) |
| Styles | Tailwind v4 + shadcn theme (`src/index.css`) | ✅ Re-themed to DayTripGO brand colours (supersedes Step 12 plain-CSS design system) |
| UI stack | shadcn/ui + Aceternity Apple Cards Carousel | ✅ Installed 15.10.2026 |
| Vite config | `vite.config.js` | ✅ `/api` proxy (Step 19) + Tailwind plugin + `@` alias |
| Package | `package.json` | ✅ react-router-dom, axios, leaflet, react-leaflet, tailwindcss |
| Pages | `src/pages/` | ✅ Home, PlaceDetail, VisitPlan, AdminLogin, AdminDashboard |
| Components | `src/components/*` | ✅ Common, Layout, PlaceListing, PlaceDetail, MapView, VisitPlan (all Step 16 files + ProtectedRoute, FeaturedCarousel) |
| Services | `src/services/` | ✅ api, placeService, categoryService, visitPlanService, authService |
| Context | `src/context/` | ✅ AuthContext, VisitPlanContext |
| Hooks | `src/hooks/` | ✅ usePlaces, useVisitPlan, useAuth |
| Utils | `src/utils/` | ✅ formatDistance, formatHours, isOpenNow, placeImage |
| Build & lint | `npm run build` / `npm run lint` | ✅ Build passes; lint warnings-only (15.10.2026) |

#### Backend (`backend/`) – Status

| Item | File / Folder | State |
| ---- | ------------- | ----- |
| Server entry | `src/server.js` | ✅ Starts on port 5000 |
| App config | `src/app.js` | ✅ CORS, JSON, Morgan (console + `logs/backend.log`), all four routes wired, central error handler |
| DB config | `src/config/db.js` | ✅ Supabase client (requires `.env`) |
| Env template | `.env.example` | ✅ PORT, SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT vars |
| Routes | `src/routes/` | ✅ places, categories, visit-plans, auth (JWT on admin operations) |
| Controllers | `src/controllers/` | ✅ place, category, visitPlan, auth |
| Models | `src/models/` | ✅ place, category, visitPlan, admin |
| Services | `src/services/` | ✅ place, visitPlan, auth (bcrypt + JWT) |
| Middleware | `src/middleware/` | ✅ auth (requireAuth), validate (FR-19), errorHandler |
| Utils | `src/utils/` | ✅ tokenUtils, passwordUtils |

#### Database (`database/`) – Status

| Item | State |
| ---- | ----- |
| `schema/001_create_tables.sql` | ✅ Written — **to be executed in the Supabase SQL Editor** |
| `seeds/001_seed_categories.sql` | ✅ 4 categories (Religious, Nature, Heritage, Cultural) |
| `seeds/002_seed_places.sql` | ✅ 10 verified places within 25 km + default admin (bcrypt-hashed password) |

---

### **14.3 Execution Steps**

#### Step 1 – Rename Folders ✅ Complete
```
client/  →  frontend/
server/  →  backend/
```
Both `package.json` name fields updated to `daytripgo-frontend` and `daytripgo-server`.

#### Step 2 – Database Schema & Seeds
Create the following SQL files in `database/`:

```
database/
├── schema/
│   └── 001_create_tables.sql    ← Category, Place, VisitPlan, VisitPlanItem, Admin
├── seeds/
│   ├── 001_seed_categories.sql  ← Religious, Nature, Heritage, Cultural
│   └── 002_seed_places.sql      ← ≥10 verified places within 25km of Wadduwa
└── migrations/                  ← (empty – reserved for future schema changes)
```

Run in Supabase SQL Editor: schema first, then seeds.

#### Step 3 – Backend Middleware Layer
Create `backend/src/middleware/`:

| File | Purpose |
| ---- | ------- |
| `auth.js` | Verifies JWT from `Authorization: Bearer <token>` header |
| `validate.js` | Sanitises and validates request bodies |
| `errorHandler.js` | Central 4-argument Express error handler |

#### Step 4 – Backend Models Layer (Supabase query functions)
Create `backend/src/models/`:

| File | Supabase Operations |
| ---- | ------------------- |
| `placeModel.js` | `select`, `insert`, `update`, `delete` on `places` table |
| `categoryModel.js` | `select` on `categories` table |
| `visitPlanModel.js` | `insert`, `select`, `update` on `visit_plans` + `visit_plan_items` |
| `adminModel.js` | `select` on `admins` (for login lookup) |

#### Step 5 – Backend Services Layer (business logic)
Create `backend/src/services/`:

| File | Responsibility |
| ---- | -------------- |
| `placeService.js` | Filter logic, distance calculation, open-status evaluation |
| `visitPlanService.js` | Add/remove/reorder items, session plan management |
| `authService.js` | Password compare (bcrypt), JWT sign/verify, logout |

#### Step 6 – Backend Controllers Layer (request/response handlers)
Create `backend/src/controllers/`:

| File | Handles |
| ---- | ------- |
| `placeController.js` | `getAllPlaces`, `getPlaceById`, `createPlace`, `updatePlace`, `deletePlace` |
| `categoryController.js` | `getAllCategories` |
| `visitPlanController.js` | `createPlan`, `getPlan`, `updatePlan` |
| `authController.js` | `login`, `logout` |

#### Step 7 – Backend Routes Layer
Create `backend/src/routes/`:

| File | Mounted At | Methods |
| ---- | ---------- | ------- |
| `placeRoutes.js` | `/api/places` | `GET`, `GET /:id`, `POST` (🔒), `PUT /:id` (🔒), `DELETE /:id` (🔒) |
| `categoryRoutes.js` | `/api/categories` | `GET` |
| `visitPlanRoutes.js` | `/api/visit-plans` | `POST`, `GET /:id`, `PUT /:id` |
| `authRoutes.js` | `/api/auth` | `POST /login`, `POST /logout` (🔒) |

🔒 = requires JWT auth middleware

#### Step 8 – Backend Utils
Create `backend/src/utils/`:

| File | Exports |
| ---- | ------- |
| `tokenUtils.js` | `signToken(payload)`, `verifyToken(token)` |
| `passwordUtils.js` | `hashPassword(plain)`, `comparePassword(plain, hash)` |

#### Step 9 – Wire Routes in `backend/src/app.js`
Uncomment and register all routes + attach `errorHandler` middleware:
```js
app.use('/api/places',      require('./routes/placeRoutes'));
app.use('/api/categories',  require('./routes/categoryRoutes'));
app.use('/api/visit-plans', require('./routes/visitPlanRoutes'));
app.use('/api/auth',        require('./routes/authRoutes'));
app.use(require('./middleware/errorHandler'));
```

#### Step 10 – Backend Logging (Separate Log File)
Configure Morgan to write to `backend/logs/backend.log` in addition to the console:
```js
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, '../../logs/backend.log'),
  { flags: 'a' }
);
app.use(morgan('combined', { stream: accessLogStream })); // file
app.use(morgan('dev'));                                    // console
```
> **Implemented note (15.10.2026):** a `tee`-based `dev:log` npm script was **not** used — `tee` is unavailable in the Windows `cmd` shell that npm runs scripts in. Morgan's file stream in `app.js` writes `logs/backend.log` directly, which is cross-platform; the `logs/` directory is created at startup and is git-ignored.

#### Step 11 – Install Frontend Packages ✅ Complete
```
react-router-dom  axios  leaflet  react-leaflet
```

#### Step 12 – Frontend Design System
Create `frontend/src/styles/`:

| File | Contents |
| ---- | -------- |
| `variables.css` | CSS custom properties (colours, spacing, fonts, breakpoints) |
| `global.css` | CSS reset + base typography |
| `components.css` | Shared utility classes (cards, buttons, badges) |

#### Step 13 – Frontend Services (API wrappers)
Create `frontend/src/services/`:

| File | Description |
| ---- | ----------- |
| `api.js` | Axios instance with `baseURL` and JWT interceptor |
| `placeService.js` | `getPlaces(params)`, `getPlaceById(id)` |
| `categoryService.js` | `getCategories()` |
| `visitPlanService.js` | `createPlan()`, `getPlan(id)`, `updatePlan(id, items)` |
| `authService.js` | `login(credentials)`, `logout()` |

#### Step 14 – Frontend Context
Create `frontend/src/context/`:

| File | State Managed |
| ---- | ------------- |
| `VisitPlanContext.jsx` | Current plan items, add/remove/reorder actions, plan ID |
| `AuthContext.jsx` | Admin JWT token, login/logout state |

#### Step 15 – Frontend Hooks
Create `frontend/src/hooks/`:

| File | Wraps |
| ---- | ----- |
| `usePlaces.js` | Fetches places, applies category filter |
| `useVisitPlan.js` | Consumes `VisitPlanContext` |
| `useAuth.js` | Consumes `AuthContext`, exposes `login`, `logout`, `isAdmin` |

#### Step 16 – Frontend Components

**Common** (`frontend/src/components/Common/`):
`Button.jsx` · `Loader.jsx` · `ErrorMessage.jsx` · `Modal.jsx` · `Badge.jsx`

**Layout** (`frontend/src/components/Layout/`):
`Header.jsx` · `Footer.jsx` · `Navbar.jsx`

**PlaceListing** (`frontend/src/components/PlaceListing/`):
`PlaceCard.jsx` · `PlaceGrid.jsx` · `CategoryFilter.jsx`

**PlaceDetail** (`frontend/src/components/PlaceDetail/`):
`DetailView.jsx` · `PhotoGallery.jsx`

**MapView** (`frontend/src/components/MapView/`):
`MapEmbed.jsx` (Leaflet) · `MapMarker.jsx`

**VisitPlan** (`frontend/src/components/VisitPlan/`):
`PlanList.jsx` · `PlanItem.jsx` · `DragReorder.jsx`

#### Step 17 – Frontend Pages
Create `frontend/src/pages/`:

| File | Route | Description |
| ---- | ----- | ----------- |
| `HomePage.jsx` | `/` | Place grid + category filter |
| `PlaceDetailPage.jsx` | `/places/:id` | Detail view + embedded Leaflet map |
| `VisitPlanPage.jsx` | `/visit-plan` | Consolidated plan with reorder |
| `AdminLoginPage.jsx` | `/admin/login` | Login form |
| `AdminDashboardPage.jsx` | `/admin/dashboard` | CRUD management table |

#### Step 18 – Frontend Routing (`App.jsx`)
Replace default Vite App with full React Router DOM routes:
```jsx
<BrowserRouter>
  <Routes>
    <Route path="/"                  element={<HomePage />} />
    <Route path="/places/:id"        element={<PlaceDetailPage />} />
    <Route path="/visit-plan"        element={<VisitPlanPage />} />
    <Route path="/admin/login"       element={<AdminLoginPage />} />
    <Route path="/admin/dashboard"   element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
  </Routes>
</BrowserRouter>
```

#### Step 19 – Vite Proxy (`vite.config.js`)
```js
server: {
  proxy: {
    '/api': 'http://localhost:5000'
  }
}
```
Eliminates CORS issues in development – all `/api` calls routed to the Express backend.

#### Step 20 – Frontend Logging (Dropped)
Not implemented: `tee` is unavailable in the Windows npm shell. Frontend messages stay in the Vite console; HTTP access logging is handled by the backend log (`backend/logs/backend.log`).

#### Step 21 – Frontend Utils
Create `frontend/src/utils/`:

| File | Function |
| ---- | -------- |
| `formatDistance.js` | `formatDistance(km)` → `"12.5 km"` |
| `formatHours.js` | `formatHours(openTime, closeTime)` → `"8:00 AM – 5:00 PM"` |
| `isOpenNow.js` | `isOpenNow(openTime, closeTime)` → `true / false` |

---

### **14.4 Integration Points (Frontend ↔ Backend)**

| Frontend Call | Backend Endpoint | Method | Auth Required |
| ------------- | ---------------- | ------ | ------------- |
| Fetch all places | `GET /api/places` | Public | No |
| Filter by category | `GET /api/places?category=:id` | Public | No |
| Get place detail | `GET /api/places/:id` | Public | No |
| Get all categories | `GET /api/categories` | Public | No |
| Create visit plan | `POST /api/visit-plans` | Public | No |
| View visit plan | `GET /api/visit-plans/:id` | Public | No |
| Update visit plan | `PUT /api/visit-plans/:id` | Public | No |
| Admin login | `POST /api/auth/login` | Public | No |
| Admin logout | `POST /api/auth/logout` | Private | JWT 🔒 |
| Add place | `POST /api/places` | Private | JWT 🔒 |
| Edit place | `PUT /api/places/:id` | Private | JWT 🔒 |
| Delete place | `DELETE /api/places/:id` | Private | JWT 🔒 |

---

### **14.5 Log Architecture**

| Log | Location | Written By | Format |
| --- | -------- | ---------- | ------ |
| Backend HTTP requests | `backend/logs/backend.log` | Morgan (`combined`) | `IP METHOD URL STATUS RESPONSE_TIME` |
| Frontend build/HMR output | `frontend/logs/frontend.log` | Vite stdout via `tee` | Vite dev server messages |

Both log files are **git-ignored** (`*.log` in respective `.gitignore` files).

---

### **14.6 Files to Create – Complete Checklist**

#### Backend (`backend/src/`)
- [ ] `middleware/auth.js`
- [ ] `middleware/validate.js`
- [ ] `middleware/errorHandler.js`
- [ ] `models/placeModel.js`
- [ ] `models/categoryModel.js`
- [ ] `models/visitPlanModel.js`
- [ ] `models/adminModel.js`
- [ ] `services/placeService.js`
- [ ] `services/visitPlanService.js`
- [ ] `services/authService.js`
- [ ] `controllers/placeController.js`
- [ ] `controllers/categoryController.js`
- [ ] `controllers/visitPlanController.js`
- [ ] `controllers/authController.js`
- [ ] `routes/placeRoutes.js`
- [ ] `routes/categoryRoutes.js`
- [ ] `routes/visitPlanRoutes.js`
- [ ] `routes/authRoutes.js`
- [ ] `utils/tokenUtils.js`
- [ ] `utils/passwordUtils.js`
- [ ] `app.js` (update – wire all routes + file logging)
- [ ] `logs/` directory (git-ignored)

#### Frontend (`frontend/src/`)
- [ ] `styles/variables.css`
- [ ] `styles/global.css`
- [ ] `styles/components.css`
- [ ] `services/api.js`
- [ ] `services/placeService.js`
- [ ] `services/categoryService.js`
- [ ] `services/visitPlanService.js`
- [ ] `services/authService.js`
- [ ] `context/VisitPlanContext.jsx`
- [ ] `context/AuthContext.jsx`
- [ ] `hooks/usePlaces.js`
- [ ] `hooks/useVisitPlan.js`
- [ ] `hooks/useAuth.js`
- [ ] `components/Common/Button.jsx`
- [ ] `components/Common/Loader.jsx`
- [ ] `components/Common/ErrorMessage.jsx`
- [ ] `components/Common/Modal.jsx`
- [ ] `components/Common/Badge.jsx`
- [ ] `components/Layout/Header.jsx`
- [ ] `components/Layout/Footer.jsx`
- [ ] `components/Layout/Navbar.jsx`
- [ ] `components/PlaceListing/PlaceCard.jsx`
- [ ] `components/PlaceListing/PlaceGrid.jsx`
- [ ] `components/PlaceListing/CategoryFilter.jsx`
- [ ] `components/PlaceDetail/DetailView.jsx`
- [ ] `components/PlaceDetail/PhotoGallery.jsx`
- [ ] `components/MapView/MapEmbed.jsx`
- [ ] `components/MapView/MapMarker.jsx`
- [ ] `components/VisitPlan/PlanList.jsx`
- [ ] `components/VisitPlan/PlanItem.jsx`
- [ ] `components/VisitPlan/DragReorder.jsx`
- [ ] `pages/HomePage.jsx`
- [ ] `pages/PlaceDetailPage.jsx`
- [ ] `pages/VisitPlanPage.jsx`
- [ ] `pages/AdminLoginPage.jsx`
- [ ] `pages/AdminDashboardPage.jsx`
- [ ] `utils/formatDistance.js`
- [ ] `utils/formatHours.js`
- [ ] `utils/isOpenNow.js`
- [ ] `App.jsx` (replace – full React Router)
- [ ] `index.css` (replace – DayTripGO design system)
- [ ] `logs/` directory (git-ignored)

#### Database (`database/`)
- [ ] `schema/001_create_tables.sql`
- [ ] `seeds/001_seed_categories.sql`
- [ ] `seeds/002_seed_places.sql`

---

> _Section 14 added 14.10.2026 by P.K.M. De Silva (E2410884) — Implementation Plan based on analysis of actual codebase state as at project kickoff of Phase 3 (System Design)._
