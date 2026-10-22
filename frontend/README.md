# DayTripGO — Frontend

React (Vite) presentation tier for **DayTripGO**, a web-based visit planning system for
places of interest within 25 km of Wadduwa, Sri Lanka. Part of the ITE2953 project
(E2410884 — De Silva P.K.M).

## Stack

- **React 19** + **Vite** (dev server with `/api` proxy to the backend on port 5000)
- **react-router-dom** — client-side routing
- **axios** — API calls (JWT interceptor for admin requests)
- **leaflet / react-leaflet** — embedded OpenStreetMap view on the place detail page

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173  (proxies /api → http://localhost:5000)
npm run build      # production build to dist/
npm run lint       # oxlint
```

The backend (`../backend`) must be running for API-dependent pages to work.

## Project structure

```
src/
├── main.jsx                 ← Entry: mounts <App /> inside Context providers
├── App.jsx                  ← Router + layout (Header/Footer)
├── index.css                ← Imports the design system in styles/
├── styles/                  ← variables.css, global.css, components.css
├── services/                ← API wrappers (api.js axios instance + place/category/visit-plan/auth)
├── context/                 ← VisitPlanContext, AuthContext
├── hooks/                   ← usePlaces, useVisitPlan, useAuth
├── components/
│   ├── Common/              ← Button, Loader, ErrorMessage, Modal, Badge
│   ├── Layout/              ← Header, Footer, Navbar
│   ├── PlaceListing/        ← PlaceCard, PlaceGrid, CategoryFilter
│   ├── PlaceDetail/         ← DetailView, PhotoGallery
│   ├── MapView/             ← MapEmbed, MapMarker (Leaflet)
│   └── VisitPlan/           ← PlanList, PlanItem, DragReorder
├── pages/                   ← HomePage, PlaceDetailPage, VisitPlanPage, AdminLoginPage, AdminDashboardPage
└── utils/                   ← formatHours, hoursRange, placeImage
```

## Routes

| Route | Page | Access |
| --- | --- | --- |
| `/` | Home — place grid + category filter | Public |
| `/places/:id` | Place detail + embedded map | Public |
| `/visit-plan` | One-day visit plan (add/remove/reorder) | Public (session-based) |
| `/admin/login` | Administrator login | Public |
| `/admin/dashboard` | Place management (CRUD) | Protected (JWT) |

## Logging

Vite dev-server output is written to the console only; backend HTTP access logs are
written by Morgan to `backend/logs/backend.log` (git-ignored).
