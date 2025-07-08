// TipTapEditor.jsx
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'

export default function TipTapEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
    ],
    content: value,
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert min-h-[200px] max-w-none outline-none p-4 bg-white dark:bg-gray-900 rounded shadow text-base',
        style: 'font-family: Inter, ui-sans-serif, system-ui, sans-serif;',
      },
    }
  })

  // Optioneel: toolbar
  return (
    <div>
      <div className="mb-2 flex gap-2 flex-wrap">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'font-bold text-blue-700' : ''}>Bold</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'italic text-blue-700' : ''}>Italic</button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'underline text-blue-700' : ''}>Underline</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}>• Lijst</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. Lijst</button>
        <button type="button" onClick={() => editor.chain().focus().setParagraph().run()}>Paragraaf</button>
        <button type="button" onClick={() => editor.chain().focus().setHardBreak().run()}>↵ Enter</button>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
