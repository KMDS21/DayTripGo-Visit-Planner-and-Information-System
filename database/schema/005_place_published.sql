-- 005_place_published.sql — per-place publish switch.
-- Unpublished places disappear from the public list (Home, Explore, plan
-- picker); the admin list keeps showing them with Publish/Unpublish buttons.
-- Idempotent — safe to run on any existing setup.

alter table places
    add column if not exists published boolean not null default true;
