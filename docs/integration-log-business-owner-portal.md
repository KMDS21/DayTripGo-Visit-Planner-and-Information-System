# DayTripGO — Integration Log · Business Owner Portal

Separate, append-only record for the **Business Owner Portal** feature branch
(`feature/business-owner-portal`). The main chronological log stays in
`docs/integration-log.md`; this file documents the portal's own steps, contracts
and verification so both remain readable.

**Rule: never overwrite this file — new entries are always appended at the bottom.**

Reference: SRS v2.1 · Project Plan §14

---

## 2026-10-23 · Business Owner Portal — feature scope and decisions

**Requirement:** businesses (rentals, villas, restaurants, …) can be submitted by
their own owners over the web, appear on the public site for browsing only, and
need admin approval before going live. The admin chooses from the panel where an
approved listing shows on the home page (card grid and Featured escapes carousel).

### Decisions taken with the developer

| Topic | Decision |
| ----- | -------- |
| Data model | New tables (`businesses`, `business_owners`, `business_tags`, `business_photos`); the `places` table is **not** reused — places are curated tourist spots with plans/distance, businesses are listings without a day plan |
| Auth | Two JWT roles, **one secret**, disjoint claims (`role: 'admin'` vs `role: 'owner'`); any auth/validation failure is a **401**, touching another owner's row is a **404** (no existence leak) |
| Registration | Two steps: **step 1 = account only** (no business name), **step 2 = listing details + photo gallery**, prefilled from the account |
| Public behaviour | Businesses are **read-only** — no add-to-plan, no detail page; the card opens a preview popup on Explore |
| Approval | Every new **and** edited listing returns to *pending* until an admin approves it |
| Tags | Admin-managed tag list (the `business_tags` table), never hardcoded in the owner form |
| Header CTA | The corner button becomes **business registration**; "My Day Plan" stays in the Navbar + mobile drawer |
| Home card grid | Business cards **merge into the existing "All places" grid** (no separate section) |
| Home featured | Featured businesses **join the existing "Featured escapes" carousel** (one combined row), not a second one |
| Admin controls | **Pills in Admin → Businesses** ("On home" / "Off home" and "Feature" / "Featured") — same look as the places panel |
| Home selection | `home_place_ids` empty → all published places (pre-existing behaviour). `home_business_ids` empty → **no businesses** (the admin ticks each one) |
| Limits | "On home" pill: **max 5 businesses** (`HOME_LIMIT`). Featured carousel: **max 12 listings total**, shared with places (`FEATURED_LIMIT`) |
| Scope note | REPORT.md / PRESENTATION.md are out of scope for this feature (gitignored, untouched) |

---

## 2026-10-23 · Database — migrations 007–010 and seed 004

Run **in order** in the Supabase SQL editor (PostgREST cannot execute DDL).

| File | Creates |
| ---- | ------- |
| `database/schema/007_business_owners.sql` | `business_owners` — owner account (name, email, phone, password hash) |
| `database/schema/008_business_categories.sql` | `business_categories` — the admin-managed tag table owners pick from |
| `database/schema/009_businesses.sql` | `businesses` — listing rows (`published` flag for approval, owner FK) + `business_tags` link table (listing ↔ tag, many-to-many) |
| `database/schema/010_business_photos.sql` | `business_photos` (max 10 per listing, `is_primary` = Explore card cover, `is_featured` = feature card cover) + the `owner_name` and `short_description` columns on `businesses` |
| `database/seeds/004_seed_business_categories.sql` | Canonical tag list — **Vehicle Rental** replaces the earlier Car/Van Rental pair |

- RLS enabled on the new tables; the service-role key (backend) bypasses it.
- The public API only ever returns `published = true` listings, so a pending
  listing is invisible to visitors even before the UI filters it.
- **Open item:** migrations 007–010 + seed 004 still need to be executed on the
  live Supabase project. The photo endpoints return a clear 4xx pointing at
  `010_business_photos.sql` until then (the rest of the portal degrades gracefully).

---

## 2026-10-23 · Backend — owner auth, listings, photos, tags

### `/api/owner/auth` (`ownerAuthRoutes.js`)

| Endpoint | Method | Auth |
| -------- | ------ | ---- |
| `/register` | POST | public (creates the account **and** returns `{ token, owner }`) |
| `/login` | POST | public |
| `/me` · `/logout` · `/password` | GET/POST/PUT | owner JWT |

Owner and admin tokens share one `JWT_SECRET`; the claims are disjoint, so an
admin token is never accepted on owner routes (and vice versa) — the middleware
rejects it with **401**.

### `/api/businesses` (`businessRoutes.js`)

| Endpoint | Method | Auth |
| -------- | ------ | ---- |
| `/` · `?tag=` | GET | public (published only); `?scope=owner` adds your own pending listings; `?scope=admin` adds everything for moderation |
| `/:id` · `/:id/photos` | GET | public for approved listings, `?scope=owner` for your own |
| `/` · `/:id` · `/:id` (DELETE) | POST/PUT/DELETE | owner JWT, scoped to their own rows |
| `/:id/publish` | PUT | admin JWT (approve / unpublish) |
| `/admin/:id` | DELETE | admin JWT (delete a listing outright) |

Editing a listing resets `published` to false — every change is re-approved.

### Photo gallery (`businessPhotoService.js`)

| Endpoint | Method | Notes |
| -------- | ------ | ----- |
| `POST /:id/photos` | POST | multipart `photo` + optional `role`; quota-gated, max **10** photos |
| `PUT /:id/photos/:photoId/role` | PUT | reassign `role`: **`explore`** = the Explore card cover (mirrored into `businesses.image_url`), **`featured`** = the feature card cover (used by the home carousel), `more` = plain gallery |
| `DELETE /:id/photos/:photoId` | DELETE | also clears the mirrored cover when the primary/feature row is removed |

Behaviour mirrors `placePhotoService` (same upload limits, type/real-image checks
and file cleanup), scoped to the owner who created the listing. Deleting a
listing deletes its photos and files.

### Other backend notes

- **Bug fixed:** `normalise()` in `businessModel.js` forced `tags: []` on plain
  selects, so `attachTags()` never ran and every listing looked tag-less.
- `businessPhotoModel.findFeaturedFor()` + `businessService.attachFeaturedCovers()`
  expose `featured_image_url` (the `is_featured` photo) on list and detail reads —
  one extra query per page, silently skipped if migration 010 is missing.
- Listing reads are cached briefly (TTL cache) like places; photo/ listing writes
  invalidate the cache.

---

## 2026-10-23 · Frontend — owner panel, admin panel, public pages

### Routes (`App.jsx`)

| Route | Page |
| ----- | ---- |
| `/business/register` · `/business/login` | public entry points (Header corner CTA → register) |
| `/owner` → `/owner/login`, `/owner/register` | owner auth shell (no public Header/Footer) |
| `/owner/dashboard`, `/owner/businesses`, `/owner/businesses/new`, `/owner/businesses/:id/edit`, `/owner/profile` | business panel with its own sidebar + mobile bar, behind `OwnerProtectedRoute` |
| `/admin/businesses` | admin moderation (behind the existing admin `ProtectedRoute`) |

### Pages and components

- `BusinessRegisterPage` — step 1, account only; returns to `OwnerBusinessFormPage` after step 2.
- `OwnerBusinessFormPage` — name, owner name, email, phone, opening hours, tag
  multi-select, short description (≤ 160 chars), and the 3-slot photo editor
  (Explore cover / feature card cover / more photos, max 10).
- `OwnerDashboardPage`, `OwnerBusinessesPage`, `OwnerProfilePage` — panel home,
  listing management, account + password.
- `BusinessesPanel`, `BusinessGrid`, `BusinessCard`, `BusinessTagFilter`,
  `BusinessPreviewModal` — the Explore **Businesses** tab. Cards are read-only:
  tap opens the popup, never the visit plan. Tab switching clears any open popup.
- `useBusinesses` — public listings + tag list with the one-tag-at-a-time filter
  (same contract as `usePlaces`).
- The header corner CTA is now business registration; "My Day Plan" remains in
  the Navbar and the mobile drawer.

---

## 2026-10-23 · Home page — admin chooses the placement

Everything is stored in the existing `page_content` **home** section (free-form
lowercase/underscore keys, string values — **no backend change needed**):

| Key | Meaning |
| --- | ------- |
| `home_business_ids` | CSV of business ids shown as cards in the home grid. **Empty = none** (the admin ticks each listing) |
| `featured_business_ids` | CSV of business ids in the Featured escapes carousel |
| `featured_business_covers` | Optional per-id cover overrides (`id=path;id=path`) |

### Admin panel (Admin → Businesses)

- **"On home" pill** per row → toggles `home_business_ids`. Capped at **5
  businesses** (`HOME_LIMIT`): at the cap the pill is disabled with the tooltip
  "Only 5 businesses can show on the home page — untick one first", and the
  handler refuses the save with a clear error message.
- **"Feature" pill** per row → toggles `featured_business_ids` (cap **12**,
  shared with places). Disabled until the listing is approved, since a pending
  listing never reaches the public list.
- Deleting a listing removes it from both home selections automatically.
- Unpublishing hides it from the home page and the carousel without losing the
  selection (re-approving restores it).
- The places panel keeps its own existing "Show on home" behaviour untouched.

### Public home page (`HomePage.jsx`, `FeaturedCarousel.jsx`)

- The **All places** section becomes **"All places & businesses"**: one grid,
  places and businesses alternating (so the four cards shown on tablets/phones
  always include businesses when any are ticked). Heading, copy and the
  "Explore everything" link updated.
- **Featured escapes** is one combined carousel: place rows first, then business
  rows, in the order they were ticked. A business card resolves its image from
  the admin cover override → the owner's feature card cover (`featured_image_url`)
  → the Explore card cover, and links to Explore with that listing's popup open
  (`previewBusinessId` router state, consumed by `ExplorePage` + `BusinessesPanel`).
- Both listings failing shows one error box per listing; the healthy one still renders.

---

## 2026-10-23 · Tests and verification

| Suite | Result |
| ----- | ------ |
| Backend unit (`npm test`) | **86 passed / 7 files** |
| Backend integration (`npm test`) | **38 passed / 6 files** (incl. 17 business tests: two-step registration, publish gate, owner scoping, tag filter, photo roles/quota, `featured_image_url`) |
| Backend API (`npm test`) | **20 passed / 3 files** |
| Frontend unit (`npm run test:unit`) | **70 passed / 8 files** (incl. new `featuredConfig` CSV/key cases and `businessTagFilter` / `ownerApi`) |
| Frontend lint | warnings only — none introduced by this feature (the warnings are pre-existing patterns: `set-state-in-effect`, unused AdminPlacesPage vars, `only-export-components`) |
| Frontend build | passes |

Notes:
- One `ttlCache` unit test (40 ms vs 25 ms timing) flaked **once** while several
  npm jobs ran in parallel; it passes on a normal run and is unrelated to this
  feature.
- The `featured_image_url` integration test inserts `business_photos` rows
  directly, so it asserts only the feature cover (a raw insert does not mirror
  `image_url`; the service does that when a photo is uploaded through the API).

---

## 2026-10-23 · Open items

- Run migrations **007–010** and seed **004** in the Supabase SQL editor.
- Optional `database/schema/011_merge_vehicle_rental.sql`: the live tag list still
  holds the old `Car Rental` / `Van Rental` rows alongside the canonical
  `Vehicle Rental`; seed 004 alone does not remap them.
- Commit: everything on `feature/business-owner-portal` (this log included).

_(Entries below are appended as further steps complete.)_
