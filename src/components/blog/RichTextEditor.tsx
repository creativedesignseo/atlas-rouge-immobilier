import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo2,
  Redo2,
} from 'lucide-react'

interface RichTextEditorProps {
  /** Contenido inicial — JSON de ProseMirror, HTML o texto plano. */
  value: unknown | null
  onChange: (json: unknown, plainText: string) => void
  placeholder?: string
}

/**
 * Editor visual estilo Notion para artículos de blog.
 * Guarda el contenido como JSON estructurado (ProseMirror / TipTap).
 *
 * - Toolbar fija con botones de formato comunes
 * - Sin sintaxis Markdown — solo clicks
 * - Soporta H1/H2/H3, listas, citas, links, imágenes
 */
export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Escribe aquí el contenido del artículo…',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-terracotta underline underline-offset-2 hover:no-underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-card my-6 max-w-full h-auto',
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass:
          'before:content-[attr(data-placeholder)] before:text-stone/50 before:float-left before:pointer-events-none before:h-0',
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON(), editor.getText())
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-stone max-w-none focus:outline-none min-h-[400px] px-6 py-5 font-serif text-ink',
      },
    },
  })

  // Si el contenido inicial cambia desde fuera (ej. cargar al editar), actualizar
  useEffect(() => {
    if (!editor) return
    const current = editor.getJSON()
    if (JSON.stringify(current) !== JSON.stringify(value || '')) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  if (!editor) return null

  return (
    <div className="border border-border-warm rounded-card overflow-hidden bg-white">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

function Toolbar({ editor }: { editor: Editor }) {
  const btn = (
    onClick: () => boolean | void,
    isActive: boolean,
    Icon: typeof Bold,
    label: string,
  ) => (
    <button
      type="button"
      onClick={() => {
        onClick()
      }}
      title={label}
      aria-label={label}
      className={`p-2 rounded-md transition-colors ${
        isActive
          ? 'bg-terracotta/15 text-terracotta'
          : 'text-stone hover:bg-cream-warm hover:text-ink'
      }`}
    >
      <Icon size={16} strokeWidth={1.75} />
    </button>
  )

  const addLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('URL del enlace:', previous || 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const addImage = () => {
    const url = window.prompt('URL de la imagen:', 'https://')
    if (!url) return
    editor.chain().focus().setImage({ src: url }).run()
  }

  return (
    <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-border-warm bg-cream-warm/40 sticky top-0 z-10">
      {btn(() => editor.chain().focus().toggleBold().run(), editor.isActive('bold'), Bold, 'Negrita')}
      {btn(
        () => editor.chain().focus().toggleItalic().run(),
        editor.isActive('italic'),
        Italic,
        'Cursiva',
      )}
      {btn(
        () => editor.chain().focus().toggleStrike().run(),
        editor.isActive('strike'),
        Strikethrough,
        'Tachado',
      )}
      <div className="w-px h-5 bg-border-warm mx-1" />
      {btn(
        () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        editor.isActive('heading', { level: 1 }),
        Heading1,
        'Título 1',
      )}
      {btn(
        () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        editor.isActive('heading', { level: 2 }),
        Heading2,
        'Título 2',
      )}
      {btn(
        () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        editor.isActive('heading', { level: 3 }),
        Heading3,
        'Título 3',
      )}
      <div className="w-px h-5 bg-border-warm mx-1" />
      {btn(
        () => editor.chain().focus().toggleBulletList().run(),
        editor.isActive('bulletList'),
        List,
        'Lista',
      )}
      {btn(
        () => editor.chain().focus().toggleOrderedList().run(),
        editor.isActive('orderedList'),
        ListOrdered,
        'Lista numerada',
      )}
      {btn(
        () => editor.chain().focus().toggleBlockquote().run(),
        editor.isActive('blockquote'),
        Quote,
        'Cita',
      )}
      <div className="w-px h-5 bg-border-warm mx-1" />
      {btn(addLink, editor.isActive('link'), LinkIcon, 'Enlace')}
      {btn(addImage, false, ImageIcon, 'Imagen')}
      <div className="w-px h-5 bg-border-warm mx-1" />
      {btn(() => editor.chain().focus().undo().run(), false, Undo2, 'Deshacer')}
      {btn(() => editor.chain().focus().redo().run(), false, Redo2, 'Rehacer')}
    </div>
  )
}
