import { useState, useRef, useCallback } from 'react'
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react'
import { getImageUrl } from '@/lib/storage'
import { uploadImage as uploadToStorage, deleteImage } from '@/services/admin/propertyAdmin.service'
import { toast } from 'sonner'

interface ImageUploaderProps {
  images: string[]
  onChange: (images: string[]) => void
}

export default function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
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
      const isValid = file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024
      if (!isValid) {
        toast.error(`${file.name}: format non valide ou taille > 5MB`)
      }
      return isValid
    })

    if (images.length + validFiles.length > 20) {
      toast.error('Maximum 20 images autorisées')
      return
    }

    setUploading(true)
    const newImages: string[] = []

    for (const file of validFiles) {
      try {
        const filename = await uploadToStorage(file)
        newImages.push(filename)
      } catch {
        toast.error(`Erreur lors de l'upload de ${file.name}`)
      }
    }

    setUploading(false)
    if (newImages.length > 0) {
      onChange([...images, ...newImages])
      toast.success(`${newImages.length} image(s) ajoutée(s)`)
    }
  }, [images, onChange])

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
            {uploading ? 'Téléchargement...' : 'Glissez-déposez des images ici'}
          </p>
          <p className="text-xs text-text-secondary">
            ou cliquez pour sélectionner • JPG, PNG, WebP • Max 5MB
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
                    title="Déplacer à gauche"
                  >
                    ←
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemove(filename, index) }}
                  className="p-1.5 bg-red-500/80 rounded-lg text-white hover:bg-red-500"
                  title="Supprimer"
                >
                  <X size={14} />
                </button>
                {index < images.length - 1 && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleReorder(index, index + 1) }}
                    className="p-1.5 bg-white/20 rounded-lg text-white hover:bg-white/40"
                    title="Déplacer à droite"
                  >
                    →
                  </button>
                )}
              </div>

              {/* First badge */}
              {index === 0 && (
                <div className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-terracotta text-white text-[10px] font-medium rounded-md">
                  Principale
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
          <p className="text-sm">Aucune image ajoutée</p>
        </div>
      )}
    </div>
  )
}
