import { useState, useRef } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { uploadAvatar } from '@/services/auth.service'
import { toast } from 'sonner'

interface AvatarUploadProps {
  userId: string
  name: string | null
  email: string
  currentUrl: string | null
  onUpload: (url: string) => void
}

export default function AvatarUpload({ userId, name, email, currentUrl, onUpload }: AvatarUploadProps) {
  const { t } = useTranslation('admin')
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error(t('avatar.selectImage'))
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('avatar.tooLarge'))
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    setIsUploading(true)
    const { url, error } = await uploadAvatar(file, userId)
    setIsUploading(false)

    URL.revokeObjectURL(objectUrl)

    if (error || !url) {
      toast.error(`${t('avatar.uploadError')}: ${error || 'Unknown error'}`)
      setPreview(currentUrl)
      return
    }

    setPreview(url)
    onUpload(url)
    toast.success(t('avatar.uploadSuccess'))
  }

  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : email.slice(0, 2).toUpperCase()

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg cursor-pointer group"
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img
            src={preview}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-midnight flex items-center justify-center text-white text-2xl font-bold">
            {initials}
          </div>
        )}

        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {isUploading ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Camera className="w-6 h-6 text-white" />
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="text-sm text-terracotta hover:text-terracotta/80 font-medium transition-colors disabled:opacity-50"
      >
        {isUploading ? 'Téléchargement...' : 'Changer la photo'}
      </button>
    </div>
  )
}
