export interface Neighborhood {
  name: string;
  slug: string;
  image: string;
  description: string;
  subtitle: string;
  propertyCount: number;
}

export const neighborhoods: Neighborhood[] = [
  {
    name: 'Gu\u00E9liz',
    slug: 'gueliz',
    image: '/neighborhood-gueliz.jpg',
    description: 'Le c\u0153ur moderne de Marrakech, avec ses boutiques, caf\u00E9s et art d\u00E9co.',
    subtitle: 'Le c\u0153ur moderne',
    propertyCount: 342,
  },
  {
    name: 'Hivernage',
    slug: 'hivernage',
    image: '/neighborhood-hivernage.jpg',
    description: 'Quartier chic aux avenues bord\u00E9es d\u2019arbres, h\u00F4tels de luxe et demeures prestigieuses.',
    subtitle: '\u00C9l\u00E9gance & prestige',
    propertyCount: 156,
  },
  {
    name: 'Palmeraie',
    slug: 'palmeraie',
    image: '/neighborhood-palmeraie.jpg',
    description: 'Oasis verdoyante de 150 000 palmiers, villas de luxe et resorts haut de gamme.',
    subtitle: 'L\u2019oasis verdoyante',
    propertyCount: 198,
  },
  {
    name: 'M\u00E9dina',
    slug: 'medina',
    image: '/neighborhood-medina.jpg',
    description: 'Vieille ville historique class\u00E9e \u00E0 l\u2019UNESCO, riads authentiques et souks anim\u00E9s.',
    subtitle: 'L\u2019\u00E2me de Marrakech',
    propertyCount: 267,
  },
  {
    name: 'Route de l\u2019Ourika',
    slug: 'ourika',
    image: '/neighborhood-ourika.jpg',
    description: 'Vall\u00E9e fertile aux pieds de l\u2019Atlas, id\u00E9ale pour les villas avec vue montagne.',
    subtitle: 'Nature & s\u00E9r\u00E9nit\u00E9',
    propertyCount: 89,
  },
  {
    name: 'Amelkis',
    slug: 'amelkis',
    image: '/neighborhood-amelkis.jpg',
    description: 'Golf resort exclusif avec r\u00E9sidences de luxe et vue imprenable sur l\u2019Atlas.',
    subtitle: 'Golf & vill\u00E9giature',
    propertyCount: 74,
  },
]
