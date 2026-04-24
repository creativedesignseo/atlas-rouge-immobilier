import { properties } from '../src/data/properties'
import { neighborhoods } from '../src/data/neighborhoods'

function esc(s: string): string {
  return s.replace(/'/g, "''")
}

let sql = `-- ============================================\n`
sql += `-- Seed: neighborhoods\n`
sql += `-- ============================================\n`

for (const n of neighborhoods) {
  sql += `INSERT INTO neighborhoods (name, slug, image, description, subtitle, property_count) VALUES (\n`
  sql += `  '${esc(n.name)}', '${n.slug}', '${n.image}', '${esc(n.description)}', '${esc(n.subtitle)}', ${n.propertyCount}\n`
  sql += `) ON CONFLICT (slug) DO NOTHING;\n`
}

sql += `\n`
sql += `-- ============================================\n`
sql += `-- Seed: properties\n`
sql += `-- ============================================\n`

for (const p of properties) {
  const highlights = p.highlights.map(h => `'${esc(h)}'`).join(', ')
  const amenities = p.amenities.map(a => `'${esc(a)}'`).join(', ')
  const images = p.images.map(i => `'${esc(i)}'`).join(', ')
  const landSurface = p.landSurface !== undefined ? p.landSurface.toString() : 'NULL'

  sql += `INSERT INTO properties (slug, title, transaction, type, city, price_eur, price_mad, surface, land_surface, rooms, bedrooms, bathrooms, price_per_sqm, description, highlights, amenities, images, latitude, longitude, is_featured, is_exclusive, has_video, has_3d_tour, created_at) VALUES (\n`
  sql += `  '${esc(p.slug)}', '${esc(p.title)}', '${p.transaction}', '${p.type}', '${esc(p.city)}', ${p.priceEUR}, ${p.priceMAD}, ${p.surface}, ${landSurface}, ${p.rooms}, ${p.bedrooms}, ${p.bathrooms}, ${p.pricePerSqm}, '${esc(p.description)}', ARRAY[${highlights}], ARRAY[${amenities}], ARRAY[${images}], ${p.latitude}, ${p.longitude}, ${p.isFeatured}, ${p.isExclusive}, ${p.hasVideo}, ${p.has3DTour}, '${p.createdAt}'\n`
  sql += `) ON CONFLICT (slug) DO NOTHING;\n`
}

console.log(sql)
