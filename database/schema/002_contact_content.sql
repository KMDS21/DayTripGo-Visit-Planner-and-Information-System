-- ============================================================
-- DayTripGO — 002_contact_content.sql
-- Adds: contact_messages (Contact us responses) and
--       page_content (per-page editable copy for the admin panel).
-- Run order: 001_create_tables.sql first, then this file.
-- Run this once in the Supabase SQL editor.
-- ============================================================

-- 1. Contact us responses -----------------------------------

create table if not exists contact_messages (
    message_id serial       primary key,
    name       varchar(120) not null,
    email      varchar(200) not null,
    phone      varchar(40),
    country    varchar(80),
    city       varchar(80),
    subject    varchar(150) not null default 'General enquiry',
    message    text         not null,
    status     varchar(10)  not null default 'new' check (status in ('new', 'read')),
    read_at    timestamptz,
    created_at timestamptz  not null default now()
);

create index if not exists idx_contact_messages_created
    on contact_messages (created_at desc);
create index if not exists idx_contact_messages_status
    on contact_messages (status);

-- 2. Per-page editable content ------------------------------
-- page_key: home | explore | plan | contact
-- section_key: hero_title, hero_subtitle, ... (client falls back to built-in copy)

create table if not exists page_content (
    page_key    varchar(30)  not null,
    section_key varchar(60)  not null,
    content     text         not null,
    updated_at  timestamptz  not null default now(),
    primary key (page_key, section_key)
);

-- Row Level Security: the backend uses the service_role key which
-- bypasses RLS; anon/public keys must not read or write directly.
alter table contact_messages enable row level security;
alter table page_content     enable row level security;
