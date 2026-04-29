import { Link } from 'react-router-dom'
import { useLang } from '@/hooks/useLang'
import {
  Users,
  ClipboardCheck,
  ShieldCheck,
  Wrench,
  FileText,
  Phone,
  Check,
  ArrowRight,
} from 'lucide-react'
import SectionReveal from '@/components/SectionReveal'

const services = [
  {
    icon: Users,
    title: 'Recherche de locataires',
    description:
      'S\u00E9lection rigoureuse des candidats, v\u00E9rification des dossiers et garanties.',
  },
  {
    icon: ClipboardCheck,
    title: '\u00C9tat des lieux',
    description:
      'R\u00E9daction et gestion des \u00E9tats des lieux d\u2019entr\u00E9e et de sortie conformes \u00E0 la loi.',
  },
  {
    icon: ShieldCheck,
    title: 'Garanties loyers impay\u00E9s',
    description:
      'Assurance protection locative pour s\u00E9curiser vos revenus fonciers.',
  },
  {
    icon: Wrench,
    title: 'Maintenance',
    description:
      'Coordination des interventions de plomberie, \u00E9lectricit\u00E9, jardinage et plus.',
  },
  {
    icon: FileText,
    title: 'D\u00E9claration fiscale',
    description:
      'Accompagnement dans vos d\u00E9clarations fiscales au Maroc.',
  },
]

const pricingTiers = [
  {
    name: 'Essentiel',
    price: '8%',
    subtitle: 'du loyer mensuel',
    features: [
      'Recherche de locataires',
      '\u00C9tat des lieux',
      'R\u00E9daction du bail',
      'Encaissement des loyers',
    ],
    highlighted: false,
  },
  {
    name: 'Confort',
    price: '10%',
    subtitle: 'du loyer mensuel',
    features: [
      'Tout le pack Essentiel',
      'Garantie loyers impay\u00E9s',
      'Maintenance courante',
      'Relances et recouvrement',
    ],
    highlighted: true,
  },
  {
    name: 'Premium',
    price: '12%',
    subtitle: 'du loyer mensuel',
    features: [
      'Tout le pack Confort',
      'D\u00E9claration fiscale',
      'Assurance dommages',
      'Conseiller d\u00E9di\u00E9 24/7',
    ],
    highlighted: false,
  },
]

export default function GestionLocative() {
  const { path } = useLang()
  return (
    <div>
      {/* ═══════ HERO ═══════ */}
      <section className="bg-midnight pt-16 md:pt-24 pb-16 md:pb-20">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12 text-center">
          <SectionReveal y={40}>
            <h1 className="font-playfair text-[36px] md:text-[48px] font-medium text-white leading-[1.1] tracking-[-0.3px] mb-4">
              Gestion locative à Marrakech
            </h1>
          </SectionReveal>

          <SectionReveal y={30} delay={0.15}>
            <p className="font-inter text-[16px] md:text-[18px] text-white/70 max-w-[640px] mx-auto">
              Confiez-nous la location de votre bien, nous nous occupons de tout.
              Une gestion sereine et professionnelle de A à Z.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* ═══════ SERVICES ═══════ */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
          <SectionReveal y={30}>
            <div className="text-center mb-12">
              <h2 className="font-playfair text-[28px] md:text-[36px] font-medium text-midnight mb-3">
                Nos services de gestion
              </h2>
              <p className="font-inter text-[16px] text-text-secondary max-w-[560px] mx-auto">
                Une prise en charge complète pour louer votre bien en toute
                tranquillité.
              </p>
            </div>
          </SectionReveal>

          <SectionReveal
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            stagger={0.1}
            y={30}
          >
            {services.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-cream-warm rounded-card p-6 md:p-8 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-250"
              >
                <div className="w-12 h-12 rounded-lg bg-palm/10 flex items-center justify-center mb-4">
                  <Icon size={24} className="text-palm" />
                </div>
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

      {/* ═══════ PRICING ═══════ */}
      <section className="bg-cream-warm py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
          <SectionReveal y={30}>
            <div className="text-center mb-12">
              <h2 className="font-playfair text-[28px] md:text-[36px] font-medium text-midnight mb-3">
                Nos formules
              </h2>
              <p className="font-inter text-[16px] text-text-secondary max-w-[560px] mx-auto">
                Choisissez la formule qui correspond à vos besoins.
              </p>
            </div>
          </SectionReveal>

          <SectionReveal
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            stagger={0.12}
            y={40}
          >
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-card p-8 ${
                  tier.highlighted
                    ? 'bg-midnight text-white shadow-lg scale-[1.02]'
                    : 'bg-white text-text-primary'
                }`}
              >
                <h3
                  className={`font-playfair text-[22px] font-semibold mb-2 ${
                    tier.highlighted ? 'text-white' : 'text-midnight'
                  }`}
                >
                  {tier.name}
                </h3>
                <div className="mb-1">
                  <span
                    className={`font-playfair text-[48px] font-semibold ${
                      tier.highlighted ? 'text-terracotta' : 'text-terracotta'
                    }`}
                  >
                    {tier.price}
                  </span>
                </div>
                <p
                  className={`font-inter text-[14px] mb-6 ${
                    tier.highlighted ? 'text-white/60' : 'text-text-secondary'
                  }`}
                >
                  {tier.subtitle}
                </p>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className={`flex items-start gap-2 font-inter text-[14px] ${
                        tier.highlighted
                          ? 'text-white/80'
                          : 'text-text-secondary'
                      }`}
                    >
                      <Check
                        size={18}
                        className={`shrink-0 mt-0.5 ${
                          tier.highlighted
                            ? 'text-terracotta'
                            : 'text-palm'
                        }`}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  to={path('/contact')}
                  className={`flex items-center justify-center gap-2 w-full h-12 rounded-lg font-inter text-[14px] font-semibold transition-transform hover:scale-[1.02] ${
                    tier.highlighted
                      ? 'bg-terracotta text-white'
                      : 'border border-border-warm text-text-primary hover:border-terracotta hover:text-terracotta'
                  }`}
                >
                  Choisir {tier.name}
                  <ArrowRight size={16} />
                </Link>
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
              Louez votre bien en confiance
            </h2>
            <p className="font-inter text-[16px] text-text-secondary mb-8 max-w-[560px] mx-auto">
              Discutons de votre projet de gestion locative. Notre équipe vous
              propose une solution sur mesure.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to={path('/contact')}
                className="inline-block bg-terracotta text-white font-inter text-[14px] font-semibold px-8 py-3.5 rounded-lg hover:scale-[1.02] transition-transform"
              >
                Prendre rendez-vous
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
