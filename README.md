

<p align="center">
  <a href="https://day-trip-go-visit-planner-and-infor.vercel.app"><strong>Live website</strong></a> ·
  <a href="https://daytripgo-visit-planner-and-information.onrender.com/api/health"><strong>API health</strong></a> ·
  <a href="https://github.com/KMDS21/DayTripGo-Visit-Planner-and-Information-System"><strong>Main branch</strong></a>
</p>

> The full technical README - stack, architecture, features, REST API, database schema, testing, and deployment - lives in the [`main`](https://github.com/KMDS21/DayTripGo-Visit-Planner-and-Information-System/blob/main/README.md) branch.

---

## 📄 Documents on this branch

| Document | Format | Contents |
| --- | --- | --- |
| [Project Introduction and Problem Specification.pdf](Project%20Introduction%20and%20Problem%20Specification.pdf) | PDF | Project background, problem statement, and objectives |
| [ITE2953_ProjectProposal_E2410884.docx](ITE2953_ProjectProposal_E2410884.docx) | Word | Project proposal (ITE2953) |
| [E2410884_SRS DOCUMENT.pdf](E2410884_SRS%20DOCUMENT.pdf) | PDF | Software requirements specification |
| [E2410884_SRS DOCUMENT_FINAL.pdf](E2410884_SRS%20DOCUMENT_FINAL.pdf) | PDF | Software requirements specification - final version |

Markdown sources (project plan, proposal, SRS, UI/UX guide, integration and testing logs) are kept in the [`main`](https://github.com/KMDS21/DayTripGo-Visit-Planner-and-Information-System/tree/main) branch.

---

## Screenshots

### Public website

| Home - hero | Home - featured escapes | Home - top places |
| :---: | :---: | :---: |
| <img src="SS/site-1.png" alt="Home page hero: One perfect day around Wadduwa" width="420"> | <img src="SS/site-2.png" alt="Home page featured escapes carousel" width="420"> | <img src="SS/site-3.png" alt="Home page top places to visit and footer" width="420"> |
| <sub>Hero with category CTAs</sub> | <sub>Featured escapes carousel</sub> | <sub>Top places + footer</sub> |

| Explore places | My Day Plan | Contact us |
| :---: | :---: | :---: |
| <img src="SS/site-4.png" alt="Explore places page with category filters" width="420"> | <img src="SS/site-5.png" alt="My Day Plan with route summary and map" width="420"> | <img src="SS/site-6.png" alt="Contact us page" width="420"> |
| <sub>Category filters, place cards, add-to-plan</sub> | <sub>Route summary, drag-reorder, Leaflet map</sub> | <sub>Contact form + company details</sub> |

### Admin panel

| Dashboard | Place editor |
| :---: | :---: |
| <img src="SS/admin-dashboard.png" alt="Admin dashboard with site statistics and storage usage" width="560"> | <img src="SS/admin-place-editor.png" alt="Admin place editor modal with photo covers" width="560"> |
| <sub>Stats: places, categories, plans, messages, server storage</sub> | <sub>Place CRUD with opening hours, covers, featured toggle</sub> |

---

## System at a glance

| Layer | Technology |
| --- | --- |
| Frontend | React 19 · Vite 8 · Tailwind CSS v4 · react-router-dom 7 · Leaflet maps - hosted on **Vercel** |
| Backend | Node.js · Express 5 · JWT · bcryptjs · multer uploads - hosted on **Render** |
| Database | Supabase (hosted PostgreSQL) |
| Testing | Vitest · Jest + Supertest · Playwright smoke · autocannon load |

Three user roles: **visitors** browse places and build one-day plans, **business owners** submit listings with photo galleries, and the **admin** moderates content, edits pages, and answers messages.

---

<p align="center">
  Built for <strong>ITE2953</strong> · P.K.M. De Silva (E2410884) · Wadduwa, Sri Lanka
</p>
