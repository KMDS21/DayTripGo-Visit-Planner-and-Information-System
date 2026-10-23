-- ============================================================
-- DayTripGO — 007_business_owners.sql
-- Business owner accounts: the third actor alongside tourists
-- (no account) and administrators (admins table).
-- Idempotent — safe to run on any existing setup.
-- ============================================================

create table if not exists business_owners (
    owner_id      serial       primary key,
    full_name     varchar(100) not null,
    email         varchar(150) not null unique,
    phone         varchar(30),
    username      varchar(50)  not null unique,
    password_hash text         not null,
    bio           text,
    created_at    timestamptz  not null default now(),
    updated_at    timestamptz  not null default now()
);

create index if not exists idx_business_owners_email on business_owners (email);

-- RLS: the backend uses the service_role key (bypasses RLS). Enable it so
-- anon/public keys cannot read or write owner accounts directly.
alter table business_owners enable row level security;
