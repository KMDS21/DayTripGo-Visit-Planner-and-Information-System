-- 003_place_google_maps_url.sql
-- Replaces the manual latitude/longitude coordinates with ONE optional
-- Google Maps link per place. The admin pastes a Google Maps URL instead of
-- typing numbers; the backend derives latitude/longitude FROM THAT LINK at
-- read time (map embeds, route map, place cards), so the columns themselves
-- are no longer needed.
--
-- Run this in the Supabase SQL editor (same as 001 and 002).
-- IDEMPOTENT: safe to run on a database where the earlier version of this
-- script was already applied (it only touches columns that still exist).

-- 1. The link the admin pastes.
alter table public.places add column if not exists google_maps_url text;

-- 2. The coordinate columns are gone — derived from the link at read time.
alter table public.places drop column if exists latitude;
alter table public.places drop column if exists longitude;

comment on column public.places.google_maps_url is
  'Google Maps place URL pasted by the admin; latitude/longitude are parsed from it at read time.';
