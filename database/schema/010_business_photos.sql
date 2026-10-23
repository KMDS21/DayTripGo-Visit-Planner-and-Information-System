-- ============================================================
-- DayTripGO — 010_business_photos.sql
-- Two listing-detail columns added after 009 (the public contact
-- name and the one-line description shown on the Explore card),
-- plus the owner photo gallery: up to 10 photos per business with
-- one Explore card cover (is_primary → businesses.image_url) and
-- one feature card cover (is_featured). Mirrors place_photos from
-- migration 004 so both galleries behave the same way.
-- Idempotent — safe to run on any existing setup.
-- ============================================================

-- ── Extra listing detail ────────────────────────────────────
alter table businesses add column if not exists owner_name       varchar(150);
alter table businesses add column if not exists short_description varchar(160);

-- ── Photo gallery ───────────────────────────────────────────
-- is_primary  → the Explore card cover (kept in sync with
--               businesses.image_url by businessPhotoService).
-- is_featured → the feature card cover; only one row per business.
create table if not exists business_photos (
    photo_id      bigint        generated always as identity primary key,
    business_id   integer       not null references businesses (business_id) on delete cascade,
    photo_url     text          not null,
    is_primary    boolean       not null default false,
    is_featured   boolean       not null default false,
    created_at    timestamptz   not null default now(),
    unique (business_id, photo_url)
);

create index if not exists idx_business_photos_business on business_photos (business_id);

-- RLS: the backend uses the service_role key (bypasses RLS). Enable it so
-- anon/public keys cannot read or write these tables directly.
alter table business_photos enable row level security;
