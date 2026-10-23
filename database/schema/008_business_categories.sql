-- ============================================================
-- DayTripGO — 008_business_categories.sql
-- Admin-managed tag list for business listings (Restaurant,
-- Hotel, Vehicle Rental, …). Separate from `categories`,
-- which stays the tourist-attraction list (Religious/Nature/…).
-- Idempotent — safe to run on any existing setup.
-- ============================================================

create table if not exists business_categories (
    category_id   serial      primary key,
    category_name varchar(50) not null unique
);

-- RLS: the backend uses the service_role key (bypasses RLS). Enable it so
-- anon/public keys cannot read or write the tag list directly.
alter table business_categories enable row level security;
