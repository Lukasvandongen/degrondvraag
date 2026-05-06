import { useEffect, useRef, useState } from "react";
import { mergeAttributes } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Circle,
  Heading1,
  Heading2,
  ImagePlus,
  Italic,
  Link,
  List,
  ListOrdered,
  Maximize2,
  Pilcrow,
  SlidersHorizontal,
  Type,
  Underline as UnderlineIcon,
} from "lucide-react";

const editorCopy = {
  nl: {
    bold: "Vet",
    italic: "Cursief",
    underline: "Onderstrepen",
    h1: "Kop 1",
    h2: "Kop 2",
    bullet: "Lijst",
    ordered: "Genummerde lijst",
    paragraph: "Paragraaf",
    upload: "Afbeelding uploaden",
    url: "Afbeelding via URL",
    urlPrompt: "Plak de afbeeldings-URL",
    uploading: "Afbeelding uploaden...",
    uploadError: "Afbeelding uploaden is mislukt.",
    mediaPanel: "Afbeelding bewerken",
    mediaHint: "Selecteer een afbeelding in de tekst om formaat, vorm en plaatsing te wijzigen.",
    width: "Breedte",
    height: "Hoogte",
    heightAuto: "0 is auto",
    shape: "Vorm",
    objectFit: "Vulling",
    alt: "Alt tekst",
    caption: "Bijschrift of bron",
    insertCaption: "Bijschrift invoegen",
    alignLeft: "Links",
    alignCenter: "Midden",
    alignRight: "Rechts",
    rectangle: "Strak",
    rounded: "Rond",
    circle: "Cirkel",
    contain: "Passend",
    cover: "Vullend",
  },
  en: {
    bold: "Bold",
    italic: "Italic",
    underline: "Underline",
    h1: "Heading 1",
    h2: "Heading 2",
    bullet: "Bullet list",
    ordered: "Numbered list",
    paragraph: "Paragraph",
    upload: "Upload image",
    url: "Image from URL",
    urlPrompt: "Paste the image URL",
    uploading: "Uploading image...",
    uploadError: "Image upload failed.",
    mediaPanel: "Edit image",
    mediaHint: "Select an image in the text to adjust size, shape and placement.",
    width: "Width",
    height: "Height",
    heightAuto: "0 is auto",
    shape: "Shape",
    objectFit: "Fit",
    alt: "Alt text",
    caption: "Caption or source",
    insertCaption: "Insert caption",
    alignLeft: "Left",
    alignCenter: "Center",
    alignRight: "Right",
    rectangle: "Sharp",
    rounded: "Rounded",
    circle: "Circle",
    contain: "Contain",
    cover: "Cover",
  },
};

const EditableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      alt: {
        default: "",
      },
      title: {
        default: "",
      },
      width: {
        default: "100%",
      },
      height: {
        default: "auto",
      },
      align: {
        default: "center",
      },
      radius: {
        default: "8px",
      },
      objectFit: {
        default: "cover",
      },
    };
  },
  renderHTML({ HTMLAttributes }) {
    const { align, width, height, radius, objectFit, style, ...attributes } = HTMLAttributes;
    const margin =
      align === "right"
        ? "margin-left:auto;margin-right:0;"
        : align === "left"
          ? "margin-left:0;margin-right:auto;"
          : "margin-left:auto;margin-right:auto;";

    return [
      "img",
      mergeAttributes(attributes, {
        style: [
          "display:block;",
          "max-width:100%;",
          width ? `width:${width};` : "",
          height && height !== "auto" ? `height:${height};` : "height:auto;",
          radius ? `border-radius:${radius};` : "",
          objectFit ? `object-fit:${objectFit};` : "",
          margin,
          style || "",
        ].join(""),
      }),
    ];
  },
});

function getToolbarItems(t) {
  return [
    { name: t.bold, icon: Bold, action: (editor) => editor.chain().focus().toggleBold().run(), active: "bold" },
    { name: t.italic, icon: Italic, action: (editor) => editor.chain().focus().toggleItalic().run(), active: "italic" },
    {
      name: t.underline,
      icon: UnderlineIcon,
      action: (editor) => editor.chain().focus().toggleUnderline().run(),
      active: "underline",
    },
    {
      name: t.h1,
      icon: Heading1,
      action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: (editor) => editor.isActive("heading", { level: 1 }),
    },
    {
      name: t.h2,
      icon: Heading2,
      action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: (editor) => editor.isActive("heading", { level: 2 }),
    },
    {
      name: t.bullet,
      icon: List,
      action: (editor) => editor.chain().focus().toggleBulletList().run(),
      active: "bulletList",
    },
    {
      name: t.ordered,
      icon: ListOrdered,
      action: (editor) => editor.chain().focus().toggleOrderedList().run(),
      active: "orderedList",
    },
    {
      name: t.paragraph,
      icon: Pilcrow,
      action: (editor) => editor.chain().focus().setParagraph().run(),
      active: "paragraph",
    },
  ];
}

function escapeHTML(value = "") {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default function TipTapEditor({ value, onChange, language = "nl", onUploadImage }) {
  const t = editorCopy[language] || editorCopy.nl;
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  const editor = useEditor({
    extensions: [StarterKit, Underline, EditableImage.configure({ inline: false, allowBase64: false })],
    content: value || "",
    onUpdate({ editor: activeEditor }) {
      onChange(activeEditor.getHTML());
      setSelectedImage(activeEditor.isActive("image") ? activeEditor.getAttributes("image") : null);
    },
    onSelectionUpdate({ editor: activeEditor }) {
      setSelectedImage(activeEditor.isActive("image") ? activeEditor.getAttributes("image") : null);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-invert min-h-[360px] max-w-none rounded-lg border border-white/10 bg-slate-950/70 p-4 text-base text-slate-100 outline-none prose-headings:text-white prose-a:text-sky-200 prose-img:my-6 focus:border-sky-300/35",
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

  const insertImage = (src, name = "") => {
    editor
      ?.chain()
      .focus()
      .setImage({
        src,
        alt: name,
        title: "",
        width: "100%",
        height: "auto",
        align: "center",
        radius: "8px",
        objectFit: "cover",
      })
      .run();
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !editor) return;

    try {
      setUploading(true);
      setUploadError("");
      const url = onUploadImage ? await onUploadImage(file) : URL.createObjectURL(file);
      insertImage(url, file.name);
    } catch (err) {
      console.error("Image upload failed:", err);
      setUploadError(t.uploadError);
    } finally {
      setUploading(false);
    }
  };

  const insertImageUrl = () => {
    const url = window.prompt(t.urlPrompt);
    if (url) insertImage(url.trim());
  };

  const updateImage = (attrs) => {
    editor?.chain().focus().updateAttributes("image", attrs).run();
    setSelectedImage((current) => ({ ...(current || {}), ...attrs }));
  };

  const insertCaption = () => {
    const caption = selectedImage?.title?.trim();
    if (!caption) return;
    editor?.chain().focus().insertContent(`<p><em>${escapeHTML(caption)}</em></p>`).run();
  };

  if (!editor) {
    return <div className="min-h-[360px] rounded-lg border border-white/10 bg-slate-950/70" />;
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2 rounded-lg border border-white/10 bg-slate-950/55 p-2">
        {getToolbarItems(t).map((item) => {
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
        <span className="mx-1 h-9 w-px bg-white/10" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-slate-300 transition hover:border-sky-300/30 hover:text-white"
          disabled={uploading}
        >
          <ImagePlus size={16} />
          {uploading ? t.uploading : t.upload}
        </button>
        <button
          type="button"
          onClick={insertImageUrl}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-slate-300 transition hover:border-sky-300/30 hover:text-white"
        >
          <Link size={15} />
          {t.url}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>

      {uploadError && (
        <p className="mb-2 rounded-md border border-red-300/20 bg-red-300/10 px-3 py-2 text-sm text-red-100">
          {uploadError}
        </p>
      )}

      <div className="mb-2 rounded-lg border border-white/10 bg-slate-950/55 p-3">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
          <SlidersHorizontal size={16} />
          {t.mediaPanel}
        </div>
        {selectedImage ? (
          <div className="grid gap-3 lg:grid-cols-12">
            <label className="space-y-1 lg:col-span-3">
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Maximize2 size={13} />
                {t.width}
              </span>
              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={Number.parseInt(selectedImage.width, 10) || 100}
                onChange={(event) => updateImage({ width: `${event.target.value}%` })}
                className="w-full accent-sky-300"
              />
            </label>
            <label className="space-y-1 lg:col-span-2">
              <span className="text-xs text-slate-400">{t.height}</span>
              <input
                type="number"
                min="0"
                max="1400"
                value={selectedImage.height === "auto" ? 0 : Number.parseInt(selectedImage.height, 10) || 0}
                onChange={(event) =>
                  updateImage({ height: Number(event.target.value) <= 0 ? "auto" : `${event.target.value}px` })
                }
                className="field py-2"
                title={t.heightAuto}
              />
            </label>
            <label className="space-y-1 lg:col-span-2">
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Circle size={12} />
                {t.shape}
              </span>
              <select
                className="field py-2"
                value={selectedImage.radius || "8px"}
                onChange={(event) => updateImage({ radius: event.target.value })}
              >
                <option value="0px">{t.rectangle}</option>
                <option value="8px">{t.rounded}</option>
                <option value="999px">{t.circle}</option>
              </select>
            </label>
            <label className="space-y-1 lg:col-span-2">
              <span className="text-xs text-slate-400">{t.objectFit}</span>
              <select
                className="field py-2"
                value={selectedImage.objectFit || "cover"}
                onChange={(event) => updateImage({ objectFit: event.target.value })}
              >
                <option value="cover">{t.cover}</option>
                <option value="contain">{t.contain}</option>
              </select>
            </label>
            <div className="space-y-1 lg:col-span-3">
              <span className="text-xs text-slate-400">{t.alignCenter}</span>
              <div className="flex gap-2">
                {[
                  { value: "left", icon: AlignLeft, label: t.alignLeft },
                  { value: "center", icon: AlignCenter, label: t.alignCenter },
                  { value: "right", icon: AlignRight, label: t.alignRight },
                ].map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateImage({ align: option.value })}
                      className={`grid h-10 flex-1 place-items-center rounded-md border transition ${
                        selectedImage.align === option.value
                          ? "border-sky-300/45 bg-sky-300/14 text-sky-100"
                          : "border-white/10 bg-white/5 text-slate-300 hover:border-sky-300/30"
                      }`}
                      aria-label={option.label}
                      title={option.label}
                    >
                      <Icon size={16} />
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="space-y-1 lg:col-span-5">
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Type size={12} />
                {t.alt}
              </span>
              <input
                className="field py-2"
                value={selectedImage.alt || ""}
                onChange={(event) => updateImage({ alt: event.target.value })}
              />
            </label>
            <label className="space-y-1 lg:col-span-5">
              <span className="text-xs text-slate-400">{t.caption}</span>
              <input
                className="field py-2"
                value={selectedImage.title || ""}
                onChange={(event) => updateImage({ title: event.target.value })}
              />
            </label>
            <button
              type="button"
              onClick={insertCaption}
              className="self-end rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:border-sky-300/30 hover:text-white lg:col-span-2"
            >
              {t.insertCaption}
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-500">{t.mediaHint}</p>
        )}
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
