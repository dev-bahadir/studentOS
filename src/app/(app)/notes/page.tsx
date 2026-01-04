'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient'; 
import { useAuth } from '@/components/providers/AuthProvider';
import Editor from '../../../components/Editor';

type Note = {
  id: number;
  content: string;
  category: string;
  created_at: string;
};

const CATEGORIES = [
  { id: 'inbox', label: '📥 Inbox', color: 'bg-gray-100 text-gray-800' },
  { id: 'projects', label: '🚀 Projekte', color: 'bg-blue-100 text-blue-800' },
  { id: 'areas', label: '🏡 Bereiche', color: 'bg-green-100 text-green-800' },
  { id: 'resources', label: '📚 Ressourcen', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'archives', label: '📦 Archiv', color: 'bg-purple-100 text-purple-800' },
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
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen pb-32">
      <h1 className="text-3xl font-extrabold mb-8 text-ink">Mein Second Brain 🧠</h1>

      {/* --- EDITOR BEREICH --- */}
      <div className="mb-12 bg-panel p-6 rounded-3xl shadow-sm border border-gray-100/10">
        <label className="block text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Gedanken festhalten</label>
        
        <div className="bg-canvas rounded-2xl overflow-hidden border border-gray-100/10">
          <Editor content={newContent} onChange={(html) => setNewContent(html)} />
        </div>
        
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto bg-canvas p-2 rounded-xl border border-gray-100/10">
            <span className="text-xs font-bold text-gray-400 ml-2">PARA:</span>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-ink text-sm outline-none cursor-pointer"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={addNote}
            className="w-full sm:w-auto bg-primary text-white px-10 py-3 rounded-2xl hover:opacity-90 font-bold shadow-lg shadow-primary/20 transition active:scale-95"
          >
            Speichern
          </button>
        </div>
      </div>
      
      {/* --- SUCHE --- */}
      <div className="relative mb-8">
        <input 
          type="text"
          placeholder="Notizen durchsuchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-4 pl-12 rounded-2xl bg-panel border border-gray-100/10 shadow-sm focus:ring-2 focus:ring-primary outline-none text-ink"
        />
        <span className="absolute left-4 top-4 opacity-50">🔍</span>
      </div>

      {/* --- LISTE --- */}
      {loading ? (
        <p className="text-center text-gray-500">Lade Gedanken...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredNotes.map((note) => {
            const catInfo = CATEGORIES.find(c => c.id === note.category) || CATEGORIES[0];

            return (
              <div key={note.id} className="group bg-panel border border-gray-100/10 p-6 rounded-3xl shadow-sm hover:border-primary/30 transition-all relative">
                
                {/* Header mit Kategorie & Lösch-Button */}
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${catInfo.color}`}>
                    {catInfo.label}
                  </span>
                  
                  <button 
                    onClick={() => deleteNote(note.id)}
                    className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-90"
                    title="Löschen"
                  >
                    <span className="text-lg">🗑️</span>
                  </button>
                </div>

                {/* Content */}
                <div 
                  className="prose prose-invert prose-sm max-w-none text-ink"
                  dangerouslySetInnerHTML={{ __html: note.content }} 
                />
                
                <div className="mt-6 pt-4 border-t border-gray-100/5 flex justify-between items-center">
                  <small className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">
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
        <div className="text-center py-20 bg-panel rounded-3xl border border-dashed border-gray-100/20">
          <p className="text-gray-500 font-medium">Keine Einträge gefunden. 💭</p>
        </div>
      )}
    </div>
  );
}