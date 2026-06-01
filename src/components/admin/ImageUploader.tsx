import { useState, useRef, useCallback } from 'react'
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import imageCompression from 'browser-image-compression'
import { getImageUrl } from '@/lib/storage'
import { uploadImage as uploadToStorage, deleteImage } from '@/services/admin/propertyAdmin.service'
import { toast } from 'sonner'

// Optimization target: cap the longest side to 2560px (keeps aspect ratio,
// never upscales), re-encode to WebP ~0.82 quality, aiming for <1MB. The
// browser decodes any input format (JPG/PNG/WebP/AVIF) — so this also fixes
// the "AVIF rejected by the bucket" bug: we always upload WebP.
const COMPRESSION_OPTS = {
  maxWidthOrHeight: 2560,
  fileType: 'image/webp' as const,
  initialQuality: 0.82,
  maxSizeMB: 1,
  // Must stay false: with the worker enabled the library tries to load its
  // script from cdn.jsdelivr.net, which our strict CSP (script-src 'self')
  // blocks — breaking every upload. Running on the main thread is fine for the
  // handful of images uploaded at once in the admin.
  useWebWorker: false,
}

// Accept generous input sizes; compression brings them well under 1MB.
const MAX_INPUT_BYTES = 25 * 1024 * 1024

interface ImageUploaderProps {
  images: string[]
  onChange: (images: string[]) => void
}

export default function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const { t } = useTranslation('admin')
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [statusKey, setStatusKey] = useState<'optimizing' | 'uploading'>('uploading')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const processFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const validFiles = Array.from(files).filter((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(t('imageUploader.invalidFormat', { name: file.name }))
        return false
      }
      if (file.size > MAX_INPUT_BYTES) {
        toast.error(t('imageUploader.tooLarge', { name: file.name }))
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    if (images.length + validFiles.length > 20) {
      toast.error(t('imageUploader.maxReached'))
      return
    }

    setUploading(true)
    const newImages: string[] = []

    try {
      for (const file of validFiles) {
        try {
          // Compress + convert to WebP in the browser, then upload the result.
          setStatusKey('optimizing')
          const compressed = await imageCompression(file, COMPRESSION_OPTS)
          setStatusKey('uploading')
          const filename = await uploadToStorage(compressed, file.name)
          newImages.push(filename)
        } catch (err) {
          // One bad file must not block the rest, and must never hang the UI.
          console.error('[ImageUploader] failed for', file.name, err)
          toast.error(t('imageUploader.uploadFailed', { name: file.name }))
        }
      }
    } finally {
      setUploading(false)
    }

    if (newImages.length > 0) {
      onChange([...images, ...newImages])
      toast.success(t('imageUploader.addedCount', { count: newImages.length }))
    }
  }, [images, onChange, t])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    processFiles(e.dataTransfer.files)
  }, [processFiles])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files)
    e.target.value = ''
  }

  const handleRemove = async (filename: string, index: number) => {
    try {
      await deleteImage(filename)
    } catch {
      // Continue even if storage delete fails
    }
    const updated = images.filter((_, i) => i !== index)
    onChange(updated)
  }

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const updated = [...images]
    const [removed] = updated.splice(fromIndex, 1)
    updated.splice(toIndex, 0, removed)
    onChange(updated)
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-terracotta bg-terracotta/5'
            : 'border-border-warm hover:border-terracotta/50 hover:bg-gray-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2">
          {uploading ? (
            <Loader2 className="w-8 h-8 text-terracotta animate-spin" />
          ) : (
            <Upload className="w-8 h-8 text-text-secondary" />
          )}
          <p className="text-sm font-medium text-text-primary">
            {uploading ? t(`imageUploader.${statusKey}`) : t('imageUploader.dropHere')}
          </p>
          <p className="text-xs text-text-secondary">
            {t('imageUploader.orClick')}
          </p>
        </div>
      </div>

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((filename, index) => (
            <div
              key={`${filename}-${index}`}
              className="relative group aspect-square rounded-xl overflow-hidden border border-border-warm bg-gray-100"
            >
              <img
                src={getImageUrl(filename, { width: 200, height: 200 })}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleReorder(index, index - 1) }}
                    className="p-1.5 bg-white/20 rounded-lg text-white hover:bg-white/40"
                    title={t('imageUploader.moveLeft')}
                  >
                    ←
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemove(filename, index) }}
                  className="p-1.5 bg-red-500/80 rounded-lg text-white hover:bg-red-500"
                  title={t('imageUploader.remove')}
                >
                  <X size={14} />
                </button>
                {index < images.length - 1 && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleReorder(index, index + 1) }}
                    className="p-1.5 bg-white/20 rounded-lg text-white hover:bg-white/40"
                    title={t('imageUploader.moveRight')}
                  >
                    →
                  </button>
                )}
              </div>

              {/* First badge */}
              {index === 0 && (
                <div className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-terracotta text-white text-[10px] font-medium rounded-md">
                  {t('imageUploader.primary')}
                </div>
              )}

              {/* Index badge */}
              <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/60 text-white text-[10px] rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-8 text-text-secondary">
          <ImageIcon size={32} />
          <p className="text-sm">{t('imageUploader.noImage')}</p>
        </div>
      )}
    </div>
  )
}
