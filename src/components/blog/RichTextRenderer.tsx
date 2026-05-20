import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { useLang } from '@/hooks/useLang'

// ============================================================================
// Tipos — ProseMirror JSON (subset que produce nuestro RichTextEditor)
// ============================================================================

type Mark = { type: 'bold' | 'italic' | 'strike' | 'code' | 'link'; attrs?: { href?: string } }

type TextNode = { type: 'text'; text: string; marks?: Mark[] }

type InlineNode = TextNode | { type: 'hardBreak' }

type BlockNode =
  | { type: 'paragraph'; content?: InlineNode[] }
  | { type: 'heading'; attrs: { level: 1 | 2 | 3 | 4 }; content?: InlineNode[] }
  | { type: 'bulletList'; content?: ListItemNode[] }
  | { type: 'orderedList'; content?: ListItemNode[] }
  | { type: 'blockquote'; content?: BlockNode[] }
  | { type: 'image'; attrs: { src: string; alt?: string | null } }
  | { type: 'horizontalRule' }

type ListItemNode = { type: 'listItem'; content?: BlockNode[] }

type DocNode = { type: 'doc'; content?: BlockNode[] }

interface RichTextRendererProps {
  content: unknown | null
}

// ============================================================================
// Renderer interno — recorre el árbol ProseMirror y emite JSX editorial.
// Sin dependencia de TipTap en runtime (más ligero, más controlable).
// ============================================================================

function renderInline(nodes: InlineNode[] | undefined): ReactNode {
  if (!nodes) return null
  return nodes.map((n, i) => {
    if (n.type === 'hardBreak') return <br key={i} />
    let el: ReactNode = n.text
    for (const m of n.marks || []) {
      if (m.type === 'bold') el = <strong key={`b-${i}`}>{el}</strong>
      else if (m.type === 'italic') el = <em key={`i-${i}`}>{el}</em>
      else if (m.type === 'strike') el = <s key={`s-${i}`}>{el}</s>
      else if (m.type === 'code')
        el = (
          <code key={`c-${i}`} className="bg-cream-warm/80 px-1.5 py-0.5 rounded text-[0.92em]">
            {el}
          </code>
        )
      else if (m.type === 'link')
        el = (
          <a
            key={`l-${i}`}
            href={m.attrs?.href || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-terracotta underline underline-offset-[3px] decoration-terracotta/40 hover:decoration-terracotta transition"
          >
            {el}
          </a>
        )
    }
    return <Fragment key={i}>{el}</Fragment>
  })
}

function renderBlock(node: BlockNode, key: number | string): ReactNode {
  switch (node.type) {
    case 'paragraph':
      // Párrafo vacío (común en TipTap) → no renderizar, evita huecos
      if (!node.content || node.content.length === 0) return null
      return (
        <p
          key={key}
          className="font-serif text-ink text-[17px] md:text-[18px] leading-[1.75] my-5"
        >
          {renderInline(node.content)}
        </p>
      )

    case 'heading': {
      const level = node.attrs.level
      const text = renderInline(node.content)
      if (level === 1)
        return (
          <h1
            key={key}
            className="font-display text-ink text-[32px] md:text-[40px] font-medium tracking-tight leading-[1.15] mt-14 mb-5"
          >
            {text}
          </h1>
        )
      if (level === 2)
        return (
          <h2
            key={key}
            className="font-display text-ink text-[26px] md:text-[32px] font-medium tracking-tight leading-[1.2] mt-14 mb-4 pt-2 border-t border-border-warm/70"
          >
            {text}
          </h2>
        )
      if (level === 3)
        return (
          <h3
            key={key}
            className="font-display text-ink text-[20px] md:text-[22px] font-semibold tracking-tight leading-snug mt-10 mb-3"
          >
            {text}
          </h3>
        )
      return (
        <h4
          key={key}
          className="font-display text-ink text-[18px] font-semibold mt-8 mb-2"
        >
          {text}
        </h4>
      )
    }

    case 'bulletList':
      return (
        <ul
          key={key}
          className="list-none my-6 space-y-3 pl-0 font-serif text-ink text-[17px] md:text-[18px] leading-[1.7]"
        >
          {(node.content || []).map((li, i) => (
            <li key={i} className="relative pl-7">
              <span className="absolute left-0 top-[0.7em] w-3 h-px bg-terracotta" />
              {(li.content || []).map((child, j) => {
                // Dentro de un <li> los párrafos no deben repetir el margen
                if (child.type === 'paragraph') {
                  return (
                    <span key={j} className="block">
                      {renderInline(child.content)}
                    </span>
                  )
                }
                return renderBlock(child, j)
              })}
            </li>
          ))}
        </ul>
      )

    case 'orderedList':
      return (
        <ol
          key={key}
          className="list-decimal list-outside pl-6 my-6 space-y-2 font-serif text-ink text-[17px] md:text-[18px] leading-[1.7] marker:text-terracotta marker:font-semibold"
        >
          {(node.content || []).map((li, i) => (
            <li key={i} className="pl-2">
              {(li.content || []).map((child, j) => {
                if (child.type === 'paragraph') {
                  return (
                    <span key={j} className="block">
                      {renderInline(child.content)}
                    </span>
                  )
                }
                return renderBlock(child, j)
              })}
            </li>
          ))}
        </ol>
      )

    case 'blockquote':
      return (
        <blockquote
          key={key}
          className="my-10 pl-6 border-l-[3px] border-terracotta font-serif italic text-stone text-[19px] md:text-[20px] leading-[1.6]"
        >
          {(node.content || []).map((child, j) => renderBlock(child, j))}
        </blockquote>
      )

    case 'image':
      return (
        <figure key={key} className="my-10">
          <img
            src={node.attrs.src}
            alt={node.attrs.alt || ''}
            className="w-full h-auto rounded-card shadow-card"
            loading="lazy"
          />
          {node.attrs.alt && (
            <figcaption className="mt-3 text-center text-stone text-[13px] font-inter italic">
              {node.attrs.alt}
            </figcaption>
          )}
        </figure>
      )

    case 'horizontalRule':
      return (
        <hr
          key={key}
          className="my-12 border-0 h-px bg-gradient-to-r from-transparent via-border-warm to-transparent"
        />
      )

    default:
      return null
  }
}

// ============================================================================
// Inline CTA — "pausa de lectura" que aparece a media lectura en TODOS los
// artículos. Texto editable vía locales/[lang]/blog.json → inlineCta.*
// ============================================================================

function InlineCta() {
  const { t } = useTranslation('blog')
  const { path } = useLang()
  return (
    <aside
      role="complementary"
      aria-label="Atlas Rouge — call to action"
      className="my-14 bg-cream-warm border border-border-warm rounded-card px-7 py-9 md:px-10 md:py-11 not-prose"
    >
      <span className="block text-terracotta text-[11px] font-inter font-semibold uppercase tracking-[2.5px] mb-3">
        {t('inlineCta.eyebrow', 'Pausa Atlas Rouge')}
      </span>
      <h3 className="font-display text-ink text-[24px] md:text-[28px] font-medium leading-tight mb-3">
        {t('inlineCta.title', 'Invierta en Marrakech con acompañamiento experto')}
      </h3>
      <p className="font-serif text-stone text-[16px] md:text-[17px] leading-relaxed mb-6 max-w-[640px]">
        {t(
          'inlineCta.description',
          'Descubra nuestra selección de villas, riads y apartamentos seleccionados por nuestros asesores locales. Análisis de mercado, fiscalidad y acompañamiento incluidos.',
        )}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to={path('/buy')}
          className="inline-flex items-center justify-center gap-2 bg-ink hover:bg-ink/85 text-cream-warm px-5 py-3 rounded-pill font-inter text-[13px] font-semibold transition-colors"
        >
          {t('inlineCta.primary', 'Ver propiedades disponibles')}
          <ArrowRight size={15} />
        </Link>
        <Link
          to={path('/contact')}
          className="inline-flex items-center justify-center gap-2 bg-white border border-border-warm hover:border-terracotta hover:text-terracotta text-ink px-5 py-3 rounded-pill font-inter text-[13px] font-semibold transition-colors"
        >
          <MessageCircle size={15} />
          {t('inlineCta.secondary', 'Hablar con un asesor')}
        </Link>
      </div>
    </aside>
  )
}

// ============================================================================
// Lógica de inyección semántica del CTA
// Estrategia: insertarlo justo antes del 3er heading nivel 2.
// Si el artículo tiene <3 H2, se inserta antes del último H2.
// Si tiene 0 H2, se inserta a mitad del documento.
// ============================================================================

function computeInsertionIndex(blocks: BlockNode[]): number {
  const h2Indices = blocks
    .map((b, i) => (b.type === 'heading' && b.attrs.level === 2 ? i : -1))
    .filter((i) => i >= 0)

  if (h2Indices.length >= 3) return h2Indices[2] // antes del 3er H2
  if (h2Indices.length >= 1) return h2Indices[h2Indices.length - 1] // último H2
  return Math.floor(blocks.length / 2) // sin H2: midpoint
}

// ============================================================================
// Componente público
// ============================================================================

export default function RichTextRenderer({ content }: RichTextRendererProps) {
  if (!content || typeof content !== 'object') return null
  const doc = content as DocNode
  if (doc.type !== 'doc' || !doc.content?.length) return null

  const blocks = doc.content
  const insertAt = computeInsertionIndex(blocks)

  return (
    <div className="blog-prose">
      {blocks.map((block, i) => (
        <Fragment key={i}>
          {i === insertAt && <InlineCta />}
          {renderBlock(block, i)}
        </Fragment>
      ))}
    </div>
  )
}
