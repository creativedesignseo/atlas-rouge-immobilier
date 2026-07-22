import { useTranslation } from 'react-i18next'
import { buildWhatsAppLink } from '@/lib/contact'
import { WhatsAppIcon } from '@/components/icons/SocialIcons'

/**
 * Botón flotante de WhatsApp — visible en todas las páginas públicas
 * (montado en Layout). Es un action-button de marca: el círculo verde es
 * el tratamiento reconocible de WhatsApp (su "logotipo"), no un fondo
 * decorativo arbitrario — por eso sí lleva color, a diferencia de los
 * iconos de contenido, que van sin fondo.
 *
 * Reutiliza buildWhatsAppLink() (número real en lib/contact.ts) y el mismo
 * mensaje pre-rellenado que el CTA del navbar.
 */
export default function FloatingWhatsApp() {
  const { t } = useTranslation('nav')

  return (
    <a
      href={buildWhatsAppLink(t('whatsappMessage'))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('whatsappAria')}
      className="fixed z-40 bottom-5 right-5 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 hover:scale-105 active:scale-95 transition-transform"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
    >
      <WhatsAppIcon size={30} />
    </a>
  )
}
