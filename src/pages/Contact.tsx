import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { submitContactForm } from '@/services/contact.service'
import { Link } from 'react-router-dom'
import { useLang } from '@/hooks/useLang'
import { EMAIL, INSTAGRAM_URL, PHONE_NUMBER, PHONE_NUMBER_DISPLAY, TIKTOK_URL } from '@/lib/contact'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  Phone,
  Mail,
  Clock,
  ChevronRight,
  Check,
  ChevronDown,
} from 'lucide-react'
import { InstagramIcon, TikTokIcon } from '@/components/icons/SocialIcons'
import SectionReveal from '@/components/SectionReveal'
import PhoneField from '@/components/forms/PhoneField'
import { useSiteSettings } from '@/hooks/useSiteSettings'

gsap.registerPlugin(ScrollTrigger)

/* ─── Accordion item ─── */
function AccordionItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="border border-border-warm rounded-lg bg-white overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-cream-warm/50 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="font-inter text-[15px] font-medium text-text-primary pr-4">
          {question}
        </span>
        <ChevronDown
          size={20}
          className={`text-text-secondary shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-5 pb-5">
          <p className="font-inter text-[14px] text-text-secondary leading-[1.7]">
            {answer}
          </p>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════ */
export default function Contact() {
  const { t } = useTranslation('contact')
  const { t: tc } = useTranslation('common')
  const { path } = useLang()
  const { settings } = useSiteSettings()

  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    // Must match a <select> option value below ('buy'), not a French label,
    // or the stored lead gets subject='Achat' while the UI shows 'buy'.
    subject: 'buy',
    message: '',
    consent: false,
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const formRef = useRef<HTMLDivElement>(null)
  const infoRef = useRef<HTMLDivElement>(null)

  // Error visible cuando el usuario olvida marcar el consentimiento
  // o cuando Supabase devuelve error. Antes era un early return mudo.
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    if (!formState.consent) {
      setSubmitError(t('form.consentRequired'))
      return
    }
    setSubmitting(true)
    const result = await submitContactForm({
      name: formState.name,
      email: formState.email,
      phone: formState.phone,
      subject: formState.subject,
      message: formState.message,
    })
    setSubmitting(false)
    if (result.success) {
      setSubmitted(true)
    } else {
      setSubmitError(result.error || t('form.errorGeneric'))
    }
  }

  /* Form field stagger animation — usa fromTo para garantizar estado final
     incluso si ScrollTrigger no se dispara (bug crítico que dejaba el form
     invisible en móvil). */
  useGSAP(
    () => {
      if (!formRef.current) return
      const fields = formRef.current.querySelectorAll('.form-field')
      if (!fields.length) return
      gsap.fromTo(
        fields,
        { y: 15, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: 'power3.out',
          stagger: 0.06,
          scrollTrigger: {
            trigger: formRef.current,
            start: 'top 90%',
            once: true,
          },
        },
      )
    },
    { scope: formRef },
  )

  /* Info block stagger animation — mismo fix */
  useGSAP(
    () => {
      if (!infoRef.current) return
      const blocks = infoRef.current.querySelectorAll('.info-block')
      if (!blocks.length) return
      gsap.fromTo(
        blocks,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: {
            trigger: infoRef.current,
            start: 'top 90%',
            once: true,
          },
        },
      )
    },
    { scope: infoRef },
  )

  return (
    <div>
      {/* ═══════ PAGE HEADER ═══════ */}
      <section className="bg-cream-warm pt-16 md:pt-20 pb-12 md:pb-12">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12 text-center">
          <nav className="flex items-center justify-center gap-2 mb-6 text-text-secondary font-inter text-[13px]">
            <Link to={path('/')} className="hover:text-terracotta transition-colors">
              {tc('home')}
            </Link>
            <ChevronRight size={14} />
            <span>{t('title')}</span>
          </nav>

          <SectionReveal y={40}>
            <h1 className="font-display text-[36px] md:text-[48px] font-medium text-midnight leading-[1.1] tracking-[-0.3px] mb-4">
              {t('title')}
            </h1>
          </SectionReveal>

          <SectionReveal y={30} delay={0.15}>
            <p className="font-inter text-[16px] text-text-secondary max-w-[560px] mx-auto">
              {t('subtitle')}
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* ═══════ FORM + INFO ═══════ */}
      <section className="bg-white py-12 md:py-20">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-12">
          <div className="flex flex-col-reverse md:flex-row gap-12 md:gap-16">
            {/* ── Left: Form ── */}
            <div ref={formRef} className="md:w-[60%]">
              <h3 className="font-display text-[24px] font-medium text-midnight mb-6">
                {t('form.title')}
              </h3>

              {submitted ? (
                <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-6">
                  <Check size={24} className="text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-inter text-[16px] font-semibold text-green-800 mb-1">
                      {t('form.successTitle')}
                    </p>
                    <p className="font-inter text-[14px] text-green-700">
                      {t('form.successText')}
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  {/* Mensaje primero — protagonista del form (layout Idealista) */}
                  <div className="form-field">
                    <label className="block font-inter text-[14px] font-semibold text-text-primary mb-2">
                      {t('form.message')} <span className="text-terracotta">*</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formState.message}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, message: e.target.value }))
                      }
                      className="w-full px-4 py-3.5 border-2 border-border-warm rounded-xl font-inter text-[15px] text-text-primary placeholder:text-text-secondary/60 focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/15 transition-colors resize-none"
                      placeholder={t('form.messagePlaceholder')}
                    />
                  </div>

                  {/* Email full-width */}
                  <div className="form-field">
                    <label className="block font-inter text-[14px] font-semibold text-text-primary mb-2">
                      {t('form.email')} <span className="text-terracotta">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formState.email}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, email: e.target.value }))
                      }
                      className="w-full h-[52px] px-4 border-2 border-border-warm rounded-xl font-inter text-[15px] text-text-primary placeholder:text-text-secondary/60 focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/15 transition-colors"
                      placeholder={t('form.emailPlaceholder')}
                    />
                  </div>

                  {/* Teléfono + Nombre en una fila (lado a lado en sm+) */}
                  <div className="form-field grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-inter text-[14px] font-semibold text-text-primary mb-2">
                        {t('form.phone')}
                      </label>
                      <PhoneField
                        value={formState.phone}
                        onChange={(v) => setFormState((s) => ({ ...s, phone: v }))}
                        placeholder={t('form.phonePlaceholder')}
                        size="lg"
                      />
                    </div>
                    <div>
                      <label className="block font-inter text-[14px] font-semibold text-text-primary mb-2">
                        {t('form.name')} <span className="text-terracotta">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formState.name}
                        onChange={(e) =>
                          setFormState((s) => ({ ...s, name: e.target.value }))
                        }
                        className="w-full h-[52px] px-4 border-2 border-border-warm rounded-xl font-inter text-[15px] text-text-primary placeholder:text-text-secondary/60 focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/15 transition-colors"
                        placeholder={t('form.namePlaceholder')}
                      />
                    </div>
                  </div>

                  {/* Asunto opcional, compacto (no es el protagonista) */}
                  <div className="form-field">
                    <label className="block font-inter text-[14px] font-semibold text-text-primary mb-2">
                      {t('form.subject')}
                    </label>
                    <select
                      value={formState.subject}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, subject: e.target.value }))
                      }
                      className="w-full h-[52px] px-4 border-2 border-border-warm rounded-xl font-inter text-[15px] text-text-primary focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/15 transition-colors bg-white"
                    >
                      <option value="buy">{t('form.subjects.buy')}</option>
                      <option value="sell">{t('form.subjects.sell')}</option>
                      <option value="rent">{t('form.subjects.rent')}</option>
                      <option value="estimate">{t('form.subjects.estimate')}</option>
                      <option value="other">{t('form.subjects.other')}</option>
                    </select>
                  </div>

                  {/* Política — checkbox grande + texto legible */}
                  <div className={`form-field flex items-start gap-3 ${submitError && !formState.consent ? 'animate-pulse' : ''}`}>
                    <input
                      type="checkbox"
                      id="consent"
                      checked={formState.consent}
                      onChange={(e) => {
                        setFormState((s) => ({ ...s, consent: e.target.checked }))
                        if (e.target.checked) setSubmitError(null)
                      }}
                      className="mt-0.5 w-5 h-5 accent-terracotta cursor-pointer"
                    />
                    <label
                      htmlFor="consent"
                      className="font-inter text-[14px] text-text-secondary leading-[1.55] cursor-pointer"
                    >
                      {t('form.consent')}
                    </label>
                  </div>

                  {/* Error visible — antes el form fallaba en silencio */}
                  {submitError && (
                    <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                      <span className="inline-block w-5 h-5 rounded-full bg-red-500 text-white text-[12px] font-bold leading-[20px] text-center shrink-0">!</span>
                      <p className="font-inter text-[13.5px] text-red-700 leading-snug">
                        {submitError}
                      </p>
                    </div>
                  )}

                  {/* Botón submit — más grande, prominente */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="form-field w-full min-h-[56px] bg-terracotta hover:bg-terracotta/90 active:bg-terracotta/80 text-white font-inter text-[15px] font-semibold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? t('form.sending') : t('form.send')}
                  </button>
                </form>
              )}
            </div>

            {/* ── Right: Contact Info ── */}
            <div ref={infoRef} className="md:w-[40%]">
              <h3 className="font-display text-[24px] font-medium text-midnight mb-8">
                {t('info.title') || 'Nos coordonnées'}
              </h3>

              <div className="space-y-7">
                <div className="info-block flex items-start gap-4">
                  <Phone size={22} strokeWidth={2.25} className="text-terracotta shrink-0 mt-0.5" />
                  <div>
                    <p className="font-inter text-[12px] font-medium text-text-secondary uppercase tracking-[0.3px] mb-1">
                      {t('info.phone')}
                    </p>
                    <a
                      href={`tel:${(settings?.phone || PHONE_NUMBER).replace(/\s/g, '')}`}
                      className="font-inter text-[15px] text-text-primary hover:text-terracotta transition-colors"
                    >
                      {settings?.phone || PHONE_NUMBER_DISPLAY}
                    </a>
                  </div>
                </div>

                <div className="info-block flex items-start gap-4">
                  <Mail size={22} strokeWidth={2.25} className="text-terracotta shrink-0 mt-0.5" />
                  <div>
                    <p className="font-inter text-[12px] font-medium text-text-secondary uppercase tracking-[0.3px] mb-1">
                      {t('info.email')}
                    </p>
                    <a
                      href={`mailto:${settings?.email || EMAIL}`}
                      className="font-inter text-[15px] text-text-primary hover:text-terracotta transition-colors"
                    >
                      {settings?.email || EMAIL}
                    </a>
                  </div>
                </div>

                <div className="info-block flex items-start gap-4">
                  <Clock size={22} strokeWidth={2.25} className="text-terracotta shrink-0 mt-0.5" />
                  <div>
                    <p className="font-inter text-[12px] font-medium text-text-secondary uppercase tracking-[0.3px] mb-1">
                      {t('info.hours')}
                    </p>
                    <p className="font-inter text-[15px] text-text-primary leading-relaxed">
                      {settings?.hours_weekday || t('info.hoursValue')}
                      {settings?.hours_saturday && (
                        <>
                          <br />
                          {settings.hours_saturday}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Social links — sin fondo, solo el icono */}
                <div className="info-block pt-5 border-t border-border-warm">
                  <p className="font-inter text-[12px] font-medium text-text-secondary uppercase tracking-[0.3px] mb-3">
                    {t('info.followUs')}
                  </p>
                  <div className="flex items-center gap-5">
                    <a
                      href={settings?.instagram_url || INSTAGRAM_URL}
                      className="text-text-secondary hover:text-terracotta transition-colors"
                      aria-label="Instagram"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <InstagramIcon size={22} />
                    </a>
                    <a
                      href={settings?.tiktok_url || TIKTOK_URL}
                      className="text-text-secondary hover:text-terracotta transition-colors"
                      aria-label="TikTok"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <TikTokIcon size={22} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <section className="bg-cream-warm py-16 md:py-20">
        <div className="max-w-[720px] mx-auto px-6 lg:px-12">
          <SectionReveal y={30}>
            <h3 className="font-display text-[28px] font-medium text-midnight text-center mb-8">
              {t('faq.title')}
            </h3>
          </SectionReveal>

          <SectionReveal className="space-y-3" stagger={0.06} y={15}>
            <AccordionItem
              question={t('faq.appointment.question')}
              answer={t('faq.appointment.answer', { phone: settings?.phone || PHONE_NUMBER_DISPLAY, whatsapp: settings?.whatsapp || PHONE_NUMBER_DISPLAY })}
              isOpen={openFaq === 0}
              onToggle={() => setOpenFaq(openFaq === 0 ? null : 0)}
            />
            <AccordionItem
              question={t('faq.languages.question')}
              answer={t('faq.languages.answer')}
              isOpen={openFaq === 1}
              onToggle={() => setOpenFaq(openFaq === 1 ? null : 1)}
            />
            <AccordionItem
              question={t('faq.virtualVisit.question')}
              answer={t('faq.virtualVisit.answer')}
              isOpen={openFaq === 2}
              onToggle={() => setOpenFaq(openFaq === 2 ? null : 2)}
            />
            <AccordionItem
              question={t('faq.foreignBuyer.question')}
              answer={t('faq.foreignBuyer.answer')}
              isOpen={openFaq === 3}
              onToggle={() => setOpenFaq(openFaq === 3 ? null : 3)}
            />
          </SectionReveal>

          <p className="text-center mt-8">
            <Link
              to={path('/vendre#faq')}
              className="font-inter text-[16px] text-terracotta hover:underline"
            >
              {t('faq.title')} →
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}
