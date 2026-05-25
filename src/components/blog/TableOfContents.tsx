import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import { extractToc, type TocItem } from './RichTextRenderer'

interface TocProps {
  content: unknown
  /** Selector del contenedor donde están los headings (para observar scroll). */
  scopeSelector?: string
}

/**
 * Tabla de contenidos inspirada en Shopify Enterprise Blog.
 *
 * - Desktop: lista vertical sticky en sidebar izquierdo.
 * - Mobile: desplegable colapsable.
 * - Heading activo resaltado vía IntersectionObserver (scroll spy).
 * - Click en un item: smooth scroll al heading con offset por navbar fijo.
 */
export default function TableOfContents({ content, scopeSelector = '.blog-prose' }: TocProps) {
  const { t } = useTranslation('blog')
  const items = useMemo<TocItem[]>(() => extractToc(content), [content])
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id || null)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Scroll spy: marcar el heading activo cuando entra en viewport
  useEffect(() => {
    if (items.length === 0) return
    const scope = document.querySelector(scopeSelector) || document.body
    const headings = items
      .map((it) => scope.querySelector(`#${CSS.escape(it.id)}`))
      .filter((el): el is HTMLElement => !!el)
    if (!headings.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Encontrar la primera entrada que entra en viewport
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 },
    )

    headings.forEach((h) => observer.observe(h))
    return () => observer.disconnect()
  }, [items, scopeSelector])

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault()
    const target = document.getElementById(id)
    if (!target) return
    const top = target.getBoundingClientRect().top + window.scrollY - 90
    window.scrollTo({ top, behavior: 'smooth' })
    setActiveId(id)
    setMobileOpen(false)
    // Actualizar URL hash sin recargar
    history.replaceState(null, '', `#${id}`)
  }

  if (items.length === 0) return null

  const eyebrow = t('toc.title')
  const activeItem = items.find((i) => i.id === activeId) || items[0]

  return (
    <>
      {/* ─── MOBILE: dropdown colapsable ─── */}
      <div className="lg:hidden mb-8">
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-cream-warm border border-border-warm rounded-lg text-left transition-colors"
          aria-expanded={mobileOpen}
        >
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-inter font-semibold text-terracotta uppercase tracking-[0.15em] mb-0.5">
              {eyebrow}
            </p>
            <p className="text-[14px] font-inter text-ink font-medium truncate">
              {activeItem.text}
            </p>
          </div>
          <ChevronDown
            size={18}
            className={`text-stone shrink-0 transition-transform ${mobileOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {mobileOpen && (
          <nav className="mt-2 bg-white border border-border-warm rounded-lg p-2 shadow-card">
            <ul className="space-y-0.5">
              {items.map((it) => (
                <li key={it.id}>
                  <a
                    href={`#${it.id}`}
                    onClick={(e) => handleClick(e, it.id)}
                    className={`block px-3 py-2 rounded-md text-[14px] font-inter transition-colors ${
                      it.level === 3 ? 'pl-7 text-[13px]' : ''
                    } ${
                      activeId === it.id
                        ? 'bg-terracotta/10 text-terracotta font-medium'
                        : 'text-text-secondary hover:bg-cream-warm hover:text-ink'
                    }`}
                  >
                    {it.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      {/* ─── DESKTOP: sidebar sticky ─── */}
      <nav
        className="hidden lg:block sticky top-24"
        aria-label="Table of contents"
      >
        <p className="text-[10.5px] font-inter font-semibold text-terracotta uppercase tracking-[0.18em] mb-4">
          {eyebrow}
        </p>
        <ul className="space-y-0.5 border-l border-border-warm/60">
          {items.map((it) => (
            <li key={it.id}>
              <a
                href={`#${it.id}`}
                onClick={(e) => handleClick(e, it.id)}
                className={`block py-1.5 pr-2 text-[13px] font-inter leading-[1.45] transition-all -ml-px border-l-2 ${
                  it.level === 3 ? 'pl-8 text-[12.5px]' : 'pl-4'
                } ${
                  activeId === it.id
                    ? 'border-terracotta text-terracotta font-medium'
                    : 'border-transparent text-text-secondary hover:text-ink hover:border-stone/40'
                }`}
              >
                {it.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
