-- 006_place_drop_distance_km.sql — drop the distance column.
-- The site no longer shows or stores a distance from Wadduwa: the badge is
-- gone from every card, popup, detail page and day-plan row, and the admin
-- form no longer asks for it. New installs get a table without the column
-- (see 001_create_tables.sql).
-- Idempotent — safe to run on any existing setup.

alter table places drop column if exists distance_km;
