import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import PropertyForm from '@/components/admin/PropertyForm'
import { createProperty } from '@/services/admin/propertyAdmin.service'
import type { PropertyFormData } from '@/services/admin/propertyAdmin.service'

export default function AdminPropertyNew() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: PropertyFormData) => {
    setIsLoading(true)
    try {
      await createProperty(data)
      toast.success('Propriété créée avec succès')
      navigate('/admin/properties')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création')
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
