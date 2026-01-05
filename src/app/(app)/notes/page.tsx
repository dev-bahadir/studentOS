'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient'; 
import { useAuth } from '@/components/providers/AuthProvider';
import Editor from '../../../components/Editor';
import { Search, Trash2, PenLine, Tag } from 'lucide-react'; // Optional: Schöne Icons für bessere UX

type Note = {
  id: number;
  content: string;
  category: string;
  created_at: string;
};

// Verbesserte Farbpalette für Hell & Dunkel
const CATEGORIES = [
  { 
    id: 'inbox', 
    label: '📥 Inbox', 
    className: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700' 
  },
  { 
    id: 'projects', 
    label: '🚀 Projekte', 
    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' 
  },
  { 
    id: 'areas', 
    label: '🏡 Bereiche', 
    className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' 
  },
  { 
    id: 'resources', 
    label: '📚 Ressourcen', 
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800' 
  },
  { 
    id: 'archives', 
    label: '📦 Archiv', 
    className: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' 
  },
];

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('inbox');
  const [searchTerm, setSearchTerm] = useState('');

  const { user } = useAuth();

  useEffect(() => {
    if (user) fetchNotes();
  }, [user]);

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Fehler:', error);
    else setNotes(data || []);
    setLoading(false);
  };

  const addNote = async () => {
    if (!newContent.trim() || newContent === '<p></p>') return;
    if (!user) { alert('Bitte einloggen'); return; }

    const { error } = await supabase
      .from('notes')
      .insert([{ 
        content: newContent, 
        user_id: user.id,
        category: selectedCategory 
      }]);

    if (error) {
      alert('Fehler: ' + error.message);
    } else {
      setNewContent('');
      setSelectedCategory('inbox');
      fetchNotes();
    }
  };

  const deleteNote = async (id: number) => {
    if (!confirm('Notiz wirklich löschen?')) return;
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (!error) {
      setNotes(prev => prev.filter(n => n.id !== id));
    } else {
      alert("Löschen fehlgeschlagen: " + error.message);
    }
  };

  const filteredNotes = notes.filter(note => 
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen pb-32 text-zinc-900 dark:text-zinc-100">
      <h1 className="text-4xl font-black mb-8 text-zinc-900 dark:text-white tracking-tight">
        Mein Second Brain 🧠
      </h1>

      {/* --- EDITOR BEREICH --- */}
      <div className="mb-12 bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="flex items-center gap-2 mb-4 text-zinc-500 dark:text-zinc-400">
          <PenLine size={18} />
          <label className="text-sm font-bold uppercase tracking-wider">Gedanken festhalten</label>
        </div>
        
        {/* Editor Container mit festem Kontrast */}
        <div className="bg-white dark:bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700/50 shadow-inner">
          <div className="text-zinc-900 dark:text-zinc-100 p-1 min-h-[150px]">
             {/* Stellen wir sicher, dass der Editor Textfarbe erbt */}
             <Editor content={newContent} onChange={(html) => setNewContent(html)} />
          </div>
        </div>
        
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto bg-zinc-50 dark:bg-zinc-800 p-2 pr-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <span className="text-zinc-400 ml-2"><Tag size={16}/></span>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-sm font-medium outline-none cursor-pointer w-full text-zinc-700 dark:text-zinc-200"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id} className="dark:bg-zinc-800">
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <button 
            onClick={addNote}
            className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
          >
            Speichern
          </button>
        </div>
      </div>
      
      {/* --- SUCHE --- */}
      <div className="relative mb-8 group">
        <input 
          type="text"
          placeholder="Notizen durchsuchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-4 pl-12 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm focus:ring-2 focus:ring-cyan-500 outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400 transition-all"
        />
        <Search className="absolute left-4 top-4 text-zinc-400 group-focus-within:text-cyan-500 transition-colors" size={20} />
      </div>

      {/* --- LISTE --- */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredNotes.map((note) => {
            const catInfo = CATEGORIES.find(c => c.id === note.category) || CATEGORIES[0];

            return (
              <div key={note.id} className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm hover:shadow-md hover:border-cyan-200 dark:hover:border-zinc-700 transition-all relative">
                
                {/* Header mit Kategorie & Lösch-Button */}
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${catInfo.className}`}>
                    {catInfo.label}
                  </span>
                  
                  <button 
                    onClick={() => deleteNote(note.id)}
                    className="p-2 bg-transparent text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    title="Löschen"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Content: Prose sorgt für perfekte Typografie bei HTML Content */}
                <div 
                  className="prose prose-zinc dark:prose-invert prose-p:leading-relaxed prose-a:text-cyan-600 max-w-none text-zinc-800 dark:text-zinc-300"
                  dangerouslySetInnerHTML={{ __html: note.content }} 
                />
                
                <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                  <small className="text-zinc-400 dark:text-zinc-500 text-[11px] uppercase font-bold tracking-widest">
                    {new Date(note.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </small>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Leerstadium */}
      {!loading && filteredNotes.length === 0 && (
        <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <div className="text-4xl mb-2 opacity-50">💭</div>
          <p className="text-zinc-500 font-medium">Keine Gedanken gefunden.</p>
        </div>
      )}
    </div>
  );
}