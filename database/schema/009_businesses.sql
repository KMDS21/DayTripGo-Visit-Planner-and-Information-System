-- ============================================================
-- DayTripGO — 009_businesses.sql
-- Business listings published by business owners (restaurants,
-- hotels, vehicle rentals, …). Mirrors `places` where useful but
-- stays a separate entity: an owner may only touch their own rows.
-- New listings start unpublished — an admin must approve them
-- (same publish switch pattern as places, migration 005).
-- Idempotent — safe to run on any existing setup.
-- ============================================================

create table if not exists businesses (
    business_id     serial        primary key,
    owner_id        integer       not null references business_owners (owner_id) on delete cascade,
    name            varchar(150)  not null,
    description     text          not null,
    opening_hours   varchar(100),
    phone           varchar(30),
    email           varchar(150),
    address         varchar(255),
    website_url     text,
    google_maps_url text,
    image_url       text,
    -- Approval switch: hidden from the public until an admin publishes it.
    published       boolean       not null default false,
    created_at      timestamptz   not null default now(),
    updated_at      timestamptz   not null default now()
);

create index if not exists idx_businesses_owner on businesses (owner_id);
create index if not exists idx_businesses_published on businesses (published);

-- Tags — a business may carry several (e.g. Hotel + Vehicle Rental).
create table if not exists business_tags (
    business_id  integer not null references businesses (business_id) on delete cascade,
    category_id  integer not null references business_categories (category_id) on delete cascade,
    primary key (business_id, category_id)
);

create index if not exists idx_business_tags_category on business_tags (category_id);

-- RLS: the backend uses the service_role key (bypasses RLS). Enable it so
-- anon/public keys cannot read or write these tables directly.
alter table businesses    enable row level security;
alter table business_tags enable row level security;
