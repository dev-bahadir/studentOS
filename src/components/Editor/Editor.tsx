'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useState } from 'react';
import { 
  Bold, Italic, List, ListOrdered, Quote, Heading1, Heading2, 
  Code, Undo, Redo, Loader2, CheckCircle2, Sparkles 
} from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider'; // Auth für UserID

interface EditorProps {
  initialTitle?: string;
  initialContent?: string;
  onSave: (title: string, content: string) => Promise<void>;
  isSaving: boolean;
}

export default function Editor({ initialTitle = '', initialContent = '', onSave, isSaving }: EditorProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(initialTitle);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // AI States
  const [isGenerating, setIsGenerating] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Schreib etwas Geniales...' }),
    ],
    content: initialContent,
    editorProps: { attributes: { class: 'prose prose-zinc dark:prose-invert max-w-none focus:outline-none min-h-[500px]' } },
  });

  useEffect(() => {
    if (!editor) return;
    const saveTimer = setTimeout(() => {
      onSave(title, editor.getHTML()).then(() => setLastSaved(new Date()));
    }, 1500);
    return () => clearTimeout(saveTimer);
  }, [title, editor?.state.doc.content, onSave]);

  // --- AI GENERATE FUNCTION ---
  const handleGenerateCards = async () => {
    if (!editor || !user) return;
    const text = editor.getText();
    
    if (text.length < 50) {
      alert("Schreib bitte etwas mehr Text für die Analyse.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, userId: user.id })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(`Erfolg! ${data.count} Karten wurden in 'AI Inbox' erstellt.`);
    } catch (err: any) {
      alert("AI Fehler: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!editor) return null;

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 animate-in fade-in duration-500 relative">
      
      {/* HEADER CONTROLS */}
      <div className="flex justify-between items-start mb-8">
         <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Unbenannte Notiz"
          className="bg-transparent text-4xl font-black text-white border-none outline-none placeholder:text-zinc-700 w-full"
        />
        
        {/* DER AI BUTTON */}
        <button
          onClick={handleGenerateCards}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl font-bold text-white shadow-lg shadow-purple-500/20 active:scale-95 hover:opacity-90 transition-all disabled:opacity-50 whitespace-nowrap ml-4"
        >
          {isGenerating ? <Loader2 className="animate-spin w-4 h-4"/> : <Sparkles className="w-4 h-4" />}
          <span>{isGenerating ? 'Analysiere...' : 'Quiz erstellen'}</span>
        </button>
      </div>

      {/* TOOLBAR */}
      <div className="sticky top-4 z-30 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-xl p-2 mb-8 flex flex-wrap gap-1 shadow-xl">
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} icon={<Bold size={18} />} />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} icon={<Italic size={18} />} />
        <div className="w-px h-6 bg-zinc-800 mx-1 self-center" />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} icon={<Heading2 size={18} />} />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} icon={<List size={18} />} />
        <div className="ml-auto flex items-center gap-3 text-xs text-zinc-500 font-mono pr-2">
           {isSaving ? <span className="text-cyan-400 animate-pulse">Speichert...</span> : lastSaved && <span>Gespeichert</span>}
        </div>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarBtn({ onClick, isActive, icon }: { onClick: () => void, isActive: boolean, icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg transition-all ${isActive ? "bg-cyan-500/20 text-cyan-400" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}
    >
      {icon}
    </button>
  );
}