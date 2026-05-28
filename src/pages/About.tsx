import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLang } from '@/hooks/useLang'
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
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

interface TeamMember {
  id: string
  name: string
  role: string
  bio: string
  photoUrl: string | null
}

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
      <span className="font-display text-[48px] font-semibold text-terracotta leading-none mb-2">
        {display}
        {suffix}
      </span>
      <span className="font-inter text-[15px] text-text-secondary">
        {label}
      </span>
    </div>
  )
}

/* Equipo cargado dinámicamente desde tabla agents — ver About() abajo */

/* ─── Value cards data (icons + i18n keys) ─── */
const values = [
  { icon: ShieldCheck, key: 'transparency' },
  { icon: MapPin, key: 'expertise' },
  { icon: Heart, key: 'commitment' },
] as const

/* ═══════════════════════════════════════════ */
export default function About() {
  const { t } = useTranslation('about')
  const { path } = useLang()
  const heroRef = useRef<HTMLDivElement>(null)
  const heroBgRef = useRef<HTMLDivElement>(null)
  const statsSectionRef = useRef<HTMLElement>(null)

  // Equipo desde tabla `agents` — antes era hardcoded con nombres ficticios
  const [team, setTeam] = useState<TeamMember[]>([])
  useEffect(() => {
    if (!isSupabaseConfigured) return
    supabase
      .from('agents')
      .select('id, name, role, bio, photo_url')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (!data) return
        setTeam(
          data
            .filter((a) => a.name?.trim())
            .map((a) => ({
              id: a.id,
              name: a.name!,
              role:
                a.role === 'admin'
                  ? t('team.directorRole')
                  : a.role || t('team.defaultRole'),
              bio: a.bio || '',
              photoUrl: a.photo_url,
            })),
        )
      })
  }, [t])

  /* Hero entrance animations */
  useGSAP(
    () => {
      if (!heroRef.current) return
      gsap.fromTo(
        '.about-hero-h1',
        { y: 40, opacity: 0 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.2 },
      )
      gsap.fromTo(
        '.about-hero-tagline',
        { y: 30, opacity: 0 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.4 },
      )
      gsap.fromTo(
        '.about-hero-mission',
        { y: 20, opacity: 0 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', delay: 0.55 },
      )
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
      gsap.fromTo(
        '.story-text > *',
        { y: 30, opacity: 0 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1, scrollTrigger: {
          trigger: storyRef.current,
          start: 'top 80%',
          once: true,
        } },
      )
      gsap.fromTo(
        '.story-image-wrap',
        { x: 40, opacity: 0 },
        { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: {
          trigger: storyRef.current,
          start: 'top 80%',
          once: true,
        } },
      )
    },
    { scope: storyRef }
  )

  /* Team section animations — fromTo para que las cards siempre acaben visibles
     incluso si el fetch del equipo tarda o falla */
  const teamRef = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      if (!teamRef.current) return
      const cards = teamRef.current.querySelectorAll('.team-card')
      if (!cards.length) return
      gsap.fromTo(
        cards,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.1,
          scrollTrigger: {
            trigger: teamRef.current,
            start: 'top 90%',
            once: true,
          },
        },
      )
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
            <Link to={path('/')} className="hover:text-white transition-colors">
              {t('breadcrumb.home')}
            </Link>
            <ChevronRight size={14} />
            <span>{t('breadcrumb.about')}</span>
          </nav>

          <h1 className="about-hero-h1 font-display text-[42px] md:text-[56px] font-medium text-white leading-[1.1] tracking-[-0.5px] mb-4">
            {t('hero.title')}
          </h1>
          <p className="about-hero-tagline font-inter text-[18px] md:text-[20px] text-white/80 mb-6 max-w-[600px]">
            {t('hero.tagline')}
          </p>
          <p className="about-hero-mission font-inter text-[15px] md:text-[16px] text-white/70 max-w-[560px] leading-relaxed">
            {t('hero.mission')}
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
                {t('story.eyebrow')}
              </span>
              <h2 className="font-display text-[28px] md:text-[36px] font-medium text-midnight leading-[1.15] tracking-[-0.3px] mb-6">
                {t('story.title')}
              </h2>
              <div className="space-y-4 font-inter text-[16px] text-text-secondary leading-[1.8]">
                <p>{t('story.p1')}</p>
                <p>{t('story.p2')}</p>
                <p>{t('story.p3')}</p>
              </div>
            </div>

            {/* Image */}
            <div className="story-image-wrap md:w-[45%]">
              <img
                src="/team-portrait.jpg"
                alt={t('story.imageAlt')}
                className="w-full rounded-card shadow-lg object-cover aspect-[4/3]"
              />
              <p className="font-inter text-[13px] text-text-secondary mt-3 text-center">
                {t('story.imageCaption')}
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
              label={t('stats.families')}
              triggerRef={statsSectionRef}
            />
            <div className="hidden lg:block w-px bg-border-warm self-stretch mx-auto" />
            <StatCard
              target={12}
              suffix=""
              label={t('stats.years')}
              triggerRef={statsSectionRef}
            />
            <div className="hidden lg:block w-px bg-border-warm self-stretch mx-auto" />
            <StatCard
              target={3500}
              suffix="+"
              label={t('stats.properties')}
              triggerRef={statsSectionRef}
            />
            <div className="hidden lg:block w-px bg-border-warm self-stretch mx-auto" />
            <StatCard
              target={98}
              suffix="%"
              label={t('stats.satisfaction')}
              triggerRef={statsSectionRef}
            />
          </div>
        </div>
      </section>

      {/* ═══════ VALUES ═══════ */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
          <SectionReveal>
            <h2 className="font-display text-[28px] md:text-[36px] font-medium text-midnight text-center mb-12 md:mb-16">
              {t('values.title')}
            </h2>
          </SectionReveal>

          <SectionReveal
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            stagger={0.12}
            y={40}
          >
            {values.map(({ icon: Icon, key }) => (
              <div
                key={key}
                className="bg-cream-warm rounded-card p-8 md:p-10 text-center hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-250"
              >
                <div className="w-12 h-12 mx-auto mb-5 flex items-center justify-center">
                  <Icon size={40} className="text-terracotta" />
                </div>
                <h3 className="font-display text-[22px] font-semibold text-midnight mb-3">
                  {t(`values.${key}.title`)}
                </h3>
                <p className="font-inter text-[15px] text-text-secondary leading-[1.7]">
                  {t(`values.${key}.description`)}
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
            <h2 className="font-display text-[28px] md:text-[36px] font-medium text-midnight mb-3">
              {t('team.title')}
            </h2>
            <p className="font-inter text-[16px] text-text-secondary">
              {t('team.subtitle')}
            </p>
          </div>

          <div
            ref={teamRef}
            className={`grid gap-6 ${
              team.length === 1
                ? 'max-w-[360px] mx-auto'
                : team.length === 2
                  ? 'grid-cols-1 sm:grid-cols-2 max-w-[760px] mx-auto'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
            }`}
          >
            {team.length === 0 ? (
              // Skeleton mientras carga
              [0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="team-card bg-white rounded-card p-6 text-center shadow-card animate-pulse"
                >
                  <div className="w-[120px] h-[120px] mx-auto mb-4 rounded-full bg-stone/10" />
                  <div className="h-4 w-2/3 mx-auto bg-stone/10 rounded mb-2" />
                  <div className="h-3 w-1/2 mx-auto bg-stone/10 rounded mb-3" />
                  <div className="h-3 w-full bg-stone/10 rounded" />
                </div>
              ))
            ) : (
              team.map((member) => (
                <div
                  key={member.id}
                  className="team-card bg-white rounded-card p-6 text-center shadow-card hover:shadow-card-hover transition-shadow duration-250"
                >
                  <div className="w-[120px] h-[120px] mx-auto mb-4 rounded-full overflow-hidden border-[3px] border-white shadow-md bg-cream-warm">
                    {member.photoUrl ? (
                      <img
                        src={member.photoUrl}
                        alt={member.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-terracotta/15 text-terracotta font-display text-[36px] font-semibold">
                        {member.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h3 className="font-display text-[20px] font-semibold text-midnight mb-1">
                    {member.name}
                  </h3>
                  <p className="font-inter text-[14px] text-text-secondary mb-3 capitalize">
                    {member.role}
                  </p>
                  {member.bio && (
                    <p className="font-inter text-[13px] text-text-secondary leading-[1.6] mb-4">
                      {member.bio}
                    </p>
                  )}
                  <Link
                    to={path('/contact')}
                    className="inline-block font-inter text-[14px] text-terracotta font-medium hover:underline"
                  >
                    {t('team.contact')}
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section className="bg-terracotta py-16 md:py-20">
        <SectionReveal className="max-w-[800px] mx-auto px-6 lg:px-12 text-center">
          <h2 className="font-display text-[28px] md:text-[36px] font-medium text-white mb-4">
            {t('cta.title')}
          </h2>
          <p className="font-inter text-[16px] text-white/80 mb-8 max-w-[560px] mx-auto">
            {t('cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={path('/contact')}
              className="inline-block bg-white text-terracotta font-inter text-[14px] font-semibold px-8 py-3.5 rounded-lg hover:scale-[1.02] transition-transform"
            >
              {t('cta.appointment')}
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
