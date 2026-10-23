-- ============================================================
-- DayTripGO — 004_seed_business_categories.sql
-- Run AFTER schema/008_business_categories.sql
-- The admin-managed tag list owners pick from when adding a business.
-- ============================================================

insert into business_categories (category_name) values
    ('Restaurant'),
    ('Hotel'),
    ('Guest House'),
    ('Cafe'),
    ('Vehicle Rental'),
    ('Taxi Service'),
    ('Shop')
on conflict (category_name) do nothing;
