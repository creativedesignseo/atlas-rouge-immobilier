import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  ShieldCheck,
  MapPin,
  Heart,
  Phone,
  ChevronRight,
} from 'lucide-react'
import SectionReveal from '@/components/SectionReveal'

gsap.registerPlugin(ScrollTrigger)

/* ─── count-up helper ─── */
function useCountUp(
  target: number,
  triggerRef: React.RefObject<HTMLElement | null>,
  suffix = ''
) {
  const [value, setValue] = useState(0)
  const [hasTriggered, setHasTriggered] = useState(false)

  useEffect(() => {
    if (!triggerRef.current || hasTriggered) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTriggered) {
          setHasTriggered(true)
          const duration = 1500
          const start = performance.now()

          const tick = (now: number) => {
            const elapsed = now - start
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setValue(Math.floor(eased * target))
            if (progress < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.2 }
    )

    observer.observe(triggerRef.current)
    return () => observer.disconnect()
  }, [target, hasTriggered, triggerRef])

  return `${value.toLocaleString('fr-FR')}${suffix}`
}

/* ─── Stat card ─── */
function StatCard({
  target,
  suffix,
  label,
  triggerRef,
}: {
  target: number
  suffix?: string
  label: string
  triggerRef: React.RefObject<HTMLElement | null>
}) {
  const display = useCountUp(target, triggerRef, suffix)

  return (
    <div className="flex flex-col items-center text-center px-6 py-8">
      <span className="font-playfair text-[48px] font-semibold text-terracotta leading-none mb-2">
        {display}
        {suffix}
      </span>
      <span className="font-inter text-[15px] text-text-secondary">
        {label}
      </span>
    </div>
  )
}

/* ─── Team member data ─── */
const teamMembers = [
  {
    name: 'Sophie Martin',
    role: 'Fondatrice & Directrice',
    bio: 'Passionn\u00E9e par l\u2019immobilier et le Maroc, Sophie a fond\u00E9 Atlas Rouge pour accompagner les Fran\u00E7ais dans leur projet marrakchi.',
  },
  {
    name: 'Karim Benali',
    role: 'Responsable Commercial',
    bio: 'Expert du march\u00E9 local, Karim conna\u00EEt chaque quartier de Marrakech et sait d\u00E9nicher les perles rares.',
  },
  {
    name: 'L\u00E9a Dubois',
    role: 'Conseill\u00E8re Immobili\u00E8re',
    bio: '\u00C0 l\u2019\u00E9coute et r\u00E9active, L\u00E9a accompagne chaque client avec patience et professionnalisme.',
  },
  {
    name: 'Youssef Alaoui',
    role: 'Responsable Gestion Locative',
    bio: 'Youssef veille sur chaque bien g\u00E9r\u00E9 comme s\u2019il \u00E9tait le sien, de la recherche de locataires aux \u00E9tats des lieux.',
  },
]

/* ─── Value cards data ─── */
const values = [
  {
    icon: ShieldCheck,
    title: 'Transparence',
    description:
      'Pas de surprise. Chaque \u00E9tape vous est expliqu\u00E9e, chaque frais d\u00E9taill\u00E9. Nous croyons que la confiance se construit par l\u2019honn\u00EAtet\u00E9.',
  },
  {
    icon: MapPin,
    title: 'Expertise locale',
    description:
      'Nous connaissons Marrakech quartier par quartier, rue par rue. Cette connaissance intime fait toute la diff\u00E9rence dans votre recherche.',
  },
  {
    icon: Heart,
    title: 'Engagement',
    description:
      'Votre projet est notre projet. Nous restons \u00E0 vos c\u00F4t\u00E9s bien au-del\u00E0 de la signature, pour vous aider \u00E0 vous installer sereinement.',
  },
]

/* ═══════════════════════════════════════════ */
export default function About() {
  const heroRef = useRef<HTMLDivElement>(null)
  const heroBgRef = useRef<HTMLDivElement>(null)
  const statsSectionRef = useRef<HTMLElement>(null)

  /* Hero entrance animations */
  useGSAP(
    () => {
      if (!heroRef.current) return
      gsap.from('.about-hero-h1', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.2,
      })
      gsap.from('.about-hero-tagline', {
        y: 30,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.out',
        delay: 0.4,
      })
      gsap.from('.about-hero-mission', {
        y: 20,
        opacity: 0,
        duration: 0.5,
        ease: 'power3.out',
        delay: 0.55,
      })
    },
    { scope: heroRef }
  )

  /* Ken Burns on hero bg */
  useGSAP(
    () => {
      if (!heroBgRef.current) return
      gsap.to(heroBgRef.current, {
        scale: 1.04,
        duration: 20,
        ease: 'none',
        repeat: -1,
        yoyo: true,
      })
    },
    { scope: heroBgRef }
  )

  /* Story section animations */
  const storyRef = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      if (!storyRef.current) return
      gsap.from('.story-text > *', {
        y: 30,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: storyRef.current,
          start: 'top 80%',
          once: true,
        },
      })
      gsap.from('.story-image-wrap', {
        x: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: storyRef.current,
          start: 'top 80%',
          once: true,
        },
      })
    },
    { scope: storyRef }
  )

  /* Team section animations */
  const teamRef = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      if (!teamRef.current) return
      gsap.from('.team-card', {
        y: 30,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: teamRef.current,
          start: 'top 85%',
          once: true,
        },
      })
    },
    { scope: teamRef }
  )

  return (
    <div>
      {/* ═══════ HERO ═══════ */}
      <section
        ref={heroRef}
        className="relative min-h-[70vh] flex items-end overflow-hidden bg-midnight"
      >
        {/* Background image with Ken Burns */}
        <div
          ref={heroBgRef}
          className="absolute inset-0 w-full h-full"
          style={{ transform: 'scale(1)' }}
        >
          <img
            src="/property-05.jpg"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-midnight/60" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-[1280px] mx-auto px-6 lg:px-12 pb-16 pt-32 w-full">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 mb-6 text-white/60 font-inter text-[13px]">
            <Link to="/" className="hover:text-white transition-colors">
              Accueil
            </Link>
            <ChevronRight size={14} />
            <span>À propos</span>
          </nav>

          <h1 className="about-hero-h1 font-playfair text-[42px] md:text-[56px] font-medium text-white leading-[1.1] tracking-[-0.5px] mb-4">
            Atlas Rouge Immobilier
          </h1>
          <p className="about-hero-tagline font-inter text-[18px] md:text-[20px] text-white/80 mb-6 max-w-[600px]">
            L&#8217;immobilier à Marrakech, pensé pour les Français
          </p>
          <p className="about-hero-mission font-inter text-[15px] md:text-[16px] text-white/70 max-w-[560px] leading-relaxed">
            Accompagner chaque acheteur avec expertise, transparence et passion
            dans son projet immobilier au Maroc.
          </p>
        </div>
      </section>

      {/* ═══════ STORY ═══════ */}
      <section className="bg-white py-16 md:py-24">
        <div
          ref={storyRef}
          className="max-w-[1100px] mx-auto px-6 lg:px-12"
        >
          <div className="flex flex-col-reverse md:flex-row gap-12 md:gap-16 items-center">
            {/* Text */}
            <div className="story-text md:w-[55%]">
              <span className="inline-block font-inter text-[12px] font-medium tracking-[0.3px] uppercase text-terracotta mb-3">
                Notre histoire
              </span>
              <h2 className="font-playfair text-[28px] md:text-[36px] font-medium text-midnight leading-[1.15] tracking-[-0.3px] mb-6">
                Un pont entre la France et le Maroc
              </h2>
              <div className="space-y-4 font-inter text-[16px] text-text-secondary leading-[1.8]">
                <p>
                  Atlas Rouge Immobilier est né en 2012 d&#8217;une conviction
                  simple : acheter une propriété à Marrakech mérite un
                  accompagnement à la hauteur de l&#8217;événement.
                </p>
                <p>
                  Fondée par un couple franco-marocain, notre agence allie la
                  rigueur et la transparence du service français à la chaleur
                  et la connaissance intime de la culture marocaine.
                </p>
                <p>
                  En dix ans, nous avons accompagné plus de 800 familles dans
                  leur projet immobilier — de la première visite à la remise
                  des clés, en passant par toutes les étapes administratives.
                </p>
              </div>
            </div>

            {/* Image */}
            <div className="story-image-wrap md:w-[45%]">
              <img
                src="/team-portrait.jpg"
                alt="L&#8217;équipe Atlas Rouge Immobilier au siège de Marrakech"
                className="w-full rounded-card shadow-lg object-cover aspect-[4/3]"
              />
              <p className="font-inter text-[13px] text-text-secondary mt-3 text-center">
                L&#8217;équipe Atlas Rouge Immobilier au siège de Marrakech
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ STATS ═══════ */}
      <section ref={statsSectionRef} className="bg-cream-warm py-16 md:py-20">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-0">
            <StatCard
              target={800}
              suffix="+"
              label="Familles accompagnées"
              triggerRef={statsSectionRef}
            />
            <div className="hidden lg:block w-px bg-border-warm self-stretch mx-auto" />
            <StatCard
              target={12}
              suffix=""
              label="Années d&#8217;expertise"
              triggerRef={statsSectionRef}
            />
            <div className="hidden lg:block w-px bg-border-warm self-stretch mx-auto" />
            <StatCard
              target={3500}
              suffix="+"
              label="Biens vendus"
              triggerRef={statsSectionRef}
            />
            <div className="hidden lg:block w-px bg-border-warm self-stretch mx-auto" />
            <StatCard
              target={98}
              suffix="%"
              label="Taux de satisfaction"
              triggerRef={statsSectionRef}
            />
          </div>
        </div>
      </section>

      {/* ═══════ VALUES ═══════ */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
          <SectionReveal>
            <h2 className="font-playfair text-[28px] md:text-[36px] font-medium text-midnight text-center mb-12 md:mb-16">
              Nos valeurs
            </h2>
          </SectionReveal>

          <SectionReveal
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            stagger={0.12}
            y={40}
          >
            {values.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-cream-warm rounded-card p-8 md:p-10 text-center hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-250"
              >
                <div className="w-12 h-12 mx-auto mb-5 flex items-center justify-center">
                  <Icon size={40} className="text-terracotta" />
                </div>
                <h3 className="font-playfair text-[22px] font-semibold text-midnight mb-3">
                  {title}
                </h3>
                <p className="font-inter text-[15px] text-text-secondary leading-[1.7]">
                  {description}
                </p>
              </div>
            ))}
          </SectionReveal>
        </div>
      </section>

      {/* ═══════ TEAM ═══════ */}
      <section className="bg-cream-warm py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="font-playfair text-[28px] md:text-[36px] font-medium text-midnight mb-3">
              Notre équipe
            </h2>
            <p className="font-inter text-[16px] text-text-secondary">
              Des conseillers passionnés à votre service
            </p>
          </div>

          <div
            ref={teamRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {teamMembers.map((member) => (
              <div
                key={member.name}
                className="team-card bg-white rounded-card p-6 text-center shadow-card hover:shadow-card-hover transition-shadow duration-250"
              >
                <div className="w-[120px] h-[120px] mx-auto mb-4 rounded-full overflow-hidden border-[3px] border-white shadow-md">
                  <img
                    src="/team-portrait.jpg"
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-playfair text-[20px] font-semibold text-midnight mb-1">
                  {member.name}
                </h3>
                <p className="font-inter text-[14px] text-text-secondary mb-3">
                  {member.role}
                </p>
                <p className="font-inter text-[13px] text-text-secondary leading-[1.6] mb-4">
                  {member.bio}
                </p>
                <Link
                  to="/contact"
                  className="inline-block font-inter text-[14px] text-terracotta font-medium hover:underline"
                >
                  Contacter
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section className="bg-terracotta py-16 md:py-20">
        <SectionReveal className="max-w-[800px] mx-auto px-6 lg:px-12 text-center">
          <h2 className="font-playfair text-[28px] md:text-[36px] font-medium text-white mb-4">
            Prêt à trouver votre bien ?
          </h2>
          <p className="font-inter text-[16px] text-white/80 mb-8 max-w-[560px] mx-auto">
            Notre équipe vous accompagne à chaque étape de votre projet
            immobilier à Marrakech.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/contact"
              className="inline-block bg-white text-terracotta font-inter text-[14px] font-semibold px-8 py-3.5 rounded-lg hover:scale-[1.02] transition-transform"
            >
              Prendre rendez-vous
            </Link>
            <a
              href="tel:+212524000000"
              className="inline-flex items-center gap-2 text-white font-inter text-[14px] hover:underline"
            >
              <Phone size={18} />
              +212 524 00 00 00
            </a>
          </div>
        </SectionReveal>
      </section>
    </div>
  )
}
