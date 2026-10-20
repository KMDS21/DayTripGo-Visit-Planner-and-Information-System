-- ============================================================
-- DayTripGO — 002_seed_places.sql
-- Run AFTER 001_seed_categories.sql
-- ≥10 verified places within 25 km of Wadduwa (proposal Table 2).
-- Distances = approximate road distances from Wadduwa town centre.
-- Location = one Google Maps link per place (schema 003 replaced the old
-- latitude/longitude columns); the optional links live in
-- 003_seed_google_maps_links.sql — run that after schema 003 to give every
-- seeded place a working Google Maps link on its public card.
-- image_url left NULL — add real photos via Admin → Places.
-- ============================================================

-- Default administrator account (username: admin / password: DayTripGO@2026)
-- CHANGE THIS PASSWORD after first login. Hash generated with bcrypt (cost 10).
insert into admins (username, password_hash) values
    ('admin', '$2b$10$tWXkUC/J6fhuI5Cc1Jjyd.8Fn28.l7AjIcNgL6p0LJzzAe0sYm7A6')
on conflict (username) do nothing;

insert into places
    (name, category_id, description, opening_hours, travel_tips,
     distance_km, image_url, created_by)
values
    ('Panadura Beach', 2,
     'A quiet sandy beach near Panadura town, a short trip north along the coastal road and railway line. Popular with local families at sunset and a good spot for an early-morning walk.',
     'Open all day',
     'Best visited early morning or late afternoon. Roadside stalls sell short eats; no lifeguard on duty — take care when swimming.',
     7.0, null),

    ('Bolgoda Lake', 2,
     'The largest freshwater lake in Sri Lanka, stretching between the Colombo South and Kalutara districts. Renowned for boat rides, bird watching and quiet waterfront scenery.',
     'Open all day (boat rides 7:00 AM - 5:00 PM)',
     'Take a guided boat ride from the Piliyandala side for the best bird watching. Bring binoculars; mornings are calmest on the water.',
     14.0, null),

    ('Kalutara Bodhiya', 1,
     'A famous Buddhist shrine beside the Kalu Ganga in Kalutara, noted for its white stupa said to be the only completely hollow stupa in the world, built on the site of an earlier Portuguese fort.',
     '5:30 AM - 8:00 PM daily',
     'Dress modestly (shoulders and knees covered). Remove shoes before climbing. The adjacent bo tree is one of the 32 saplings from the Sri Maha Bodhi in Anuradhapura.',
     11.0, null),

    ('Richmond Castle', 4,
     'A colonial-era mansion (c. 1896) set in 42 acres of gardens in Kalutara district, blending local and Western architectural styles. Built by a wealthy planter and open to the public today.',
     '9:00 AM - 5:00 PM daily',
     'A caretaker shows the ground floor and shares the history of the estate. Combine with a visit to the nearby Kalutara Bodhiya.',
     12.0, null),

    ('Kalutara Beach', 2,
     'A tranquil beach beside Kalutara town, close to the Kalutara Bodhiya. Calm stretches of sand suitable for a relaxing break between other sights.',
     'Open all day',
     'Shade is limited — carry water and sun protection. Pair with the Bodhiya and the lagoon-side stalls for fresh fish.',
     11.0, null),

    ('Beruwala (Barberyn) Lighthouse', 3,
     'A 19th-century lighthouse standing on Barberyn Island off Beruwala, guarding the southern approaches of the west coast. Offers panoramic coastal views from the lantern gallery.',
     '8:00 AM - 5:00 PM (visits by arrangement)',
     'Access is by a short boat ride to the island; confirm visiting times with the keepers beforehand. Not suitable during heavy swell.',
     19.0, null),

    ('Brief Garden (Bevis Bawa)', 4,
     'A beautifully landscaped garden estate near Dedduwa designed by Bevis Bawa, one of Sri Lanka''s best-known artists and landscape architects, with sculptures, art and mature tropical plantings.',
     '8:00 AM - 5:00 PM daily',
     'Allow about an hour for the gardens. Photography of the house interior may need permission. Quiet paths can be slippery after rain.',
     21.0, null),

    ('Kande Viharaya', 1,
     'An ancient Buddhist temple in Aluthgama renowned for its colourful murals, intricate carvings and a large seated Buddha statue overlooking the town.',
     '7:00 AM - 6:30 PM daily',
     'Dress modestly and remove shoes at the shrine. The upper terrace gives views over Aluthgama and the Bentota river mouth.',
     22.0, null),

    ('Thudugala Ella (Kalutara)', 2,
     'A small waterfall in Thudugala village, Dodangoda, surrounded by forest estate land. A peaceful nature stop with shallow pools and shaded walking paths.',
     '6:00 AM - 6:00 PM daily',
     'Rocks are slippery — take care near the falls. Visit after rain for the best flow, but avoid during very heavy monsoon downpours.',
     23.0, null),

    ('Sapphire Natural Pool (Magical Sapphire)', 2,
     'A natural rock pool near Thudugala enhanced with a constructed bathing pond, known for its clear water. A popular local swimming spot inland from the Kalutara coast.',
     '7:00 AM - 5:00 PM daily',
     'Bring a change of clothes if you plan to bathe. The access path is through estate land — wear sturdy footwear.',
     20.0, null);
