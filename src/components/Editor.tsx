'use client';

import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { 
  Bold, 
  Italic, 
  Heading1, 
  List, 
  ListOrdered, 
  Quote 
} from 'lucide-react';

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  // Hilfsfunktion für Button-Styles (angepasst an Dark Mode)
  const btnClass = (isActive: boolean) => 
    `p-2 rounded-lg transition-colors ${
      isActive 
        ? 'bg-zinc-200 dark:bg-zinc-700 text-black dark:text-white' 
        : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
    }`;

  return (
    <div className="flex flex-wrap items-center gap-1 mb-2 p-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
      
      <button 
        onClick={() => editor.chain().focus().toggleBold().run()} 
        className={btnClass(editor.isActive('bold'))}
        title="Fett"
      >
        <Bold size={18} />
      </button>
      
      <button 
        onClick={() => editor.chain().focus().toggleItalic().run()} 
        className={btnClass(editor.isActive('italic'))}
        title="Kursiv"
      >
        <Italic size={18} />
      </button>

      <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-700 mx-2" />

      <button 
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
        className={btnClass(editor.isActive('heading', { level: 1 }))}
        title="Überschrift"
      >
        <Heading1 size={18} />
      </button>

      <button 
        onClick={() => editor.chain().focus().toggleBulletList().run()} 
        className={btnClass(editor.isActive('bulletList'))}
        title="Liste"
      >
        <List size={18} />
      </button>
      
      <button 
        onClick={() => editor.chain().focus().toggleOrderedList().run()} 
        className={btnClass(editor.isActive('orderedList'))}
        title="Nummerierte Liste"
      >
        <ListOrdered size={18} />
      </button>

      <button 
        onClick={() => editor.chain().focus().toggleBlockquote().run()} 
        className={btnClass(editor.isActive('blockquote'))}
        title="Zitat"
      >
        <Quote size={18} />
      </button>

    </div>
  );
};

export default function Editor({ content, onChange }: { content: string, onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    immediatelyRender: false, // WICHTIG für Next.js Hydration
    editorProps: { 
      attributes: { 
        // Tailwind Typography Klassen für schönes HTML Styling im Editor
        class: 'prose prose-sm sm:prose-base dark:prose-invert focus:outline-none max-w-none min-h-[150px] px-4 py-3 text-zinc-800 dark:text-zinc-200' 
      } 
    },
    onUpdate: ({ editor }) => { 
      onChange(editor.getHTML()); 
    },
  });

  // 🔥 FIX: useEffect statt direkter Logic im Render-Body
  // Das sorgt dafür, dass der Editor geleert wird, wenn du "Speichern" drückst
  useEffect(() => {
    if (editor && content === '') {
      editor.commands.clearContent();
    }
  }, [content, editor]);

  return (
    <div className="flex flex-col w-full bg-white dark:bg-zinc-950 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}