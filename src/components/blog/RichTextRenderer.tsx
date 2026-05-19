import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'

interface RichTextRendererProps {
  /** JSON de ProseMirror guardado por RichTextEditor. */
  content: unknown | null
}

/**
 * Render read-only del contenido TipTap.
 * Usa el mismo set de extensiones que el editor pero con `editable: false`.
 * Tipografía editorial: cuerpo en Newsreader (serif), headings en Schibsted Grotesk.
 */
export default function RichTextRenderer({ content }: RichTextRendererProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-terracotta underline underline-offset-2 hover:no-underline',
          rel: 'noopener noreferrer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-card my-8 max-w-full h-auto',
        },
      }),
    ],
    content: content || '',
    editable: false,
    editorProps: {
      attributes: {
        class:
          'prose prose-lg prose-stone max-w-none font-serif text-ink ' +
          // Headings con la display sans Schibsted Grotesk
          'prose-headings:font-display prose-headings:text-ink prose-headings:tracking-tight ' +
          'prose-h1:text-[36px] md:prose-h1:text-[44px] prose-h1:font-medium prose-h1:mt-12 prose-h1:mb-4 ' +
          'prose-h2:text-[28px] md:prose-h2:text-[32px] prose-h2:font-medium prose-h2:mt-10 prose-h2:mb-3 ' +
          'prose-h3:text-[22px] md:prose-h3:text-[24px] prose-h3:font-medium prose-h3:mt-8 prose-h3:mb-2 ' +
          // Cuerpo
          'prose-p:text-[17px] md:prose-p:text-[18px] prose-p:leading-relaxed prose-p:my-5 ' +
          // Citas
          'prose-blockquote:border-l-2 prose-blockquote:border-terracotta prose-blockquote:pl-6 ' +
          'prose-blockquote:font-serif prose-blockquote:italic prose-blockquote:text-stone ' +
          // Listas
          'prose-ul:my-5 prose-ol:my-5 prose-li:my-1 ' +
          // Strong
          'prose-strong:text-ink prose-strong:font-semibold',
      },
    },
  })

  if (!editor) return null
  return <EditorContent editor={editor} />
}
