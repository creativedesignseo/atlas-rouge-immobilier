import { useRef, useState } from 'react'
import { submitContactForm } from '@/services/contact.service'
import { Link } from 'react-router-dom'
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

const faqItems = [
  {
    question: 'Comment prendre rendez-vous ?',
    answer:
      'Vous pouvez prendre rendez-vous par t\u00E9l\u00E9phone au +212 524 00 00 00, par WhatsApp au +212 600 00 00 00, ou en remplissant le formulaire de contact ci-dessus. Notre \u00E9quipe vous r\u00E9pond sous 24h.',
  },
  {
    question: 'Est-ce que vous parlez fran\u00E7ais ?',
    answer:
      'Oui, toute notre \u00E9quipe est francophone. Nous sommes sp\u00E9cialis\u00E9s dans l\u2019accompagnement des acheteurs fran\u00E7ais et nous connaissons parfaitement les sp\u00E9cificit\u00E9s du march\u00E9 immobilier marocain.',
  },
  {
    question: 'Puis-je visiter un bien sans me d\u00E9placer ?',
    answer:
      'Absolument. Nous proposons des visites virtuelles en vid\u00E9o live pour la plupart de nos biens. Vous pouvez ainsi visiter en temps r\u00E9el depuis la France, avec un de nos conseillers qui se d\u00E9place sur place.',
  },
  {
    question: 'Quels sont les d\u00E9lais pour acheter ?',
    answer:
      'Le d\u00E9lai moyen entre la premi\u00E8re visite et la signature chez le notaire est de 2 \u00E0 3 mois. Cela d\u00E9pend du type de bien et de la rapidit\u00E9 d\u2019obtention du financement si besoin.',
  },
]

/* ═══════════════════════════════════════════ */
export default function Contact() {
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
            <Link to="/" className="hover:text-terracotta transition-colors">
              Accueil
            </Link>
            <ChevronRight size={14} />
            <span>Contact</span>
          </nav>

          <SectionReveal y={40}>
            <h1 className="font-playfair text-[36px] md:text-[48px] font-medium text-midnight leading-[1.1] tracking-[-0.3px] mb-4">
              Contactez-nous
            </h1>
          </SectionReveal>

          <SectionReveal y={30} delay={0.15}>
            <p className="font-inter text-[16px] text-text-secondary max-w-[560px] mx-auto">
              Notre équipe vous répond sous 24h. Pour une réponse immédiate,
              contactez-nous par téléphone ou WhatsApp.
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
                Envoyez-nous un message
              </h3>

              {submitted ? (
                <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-5">
                  <Check size={22} className="text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-inter text-[15px] font-medium text-green-800 mb-1">
                      Message envoyé !
                    </p>
                    <p className="font-inter text-[14px] text-green-700">
                      Votre message a bien été envoyé. Nous vous répondrons sous
                      24h.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="form-field">
                    <label className="block font-inter text-[13px] font-medium text-text-primary mb-1.5">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      required
                      value={formState.name}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, name: e.target.value }))
                      }
                      className="w-full h-12 px-4 border border-border-warm rounded-lg font-inter text-[14px] focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/20 transition-colors"
                      placeholder="Votre nom"
                    />
                  </div>

                  <div className="form-field">
                    <label className="block font-inter text-[13px] font-medium text-text-primary mb-1.5">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formState.email}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, email: e.target.value }))
                      }
                      className="w-full h-12 px-4 border border-border-warm rounded-lg font-inter text-[14px] focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/20 transition-colors"
                      placeholder="votre@email.com"
                    />
                  </div>

                  <div className="form-field">
                    <label className="block font-inter text-[13px] font-medium text-text-primary mb-1.5">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={formState.phone}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, phone: e.target.value }))
                      }
                      className="w-full h-12 px-4 border border-border-warm rounded-lg font-inter text-[14px] focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/20 transition-colors"
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>

                  <div className="form-field">
                    <label className="block font-inter text-[13px] font-medium text-text-primary mb-1.5">
                      Sujet *
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
                      <option>Achat</option>
                      <option>Vente</option>
                      <option>Location</option>
                      <option>Estimation</option>
                      <option>Autre</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label className="block font-inter text-[13px] font-medium text-text-primary mb-1.5">
                      Message *
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
                      placeholder="Décrivez votre projet..."
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
                      J&#8217;accepte que mes données soient traitées pour être
                      contacté *
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={!formState.consent || submitting}
                    className="form-field w-full h-12 bg-terracotta text-white font-inter text-[14px] font-semibold rounded-lg hover:scale-[1.01] active:scale-[0.99] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Envoi en cours...' : 'Envoyer mon message'}
                  </button>
                </form>
              )}
            </div>

            {/* ── Right: Contact Info ── */}
            <div ref={infoRef} className="md:w-[40%]">
              <h3 className="font-playfair text-[24px] font-medium text-midnight mb-8">
                Nos coordonnées
              </h3>

              <div className="space-y-6">
                <div className="info-block flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-cream-warm flex items-center justify-center shrink-0">
                    <MapPin size={20} className="text-terracotta" />
                  </div>
                  <div>
                    <p className="font-inter text-[12px] font-medium text-text-secondary uppercase tracking-[0.3px] mb-0.5">
                      Adresse
                    </p>
                    <p className="font-inter text-[15px] text-text-primary">
                      123 Boulevard Mohamed VI, Guéliz
                      <br />
                      40000 Marrakech, Maroc
                    </p>
                  </div>
                </div>

                <div className="info-block flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-cream-warm flex items-center justify-center shrink-0">
                    <Phone size={20} className="text-terracotta" />
                  </div>
                  <div>
                    <p className="font-inter text-[12px] font-medium text-text-secondary uppercase tracking-[0.3px] mb-0.5">
                      Téléphone
                    </p>
                    <a
                      href="tel:+212524000000"
                      className="font-inter text-[15px] text-text-primary hover:text-terracotta transition-colors"
                    >
                      +212 524 00 00 00
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
                      href="https://wa.me/212600000000"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-inter text-[15px] text-text-primary hover:text-terracotta transition-colors"
                    >
                      +212 600 00 00 00
                    </a>
                  </div>
                </div>

                <div className="info-block flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-cream-warm flex items-center justify-center shrink-0">
                    <Mail size={20} className="text-terracotta" />
                  </div>
                  <div>
                    <p className="font-inter text-[12px] font-medium text-text-secondary uppercase tracking-[0.3px] mb-0.5">
                      Email
                    </p>
                    <a
                      href="mailto:contact@atlasrouge.immo"
                      className="font-inter text-[15px] text-text-primary hover:text-terracotta transition-colors"
                    >
                      contact@atlasrouge.immo
                    </a>
                  </div>
                </div>

                <div className="info-block flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-cream-warm flex items-center justify-center shrink-0">
                    <Clock size={20} className="text-terracotta" />
                  </div>
                  <div>
                    <p className="font-inter text-[12px] font-medium text-text-secondary uppercase tracking-[0.3px] mb-0.5">
                      Horaires
                    </p>
                    <p className="font-inter text-[15px] text-text-primary">
                      Lun – Ven : 9h – 18h
                      <br />
                      Sam : 10h – 14h
                    </p>
                  </div>
                </div>

                {/* Social links */}
                <div className="info-block pt-4 border-t border-border-warm">
                  <p className="font-inter text-[12px] font-medium text-text-secondary uppercase tracking-[0.3px] mb-3">
                    Suivez-nous
                  </p>
                  <div className="flex items-center gap-3">
                    <a
                      href="#"
                      className="w-10 h-10 rounded-lg bg-cream-warm flex items-center justify-center hover:bg-terracotta hover:text-white text-text-secondary transition-colors"
                      aria-label="Instagram"
                    >
                      <Instagram size={18} />
                    </a>
                    <a
                      href="#"
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
            Atlas Rouge Immobilier
          </p>
          <p className="font-inter text-[13px] text-white/60">
            123 Boulevard Mohamed VI, Marrakech
          </p>
        </div>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <section className="bg-cream-warm py-16 md:py-20">
        <div className="max-w-[720px] mx-auto px-6 lg:px-12">
          <SectionReveal y={30}>
            <h3 className="font-playfair text-[28px] font-medium text-midnight text-center mb-8">
              Questions fréquentes
            </h3>
          </SectionReveal>

          <SectionReveal className="space-y-3" stagger={0.06} y={15}>
            {faqItems.map((item, i) => (
              <AccordionItem
                key={i}
                question={item.question}
                answer={item.answer}
                isOpen={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
              />
            ))}
          </SectionReveal>

          <p className="text-center mt-8">
            <Link
              to="/vendre#faq"
              className="font-inter text-[16px] text-terracotta hover:underline"
            >
              Voir toutes les questions →
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}
