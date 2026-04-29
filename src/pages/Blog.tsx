import { useRef, useState } from 'react'
import { getImageUrl } from '@/lib/storage'
import { Link } from 'react-router-dom'
import { useLang } from '@/hooks/useLang'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

gsap.registerPlugin(ScrollTrigger)

/* ── Category filters ── */
const categories = [
  'Tous',
  'Achat',
  'Investissement',
  'Quartiers',
  'Fiscalit\u00E9',
  'D\u00E9coration',
]

/* ── Articles data ── */
const articles = [
  {
    image: 'blog-pricing.jpg',
    category: 'Quartiers',
    title: 'Prix de l\u2019immobilier \u00E0 Marrakech : tendances et pr\u00E9visions 2025',
    excerpt:
      'Apr\u00E8s une ann\u00E9e de stabilisation, le march\u00E9 immobilier de Marrakech montre des signes de reprise. Analyse des prix au m\u00B2 par quartier et des facteurs qui influenceront le march\u00E9 en 2025.',
    date: '15 Janvier 2024',
    readTime: '8 min',
  },
  {
    image: 'blog-neighborhood.jpg',
    category: 'Quartiers',
    title: 'Choisir son quartier \u00E0 Marrakech : Gu\u00E9liz vs Hivernage',
    excerpt:
      'Deux quartiers, deux ambiances. Gu\u00E9liz, le c\u0153ur moderne avec ses commerces et restaurants, contre Hivernage, l\u2019\u00E9l\u00E9gance des avenues bord\u00E9es d\u2019arbres. Le comparatif d\u00E9taill\u00E9 pour bien choisir.',
    date: '12 Janvier 2024',
    readTime: '6 min',
  },
  {
    image: 'guide-buyer.jpg',
    category: 'Achat',
    title: 'Acheter au Maroc en tant qu\u2019\u00E9tranger : le guide complet',
    excerpt:
      'Tout ce que les ressortissants fran\u00E7ais doivent savoir pour acqu\u00E9rir un bien immobilier au Maroc : formalit\u00E9s, financement, fiscalit\u00E9 et pi\u00E8ges \u00E0 \u00E9viter.',
    date: '10 Janvier 2024',
    readTime: '7 min',
  },
  {
    image: 'property-01.jpg',
    category: 'Achat',
    title: 'Riad ou villa : quel bien choisir \u00E0 Marrakech ?',
    excerpt:
      'Entre l\u2019authenticit\u00E9 d\u2019un riad traditionnel et le confort moderne d\u2019une villa avec piscine, le choix n\u2019est pas simple. D\u00E9couvrez les avantages de chaque option.',
    date: '8 Janvier 2024',
    readTime: '6 min',
  },
  {
    image: 'property-02.jpg',
    category: 'Investissement',
    title: 'Investissement locatif \u00E0 Marrakech : les meilleurs rendements',
    excerpt:
      'Les villas avec piscine g\u00E9n\u00E8rent les meilleurs rendements en saisonnier. D\u00E9couvrez lesquels des quartiers offrent le meilleur rapport qualit\u00E9/prix pour votre projet locatif.',
    date: '5 Janvier 2024',
    readTime: '7 min',
  },
  {
    image: 'neighborhood-palmeraie.jpg',
    category: 'Quartiers',
    title: 'Palmeraie : le quartier des villas de luxe',
    excerpt:
      'L\u2019oasis de 150 000 palmiers abrite les plus belles propri\u00E9t\u00E9s de Marrakech. Villas avec piscine, resorts haut de gamme et vue sur l\u2019Atlas : tout savoir sur ce quartier pris\u00E9.',
    date: '3 Janvier 2024',
    readTime: '5 min',
  },
  {
    image: 'neighborhood-medina.jpg',
    category: 'D\u00E9coration',
    title: 'D\u00E9coration marocaine moderne : tendances et inspirations',
    excerpt:
      'Le style marocain contemporain m\u00EAle zelliges, tadelakt et mobilier design. D\u00E9couvrez les derni\u00E8res tendances pour am\u00E9nager votre riad ou villa avec une touche moderne.',
    date: '28 D\u00E9cembre 2023',
    readTime: '5 min',
  },
  {
    image: 'neighborhood-ourika.jpg',
    category: 'Quartiers',
    title: 'La Palmeraie vs l\u2019Hivernage : o\u00F9 investir en 2025 ?',
    excerpt:
      'Deux quartiers embl\u00E9matiques, deux profils d\u2019investissement. La Palmeraie offre l\u2019exclusivit\u00E9 et la nature, tandis que l\u2019Hivernage allie centralit\u00E9 et prestige historique.',
    date: '20 D\u00E9cembre 2023',
    readTime: '6 min',
  },
  {
    image: 'neighborhood-amelkis.jpg',
    category: 'Investissement',
    title: 'Maisons \u00E9cologiques \u00E0 Marrakech : le nouveau march\u00E9',
    excerpt:
      'Construction durable, panneaux solaires et gestion de l\u2019eau : le green building s\u00E9duit de plus en plus d\u2019acheteurs \u00E0 Marrakech. Zoom sur cette tendance porteuse.',
    date: '15 D\u00E9cembre 2023',
    readTime: '6 min',
  },
]

/* ── Featured article ── */
const featuredArticle = {
  image: 'blog-pricing.jpg',
  category: 'March\u00E9',
  title:
    'Prix de l\u2019immobilier \u00E0 Marrakech : tendances et pr\u00E9visions 2024',
  excerpt:
    'Apr\u00E8s une ann\u00E9e de stabilisation, le march\u00E9 immobilier de Marrakech montre des signes de reprise. Analyse des prix au m\u00B2 par quartier et des facteurs qui influenceront le march\u00E9 en 2024.',
  date: '15 Janvier 2024',
  readTime: '8 min',
}

export default function Blog() {
  const { path } = useLang()
  const [activeCategory, setActiveCategory] = useState('Tous')
  const [email, setEmail] = useState('')

  const heroRef = useRef<HTMLDivElement>(null)
  const featuredRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const newsletterRef = useRef<HTMLDivElement>(null)

  /* Filtered articles */
  const filteredArticles =
    activeCategory === 'Tous'
      ? articles
      : articles.filter((a) => a.category === activeCategory)

  /* Hero animations */
  useGSAP(
    () => {
      if (!heroRef.current) return
      const tl = gsap.timeline()
      tl.from(heroRef.current!.querySelector('.hero-title'), {
        y: 40,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
      })
        .from(
          heroRef.current!.querySelector('.hero-subtitle'),
          { y: 30, opacity: 0, duration: 0.6, ease: 'power3.out' },
          '-=0.45'
        )
        .from(
          heroRef.current!.querySelectorAll('.hero-chip'),
          {
            y: 15,
            opacity: 0,
            duration: 0.4,
            stagger: 0.05,
            ease: 'power3.out',
          },
          '-=0.3'
        )
    },
    { scope: heroRef }
  )

  /* Featured article animation */
  useGSAP(
    () => {
      if (!featuredRef.current) return
      gsap.from(featuredRef.current!.querySelector('.featured-image'), {
        x: -30,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: featuredRef.current,
          start: 'top 85%',
          once: true,
        },
      })
      gsap.from(
        featuredRef.current!.querySelector('.featured-content'),
        {
          y: 30,
          opacity: 0,
          duration: 0.6,
          ease: 'power3.out',
          delay: 0.15,
          scrollTrigger: {
            trigger: featuredRef.current,
            start: 'top 85%',
            once: true,
          },
        }
      )
    },
    { scope: featuredRef }
  )

  /* Grid animation */
  useGSAP(
    () => {
      if (!gridRef.current) return
      gsap.from(gridRef.current!.querySelectorAll('.article-card'), {
        y: 40,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: gridRef.current,
          start: 'top 85%',
          once: true,
        },
      })
    },
    { scope: gridRef }
  )

  /* Newsletter animation */
  useGSAP(
    () => {
      if (!newsletterRef.current) return
      gsap.from(newsletterRef.current!.querySelectorAll('.nl-fade'), {
        y: 30,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: newsletterRef.current,
          start: 'top 85%',
          once: true,
        },
      })
    },
    { scope: newsletterRef }
  )

  return (
    <div>
      {/* ═══════ Hero Section ═══════ */}
      <section ref={heroRef} className="bg-cream-warm pt-[80px] pb-12 px-6">
        <div className="max-w-[1100px] mx-auto text-center">
          {/* Breadcrumb */}
          <p className="text-text-secondary text-[13px] font-inter mb-6">
            <Link to={path('/')} className="hover:text-terracotta transition-colors">
              Accueil
            </Link>
            <span className="mx-2">&gt;</span>
            <span>Conseils immobiliers</span>
          </p>

          <h1 className="hero-title font-playfair text-[38px] md:text-[44px] font-medium text-midnight leading-tight mb-4">
            Conseils immobiliers &agrave; Marrakech
          </h1>
          <p className="hero-subtitle text-text-secondary text-[16px] font-inter max-w-[600px] mx-auto mb-8 leading-relaxed">
            Guides, tendances du march&eacute; et conseils pour acheter, vendre ou
            louer au Maroc.
          </p>

          {/* Category chips */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'hero-chip px-4 py-2 rounded-pill text-[13px] font-inter font-medium transition-all duration-200',
                  activeCategory === cat
                    ? 'bg-palm text-white'
                    : 'bg-sand/30 text-text-primary hover:bg-sand/50'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ Featured Article ═══════ */}
      {!activeCategory || activeCategory === 'Tous' || activeCategory === 'March&eacute;' ? (
        <section className="bg-white py-12 px-6">
          <div ref={featuredRef} className="max-w-[1100px] mx-auto">
            <div className="bg-white rounded-card border border-border-warm overflow-hidden shadow-card hover:shadow-card-hover transition-shadow">
              <div className="grid grid-cols-1 lg:grid-cols-[55%_45%]">
                {/* Image */}
                <div className="featured-image aspect-video lg:aspect-auto overflow-hidden">
                  <img
                    src={getImageUrl(featuredArticle.image, { width: 800, height: 500, resize: 'cover' })}
                    alt={featuredArticle.title}
                    className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-400"
                  />
                </div>

                {/* Content */}
                <div className="featured-content p-6 md:p-10 flex flex-col justify-center">
                  <span className="bg-palm text-white text-[11px] font-semibold px-2 py-1 rounded mb-4 inline-block self-start uppercase tracking-wide">
                    {featuredArticle.category}
                  </span>
                  <h2 className="font-playfair text-[22px] md:text-[28px] font-medium text-midnight leading-snug mb-4">
                    {featuredArticle.title}
                  </h2>
                  <p className="text-text-secondary text-[15px] md:text-[16px] font-inter leading-[1.7] mb-4 line-clamp-3">
                    {featuredArticle.excerpt}
                  </p>
                  <p className="text-text-secondary text-[13px] font-inter mb-5">
                    {featuredArticle.date} &middot; {featuredArticle.readTime} de
                    lecture
                  </p>
                  <Link
                    to={path('/conseils-immobiliers')}
                    className="text-terracotta text-[16px] font-inter font-medium hover:underline self-start"
                  >
                    Lire l&rsquo;article &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* ═══════ Article Grid ═══════ */}
      <section className="bg-white py-12 px-6">
        <div ref={gridRef} className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <Link
                key={article.title}
                to={path('/conseils-immobiliers')}
                className="article-card group bg-white rounded-card border border-border-warm overflow-hidden shadow-card hover:shadow-card-hover transition-all"
              >
                {/* Image */}
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={getImageUrl(article.image, { width: 600, height: 375, resize: 'cover' })}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-400"
                    loading="lazy"
                  />
                </div>

                {/* Content */}
                <div className="p-5">
                  {/* Category badge */}
                  <span
                    className={cn(
                      'text-[11px] font-semibold px-2 py-1 rounded mb-3 inline-block uppercase tracking-wide',
                      article.category === 'Achat' &&
                        'bg-terracotta/10 text-terracotta',
                      article.category === 'Investissement' &&
                        'bg-gold/20 text-midnight',
                      article.category === 'Quartiers' &&
                        'bg-palm/10 text-palm',
                      article.category === 'Fiscalit\u00E9' &&
                        'bg-sand/50 text-text-primary',
                      article.category === 'D\u00E9coration' &&
                        'bg-sand/50 text-text-primary',
                      (![
                        'Achat',
                        'Investissement',
                        'Quartiers',
                        'Fiscalit\u00E9',
                        'D\u00E9coration',
                      ].includes(article.category)) &&
                        'bg-sand/30 text-text-primary'
                    )}
                  >
                    {article.category}
                  </span>

                  <h3 className="font-playfair text-[16px] font-medium text-text-primary mb-2 line-clamp-2 group-hover:text-terracotta transition-colors leading-snug">
                    {article.title}
                  </h3>

                  <p className="text-text-secondary text-[14px] font-inter leading-relaxed mb-4 line-clamp-2">
                    {article.excerpt}
                  </p>

                  <div className="flex items-center gap-3 text-text-secondary text-[12px] font-inter">
                    <span>{article.date}</span>
                    <span className="w-1 h-1 rounded-full bg-text-secondary/40" />
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {article.readTime}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ Newsletter CTA ═══════ */}
      <section ref={newsletterRef} className="bg-midnight py-16 px-6">
        <div className="max-w-[600px] mx-auto text-center">
          <h3 className="nl-fade font-playfair text-[26px] md:text-[28px] font-medium text-white mb-3">
            Ne manquez aucune actualit&eacute; du march&eacute;
          </h3>
          <p className="nl-fade text-white/75 text-[16px] font-inter mb-8 leading-relaxed">
            Recevez nos analyses et conseils immobiliers directement dans
            votre bo&icirc;te mail.
          </p>
          <div className="nl-fade flex flex-col sm:flex-row gap-3 max-w-[480px] mx-auto mb-4">
            <input
              type="email"
              placeholder="Votre adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 h-[48px] px-4 rounded-lg bg-white font-inter text-[14px] text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              onClick={() => alert('Inscription bient\u00F4t disponible !')}
              className="h-[48px] px-6 bg-terracotta text-white font-inter text-[14px] font-semibold rounded-lg hover:bg-terracotta/90 transition-colors"
            >
              S&rsquo;inscrire
            </button>
          </div>
          <p className="nl-fade text-white/50 text-[12px] font-inter">
            D&eacute;sinscription &agrave; tout moment. Aucun spam.
          </p>
        </div>
      </section>
    </div>
  )
}
