-- ============================================
-- Seed: neighborhoods
-- ============================================
INSERT INTO neighborhoods (name, slug, image, description, subtitle, property_count) VALUES (
  'Guéliz', 'gueliz', '/neighborhood-gueliz.jpg', 'Le cœur moderne de Marrakech, avec ses boutiques, cafés et art déco.', 'Le cœur moderne', 342
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO neighborhoods (name, slug, image, description, subtitle, property_count) VALUES (
  'Hivernage', 'hivernage', '/neighborhood-hivernage.jpg', 'Quartier chic aux avenues bordées d’arbres, hôtels de luxe et demeures prestigieuses.', 'Élégance & prestige', 156
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO neighborhoods (name, slug, image, description, subtitle, property_count) VALUES (
  'Palmeraie', 'palmeraie', '/neighborhood-palmeraie.jpg', 'Oasis verdoyante de 150 000 palmiers, villas de luxe et resorts haut de gamme.', 'L’oasis verdoyante', 198
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO neighborhoods (name, slug, image, description, subtitle, property_count) VALUES (
  'Médina', 'medina', '/neighborhood-medina.jpg', 'Vieille ville historique classée à l’UNESCO, riads authentiques et souks animés.', 'L’âme de Marrakech', 267
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO neighborhoods (name, slug, image, description, subtitle, property_count) VALUES (
  'Route de l’Ourika', 'ourika', '/neighborhood-ourika.jpg', 'Vallée fertile aux pieds de l’Atlas, idéale pour les villas avec vue montagne.', 'Nature & sérénité', 89
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO neighborhoods (name, slug, image, description, subtitle, property_count) VALUES (
  'Amelkis', 'amelkis', '/neighborhood-amelkis.jpg', 'Golf resort exclusif avec résidences de luxe et vue imprenable sur l’Atlas.', 'Golf & villégiature', 74
) ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- Seed: properties
-- ============================================
INSERT INTO properties (slug, title, transaction, type, city, price_eur, price_mad, surface, land_surface, rooms, bedrooms, bathrooms, price_per_sqm, description, highlights, amenities, images, latitude, longitude, is_featured, is_exclusive, has_video, has_3d_tour, created_at) VALUES (
  'villa-contemporaine-palmeraie', 'Villa contemporaine à la Palmeraie', 'sale', 'villa', 'Marrakech', 850000, 9350000, 320, 1200, 6, 4, 3, 2656, 'Magnifique villa contemporaine située dans le prestigieux quartier de la Palmeraie. Cette propriété d’exception allie architecture moderne et touches marocaines avec des espaces de vie généreux, un jardin luxuriant et une piscine privée.', ARRAY['Piscine privée', 'Jardin paysager', 'Parking 2 voitures'], ARRAY['Piscine', 'Jardin', 'Terrasse', 'Parking', 'Climatisation', 'Cheminée'], ARRAY['/villa-palmeraie-1.jpg', '/villa-palmeraie-2.jpg', '/villa-palmeraie-3.jpg', '/villa-palmeraie-4.jpg', '/villa-palmeraie-5.jpg'], 31.6258, -7.9811, true, true, true, true, '2024-01-15'
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO properties (slug, title, transaction, type, city, price_eur, price_mad, surface, land_surface, rooms, bedrooms, bathrooms, price_per_sqm, description, highlights, amenities, images, latitude, longitude, is_featured, is_exclusive, has_video, has_3d_tour, created_at) VALUES (
  'riad-renove-medina', 'Riad rénové dans la Médina', 'sale', 'riad', 'Marrakech', 420000, 4620000, 180, NULL, 5, 3, 2, 2333, 'Authentique riad entièrement rénové au cœur de la Médina de Marrakech. Zelliges traditionnels, fontaine centrale, patio ensoleillé et terrasse avec vue panoramique sur les toits de la ville rouge.', ARRAY['Terrasse panoramique', 'Zelliges traditionnels', 'Fontaine centrale'], ARRAY['Terrasse', 'Patio', 'Cheminée', 'Climatisation'], ARRAY['/riad-medina-1.jpg', '/riad-medina-2.jpg', '/riad-medina-3.jpg', '/riad-medina-4.jpg', '/riad-medina-5.jpg'], 31.6315, -7.9893, true, false, true, false, '2024-01-10'
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO properties (slug, title, transaction, type, city, price_eur, price_mad, surface, land_surface, rooms, bedrooms, bathrooms, price_per_sqm, description, highlights, amenities, images, latitude, longitude, is_featured, is_exclusive, has_video, has_3d_tour, created_at) VALUES (
  'appartement-haut-standing-gueliz', 'Appartement haut standing à Guéliz', 'sale', 'apartment', 'Marrakech', 295000, 3245000, 95, NULL, 3, 2, 2, 3105, 'Appartement neuf de haut standing dans le quartier moderne de Guéliz. Finitions premium, cuisine équipée, balcon avec vue dégagée et accès à une résidence sécurisée avec ascenseur et parking sous-terrain.', ARRAY['Neuf', 'Résidence sécurisée', 'Parking'], ARRAY['Ascenseur', 'Parking', 'Balcon', 'Climatisation', 'Cuisine équipée'], ARRAY['/apart-gueliz-1.jpg', '/apart-gueliz-2.jpg', '/apart-gueliz-3.jpg', '/apart-gueliz-4.jpg', '/apart-gueliz-5.jpg'], 31.635, -8.0086, true, false, false, false, '2024-01-08'
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO properties (slug, title, transaction, type, city, price_eur, price_mad, surface, land_surface, rooms, bedrooms, bathrooms, price_per_sqm, description, highlights, amenities, images, latitude, longitude, is_featured, is_exclusive, has_video, has_3d_tour, created_at) VALUES (
  'villa-golf-amelkis', 'Villa golf à Amelkis', 'sale', 'villa', 'Marrakech', 1200000, 13200000, 450, 2000, 8, 5, 4, 2667, 'Somptueuse villa sur le golf d’Amelkis avec vue imprenable sur le parcours et les montagnes de l’Atlas. Architecture contemporaine, vastes baies vitrées, piscine à débordement et jardin paysager.', ARRAY['Vue golf', 'Piscine à débordement', 'Vue Atlas'], ARRAY['Piscine', 'Jardin', 'Terrasse', 'Parking', 'Climatisation', 'Salle de fitness'], ARRAY['/villa-golf-1.jpg', '/property-04.jpg', '/villa-palmeraie-2.jpg', '/villa-palmeraie-3.jpg', '/villa-palmeraie-4.jpg'], 31.5833, -7.9333, false, true, true, true, '2024-01-05'
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO properties (slug, title, transaction, type, city, price_eur, price_mad, surface, land_surface, rooms, bedrooms, bathrooms, price_per_sqm, description, highlights, amenities, images, latitude, longitude, is_featured, is_exclusive, has_video, has_3d_tour, created_at) VALUES (
  'maison-prestige-hivernage', 'Maison de prestige à Hivernage', 'sale', 'prestige', 'Marrakech', 1850000, 20350000, 550, 1500, 10, 6, 5, 3364, 'Exceptionnelle demeure de prestige dans le quartier prisé de l’Hivernage. Façade art déco, intérieurs raffinés, jardin à la française, piscine chauffée et dependances pour le personnel.', ARRAY['Façade art déco', 'Piscine chauffée', 'Dépendances'], ARRAY['Piscine', 'Jardin', 'Terrasse', 'Parking', 'Climatisation', 'Domotique'], ARRAY['/prestige-hivernage-1.jpg', '/property-05.jpg', '/villa-palmeraie-1.jpg', '/villa-palmeraie-4.jpg', '/domaine-fes-1.jpg'], 31.6236, -8.0083, false, true, true, false, '2023-12-20'
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO properties (slug, title, transaction, type, city, price_eur, price_mad, surface, land_surface, rooms, bedrooms, bathrooms, price_per_sqm, description, highlights, amenities, images, latitude, longitude, is_featured, is_exclusive, has_video, has_3d_tour, created_at) VALUES (
  'terrain-route-de-lourika', 'Terrain Route de l’Ourika', 'sale', 'land', 'Marrakech', 180000, 1980000, 0, 5000, 0, 0, 0, 36, 'Superbe terrain de 5000 m² avec vue panoramique sur la vallée de l’Ourika et les montagnes de l’Atlas. Emplacement idéal pour construire votre villa de rêve à 20 minutes du centre de Marrakech.', ARRAY['Vue panoramique', 'Borné', 'Accès direct'], ARRAY['Vue Atlas', 'Oliveraie'], ARRAY['/terrain-ourika-1.jpg', '/property-06.jpg', '/hero-marrakech.jpg', '/neighborhood-ourika.jpg', '/terrain-ourika-1.jpg'], 31.4833, -7.9, false, false, false, false, '2024-01-12'
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO properties (slug, title, transaction, type, city, price_eur, price_mad, surface, land_surface, rooms, bedrooms, bathrooms, price_per_sqm, description, highlights, amenities, images, latitude, longitude, is_featured, is_exclusive, has_video, has_3d_tour, created_at) VALUES (
  'villa-minimaliste-route-damizmiz', 'Villa minimaliste Route d’Amizmiz', 'sale', 'villa', 'Marrakech', 650000, 7150000, 280, 3000, 5, 3, 3, 2321, 'Villa d’architecte au style minimaliste sur la route d’Amizmiz. Lignes épurées, matériaux nobles, vastes baies vitrées ouvertes sur la nature et la piscine à débordement.', ARRAY['Architecture d’architecte', 'Piscine à débordement', 'Calme absolu'], ARRAY['Piscine', 'Jardin', 'Terrasse', 'Parking'], ARRAY['/villa-minimaliste-1.jpg', '/villa-palmeraie-2.jpg', '/villa-palmeraie-3.jpg', '/villa-palmeraie-5.jpg', '/property-01.jpg'], 31.55, -8.15, false, false, false, false, '2024-01-03'
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO properties (slug, title, transaction, type, city, price_eur, price_mad, surface, land_surface, rooms, bedrooms, bathrooms, price_per_sqm, description, highlights, amenities, images, latitude, longitude, is_featured, is_exclusive, has_video, has_3d_tour, created_at) VALUES (
  'appartement-rooftop-agdal', 'Appartement avec rooftop à Agdal', 'sale', 'rooftop', 'Marrakech', 340000, 3740000, 120, NULL, 4, 2, 2, 2833, 'Splendide appartement avec rooftop privatif dans le quartier d’Agdal. Grande terrasse aménagée avec vue dégagée, cuisine d’été et espace lounge pour profiter des soirées marrakchies.', ARRAY['Rooftop privatif', 'Vue dégagée', 'Cuisine d’été'], ARRAY['Terrasse', 'Parking', 'Climatisation', 'Cuisine équipée'], ARRAY['/apart-gueliz-2.jpg', '/apart-gueliz-1.jpg', '/apart-gueliz-3.jpg', '/property-03.jpg', '/apart-gueliz-4.jpg'], 31.63, -8.02, false, false, false, false, '2023-12-28'
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO properties (slug, title, transaction, type, city, price_eur, price_mad, surface, land_surface, rooms, bedrooms, bathrooms, price_per_sqm, description, highlights, amenities, images, latitude, longitude, is_featured, is_exclusive, has_video, has_3d_tour, created_at) VALUES (
  'riad-maison-dhotes-a-renover', 'Riad maison d’hôtes à rénover', 'sale', 'riad', 'Marrakech', 380000, 4180000, 250, NULL, 8, 5, 4, 1520, 'Ancien riad maison d’hôtes à rénover en plein cœur de la Médina. Structure solide, patios multiples, potentiel exceptionnel pour projet de chambres d’hôtes ou riad familial.', ARRAY['Patios multiples', 'Potentiel chambres d’hôtes', 'Emplacement privilégié'], ARRAY['Patio', 'Terrasse'], ARRAY['/riad-medina-1.jpg', '/riad-medina-3.jpg', '/property-02.jpg', '/riad-medina-4.jpg', '/riad-medina-5.jpg'], 31.628, -7.987, false, false, false, false, '2023-12-15'
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO properties (slug, title, transaction, type, city, price_eur, price_mad, surface, land_surface, rooms, bedrooms, bathrooms, price_per_sqm, description, highlights, amenities, images, latitude, longitude, is_featured, is_exclusive, has_video, has_3d_tour, created_at) VALUES (
  'domaine-prive-route-de-fes', 'Domaine privé Route de Fès', 'sale', 'prestige', 'Marrakech', 2400000, 26400000, 800, 5000, 12, 7, 6, 3000, 'Domaine d’exception sur la Route de Fès. Cette propriété de luxe dispose de plusieurs villas, piscine olympique, tennis, hammam et jardins à la française dans un parc arboré de 5000 m².', ARRAY['Plusieurs villas', 'Piscine olympique', 'Court de tennis'], ARRAY['Piscine', 'Jardin', 'Terrasse', 'Parking', 'Tennis', 'Hammam'], ARRAY['/domaine-fes-1.jpg', '/prestige-hivernage-1.jpg', '/villa-palmeraie-1.jpg', '/villa-palmeraie-4.jpg', '/property-05.jpg'], 31.65, -7.95, false, true, true, true, '2023-12-10'
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO properties (slug, title, transaction, type, city, price_eur, price_mad, surface, land_surface, rooms, bedrooms, bathrooms, price_per_sqm, description, highlights, amenities, images, latitude, longitude, is_featured, is_exclusive, has_video, has_3d_tour, created_at) VALUES (
  'appartement-neuf-m-avenue', 'Appartement neuf à M Avenue', 'sale', 'apartment', 'Marrakech', 210000, 2310000, 75, NULL, 3, 2, 1, 2800, 'Appartement neuf dans le quartier tendance de M Avenue. Design contemporain, prestations de qualité, balcon et accès aux commerces et restaurants à pied.', ARRAY['Neuf', 'Quartier tendance', 'Commerces à pied'], ARRAY['Balcon', 'Ascenseur', 'Parking', 'Climatisation'], ARRAY['/apart-gueliz-1.jpg', '/apart-gueliz-3.jpg', '/apart-gueliz-5.jpg', '/property-03.jpg', '/apart-gueliz-4.jpg'], 31.64, -8.015, false, false, false, false, '2024-01-14'
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO properties (slug, title, transaction, type, city, price_eur, price_mad, surface, land_surface, rooms, bedrooms, bathrooms, price_per_sqm, description, highlights, amenities, images, latitude, longitude, is_featured, is_exclusive, has_video, has_3d_tour, created_at) VALUES (
  'villa-familiale-targa', 'Villa familiale à Targa', 'sale', 'villa', 'Marrakech', 520000, 5720000, 260, 800, 6, 4, 3, 2000, 'Belle villa familiale dans le quartier résidentiel de Targa. Idéale pour une famille, elle dispose d’un jardin arboré, d’une piscine, de 4 chambres avec dressing et d’un grand salon marocain.', ARRAY['Idéale famille', 'Jardin arboré', 'Salon marocain'], ARRAY['Piscine', 'Jardin', 'Terrasse', 'Parking', 'Climatisation'], ARRAY['/villa-palmeraie-1.jpg', '/villa-palmeraie-2.jpg', '/property-04.jpg', '/villa-golf-1.jpg', '/villa-palmeraie-3.jpg'], 31.66, -8.01, false, false, false, false, '2024-01-01'
) ON CONFLICT (slug) DO NOTHING;


-- ============================================
-- Seed: site_settings
-- ============================================
INSERT INTO site_settings (key, value) VALUES
  ('company_name', 'Atlas Rouge Immobilier'),
  ('agent_name', 'Sophie Martin'),
  ('agent_title', 'Conseillère immobilière'),
  ('phone', '+212 524 00 00 00'),
  ('whatsapp', '+212 600 00 00 00'),
  ('email', 'contact@atlasrouge.immo'),
  ('address', '123 Boulevard Mohamed VI, Guéliz'),
  ('city_postal', '40000 Marrakech, Maroc'),
  ('hours_weekday', 'Lun – Ven : 9h – 18h'),
  ('hours_saturday', 'Sam : 10h – 14h'),
  ('instagram_url', '#'),
  ('facebook_url', '#')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
