export type Database = {
  public: {
    Tables: {
      neighborhoods: {
        Row: NeighborhoodRow
        Insert: NeighborhoodInsert
        Update: NeighborhoodUpdate
        Relationships: []
      }
      properties: {
        Row: PropertyRow
        Insert: PropertyInsert
        Update: PropertyUpdate
        Relationships: []
      }
      contact_submissions: {
        Row: ContactSubmissionRow
        Insert: ContactSubmissionInsert
        Update: ContactSubmissionUpdate
        Relationships: []
      }
      favorites: {
        Row: FavoriteRow
        Insert: FavoriteInsert
        Update: FavoriteUpdate
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}

export type NeighborhoodRow = {
  id: string
  name: string
  slug: string
  image: string
  description: string
  subtitle: string
  property_count: number
  created_at: string
}

export type NeighborhoodInsert = Omit<NeighborhoodRow, 'id' | 'created_at'>
export type NeighborhoodUpdate = Partial<NeighborhoodInsert>

export type PropertyRow = {
  id: string
  slug: string
  title: string
  transaction: 'sale' | 'rent'
  type: 'villa' | 'apartment' | 'riad' | 'prestige' | 'land' | 'rooftop'
  neighborhood_id: string | null
  city: string
  price_eur: number
  price_mad: number
  surface: number
  land_surface: number | null
  rooms: number
  bedrooms: number
  bathrooms: number
  price_per_sqm: number
  description: string
  highlights: string[]
  amenities: string[]
  images: string[]
  latitude: number
  longitude: number
  is_featured: boolean
  is_exclusive: boolean
  has_video: boolean
  has_3d_tour: boolean
  created_at: string
}

export type PropertyInsert = Omit<PropertyRow, 'id' | 'created_at'>
export type PropertyUpdate = Partial<PropertyInsert>

export type ContactSubmissionRow = {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string
  message: string
  property_slug: string | null
  created_at: string
}

export type ContactSubmissionInsert = Omit<ContactSubmissionRow, 'id' | 'created_at'>
export type ContactSubmissionUpdate = Partial<ContactSubmissionInsert>

export type FavoriteRow = {
  id: string
  user_id: string
  property_slug: string
  created_at: string
}

export type FavoriteInsert = Omit<FavoriteRow, 'id' | 'created_at'>
export type FavoriteUpdate = Partial<FavoriteInsert>
