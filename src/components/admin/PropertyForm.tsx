import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { Save, ArrowLeft, Plus, X, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import ImageUploader from './ImageUploader'
import { getNeighborhoods } from '@/services/neighborhood.service'
import type { Neighborhood } from '@/data/neighborhoods'
import { autoTranslateProperty } from '@/services/translation.service'
import { amenityLabel } from '@/lib/amenities'
import type { SupportedLanguage } from '@/i18n'

const LANGS: SupportedLanguage[] = ['en', 'fr', 'es']
const LANG_LABELS: Record<SupportedLanguage, string> = { en: 'EN', fr: 'FR', es: 'ES' }

// Zod validation messages are emitted in English (the project fallback lng).
// They show in form fields when validation fails — admin-facing. If we want
// per-language messages we'd need to rebuild the schema with t() inside the
// component; English messages are an acceptable trade-off for now.
const propertySchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, digits and dashes'),
  transaction: z.enum(['sale', 'rent']),
  type: z.enum(['villa', 'apartment', 'riad', 'prestige', 'land', 'rooftop']),
  neighborhood_id: z.string().nullable(),
  city: z.string().min(1, 'City required'),
  price_eur: z.number().min(1, 'Price required'),
  price_mad: z.number().min(1, 'Price required'),
  surface: z.number().min(1, 'Surface required'),
  land_surface: z.number().nullable(),
  rooms: z.number().min(0),
  bedrooms: z.number().min(0),
  bathrooms: z.number().min(0),
  price_per_sqm: z.number().min(0),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  highlights: z.array(z.string()),
  amenities: z.array(z.string()),
  images: z.array(z.string()).min(1, 'At least one image is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  is_featured: z.boolean(),
  is_exclusive: z.boolean(),
  has_video: z.boolean(),
  has_3d_tour: z.boolean(),
  // Multilingual fields (optional — filled via translation tabs)
  title_en: z.string().nullable().optional(),
  title_fr: z.string().nullable().optional(),
  title_es: z.string().nullable().optional(),
  description_en: z.string().nullable().optional(),
  description_fr: z.string().nullable().optional(),
  description_es: z.string().nullable().optional(),
  highlights_en: z.array(z.string()).optional(),
  highlights_fr: z.array(z.string()).optional(),
  highlights_es: z.array(z.string()).optional(),
})

type PropertyFormValues = z.infer<typeof propertySchema>

// Option values are stored in the DB; labels resolve via i18n at render.
const transactionOptions = ['sale', 'rent'] as const
const typeOptions = ['villa', 'apartment', 'riad', 'prestige', 'land', 'rooftop'] as const

// Amenity values are stored in the DB in French (the DB language) — they're
// the canonical strings the filter logic compares against. The display label
// is translated via amenities namespace using the slugified value as key.
const amenitiesList = [
  'Piscine', 'Jardin', 'Terrasse', 'Parking', 'Climatisation',
  'Cheminée', 'Sécurité 24/7', 'Concierge', 'Gym', 'Spa',
  'Hamam', 'Cuisine équipée', 'Dressing', 'Bureau', 'Buanderie',
  'Garage', 'Ascenseur', 'Accès PMR', 'Fibre optique', 'Vue sur mer',
  'Vue sur montagne', 'Vue sur piscine', 'Vue sur jardin',
]

interface PropertyFormProps {
  defaultValues?: Partial<PropertyFormValues>
  onSubmit: (data: PropertyFormValues) => Promise<void>
  isLoading?: boolean
  mode: 'create' | 'edit'
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function PropertyForm({ defaultValues, onSubmit, isLoading, mode }: PropertyFormProps) {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation('admin')
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([])
  const [highlightInput, setHighlightInput] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)
  const [highlightInputs, setHighlightInputs] = useState<Record<SupportedLanguage, string>>({ en: '', fr: '', es: '' })

  // Source language for AI translation = admin's current UI language.
  // Falls back to 'fr' (the historical primary content language) if the admin
  // is using a language that's not in our supported set.
  const sourceLang: SupportedLanguage = (() => {
    const ui = i18n.language?.slice(0, 2) as SupportedLanguage
    return LANGS.includes(ui) ? ui : 'fr'
  })()

  // Active tab in the Translations panel (one language shown at a time).
  const [activeLang, setActiveLang] = useState<SupportedLanguage>(sourceLang)

  const {
    register,
    handleSubmit,
    control,
    watch,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      city: 'Marrakech',
      transaction: 'sale',
      type: 'villa',
      rooms: 0,
      bedrooms: 0,
      bathrooms: 0,
      price_per_sqm: 0,
      highlights: [],
      amenities: [],
      images: [],
      latitude: 31.6295,
      longitude: -7.9811,
      is_featured: false,
      is_exclusive: false,
      has_video: false,
      has_3d_tour: false,
      ...defaultValues,
    },
  })

  const title = watch('title')
  const priceEUR = watch('price_eur')
  const surface = watch('surface')
  const highlights = watch('highlights')

  // Auto-generate slug from title
  useEffect(() => {
    if (mode === 'create' && title && !defaultValues?.slug) {
      setValue('slug', slugify(title))
    }
  }, [title, mode, setValue, defaultValues?.slug])

  // Auto-calculate price per sqm
  useEffect(() => {
    if (priceEUR && surface && surface > 0) {
      setValue('price_per_sqm', Math.round(priceEUR / surface))
    }
  }, [priceEUR, surface, setValue])

  // Load neighborhoods
  useEffect(() => {
    getNeighborhoods().then(setNeighborhoods)
  }, [])

  const addHighlight = () => {
    const trimmed = highlightInput.trim()
    if (trimmed && !highlights.includes(trimmed)) {
      setValue('highlights', [...highlights, trimmed])
      setHighlightInput('')
    }
  }

  const removeHighlight = (index: number) => {
    setValue('highlights', highlights.filter((_, i) => i !== index))
  }

  const toggleAmenity = (amenity: string) => {
    const current = watch('amenities') || []
    if (current.includes(amenity)) {
      setValue('amenities', current.filter((a) => a !== amenity))
    } else {
      setValue('amenities', [...current, amenity])
    }
  }

  // Build the source-content payload for the AI translator from form values.
  const buildSourceContent = (values: PropertyFormValues) => {
    const neighborhood = neighborhoods.find((item) => item.slug === values.neighborhood_id)
    return {
      title: (values.title || '').trim(),
      description: (values.description || '').trim(),
      highlights: values.highlights || [],
      amenities: values.amenities || [],
      transaction: values.transaction,
      type: values.type,
      city: values.city,
      neighborhood: neighborhood?.name || '',
      priceEUR: values.price_eur,
      priceMAD: values.price_mad,
      surface: values.surface,
      landSurface: values.land_surface,
      rooms: values.rooms,
      bedrooms: values.bedrooms,
      bathrooms: values.bathrooms,
    }
  }

  // On save: guarantee every language has content. If the agent didn't press
  // the "Auto-translate" button and ES/EN are still empty, generate them with
  // AI before persisting. Mutates `data` in place. Never blocks saving — if the
  // AI call fails we save anyway and the public site falls back to French.
  const ensureTranslationsOnSave = async (data: PropertyFormValues) => {
    const d = data as Record<string, unknown>
    const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
    const arr = (v: unknown) => (Array.isArray(v) ? (v as string[]) : [])
    const sourceTitle = str(data.title)
    const sourceDescription = str(data.description)
    if (!sourceTitle || !sourceDescription) return

    // Seed the source-language columns from the base fields if empty.
    if (!str(d[`title_${sourceLang}`])) d[`title_${sourceLang}`] = sourceTitle
    if (!str(d[`description_${sourceLang}`])) d[`description_${sourceLang}`] = sourceDescription
    if (arr(d[`highlights_${sourceLang}`]).length === 0) d[`highlights_${sourceLang}`] = data.highlights || []

    // Which other languages still need a translation?
    const targets = LANGS.filter((l) => l !== sourceLang).filter(
      (l) => !str(d[`title_${l}`]) || !str(d[`description_${l}`]),
    )
    if (targets.length === 0) return

    const toastId = toast.loading(t('propertyForm.autoTranslating'))
    try {
      const result = await autoTranslateProperty(buildSourceContent(data), sourceLang)
      for (const [lang, content] of Object.entries(result)) {
        if (!targets.includes(lang as SupportedLanguage)) continue
        d[`title_${lang}`] = content.title
        d[`description_${lang}`] = content.description
        d[`highlights_${lang}`] = content.highlights
      }
      toast.success(t('propertyForm.autoTranslateSuccess'), { id: toastId })
    } catch (error) {
      // Don't block the save — fall back to French on the public site.
      toast.error(error instanceof Error ? error.message : t('propertyForm.autoTranslateError'), { id: toastId })
    }
  }

  const handleFormSubmit = handleSubmit(async (data) => {
    try {
      await ensureTranslationsOnSave(data)
      await onSubmit(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('propertyEdit.saveError'))
    }
  })

  const handleAutoTranslate = async () => {
    const values = getValues()
    const title = (values.title || '').trim()
    const description = (values.description || '').trim()
    const sourceHighlights = values.highlights || []

    if (!title || !description) {
      toast.error(t('propertyForm.autoTranslateMissingSource', { lang: sourceLang.toUpperCase() }))
      return
    }

    setIsTranslating(true)
    try {
      const result = await autoTranslateProperty(buildSourceContent(values), sourceLang)

      // Source language gets the original content as-is.
      setValue(`title_${sourceLang}` as keyof PropertyFormValues, title as never)
      setValue(`description_${sourceLang}` as keyof PropertyFormValues, description as never)
      setValue(`highlights_${sourceLang}` as keyof PropertyFormValues, sourceHighlights as never)

      // Other languages get AI translations.
      for (const [lang, content] of Object.entries(result)) {
        const l = lang as SupportedLanguage
        setValue(`title_${l}` as keyof PropertyFormValues, content.title as never)
        setValue(`description_${l}` as keyof PropertyFormValues, content.description as never)
        setValue(`highlights_${l}` as keyof PropertyFormValues, content.highlights as never)
      }
      toast.success(t('propertyForm.autoTranslateSuccess'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('propertyForm.autoTranslateError'))
    } finally {
      setIsTranslating(false)
    }
  }

  const addLangHighlight = (lang: SupportedLanguage) => {
    const val = highlightInputs[lang].trim()
    if (!val) return
    const current = (watch(`highlights_${lang}` as keyof PropertyFormValues) as string[]) || []
    if (!current.includes(val)) {
      setValue(`highlights_${lang}` as keyof PropertyFormValues, [...current, val] as never)
      setHighlightInputs((prev) => ({ ...prev, [lang]: '' }))
    }
  }

  const removeLangHighlight = (lang: SupportedLanguage, index: number) => {
    const current = (watch(`highlights_${lang}` as keyof PropertyFormValues) as string[]) || []
    setValue(`highlights_${lang}` as keyof PropertyFormValues, current.filter((_, i) => i !== index) as never)
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-8">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/admin/properties')}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          {t('propertyForm.backToList')}
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-2.5 bg-terracotta text-white font-medium rounded-xl hover:bg-terracotta/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save size={18} />
          )}
          {mode === 'create' ? t('propertyForm.createSubmit') : t('propertyForm.updateSubmit')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left column - form fields */}
        <div className="lg:col-span-3 space-y-6">
          {/* Basic info */}
          <div className="bg-white rounded-2xl p-6 shadow-card border border-border-warm space-y-5">
            <h3 className="font-semibold text-text-primary">{t('propertyForm.basicInfo')}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  {t('propertyForm.title')} <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('title')}
                  className="w-full px-4 py-2.5 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors"
                  placeholder={t('propertyForm.titlePlaceholder')}
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  {t('propertyForm.slug')} <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('slug')}
                  className="w-full px-4 py-2.5 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors"
                  placeholder={t('propertyForm.slugPlaceholder')}
                />
                {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  {t('propertyForm.city')} <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('city')}
                  className="w-full px-4 py-2.5 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  {t('propertyForm.transaction')} <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('transaction')}
                  className="w-full px-4 py-2.5 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors bg-white"
                >
                  {transactionOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt === 'sale' ? t('properties.badges.sale') : t('properties.badges.rent')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  {t('propertyForm.type')} <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('type')}
                  className="w-full px-4 py-2.5 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors bg-white"
                >
                  {typeOptions.map((opt) => (
                    <option key={opt} value={opt}>{t(`properties.types.${opt}`)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  {t('propertyForm.neighborhood')}
                </label>
                <select
                  {...register('neighborhood_id')}
                  className="w-full px-4 py-2.5 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors bg-white"
                >
                  <option value="">{t('propertyForm.selectOption')}</option>
                  {neighborhoods.map((n) => (
                    <option key={n.slug} value={n.slug}>{n.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-2xl p-6 shadow-card border border-border-warm space-y-5">
            <h3 className="font-semibold text-text-primary">{t('propertyForm.pricingSection')}</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  {t('propertyForm.price')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  {...register('price_eur', { valueAsNumber: true })}
                  className="w-full px-4 py-2.5 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors"
                />
                {errors.price_eur && <p className="text-red-500 text-xs mt-1">{errors.price_eur.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  {t('propertyForm.priceMad')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  {...register('price_mad', { valueAsNumber: true })}
                  className="w-full px-4 py-2.5 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  {t('propertyForm.pricePerSqm')}
                </label>
                <input
                  type="number"
                  {...register('price_per_sqm', { valueAsNumber: true })}
                  readOnly
                  className="w-full px-4 py-2.5 border border-border-warm rounded-xl bg-gray-50 text-text-secondary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  {t('propertyForm.surface')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  {...register('surface', { valueAsNumber: true })}
                  className="w-full px-4 py-2.5 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  {t('propertyForm.landSurface')}
                </label>
                <input
                  type="number"
                  {...register('land_surface', { valueAsNumber: true })}
                  className="w-full px-4 py-2.5 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Rooms */}
          <div className="bg-white rounded-2xl p-6 shadow-card border border-border-warm space-y-5">
            <h3 className="font-semibold text-text-primary">{t('propertyForm.roomsSection')}</h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">{t('propertyForm.rooms')}</label>
                <input
                  type="number"
                  {...register('rooms', { valueAsNumber: true })}
                  className="w-full px-4 py-2.5 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">{t('propertyForm.bedrooms')}</label>
                <input
                  type="number"
                  {...register('bedrooms', { valueAsNumber: true })}
                  className="w-full px-4 py-2.5 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">{t('propertyForm.bathrooms')}</label>
                <input
                  type="number"
                  {...register('bathrooms', { valueAsNumber: true })}
                  className="w-full px-4 py-2.5 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl p-6 shadow-card border border-border-warm space-y-5">
            <h3 className="font-semibold text-text-primary">{t('propertyForm.description')}</h3>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                {t('propertyForm.description')} <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('description')}
                rows={6}
                className="w-full px-4 py-2.5 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors resize-none"
                placeholder={t('propertyForm.descriptionPlaceholder')}
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>

            {/* Highlights */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">{t('propertyForm.highlights')}</label>
              <div className="flex gap-2 mb-2">
                <input
                  value={highlightInput}
                  onChange={(e) => setHighlightInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addHighlight() } }}
                  className="flex-1 px-4 py-2.5 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors"
                  placeholder={t('propertyForm.highlightPlaceholder')}
                />
                <button
                  type="button"
                  onClick={addHighlight}
                  className="px-4 py-2.5 bg-midnight text-white rounded-xl hover:bg-midnight/90 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {highlights.map((h, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-terracotta/10 text-terracotta text-sm rounded-lg"
                  >
                    {h}
                    <button type="button" onClick={() => removeHighlight(i)}>
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">{t('propertyForm.amenities')}</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {amenitiesList.map((amenity) => {
                  const current = watch('amenities') || []
                  const checked = current.includes(amenity)
                  return (
                    <label
                      key={amenity}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-colors ${
                        checked
                          ? 'border-terracotta bg-terracotta/5 text-terracotta'
                          : 'border-border-warm hover:border-terracotta/30'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAmenity(amenity)}
                        className="w-4 h-4 accent-terracotta"
                      />
                      <span className="text-sm">{amenityLabel(amenity, t)}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl p-6 shadow-card border border-border-warm space-y-5">
            <h3 className="font-semibold text-text-primary">{t('propertyForm.location')}</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">{t('propertyForm.latitude')}</label>
                <input
                  type="number"
                  step="0.000001"
                  {...register('latitude', { valueAsNumber: true })}
                  className="w-full px-4 py-2.5 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">{t('propertyForm.longitude')}</label>
                <input
                  type="number"
                  step="0.000001"
                  {...register('longitude', { valueAsNumber: true })}
                  className="w-full px-4 py-2.5 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="bg-white rounded-2xl p-6 shadow-card border border-border-warm space-y-4">
            <h3 className="font-semibold text-text-primary">{t('propertyForm.optionsSection')}</h3>

            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="is_featured"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="w-5 h-5 accent-terracotta"
                    />
                    <span className="text-sm">{t('propertyForm.isFeatured')}</span>
                  </label>
                )}
              />

              <Controller
                name="is_exclusive"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="w-5 h-5 accent-terracotta"
                    />
                    <span className="text-sm">{t('propertyForm.isExclusive')}</span>
                  </label>
                )}
              />

              <Controller
                name="has_video"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="w-5 h-5 accent-terracotta"
                    />
                    <span className="text-sm">{t('propertyForm.hasVideo')}</span>
                  </label>
                )}
              />

              <Controller
                name="has_3d_tour"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="w-5 h-5 accent-terracotta"
                    />
                    <span className="text-sm">{t('propertyForm.has3dTour')}</span>
                  </label>
                )}
              />
            </div>
          </div>
        </div>

        {/* Right column - images + translations */}
        <div className="lg:col-span-2 space-y-6">

          {/* Translations: one big AI button + 3 collapsible cards (one per language) */}
          <div className="bg-white rounded-2xl p-6 shadow-card border border-border-warm">
            <div className="mb-4">
              <h3 className="font-semibold text-text-primary">{t('propertyForm.translations')}</h3>
              <p className="text-xs text-text-secondary mt-1">
                {t('propertyForm.translationsHint', { lang: LANG_LABELS[sourceLang] })}
              </p>
            </div>

            <button
              type="button"
              onClick={handleAutoTranslate}
              disabled={isTranslating}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-terracotta text-white text-sm font-semibold rounded-xl hover:bg-terracotta/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4"
            >
              {isTranslating ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Wand2 size={16} />
              )}
              {isTranslating ? t('propertyForm.autoTranslating') : t('propertyForm.translateAll')}
            </button>

            {/* Language switcher tabs — review/edit the AI translation per language */}
            <div className="flex border border-border-warm rounded-xl overflow-hidden mb-4">
              {LANGS.map((lang) => {
                const active = activeLang === lang
                const hasContent = Boolean(
                  (watch(`title_${lang}` as keyof PropertyFormValues) as string | null) ||
                  (watch(`description_${lang}` as keyof PropertyFormValues) as string | null)
                )
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveLang(lang)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-bold uppercase transition-colors ${
                      active ? 'bg-terracotta text-white' : 'bg-white text-text-primary hover:bg-gray-50'
                    }`}
                  >
                    <span>{LANG_LABELS[lang]}</span>
                    {lang === sourceLang && (
                      <span
                        className={`text-[9px] normal-case font-medium px-1 py-0.5 rounded ${
                          active ? 'bg-white/20 text-white' : 'bg-midnight/10 text-midnight'
                        }`}
                      >
                        {t('propertyForm.sourceLanguage')}
                      </span>
                    )}
                    {hasContent && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white' : 'bg-emerald-500'}`}
                        title={t('propertyForm.filled')}
                      />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Active language fields (RHF keeps the other languages' values) */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  {t('propertyForm.titleLang', { lang: activeLang.toUpperCase() })}
                </label>
                <input
                  {...register(`title_${activeLang}` as keyof PropertyFormValues)}
                  placeholder={t('propertyForm.titleLangPlaceholder', { lang: activeLang.toUpperCase() })}
                  className="w-full px-3 py-2 text-sm border border-border-warm rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  {t('propertyForm.descriptionLang', { lang: activeLang.toUpperCase() })}
                </label>
                <textarea
                  {...register(`description_${activeLang}` as keyof PropertyFormValues)}
                  rows={5}
                  placeholder={t('propertyForm.descriptionLangPlaceholder', { lang: activeLang.toUpperCase() })}
                  className="w-full px-3 py-2 text-sm border border-border-warm rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  {t('propertyForm.highlightsLang', { lang: activeLang.toUpperCase() })}
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    value={highlightInputs[activeLang]}
                    onChange={(e) => setHighlightInputs((p) => ({ ...p, [activeLang]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLangHighlight(activeLang) } }}
                    placeholder={t('propertyForm.highlightLangPlaceholder')}
                    className="flex-1 px-3 py-1.5 text-sm border border-border-warm rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
                  />
                  <button
                    type="button"
                    onClick={() => addLangHighlight(activeLang)}
                    className="p-1.5 bg-terracotta text-white rounded-lg hover:bg-terracotta/90"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {((watch(`highlights_${activeLang}` as keyof PropertyFormValues) as string[]) || []).map((h, i) => (
                    <span key={i} className="flex items-center gap-1 bg-white border border-border-warm text-text-primary text-xs px-2 py-1 rounded-full">
                      {h}
                      <button type="button" onClick={() => removeLangHighlight(activeLang, i)}>
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-2xl p-6 shadow-card border border-border-warm sticky top-6">
            <h3 className="font-semibold text-text-primary mb-4">
              {t('propertyForm.images')} <span className="text-red-500">*</span>
            </h3>
            <Controller
              name="images"
              control={control}
              render={({ field }) => (
                <ImageUploader
                  images={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.images && <p className="text-red-500 text-xs mt-2">{errors.images.message}</p>}
          </div>
        </div>

      </div>
    </form>
  )
}
