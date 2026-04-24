import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calculator,
  UserCheck,
  BadgeCheck,
  Clock,
  Handshake,
  FileText,
  Search,
  Send,
  Phone,
} from 'lucide-react'
import SectionReveal from '@/components/SectionReveal'

const steps = [
  {
    number: '1',
    title: 'Remplissez le formulaire',
    description:
      'Indiquez l\u2019adresse, le type de bien et la surface de votre propri\u00E9t\u00E9.',
    icon: FileText,
  },
  {
    number: '2',
    title: 'Notre agent analyse',
    description:
      'Un expert \u00E9tudie votre bien et compare avec les ventes r\u00E9centes du quartier.',
    icon: Search,
  },
  {
    number: '3',
    title: 'Recevez votre estimation',
    description:
      'Vous obtenez une fourchette de prix pr\u00E9cise sous 24 heures.',
    icon: Send,
  },
]

const trustElements = [
  { icon: BadgeCheck, label: 'Gratuit' },
  { icon: Handshake, label: 'Sans engagement' },
  { icon: Clock, label: 'R\u00E9sultat en 24h' },
]

export default function Estimation() {
  const [onlineForm, setOnlineForm] = useState({
    address: '',
    type: 'appartement',
    surface: '',
  })
  const [expertForm, setExpertForm] = useState({
    name: '',
    phone: '',
    date: '',
  })

  return (
    <div>
      {/* ═══════ HERO ═══════ */}
      <section className="bg-midnight pt-16 md:pt-24 pb-16 md:pb-20">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12 text-center">
          <SectionReveal y={40}>
            <h1 className="font-playfair text-[36px] md:text-[48px] font-medium text-white leading-[1.1] tracking-[-0.3px] mb-4">
              Estimez votre bien à Marrakech
            </h1>
          </SectionReveal>

          <SectionReveal y={30} delay={0.15}>
            <p className="font-inter text-[16px] md:text-[18px] text-white/70 max-w-[600px] mx-auto mb-8">
              Découvrez la valeur de votre propriété en quelques clics. Notre
              expertise du marché local pour une estimation précise.
            </p>
          </SectionReveal>

          {/* Trust badges */}
          <SectionReveal
            className="flex items-center justify-center gap-6 md:gap-10"
            delay={0.3}
            stagger={0.1}
          >
            {trustElements.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 text-white/70"
              >
                <Icon size={20} className="text-terracotta" />
                <span className="font-inter text-[14px]">{label}</span>
              </div>
            ))}
          </SectionReveal>
        </div>
      </section>

      {/* ═══════ TWO CTA CARDS ═══════ */}
      <section className="bg-white py-12 md:py-20">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* ── Online estimation ── */}
            <div className="bg-cream-warm rounded-card p-8">
              <div className="w-12 h-12 rounded-lg bg-terracotta/10 flex items-center justify-center mb-5">
                <Calculator size={24} className="text-terracotta" />
              </div>
              <h2 className="font-playfair text-[24px] font-medium text-midnight mb-2">
                Estimation en ligne
              </h2>
              <p className="font-inter text-[14px] text-text-secondary mb-6">
                Obtenez une première fourchette de prix instantanément.
              </p>

              <form className="space-y-4">
                <div>
                  <label className="block font-inter text-[13px] font-medium text-text-primary mb-1.5">
                    Adresse du bien
                  </label>
                  <input
                    type="text"
                    value={onlineForm.address}
                    onChange={(e) =>
                      setOnlineForm((s) => ({
                        ...s,
                        address: e.target.value,
                      }))
                    }
                    className="w-full h-12 px-4 border border-border-warm rounded-lg font-inter text-[14px] focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/20 transition-colors"
                    placeholder="Quartier, rue..."
                  />
                </div>

                <div>
                  <label className="block font-inter text-[13px] font-medium text-text-primary mb-1.5">
                    Type de bien
                  </label>
                  <select
                    value={onlineForm.type}
                    onChange={(e) =>
                      setOnlineForm((s) => ({ ...s, type: e.target.value }))
                    }
                    className="w-full h-12 px-4 border border-border-warm rounded-lg font-inter text-[14px] focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/20 transition-colors bg-white"
                  >
                    <option value="appartement">Appartement</option>
                    <option value="villa">Villa</option>
                    <option value="riad">Riad</option>
                    <option value="terrain">Terrain</option>
                    <option value="prestige">Maison de prestige</option>
                  </select>
                </div>

                <div>
                  <label className="block font-inter text-[13px] font-medium text-text-primary mb-1.5">
                    Surface (m²)
                  </label>
                  <input
                    type="number"
                    value={onlineForm.surface}
                    onChange={(e) =>
                      setOnlineForm((s) => ({
                        ...s,
                        surface: e.target.value,
                      }))
                    }
                    className="w-full h-12 px-4 border border-border-warm rounded-lg font-inter text-[14px] focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/20 transition-colors"
                    placeholder="Ex: 120"
                  />
                </div>

                <button
                  type="button"
                  className="w-full h-12 bg-terracotta text-white font-inter text-[14px] font-semibold rounded-lg hover:scale-[1.01] active:scale-[0.99] transition-transform"
                >
                  Obtenir une estimation
                </button>
              </form>
            </div>

            {/* ── Expert estimation ── */}
            <div className="bg-cream-warm rounded-card p-8">
              <div className="w-12 h-12 rounded-lg bg-palm/10 flex items-center justify-center mb-5">
                <UserCheck size={24} className="text-palm" />
              </div>
              <h2 className="font-playfair text-[24px] font-medium text-midnight mb-2">
                Estimation par un expert
              </h2>
              <p className="font-inter text-[14px] text-text-secondary mb-6">
                Planifiez une visite avec l'un de nos agents pour une estimation
                précise.
              </p>

              <form className="space-y-4">
                <div>
                  <label className="block font-inter text-[13px] font-medium text-text-primary mb-1.5">
                    Votre nom
                  </label>
                  <input
                    type="text"
                    value={expertForm.name}
                    onChange={(e) =>
                      setExpertForm((s) => ({ ...s, name: e.target.value }))
                    }
                    className="w-full h-12 px-4 border border-border-warm rounded-lg font-inter text-[14px] focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/20 transition-colors"
                    placeholder="Prénom et nom"
                  />
                </div>

                <div>
                  <label className="block font-inter text-[13px] font-medium text-text-primary mb-1.5">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={expertForm.phone}
                    onChange={(e) =>
                      setExpertForm((s) => ({ ...s, phone: e.target.value }))
                    }
                    className="w-full h-12 px-4 border border-border-warm rounded-lg font-inter text-[14px] focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/20 transition-colors"
                    placeholder="+212 6 XX XX XX XX"
                  />
                </div>

                <div>
                  <label className="block font-inter text-[13px] font-medium text-text-primary mb-1.5">
                    Date souhaitée
                  </label>
                  <input
                    type="date"
                    value={expertForm.date}
                    onChange={(e) =>
                      setExpertForm((s) => ({ ...s, date: e.target.value }))
                    }
                    className="w-full h-12 px-4 border border-border-warm rounded-lg font-inter text-[14px] focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/20 transition-colors"
                  />
                </div>

                <button
                  type="button"
                  className="w-full h-12 bg-palm text-white font-inter text-[14px] font-semibold rounded-lg hover:scale-[1.01] active:scale-[0.99] transition-transform"
                >
                  Demander une visite
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ STEPS ═══════ */}
      <section className="bg-cream-warm py-16 md:py-20">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
          <SectionReveal y={30}>
            <h2 className="font-playfair text-[28px] md:text-[36px] font-medium text-midnight text-center mb-12">
              Comment ça marche ?
            </h2>
          </SectionReveal>

          <SectionReveal
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            stagger={0.12}
            y={40}
          >
            {steps.map(({ number, title, description, icon: Icon }) => (
              <div
                key={number}
                className="bg-white rounded-card p-8 text-center hover:shadow-card-hover transition-shadow duration-250"
              >
                <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-terracotta/10 flex items-center justify-center">
                  <Icon size={24} className="text-terracotta" />
                </div>
                <span className="inline-block w-8 h-8 rounded-full bg-terracotta text-white font-inter text-[14px] font-semibold leading-8 mb-3">
                  {number}
                </span>
                <h3 className="font-playfair text-[20px] font-semibold text-midnight mb-2">
                  {title}
                </h3>
                <p className="font-inter text-[14px] text-text-secondary leading-[1.7]">
                  {description}
                </p>
              </div>
            ))}
          </SectionReveal>
        </div>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section className="bg-white py-16 md:py-20">
        <div className="max-w-[800px] mx-auto px-6 lg:px-12 text-center">
          <SectionReveal y={30}>
            <h2 className="font-playfair text-[28px] md:text-[36px] font-medium text-midnight mb-4">
              Des questions ?
            </h2>
            <p className="font-inter text-[16px] text-text-secondary mb-8 max-w-[560px] mx-auto">
              Notre équipe est à votre disposition pour toute question sur
              l&#8217;estimation de votre bien.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/contact"
                className="inline-block bg-terracotta text-white font-inter text-[14px] font-semibold px-8 py-3.5 rounded-lg hover:scale-[1.02] transition-transform"
              >
                Nous contacter
              </Link>
              <a
                href="tel:+212524000000"
                className="inline-flex items-center gap-2 text-terracotta font-inter text-[14px] font-medium hover:underline"
              >
                <Phone size={18} />
                +212 524 00 00 00
              </a>
            </div>
          </SectionReveal>
        </div>
      </section>
    </div>
  )
}
