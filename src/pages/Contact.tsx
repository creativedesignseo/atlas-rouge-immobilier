import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { submitContactForm } from '@/services/contact.service'
import { Link } from 'react-router-dom'
import { useLang } from '@/hooks/useLang'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ChevronRight,
  Check,
  ChevronDown,
  MessageCircle,
  Instagram,
  Facebook,
} from 'lucide-react'
import SectionReveal from '@/components/SectionReveal'
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
    subject: 'Achat',
    message: '',
    consent: false,
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const formRef = useRef<HTMLDivElement>(null)
  const infoRef = useRef<HTMLDivElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formState.consent) return
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
    }
  }

  /* Form field stagger animation */
  useGSAP(
    () => {
      if (!formRef.current) return
      gsap.from('.form-field', {
        y: 15,
        opacity: 0,
        duration: 0.5,
        ease: 'power3.out',
        stagger: 0.06,
        scrollTrigger: {
          trigger: formRef.current,
          start: 'top 85%',
          once: true,
        },
      })
    },
    { scope: formRef }
  )

  /* Info block stagger animation */
  useGSAP(
    () => {
      if (!infoRef.current) return
      gsap.from('.info-block', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: {
          trigger: infoRef.current,
          start: 'top 85%',
          once: true,
        },
      })
    },
    { scope: infoRef }
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
            <h1 className="font-playfair text-[36px] md:text-[48px] font-medium text-midnight leading-[1.1] tracking-[-0.3px] mb-4">
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
              <h3 className="font-playfair text-[24px] font-medium text-midnight mb-6">
                {t('form.title')}
              </h3>

              {submitted ? (
                <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-5">
                  <Check size={22} className="text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-inter text-[15px] font-medium text-green-800 mb-1">
                      {t('form.successTitle')}
                    </p>
                    <p className="font-inter text-[14px] text-green-700">
                      {t('form.successText')}
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="form-field">
                    <label className="block font-inter text-[13px] font-medium text-text-primary mb-1.5">
                      {t('form.name')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formState.name}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, name: e.target.value }))
                      }
                      className="w-full h-12 px-4 border border-border-warm rounded-lg font-inter text-[14px] focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/20 transition-colors"
                      placeholder={t('form.namePlaceholder')}
                    />
                  </div>

                  <div className="form-field">
                    <label className="block font-inter text-[13px] font-medium text-text-primary mb-1.5">
                      {t('form.email')} *
                    </label>
                    <input
                      type="email"
                      required
                      value={formState.email}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, email: e.target.value }))
                      }
                      className="w-full h-12 px-4 border border-border-warm rounded-lg font-inter text-[14px] focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/20 transition-colors"
                      placeholder={t('form.emailPlaceholder')}
                    />
                  </div>

                  <div className="form-field">
                    <label className="block font-inter text-[13px] font-medium text-text-primary mb-1.5">
                      {t('form.phone')}
                    </label>
                    <input
                      type="tel"
                      value={formState.phone}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, phone: e.target.value }))
                      }
                      className="w-full h-12 px-4 border border-border-warm rounded-lg font-inter text-[14px] focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/20 transition-colors"
                      placeholder={t('form.phonePlaceholder')}
                    />
                  </div>

                  <div className="form-field">
                    <label className="block font-inter text-[13px] font-medium text-text-primary mb-1.5">
                      {t('form.subject')} *
                    </label>
                    <select
                      value={formState.subject}
                      onChange={(e) =>
                        setFormState((s) => ({
                          ...s,
                          subject: e.target.value,
                        }))
                      }
                      className="w-full h-12 px-4 border border-border-warm rounded-lg font-inter text-[14px] focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/20 transition-colors bg-white"
                    >
                      <option value="buy">{t('form.subject')}</option>
                      <option value="sell">Vente</option>
                      <option value="rent">Location</option>
                      <option value="estimate">Estimation</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label className="block font-inter text-[13px] font-medium text-text-primary mb-1.5">
                      {t('form.message')} *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formState.message}
                      onChange={(e) =>
                        setFormState((s) => ({
                          ...s,
                          message: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 border border-border-warm rounded-lg font-inter text-[14px] focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/20 transition-colors resize-none"
                      placeholder={t('form.messagePlaceholder')}
                    />
                  </div>

                  <div className="form-field flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="consent"
                      checked={formState.consent}
                      onChange={(e) =>
                        setFormState((s) => ({
                          ...s,
                          consent: e.target.checked,
                        }))
                      }
                      className="mt-1 w-4 h-4 accent-terracotta"
                    />
                    <label
                      htmlFor="consent"
                      className="font-inter text-[13px] text-text-secondary leading-[1.5]"
                    >
                      {t('form.consent')}
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={!formState.consent || submitting}
                    className="form-field w-full h-12 bg-terracotta text-white font-inter text-[14px] font-semibold rounded-lg hover:scale-[1.01] active:scale-[0.99] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? t('form.sending') : t('form.send')}
                  </button>
                </form>
              )}
            </div>

            {/* ── Right: Contact Info ── */}
            <div ref={infoRef} className="md:w-[40%]">
              <h3 className="font-playfair text-[24px] font-medium text-midnight mb-8">
                {t('info.title') || 'Nos coordonnées'}
              </h3>

              <div className="space-y-6">
                <div className="info-block flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-cream-warm flex items-center justify-center shrink-0">
                    <MapPin size={20} className="text-terracotta" />
                  </div>
                  <div>
                    <p className="font-inter text-[12px] font-medium text-text-secondary uppercase tracking-[0.3px] mb-0.5">
                      {t('info.address')}
                    </p>
                    <p className="font-inter text-[15px] text-text-primary">
                      {settings?.address || '123 Boulevard Mohamed VI, Guéliz'}
                      <br />
                      {settings?.city_postal || '40000 Marrakech, Maroc'}
                    </p>
                  </div>
                </div>

                <div className="info-block flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-cream-warm flex items-center justify-center shrink-0">
                    <Phone size={20} className="text-terracotta" />
                  </div>
                  <div>
                    <p className="font-inter text-[12px] font-medium text-text-secondary uppercase tracking-[0.3px] mb-0.5">
                      {t('info.phone')}
                    </p>
                    <a
                      href={`tel:${(settings?.phone || '+212524000000').replace(/\s/g, '')}`}
                      className="font-inter text-[15px] text-text-primary hover:text-terracotta transition-colors"
                    >
                      {settings?.phone || '+212 524 00 00 00'}
                    </a>
                  </div>
                </div>

                <div className="info-block flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-cream-warm flex items-center justify-center shrink-0">
                    <MessageCircle size={20} className="text-terracotta" />
                  </div>
                  <div>
                    <p className="font-inter text-[12px] font-medium text-text-secondary uppercase tracking-[0.3px] mb-0.5">
                      WhatsApp
                    </p>
                    <a
                      href={`https://wa.me/${(settings?.whatsapp || '+212600000000').replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-inter text-[15px] text-text-primary hover:text-terracotta transition-colors"
                    >
                      {settings?.whatsapp || '+212 600 00 00 00'}
                    </a>
                  </div>
                </div>

                <div className="info-block flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-cream-warm flex items-center justify-center shrink-0">
                    <Mail size={20} className="text-terracotta" />
                  </div>
                  <div>
                    <p className="font-inter text-[12px] font-medium text-text-secondary uppercase tracking-[0.3px] mb-0.5">
                      {t('info.email')}
                    </p>
                    <a
                      href={`mailto:${settings?.email || 'contact@atlasrouge.immo'}`}
                      className="font-inter text-[15px] text-text-primary hover:text-terracotta transition-colors"
                    >
                      {settings?.email || 'contact@atlasrouge.immo'}
                    </a>
                  </div>
                </div>

                <div className="info-block flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-cream-warm flex items-center justify-center shrink-0">
                    <Clock size={20} className="text-terracotta" />
                  </div>
                  <div>
                    <p className="font-inter text-[12px] font-medium text-text-secondary uppercase tracking-[0.3px] mb-0.5">
                      {t('info.hours')}
                    </p>
                    <p className="font-inter text-[15px] text-text-primary">
                      {settings?.hours_weekday || t('info.hoursValue')}
                      <br />
                      {settings?.hours_saturday || ''}
                    </p>
                  </div>
                </div>

                {/* Social links */}
                <div className="info-block pt-4 border-t border-border-warm">
                  <p className="font-inter text-[12px] font-medium text-text-secondary uppercase tracking-[0.3px] mb-3">
                    {t('info.followUs') || 'Suivez-nous'}
                  </p>
                  <div className="flex items-center gap-3">
                    <a
                      href={settings?.instagram_url || '#'}
                      className="w-10 h-10 rounded-lg bg-cream-warm flex items-center justify-center hover:bg-terracotta hover:text-white text-text-secondary transition-colors"
                      aria-label="Instagram"
                    >
                      <Instagram size={18} />
                    </a>
                    <a
                      href={settings?.facebook_url || '#'}
                      className="w-10 h-10 rounded-lg bg-cream-warm flex items-center justify-center hover:bg-terracotta hover:text-white text-text-secondary transition-colors"
                      aria-label="Facebook"
                    >
                      <Facebook size={18} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ MAP ═══════ */}
      <section className="bg-midnight h-[400px] relative flex items-center justify-center overflow-hidden">
        {/* Decorative map pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="white"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Decorative circles for roads */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[300px] h-[300px] rounded-full border border-white/10 absolute" />
          <div className="w-[500px] h-[500px] rounded-full border border-white/5 absolute" />
          <div className="w-[200px] h-[200px] rounded-full border border-terracotta/20 absolute" />
        </div>

        {/* Center pin */}
        <div className="relative z-10 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-terracotta flex items-center justify-center shadow-lg">
            <MapPin size={24} className="text-white" />
          </div>
          <p className="font-playfair text-[18px] text-white mb-1">
            {settings?.company_name || 'Atlas Rouge Immobilier'}
          </p>
          <p className="font-inter text-[13px] text-white/60">
            {settings?.address || '123 Boulevard Mohamed VI, Marrakech'}
          </p>
        </div>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <section className="bg-cream-warm py-16 md:py-20">
        <div className="max-w-[720px] mx-auto px-6 lg:px-12">
          <SectionReveal y={30}>
            <h3 className="font-playfair text-[28px] font-medium text-midnight text-center mb-8">
              {t('faq.title')}
            </h3>
          </SectionReveal>

          <SectionReveal className="space-y-3" stagger={0.06} y={15}>
            <AccordionItem
              question={t('faq.appointment.question')}
              answer={t('faq.appointment.answer', { phone: settings?.phone || '+212 524 00 00 00', whatsapp: settings?.whatsapp || '+212 600 00 00 00' })}
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
