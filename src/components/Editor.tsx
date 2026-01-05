'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  const btnClass = (isActive: boolean) => 
    `px-3 py-1 rounded text-sm font-medium transition ${
      isActive ? 'bg-black text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    }`;

  return (
    <div className="flex flex-wrap gap-2 mb-4 p-2 border-b border-gray-100">
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))}>B</button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`italic ${btnClass(editor.isActive('italic'))}`}>I</button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btnClass(editor.isActive('heading', { level: 1 }))}>H1</button>
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))}>• Liste</button>
    </div>
  );
};

export default function Editor({ content, onChange }: { content: string, onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    immediatelyRender: false, // 👈 HIER IST DER FIX! (Zeile 27)
    editorProps: { attributes: { class: 'prose prose-sm sm:prose focus:outline-none min-h-[150px] p-4' } },
    onUpdate: ({ editor }) => { onChange(editor.getHTML()); },
  });

  if (editor && content === '' && editor.getText() !== '') {
    editor.commands.clearContent();
  }

  return (
    <div className="border border-gray-300 rounded-xl bg-panel shadow-sm overflow-hidden">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
