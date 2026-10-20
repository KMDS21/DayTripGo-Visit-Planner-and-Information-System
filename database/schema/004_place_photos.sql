-- ============================================================
-- DayTripGO — 004_place_photos.sql
-- Multiple photos per place (admin uploads up to 10), with one
-- primary photo that is the "card photo" shown on the public cards.
-- Run AFTER 003_place_google_maps_url.sql.
-- ============================================================

create table if not exists public.place_photos (
  photo_id    bigint generated always as identity primary key,
  place_id    integer not null references public.places (place_id) on delete cascade,
  photo_url   text not null,
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (place_id, photo_url)
);

create index if not exists idx_place_photos_place on public.place_photos (place_id);

alter table public.place_photos enable row level security;

-- Public read (cards/detail use places.image_url, but the gallery is public
-- content too); all writes go through the service-role key, which bypasses RLS.
drop policy if exists "place_photos readable by everyone" on public.place_photos;
create policy "place_photos readable by everyone"
  on public.place_photos for select
  using (true);

-- Backfill: each place's current card photo becomes its first gallery photo,
-- so the admin sees every existing image in the picker straight away.
insert into public.place_photos (place_id, photo_url, is_primary)
select p.place_id, p.image_url, true
from public.places p
where p.image_url is not null
  and not exists (
    select 1
    from public.place_photos pp
    where pp.place_id = p.place_id
      and pp.photo_url = p.image_url
  )
on conflict do nothing;
