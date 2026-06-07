import { useEffect, useRef, useState } from 'react'
import mapboxgl, { MAPBOX_STYLE, canUseWebGL, hasMapboxToken } from '@/lib/mapbox'
import { MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Property } from '@/data/properties'

/**
 * Mapa de ubicación de una propiedad — Mapbox GL (estilo Standard, 2D plano).
 * Vive en su propio chunk (lazy import desde PropertyDetail) para evitar
 * cargar ~1 MB de JS si el usuario no llega a verlo above the fold.
 */
export default function LocationMap({ property }: { property: Property }) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [mapError, setMapError] = useState(false)
  const { t } = useTranslation('property')

  useEffect(() => {
    if (!mapContainer.current) return
    if (!hasMapboxToken || !canUseWebGL()) {
      setMapError(true)
      return
    }

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: MAPBOX_STYLE,
        center: [property.longitude, property.latitude],
        zoom: 14,
        pitch: 0,
        interactive: true,
        attributionControl: false,
      })
    } catch (error) {
      console.error('Failed to initialize property detail map:', error)
      setMapError(true)
      map.current = null
      return
    }

    map.current.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      'bottom-right',
    )
    map.current.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      'top-right',
    )
    map.current.on('error', (event) => {
      console.error('Property detail map error:', event.error)
    })

    const el = document.createElement('div')
    el.innerHTML = `<div style="width: 80px; height: 80px; background: rgba(179,90,61,0.2); border: 2px solid #B35A3D; border-radius: 50%; display: flex; align-items: center; justify-content: center;"><div style="width: 12px; height: 12px; background: #B35A3D; border-radius: 50%;"></div></div>`
    const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat([property.longitude, property.latitude])
      .addTo(map.current)

    return () => {
      marker.remove()
      map.current?.remove()
      map.current = null
    }
  }, [property.latitude, property.longitude])

  return (
    <div className="relative w-full h-[320px] sm:h-[400px] rounded-xl overflow-hidden">
      {mapError ? (
        <div className="w-full h-full bg-cream-warm flex items-center justify-center p-6 text-center">
          <div>
            <MapPin size={36} className="mx-auto text-terracotta mb-3" />
            <p className="font-inter text-[15px] font-semibold text-midnight">
              {property.neighborhood}, Marrakech
            </p>
            <p className="font-inter text-[13px] text-text-secondary mt-1">
              {t('exactAddressOnRequest')}
            </p>
          </div>
        </div>
      ) : (
        <div ref={mapContainer} className="w-full h-full" />
      )}
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between pointer-events-none gap-3">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 sm:px-4 shadow-md max-w-[60%]">
          <p className="text-midnight font-inter text-[13px] sm:text-[14px] font-medium truncate">
            {property.neighborhood}, Marrakech
          </p>
          <p className="text-text-secondary text-[11px] sm:text-[12px] font-inter mt-0.5 truncate">
            {t('exactAddressOnRequest')}
          </p>
        </div>
        <button className="bg-terracotta hover:bg-terracotta/90 active:bg-terracotta/80 text-white text-[12px] sm:text-[13px] font-medium px-3 sm:px-4 py-2 rounded-lg transition-colors pointer-events-auto shadow-md whitespace-nowrap">
          {t('getExactAddress')}
        </button>
      </div>
    </div>
  )
}
