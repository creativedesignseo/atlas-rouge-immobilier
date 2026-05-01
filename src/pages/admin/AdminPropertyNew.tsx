import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import PropertyForm from '@/components/admin/PropertyForm'
import { createProperty } from '@/services/admin/propertyAdmin.service'
import type { PropertyFormData } from '@/services/admin/propertyAdmin.service'

export default function AdminPropertyNew() {
  const navigate = useNavigate()
  const { t } = useTranslation('admin')
  const { agent } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: PropertyFormData) => {
    setIsLoading(true)
    try {
      await createProperty(data, agent?.id)
      toast.success(t('propertyEdit.createSuccess'))
      navigate('/admin/properties')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('propertyEdit.createError'))
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <PropertyForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        mode="create"
      />
    </div>
  )
}
