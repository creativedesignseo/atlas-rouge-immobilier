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
      site_settings: {
        Row: SiteSettingRow
        Insert: SiteSettingInsert
        Update: SiteSettingUpdate
        Relationships: []
      }
      agents: {
        Row: AgentRow
        Insert: AgentInsert
        Update: AgentUpdate
        Relationships: []
      }
      blog_posts: {
        Row: BlogPostRow
        Insert: BlogPostInsert
        Update: BlogPostUpdate
        Relationships: []
      }
      blog_post_translations: {
        Row: BlogPostTranslationRow
        Insert: BlogPostTranslationInsert
        Update: BlogPostTranslationUpdate
        Relationships: []
      }
      estimation_requests: {
        Row: EstimationRequestRow
        Insert: EstimationRequestInsert
        Update: EstimationRequestUpdate
        Relationships: []
      }
      newsletter_subscribers: {
        Row: NewsletterSubscriberRow
        Insert: NewsletterSubscriberInsert
        Update: NewsletterSubscriberUpdate
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
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
  price_on_request: boolean
  agent_id: string | null
  created_at: string
  // Multilingual fields
  title_en: string | null
  title_fr: string | null
  title_es: string | null
  description_en: string | null
  description_fr: string | null
  description_es: string | null
  highlights_en: string[]
  highlights_fr: string[]
  highlights_es: string[]
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
  assigned_to_agent_id: string | null
  status: 'new' | 'in_progress' | 'closed'
  created_at: string
}

export type ContactSubmissionInsert = Omit<ContactSubmissionRow, 'id' | 'created_at'>
export type ContactSubmissionUpdate = Partial<ContactSubmissionInsert>

export type FavoriteRow = {
  id: string
  user_id: string | null
  property_slug: string
  anonymous_id: string | null
  created_at: string
}

export type FavoriteInsert = Omit<FavoriteRow, 'id' | 'created_at'>
export type FavoriteUpdate = Partial<FavoriteInsert>

export type SiteSettingRow = {
  id: string
  key: string
  value: string
  updated_at: string
}

export type SiteSettingInsert = Omit<SiteSettingRow, 'id' | 'updated_at'>
export type SiteSettingUpdate = Partial<SiteSettingInsert>

export type AgentRow = {
  id: string
  user_id: string
  email: string
  name: string | null
  phone: string | null
  photo_url: string | null
  bio: string | null
  role: 'admin' | 'agent'
  is_active: boolean
  created_at: string
}

export type AgentInsert = Omit<AgentRow, 'id' | 'created_at'>
export type AgentUpdate = Partial<AgentInsert>

// ============================================================================
// Blog (003_blog.sql)
// ============================================================================

export type BlogPostRow = {
  id: string
  slug: string
  status: 'draft' | 'published'
  cover_image: string | null
  category: 'buying' | 'investment' | 'neighborhoods' | 'taxation' | 'decoration' | 'market'
  read_time_min: number
  author_id: string | null
  guest_author: string | null
  published_at: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export type BlogPostInsert = Partial<Pick<BlogPostRow, 'id' | 'created_by'>> &
  Omit<BlogPostRow, 'id' | 'created_at' | 'updated_at' | 'created_by'>

export type BlogPostUpdate = Partial<BlogPostInsert>

export type BlogPostTranslationRow = {
  id: string
  post_id: string
  locale: 'fr' | 'es' | 'en'
  title: string
  excerpt: string | null
  content: unknown | null
  seo_title: string | null
  seo_description: string | null
  created_at: string
  updated_at: string
}

export type BlogPostTranslationInsert = Omit<BlogPostTranslationRow, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
}
export type BlogPostTranslationUpdate = Partial<BlogPostTranslationInsert>

// ============================================================================
// Leads (004_leads.sql) — estimation requests + newsletter subscribers
// ============================================================================

export type EstimationRequestRow = {
  id: string
  name: string
  phone: string
  email: string | null
  preferred_date: string | null
  property_address: string | null
  notes: string | null
  source_lang: string | null
  status: 'new' | 'contacted' | 'scheduled' | 'closed'
  assigned_to_agent_id: string | null
  created_at: string
}

export type EstimationRequestInsert = Partial<Pick<EstimationRequestRow, 'id' | 'status' | 'assigned_to_agent_id'>> &
  Omit<EstimationRequestRow, 'id' | 'status' | 'assigned_to_agent_id' | 'created_at'>

export type EstimationRequestUpdate = Partial<EstimationRequestInsert>

export type NewsletterSubscriberRow = {
  id: string
  email: string
  source_lang: string | null
  source_page: string | null
  confirmed: boolean
  unsubscribed_at: string | null
  created_at: string
}

export type NewsletterSubscriberInsert = Partial<Pick<NewsletterSubscriberRow, 'id' | 'confirmed' | 'unsubscribed_at'>> &
  Omit<NewsletterSubscriberRow, 'id' | 'confirmed' | 'unsubscribed_at' | 'created_at'>

export type NewsletterSubscriberUpdate = Partial<NewsletterSubscriberInsert>
