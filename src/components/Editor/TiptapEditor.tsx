'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useState } from 'react';
import { 
  Bold, Italic, List, ListOrdered, Quote, 
  Heading1, Heading2, Code, Undo, Redo, Loader2, CheckCircle2 
} from 'lucide-react';
import { cn } from '@/lib/utils'; // Falls du keine cn utility hast, nutze einfaches Template Literal oder installiere clsx

// Fallback für cn, falls du es nicht hast
function classNames(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

interface EditorProps {
  initialTitle?: string;
  initialContent?: string;
  onSave: (title: string, content: string) => Promise<void>;
  isSaving: boolean;
}

export default function Editor({ initialTitle = '', initialContent = '', onSave, isSaving }: EditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Schreib etwas Geniales...',
        emptyEditorClass: 'is-editor-empty before:content-[attr(data-placeholder)] before:text-zinc-500 before:float-left before:pointer-events-none',
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-zinc dark:prose-invert max-w-none focus:outline-none min-h-[500px]',
      },
    },
  });

  // Autosave Logic mit Debounce
  useEffect(() => {
    if (!editor) return;

    const saveTimer = setTimeout(() => {
      // Nur speichern, wenn sich etwas geändert hat oder initial geladen wurde
      const currentContent = editor.getHTML();
      // Einfacher Check um unnötige Calls zu vermeiden (könnte man verfeinern)
      onSave(title, currentContent).then(() => setLastSaved(new Date()));
    }, 1000); // 1 Sekunde Wartezeit nach dem Tippen

    return () => clearTimeout(saveTimer);
  }, [title, editor?.state.doc.content, onSave]); // Abhängig von Content-Änderung

  if (!editor) return null;

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 animate-in fade-in duration-500">
      
      {/* STATUS BAR OBEN RECHTS */}
      <div className="fixed top-20 right-6 md:right-12 z-40 flex items-center gap-2 text-xs font-mono text-zinc-500 bg-zinc-900/50 backdrop-blur border border-zinc-800 px-3 py-1.5 rounded-full">
        {isSaving ? (
          <>
            <Loader2 size={12} className="animate-spin text-cyan-400" />
            <span>Speichere...</span>
          </>
        ) : lastSaved ? (
          <>
            <CheckCircle2 size={12} className="text-emerald-500" />
            <span>Gespeichert {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</span>
          </>
        ) : (
          <span>Bereit</span>
        )}
      </div>

      {/* TITEL INPUT */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Unbenannte Notiz"
        className="w-full text-5xl font-black bg-transparent border-none outline-none placeholder:text-zinc-700 text-zinc-100 mb-8"
      />

      {/* TOOLBAR (Sticky) */}
      <div className="sticky top-4 z-30 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-xl p-2 mb-8 flex flex-wrap gap-1 shadow-xl">
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} icon={<Bold size={18} />} />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} icon={<Italic size={18} />} />
        <div className="w-px h-6 bg-zinc-800 mx-1 self-center" />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} icon={<Heading1 size={18} />} />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} icon={<Heading2 size={18} />} />
        <div className="w-px h-6 bg-zinc-800 mx-1 self-center" />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} icon={<List size={18} />} />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} icon={<ListOrdered size={18} />} />
        <div className="w-px h-6 bg-zinc-800 mx-1 self-center" />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} icon={<Code size={18} />} />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} icon={<Quote size={18} />} />
        <div className="ml-auto flex gap-1">
            <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} isActive={false} icon={<Undo size={18} />} />
            <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} isActive={false} icon={<Redo size={18} />} />
        </div>
      </div>

      {/* EDITOR AREA */}
      <EditorContent editor={editor} />
    </div>
  );
}

// Kleiner Helper Button
function ToolbarBtn({ onClick, isActive, icon }: { onClick: () => void, isActive: boolean, icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        "p-2 rounded-lg transition-all hover:bg-zinc-800 hover:text-white",
        isActive ? "bg-cyan-500/20 text-cyan-400" : "text-zinc-400"
      )}
    >
      {icon}
    </button>
  );
}