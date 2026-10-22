# DayTripGO UI/UX Design Guide

**Project:** DayTripGO (ITE2953), React 19 + Tailwind v4 + shadcn/ui
**Inspired by:** patterns seen on walkerstours.com (structure, trust signals, FAQ, route map, enquiry flow). Not copied.
**Purpose:** one place that says how every page should look and behave, so the site feels like one product and matches the SRS.

> **Font status: open item.** The Walkers Tours font has not been confirmed (CSS not readable from the page content). Everything below uses one font token, `--font-sans`. When the font name is known, change **only that token** (section 3). The fallback in section 3 is my suggestion, not Walkers' font.

---

## 1. Design principles

1. **One main action per screen.** Tourist: build the day plan. Admin: manage places.
2. **Plan first, read second.** Every place card has Add to plan within one tap.
3. **Short sections.** Heading + 1-2 lines + one button (Walkers pattern).
4. **Trust through real facts.** Real counters, real opening hours, no invented claims.
5. **Planning only.** Never imply booking or payment (SRS NFR-4).
6. **Fast on a phone.** Target: home page under 3 s on 4G (NFR-1).
7. **Plain language.** Short sentences, no jargon, no em dashes in visible copy (existing rule in your log).

---

## 2. Colour system

Keep the tokens you already have. Do not add new brand colours.

| Role | Token (existing) | Use |
|---|---|---|
| Primary | `brand` / `brand-dark` | Buttons, links, active nav text, hero wash |
| Soft background | `brand-light` (at 50%) | Section bands, chips |
| Accent | sand token in `index.css` | Highlights, badges |
| Surface | `bg-card`, `bg-background` | Cards, pages |
| Danger | `danger-soft` variant | Clear plan, Log out, delete |
| Text | `foreground`, `muted-foreground` | Body, captions |

Rules:
- Text on photos or video: white text + dark overlay + the existing `text-shadow`. Never rely on the photo alone.
- Contrast: body text at least 4.5:1, large text at least 3:1. Check every hero and the footer (footer has the smallest text).
- Do not use colour alone to show state. Add an icon or label (for example "Added" with a tick).

---

## 3. Typography

**One typeface for everything** (public site, admin, popups, map popups, form fields).

```css
/* frontend/src/index.css */
@theme {
  --font-sans: "FONT NAME", system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-heading: var(--font-sans);
}
body { font-family: var(--font-sans); }
input, button, textarea, select { font-family: inherit; }
```

```html
<!-- frontend/index.html: add only the weights you use (400, 500, 600, 700) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=FONT+NAME:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**Until the Walkers font is confirmed**, use a clean humanist sans from Google Fonts as a temporary value of `FONT NAME` (for example Poppins or Nunito Sans). This is only a placeholder.

**Type scale** (mobile -> desktop):

| Style | Size | Weight | Use |
|---|---|---|---|
| Hero title | `text-3xl` -> `lg:text-5xl` | 700 | Page heroes |
| Section title | `text-2xl` -> `lg:text-3xl` | 600 | Each section |
| Card title | `text-lg` | 600 | Place name |
| Body | `text-base` (16 px minimum) | 400 | Descriptions |
| Caption | `text-sm` | 400-500 | Hours, tags, hints |

- Line length for paragraphs: about 60-75 characters (`max-w-2xl`).
- Line height: 1.5 for body, 1.2 for headings.
- Form inputs stay at 16 px on mobile (stops iOS zoom, already done).
- If the font is a **paid or custom** font, you may not have the right to use it. Check the licence first.

---

## 4. Layout and spacing

- Spacing unit: 4 px steps (`gap-4`, `py-12`). Section padding: `py-12 sm:py-16 lg:py-20`.
- Side padding: `px-4 sm:px-6 lg:px-10` (already used).
- Text blocks: `max-w-2xl` or `max-w-3xl`. Card grids: full width.
- Grid: 1 column under 640 px, 2 from `sm`, 3 from `lg`, 4 from `xl`, capped at 5 on `2xl` (already used).
- Corners: cards `rounded-2xl`, buttons `rounded-2xl` (CTA) or `rounded-xl`, hero bottom `rounded-b-[2.5rem]`.
- Shadows: one soft shadow for cards, one stronger for modals. Nothing else.

---

## 5. Components

### 5.1 Header and navigation
- Left: logo. Centre: Home, Explore, My Day Plan, Contact us. Right: green CTA "Let's plan your tour".
- Below `md`: logo + hamburger drawer + short CTA "My plan" with count badge (already built).
- Active item = brand text colour only. Sticky header, solid background after scrolling.
- **Keep the menu to 4 items.** Walkers has 40+ links; you have 10 places.

### 5.2 Hero
- Title, one-line subtitle, optional 2 short trust bullets (Walkers pattern), one button.
- Video or photo cover, dark overlay, text shadow. A `poster` image for video.
- Do not autoplay video on very slow connections or when the user prefers reduced motion.
- Height: about 70-75 svh on Home, content height on other pages.

### 5.3 Place card
- Photo (3:2), category chip, name, 1-line summary, **Add to plan** and **Details/Map**.
- Optional "Best for" tag (Families, History, Photography, Quiet). Maximum 2 tags per card.
- Added state: button changes to "Added" with a tick and stays disabled or toggles to remove.
- Whole photo and name open the popup (Explore) or detail page.

### 5.4 Category tiles (new, from Walkers)
- 4 image tiles on Home (Religious, Nature, Heritage, Cultural) linking to `/explore` with the filter set.
- Image + name + "Explore" link; hover lifts the card and zooms the photo slightly.

### 5.5 Place popup / detail
- Desktop: details left, photos right (big photo + thumbnails). Mobile: photo first.
- Order: category, name, short description, opening hours, travel tips, **Add to plan**, map.
- Add "Nearby places" row (same category or close by) at the bottom.

### 5.6 My Day Plan
- Mobile: map first, list below. Desktop: list left (own scroll), map right (sticky).
- Each row: number badge, name, hours, up/down buttons (44 px touch targets), remove.
- Optional suggested time per stop. Summary bar: "N places", Clear plan (soft red).
- Empty state: one sentence + button to Explore.

### 5.7 Forms (Contact, Admin)
- Label above field, helper text below, error text in red with an icon, `role="alert"` for errors.
- Required fields marked. Validate on blur and on submit.
- Contact form: short privacy line under the button; optional pre-filled place from `?place=`.

### 5.8 FAQ (new)
- Accordion, 6-8 questions: best time to visit, what to wear at temples, getting around Wadduwa, money and cards, safety, opening hours accuracy.
- Admin-editable text (reuse the page content editor).

### 5.9 Feedback and states
| State | Pattern |
|---|---|
| Loading | Skeleton cards, not a blank page |
| Empty | Icon, one sentence, one button |
| Error | Plain message + Retry (NFR-9) |
| Success | Small toast, bottom centre, `w-[calc(100vw-2rem)] max-w-md` |
| Destructive | Confirmation modal before delete or clear |

### 5.10 Footer
- Brand blurb, quick links, categories, contact details, privacy link, "Planning only, no bookings" note.

---

## 6. Page blueprints

**Home:** hero -> Why DayTripGO (with real counters) -> category tiles -> Featured escapes -> How it works -> All places preview -> FAQ teaser -> footer.
**Explore:** hero -> filter pills (All + categories) -> place grid -> popup.
**Place detail:** photos -> details -> map -> add to plan -> nearby places.
**My Day Plan:** hero -> map + list -> clear/share/print.
**Contact:** hero -> form + company details (+ privacy note).
**FAQ:** hero -> accordion.
**Admin:** sidebar layout, dashboard counters, Attractive Places table, page editors, messages inbox.

---

## 7. Interaction and motion

- Hover: 150-200 ms. Card lift and image zoom only.
- Carousel auto-glide: stop on touch, hover or any manual action (already built).
- Use `prefers-reduced-motion`: turn off auto-glide, video autoplay and parallax.
- Page change: scroll to top; keep focus on the main heading.
- Max 2 animated things on screen at once.

---

## 8. Accessibility (add to SRS as an NFR)

- All images have meaningful `alt`; decorative images use `alt=""`.
- Keyboard: every control reachable by Tab, visible focus ring, Esc closes modals and drawers.
- Touch targets at least 44 x 44 px.
- Headings in order (one H1 per page).
- Links have descriptive text (not "click here").
- Forms: labels linked to inputs, errors announced.
- Run Lighthouse Accessibility on every page; target 90+.

---

## 9. Responsive rules

| Width | Behaviour |
|---|---|
| < 640 | 1 column, drawer menu, sticky bottom Add-to-plan bar on detail |
| 640-1023 | 2 columns, drawer menu |
| 1024-1279 | 3 columns, full nav |
| 1280+ | 4-5 columns, full-width layout |

Test at 390, 768, 1280 and 1920 px. No horizontal scroll at any width (already measured on earlier rounds).

---

## 10. Performance budget (NFR-1)

| Item | Budget |
|---|---|
| Hero video | 5 MB max, 720p, with poster |
| Card photo | 300 KB max, resized on upload |
| Hero photo | 400 KB max |
| JS on first load | Under 300 kB gzipped (code-split admin and Leaflet) |
| Fonts | 1 family, 3-4 weights, `display=swap` |

---

## 11. Content and tone

- Warm, short, direct. Example: "Pick places. Build your day. Go."
- Use "day plan", "places", "Add to plan". Do not use "book", "reserve", "buy".
- Show real opening hours as typed by the admin; do not promise they are live.
- Category names are the same everywhere: Religious, Nature, Heritage, Cultural.

---

## 12. Checklist before submission

- [ ] One font used everywhere (public, admin, forms, map popups)
- [ ] Contrast checked on all heroes and footer
- [ ] Hero videos compressed, posters added
- [ ] FAQ, category tiles, "Best for" tags built (or listed as future work)
- [ ] Privacy note on Contact form and footer
- [ ] Meta title and description on every public page
- [ ] Lighthouse: Performance, Accessibility, Best Practices, SEO recorded for NFR evidence
- [ ] SRS updated (new FRs and NFRs for the items above)
- [ ] Screenshots of final pages for the report
