-- 003_place_google_maps_url.sql
-- Admin-supplied Google Maps link per place (shown as a "Map" link on the
-- public place cards). Coordinates become optional: the backend derives
-- latitude/longitude from the Google Maps URL whenever it contains them, so
-- the admin no longer types coordinates by hand. Places without a usable
-- link simply keep no coordinates (the embedded detail map hides itself).
--
-- Run this in the Supabase SQL editor (same as 001 and 002).

alter table public.places
  add column if not exists google_maps_url text;

-- Latitude/longitude were NOT NULL in 001 — relax that now that they can be
-- derived (check constraints still apply whenever a value is present).
alter table public.places alter column latitude drop not null;
alter table public.places alter column longitude drop not null;

comment on column public.places.google_maps_url is
  'Google Maps place URL pasted by the admin; coordinates are parsed from it when possible.';
