-- ============================================================
-- DayTripGO — 001_create_tables.sql
-- Data Tier: PostgreSQL (Supabase)
-- Entities: Category, Admin, Place, VisitPlan, VisitPlanItem
-- Aligns with SRS §6 (v2.1) and Appendix B.4 ERD.
-- Run order: schema first, then seeds.
-- ============================================================

-- 1. Categories ------------------------------------------------

create table if not exists categories (
    category_id   serial       primary key,
    category_name varchar(50)  not null unique
);

-- 2. Administrators -------------------------------------------

create table if not exists admins (
    admin_id      serial       primary key,
    username      varchar(50)  not null unique,
    password_hash text         not null,
    created_at    timestamptz  not null default now()
);

-- 3. Places ---------------------------------------------------

create table if not exists places (
    place_id      serial        primary key,
    name          varchar(150)  not null,
    category_id   integer       not null references categories (category_id),
    description   text          not null,
    opening_hours varchar(100),
    travel_tips   text,
    distance_km   decimal(4,1)  not null check (distance_km >= 0),
    latitude      decimal(9,6)  not null check (latitude between -90 and 90),
    longitude     decimal(9,6)  not null check (longitude between -180 and 180),
    image_url     text,
    created_by    integer       references admins (admin_id),
    created_at    timestamptz   not null default now(),
    updated_at    timestamptz   not null default now()
);

create index if not exists idx_places_category on places (category_id);

-- 4. Visit plans (session-based — no tourist account, SRS NFR-7) --

create table if not exists visit_plans (
    plan_id     serial       primary key,
    session_id  varchar(120),
    plan_title  varchar(100) not null default 'My One-Day Plan',
    created_at  timestamptz  not null default now()
);

-- 5. Visit plan items (join entity + visit order, SRS FR-13) ----

create table if not exists visit_plan_items (
    item_id     serial    primary key,
    plan_id     integer   not null references visit_plans (plan_id) on delete cascade,
    place_id    integer   not null references places (place_id)    on delete cascade,
    visit_order integer   not null,
    unique (plan_id, place_id)
);

-- Row Level Security: the backend uses the service_role key,
-- which bypasses RLS. Enable RLS so anon/public keys cannot
-- read or write these tables directly.
alter table categories       enable row level security;
alter table admins           enable row level security;
alter table places           enable row level security;
alter table visit_plans      enable row level security;
alter table visit_plan_items enable row level security;
