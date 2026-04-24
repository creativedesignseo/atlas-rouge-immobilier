export const propertyTypes = [
  'Villa',
  'Appartement',
  'Riad',
  'Maison de prestige',
  'Terrain',
  'Rooftop',
] as const

export const neighborhoods = [
  'Gu\u00E9liz',
  'Hivernage',
  'Palmeraie',
  'M\u00E9dina',
  'Agdal',
  'Targa',
  'Amelkis',
  'Route de l\u2019Ourika',
  'Route de F\u00E8s',
  'Route d\u2019Amizmiz',
  'M Avenue',
] as const

export const budgetRanges = [
  { label: 'Moins de 200 000 \u20AC', min: 0, max: 200000 },
  { label: '200 000 \u20AC - 400 000 \u20AC', min: 200000, max: 400000 },
  { label: '400 000 \u20AC - 600 000 \u20AC', min: 400000, max: 600000 },
  { label: '600 000 \u20AC - 1 000 000 \u20AC', min: 600000, max: 1000000 },
  { label: 'Plus de 1 000 000 \u20AC', min: 1000000, max: Infinity },
] as const

export const surfaceRanges = [
  { label: 'Moins de 80 m\u00B2', min: 0, max: 80 },
  { label: '80 - 150 m\u00B2', min: 80, max: 150 },
  { label: '150 - 300 m\u00B2', min: 150, max: 300 },
  { label: '300 - 500 m\u00B2', min: 300, max: 500 },
  { label: 'Plus de 500 m\u00B2', min: 500, max: Infinity },
] as const

export const roomsOptions = [
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
  { label: '5+', value: 5 },
] as const

export const amenitiesList = [
  'Piscine',
  'Jardin',
  'Terrasse',
  'Parking',
  'Climatisation',
  'Chemin\u00E9e',
  'Ascenseur',
  'Balcon',
  'Cuisine \u00E9quip\u00E9e',
  'Domotique',
  'Salle de fitness',
  'Hammam',
  'Tennis',
  'Vue Atlas',
] as const

export const sortOptions = [
  { label: 'Prix croissant', value: 'price-asc' },
  { label: 'Prix d\u00E9croissant', value: 'price-desc' },
  { label: 'Surface croissante', value: 'surface-asc' },
  { label: 'Nouveaut\u00E9s', value: 'newest' },
] as const
