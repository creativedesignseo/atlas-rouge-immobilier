import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { Save, ArrowLeft, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import ImageUploader from './ImageUploader'
import { getNeighborhoods } from '@/services/neighborhood.service'
import type { Neighborhood } from '@/data/neighborhoods'

const propertySchema = z.object({
  title: z.string().min(5, 'Le titre doit faire au moins 5 caractères').max(100),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Le slug ne doit contenir que des lettres minuscules, chiffres et tirets'),
  transaction: z.enum(['sale', 'rent']),
  type: z.enum(['villa', 'apartment', 'riad', 'prestige', 'land', 'rooftop']),
  neighborhood_id: z.string().nullable(),
  city: z.string().min(1, 'Ville requise'),
  price_eur: z.number().min(1, 'Prix requis'),
  price_mad: z.number().min(1, 'Prix requis'),
  surface: z.number().min(1, 'Surface requise'),
  land_surface: z.number().nullable(),
  rooms: z.number().min(0),
  bedrooms: z.number().min(0),
  bathrooms: z.number().min(0),
  price_per_sqm: z.number().min(0),
  description: z.string().min(50, 'La description doit faire au moins 50 caractères'),
  highlights: z.array(z.string()),
  amenities: z.array(z.string()),
  images: z.array(z.string()).min(1, 'Au moins une image est requise'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  is_featured: z.boolean(),
  is_exclusive: z.boolean(),
  has_video: z.boolean(),
  has_3d_tour: z.boolean(),
})

type PropertyFormValues = z.infer<typeof propertySchema>

const transactionOptions = [
  { value: 'sale', label: 'Vente' },
  { value: 'rent', label: 'Location' },
]

const typeOptions = [
  { value: 'villa', label: 'Villa' },
  { value: 'apartment', label: 'Appartement' },
  { value: 'riad', label: 'Riad' },
  { value: 'prestige', label: 'Prestige' },
  { value: 'land', label: 'Terrain' },
  { value: 'rooftop', label: 'Rooftop' },
]

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
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([])
  const [highlightInput, setHighlightInput] = useState('')

  const {
    register,
    handleSubmit,
    control,
    watch,
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

  const handleFormSubmit = handleSubmit(async (data) => {
    try {
      await onSubmit(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde')
    }
  })

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
          Retour à la liste
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
          {mode === 'create' ? 'Créer la propriété' : 'Enregistrer les modifications'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left column - form fields */}
        <div className="lg:col-span-3 space-y-6">
          {/* Basic info */}
          <div className="bg-white rounded-2xl p-6 shadow-card border border-border-warm space-y-5">
            <h3 className="font-semibold text-text-primary">Informations de base</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Titre <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('title')}
                  className="w-full px-4 py-2.5 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors"
                  placeholder="Villa contemporaine à la Palmeraie"
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('slug')}
                  className="w-full px-4 py-2.5 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors"
                  placeholder="villa-contemporaine-palmeraie"
                />
                {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Ville <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('city')}
                  className="w-full px-4 py-2.5 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Transaction <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('transaction')}
                  className="w-full px-4 py-2.5 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors bg-white"
                >
                  {transactionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('type')}
                  className="w-full px-4 py-2.5 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors bg-white"
                >
                  {typeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Quartier
                </label>
                <select
                  {...register('neighborhood_id')}
                  className="w-full px-4 py-2.5 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors bg-white"
                >
                  <option value="">-- Sélectionner --</option>
                  {neighborhoods.map((n) => (
                    <option key={n.slug} value={n.slug}>{n.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-2xl p-6 shadow-card border border-border-warm space-y-5">
            <h3 className="font-semibold text-text-primary">Prix et surface</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Prix EUR <span className="text-red-500">*</span>
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
                  Prix MAD <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  {...register('price_mad', { valueAsNumber: true })}
                  className="w-full px-4 py-2.5 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Prix/m² (auto)
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
                  Surface (m²) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  {...register('surface', { valueAsNumber: true })}
                  className="w-full px-4 py-2.5 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Surface terrain (m²)
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
            <h3 className="font-semibold text-text-primary">Pièces</h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Pièces</label>
                <input
                  type="number"
                  {...register('rooms', { valueAsNumber: true })}
                  className="w-full px-4 py-2.5 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Chambres</label>
                <input
                  type="number"
                  {...register('bedrooms', { valueAsNumber: true })}
                  className="w-full px-4 py-2.5 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Salles de bain</label>
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
            <h3 className="font-semibold text-text-primary">Description</h3>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('description')}
                rows={6}
                className="w-full px-4 py-2.5 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors resize-none"
                placeholder="Décrivez la propriété en détail..."
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>

            {/* Highlights */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Points forts</label>
              <div className="flex gap-2 mb-2">
                <input
                  value={highlightInput}
                  onChange={(e) => setHighlightInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addHighlight() } }}
                  className="flex-1 px-4 py-2.5 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors"
                  placeholder="Ex: Piscine privée"
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
              <label className="block text-sm font-medium text-text-primary mb-2">Équipements</label>
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
                      <span className="text-sm">{amenity}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl p-6 shadow-card border border-border-warm space-y-5">
            <h3 className="font-semibold text-text-primary">Localisation</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Latitude</label>
                <input
                  type="number"
                  step="0.000001"
                  {...register('latitude', { valueAsNumber: true })}
                  className="w-full px-4 py-2.5 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Longitude</label>
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
            <h3 className="font-semibold text-text-primary">Options</h3>

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
                    <span className="text-sm">Propriété mise en avant</span>
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
                    <span className="text-sm">Exclusivité</span>
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
                    <span className="text-sm">Vidéo disponible</span>
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
                    <span className="text-sm">Visite 3D</span>
                  </label>
                )}
              />
            </div>
          </div>
        </div>

        {/* Right column - images */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-6 shadow-card border border-border-warm sticky top-6">
            <h3 className="font-semibold text-text-primary mb-4">
              Images <span className="text-red-500">*</span>
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
