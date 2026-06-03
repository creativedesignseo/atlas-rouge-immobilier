import { adminRestRequest } from '@/lib/adminRest'
import { invalidate } from '@/lib/queryCache'

// Admin CRUD for the `neighborhoods` table. Public reads live in
// neighborhood.service.ts; this file is admin-only (writes are gated by the
// is_admin() RLS policies added in migration 011).

const NEIGHBORHOODS = '/rest/v1/neighborhoods'

export interface AdminNeighborhood {
  id: string
  name: string
  slug: string
  image: string
  description: string
  subtitle: string
  property_count: number
  is_active: boolean
  created_at: string
}

export interface NeighborhoodFormData {
  name: string
  slug: string
  image: string
  description: string
  subtitle: string
  is_active: boolean
}

/** URL-safe slug from a free-text name (accent-stripped, kebab-case). */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function dropPublicCaches() {
  // The home grid, search filter and hero autocomplete all read the cached
  // public list — drop it so the change shows up without a hard reload.
  invalidate('neighborhoods')
}

/** All neighborhoods incl. inactive (admins only — RLS lets them see all). */
export async function listAdminNeighborhoods(): Promise<AdminNeighborhood[]> {
  return adminRestRequest<AdminNeighborhood[]>(
    `${NEIGHBORHOODS}?select=*&order=name.asc`,
    { method: 'GET' },
  )
}

export async function createNeighborhood(data: NeighborhoodFormData): Promise<AdminNeighborhood> {
  const rows = await adminRestRequest<AdminNeighborhood[]>(`${NEIGHBORHOODS}?select=*`, {
    method: 'POST',
    body: {
      name: data.name,
      slug: data.slug,
      image: data.image,
      description: data.description,
      subtitle: data.subtitle,
      is_active: data.is_active,
      // property_count is maintained by the trigger; new ones start at 0.
    },
  })
  dropPublicCaches()
  return rows[0]
}

export async function updateNeighborhood(
  id: string,
  data: NeighborhoodFormData,
): Promise<AdminNeighborhood> {
  const rows = await adminRestRequest<AdminNeighborhood[]>(
    `${NEIGHBORHOODS}?id=eq.${encodeURIComponent(id)}&select=*`,
    {
      method: 'PATCH',
      body: {
        name: data.name,
        slug: data.slug,
        image: data.image,
        description: data.description,
        subtitle: data.subtitle,
        is_active: data.is_active,
      },
    },
  )
  dropPublicCaches()
  return rows[0]
}

/** Soft delete / restore. */
export async function setNeighborhoodActive(id: string, isActive: boolean): Promise<void> {
  await adminRestRequest(
    `${NEIGHBORHOODS}?id=eq.${encodeURIComponent(id)}`,
    { method: 'PATCH', body: { is_active: isActive }, returnRepresentation: false },
  )
  dropPublicCaches()
}

/** Hard delete. Only safe when no properties reference it (count 0); the FK is
 *  ON DELETE SET NULL, but we still guard in the UI to avoid orphaning. */
export async function deleteNeighborhood(id: string): Promise<void> {
  await adminRestRequest(
    `${NEIGHBORHOODS}?id=eq.${encodeURIComponent(id)}`,
    { method: 'DELETE', returnRepresentation: false },
  )
  dropPublicCaches()
}
