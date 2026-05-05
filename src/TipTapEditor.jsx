import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import {
  Bold,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Pilcrow,
  Underline as UnderlineIcon,
} from "lucide-react";

const toolbarItems = [
  { name: "Vet", icon: Bold, action: (editor) => editor.chain().focus().toggleBold().run(), active: "bold" },
  { name: "Cursief", icon: Italic, action: (editor) => editor.chain().focus().toggleItalic().run(), active: "italic" },
  {
    name: "Onderstrepen",
    icon: UnderlineIcon,
    action: (editor) => editor.chain().focus().toggleUnderline().run(),
    active: "underline",
  },
  {
    name: "Kop 1",
    icon: Heading1,
    action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    isActive: (editor) => editor.isActive("heading", { level: 1 }),
  },
  {
    name: "Kop 2",
    icon: Heading2,
    action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: (editor) => editor.isActive("heading", { level: 2 }),
  },
  {
    name: "Lijst",
    icon: List,
    action: (editor) => editor.chain().focus().toggleBulletList().run(),
    active: "bulletList",
  },
  {
    name: "Genummerde lijst",
    icon: ListOrdered,
    action: (editor) => editor.chain().focus().toggleOrderedList().run(),
    active: "orderedList",
  },
  {
    name: "Paragraaf",
    icon: Pilcrow,
    action: (editor) => editor.chain().focus().setParagraph().run(),
    active: "paragraph",
  },
];

export default function TipTapEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: value || "",
    onUpdate({ editor: activeEditor }) {
      onChange(activeEditor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-invert min-h-[320px] max-w-none rounded-lg border border-white/10 bg-slate-950/70 p-4 text-base text-slate-100 outline-none prose-headings:text-white prose-a:text-sky-200 focus:border-sky-300/35",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const nextValue = value || "";
    if (editor.getHTML() !== nextValue) {
      editor.commands.setContent(nextValue, false);
    }
  }, [editor, value]);

  if (!editor) {
    return <div className="min-h-[320px] rounded-lg border border-white/10 bg-slate-950/70" />;
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2 rounded-lg border border-white/10 bg-slate-950/55 p-2">
        {toolbarItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive ? item.isActive(editor) : editor.isActive(item.active);
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => item.action(editor)}
              className={`grid h-9 w-9 place-items-center rounded-md border transition ${
                active
                  ? "border-sky-300/45 bg-sky-300/14 text-sky-100"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-sky-300/30 hover:text-white"
              }`}
              aria-label={item.name}
              title={item.name}
            >
              <Icon size={17} />
            </button>
          );
        })}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
