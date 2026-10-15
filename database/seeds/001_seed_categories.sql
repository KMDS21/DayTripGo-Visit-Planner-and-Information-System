-- ============================================================
-- DayTripGO — 001_seed_categories.sql
-- Run AFTER schema/001_create_tables.sql
-- ============================================================

insert into categories (category_name) values
    ('Religious'),
    ('Nature'),
    ('Heritage'),
    ('Cultural')
on conflict (category_name) do nothing;
