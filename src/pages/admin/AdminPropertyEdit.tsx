import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import PropertyForm from '@/components/admin/PropertyForm'
import { getPropertyForEdit, updateProperty } from '@/services/admin/propertyAdmin.service'
import type { PropertyFormData } from '@/services/admin/propertyAdmin.service'

export default function AdminPropertyEdit() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const { agent } = useAuth()
  const [defaultValues, setDefaultValues] = useState<Partial<PropertyFormData>>()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  useEffect(() => {
    if (!slug) return
    getPropertyForEdit(slug).then((data) => {
      if (data) {
        setDefaultValues(data)
      } else {
        toast.error('Propriété non trouvée')
        navigate('/admin/properties')
      }
      setIsFetching(false)
    })
  }, [slug, navigate])

  const handleSubmit = async (data: PropertyFormData) => {
    if (!slug) return
    setIsLoading(true)
    try {
      await updateProperty(slug, data, agent?.id)
      toast.success('Propriété mise à jour avec succès')
      navigate('/admin/properties')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <PropertyForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        mode="edit"
      />
    </div>
  )
}
