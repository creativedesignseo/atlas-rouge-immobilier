import { useRef, useState } from 'react'
import { Loader2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { getImageUrl } from '@/lib/storage'
import { compressToWebp } from '@/lib/imageCompress'
import { uploadImage } from '@/services/admin/propertyAdmin.service'
import {
  createNeighborhood,
  updateNeighborhood,
  slugify,
  type AdminNeighborhood,
  type NeighborhoodFormData,
} from '@/services/admin/neighborhoodAdmin.service'

interface NeighborhoodFormProps {
  // When provided, the form edits this row; otherwise it creates a new one.
  existing?: AdminNeighborhood | null
  onSaved: () => void
  onCancel: () => void
}

const MAX_INPUT_BYTES = 25 * 1024 * 1024

export default function NeighborhoodForm({ existing, onSaved, onCancel }: NeighborhoodFormProps) {
  const { t } = useTranslation('admin')
  const inputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<NeighborhoodFormData>({
    name: existing?.name ?? '',
    slug: existing?.slug ?? '',
    image: existing?.image ?? '',
    description: existing?.description ?? '',
    subtitle: existing?.subtitle ?? '',
    is_active: existing?.is_active ?? true,
  })
  // Track whether the user manually edited the slug; if not, keep it in sync
  // with the name.
  const [slugTouched, setSlugTouched] = useState(Boolean(existing))
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  function update<K extends keyof NeighborhoodFormData>(key: K, value: NeighborhoodFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleNameChange(name: string) {
    setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }))
  }

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error(t('neighborhoods.form.invalidImage'))
      return
    }
    if (file.size > MAX_INPUT_BYTES) {
      toast.error(t('neighborhoods.form.imageTooLarge'))
      return
    }
    setUploading(true)
    try {
      const compressed = await compressToWebp(file)
      const filename = await uploadImage(compressed, file.name)
      update('image', filename)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('neighborhoods.form.uploadFailed'))
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error(t('neighborhoods.form.nameRequired'))
      return
    }
    if (!form.image) {
      toast.error(t('neighborhoods.form.imageRequired'))
      return
    }
    setSaving(true)
    try {
      if (existing) {
        await updateNeighborhood(existing.id, form)
        toast.success(t('neighborhoods.form.updated'))
      } else {
        await createNeighborhood(form)
        toast.success(t('neighborhoods.form.created'))
      }
      onSaved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('neighborhoods.form.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const inputCls =
    'w-full px-4 py-2.5 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Image */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          {t('neighborhoods.form.image')}
        </label>
        {form.image ? (
          <div className="relative w-full max-w-xs aspect-[3/2] rounded-xl overflow-hidden border border-border-warm">
            <img
              src={getImageUrl(form.image, { width: 480, height: 320, resize: 'cover' })}
              alt={form.name}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => update('image', '')}
              className="absolute top-2 right-2 p-1.5 bg-red-500/80 rounded-lg text-white hover:bg-red-500"
              title={t('neighborhoods.form.removeImage')}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-border-warm rounded-xl p-6 text-center cursor-pointer hover:border-terracotta/50 hover:bg-gray-50 transition-colors max-w-xs"
          >
            <div className="flex flex-col items-center gap-2">
              {uploading ? (
                <Loader2 className="w-7 h-7 text-terracotta animate-spin" />
              ) : (
                <Upload className="w-7 h-7 text-text-secondary" />
              )}
              <p className="text-sm font-medium text-text-primary">
                {uploading ? t('neighborhoods.form.uploading') : t('neighborhoods.form.dropImage')}
              </p>
            </div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = '' }}
          className="hidden"
        />
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          {t('neighborhoods.form.name')}
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => handleNameChange(e.target.value)}
          className={inputCls}
          placeholder={t('neighborhoods.form.namePlaceholder')}
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          {t('neighborhoods.form.slug')}
        </label>
        <input
          type="text"
          value={form.slug}
          onChange={(e) => { setSlugTouched(true); update('slug', slugify(e.target.value)) }}
          className={inputCls}
          placeholder="route-ouarzazate"
        />
        <p className="text-xs text-text-secondary mt-1">{t('neighborhoods.form.slugHint')}</p>
      </div>

      {/* Subtitle */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          {t('neighborhoods.form.subtitle')}
        </label>
        <input
          type="text"
          value={form.subtitle}
          onChange={(e) => update('subtitle', e.target.value)}
          className={inputCls}
          placeholder={t('neighborhoods.form.subtitlePlaceholder')}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          {t('neighborhoods.form.description')}
        </label>
        <textarea
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          rows={3}
          className={inputCls}
          placeholder={t('neighborhoods.form.descriptionPlaceholder')}
        />
      </div>

      {/* Active toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => update('is_active', e.target.checked)}
          className="w-4 h-4 accent-terracotta"
        />
        <span className="text-sm text-text-primary">{t('neighborhoods.form.active')}</span>
      </label>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving || uploading}
          className="flex items-center gap-2 px-5 py-2.5 bg-terracotta text-white font-medium rounded-xl hover:bg-terracotta/90 transition-colors disabled:opacity-50"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          {t('neighborhoods.form.save')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 border border-border-warm text-text-primary font-medium rounded-xl hover:bg-gray-50 transition-colors"
        >
          {t('actions.cancel')}
        </button>
      </div>
    </form>
  )
}
