-- ============================================================
-- DayTripGO — 003_seed_google_maps_links.sql (OPTIONAL)
-- Run AFTER schema/003_place_google_maps_url.sql (needs the
-- google_maps_url column) — safe to re-run: it never overwrites a
-- link an admin has already set (google_maps_url is null guard).
--
-- Gives the 10 proposal places their Google Maps links (the same
-- coordinates the proposal dataset used), so every public place card
-- immediately shows its mini Google map and "Map ↗" link.
-- ============================================================

update places set google_maps_url = 'https://www.google.com/maps?q=6.693000,79.960000'
 where name = 'Panadura Beach' and google_maps_url is null;

update places set google_maps_url = 'https://www.google.com/maps?q=6.715000,80.010000'
 where name = 'Bolgoda Lake' and google_maps_url is null;

update places set google_maps_url = 'https://www.google.com/maps?q=6.556000,79.966000'
 where name = 'Kalutara Bodhiya' and google_maps_url is null;

update places set google_maps_url = 'https://www.google.com/maps?q=6.530000,79.940000'
 where name = 'Richmond Castle' and google_maps_url is null;

update places set google_maps_url = 'https://www.google.com/maps?q=6.548000,79.955000'
 where name = 'Kalutara Beach' and google_maps_url is null;

update places set google_maps_url = 'https://www.google.com/maps?q=6.433000,79.980000'
 where name = 'Beruwala (Barberyn) Lighthouse' and google_maps_url is null;

update places set google_maps_url = 'https://www.google.com/maps?q=6.405000,80.000000'
 where name = 'Brief Garden (Bevis Bawa)' and google_maps_url is null;

update places set google_maps_url = 'https://www.google.com/maps?q=6.435000,79.975000'
 where name = 'Kande Viharaya' and google_maps_url is null;

update places set google_maps_url = 'https://www.google.com/maps?q=6.510000,79.940000'
 where name = 'Thudugala Ella (Kalutara)' and google_maps_url is null;

update places set google_maps_url = 'https://www.google.com/maps?q=6.505000,79.935000'
 where name = 'Sapphire Natural Pool (Magical Sapphire)' and google_maps_url is null;
