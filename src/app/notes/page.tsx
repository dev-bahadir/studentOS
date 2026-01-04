'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient'; 
import { useAuth } from '@/components/providers/AuthProvider';
import Editor from '../../components/Editor';

type Note = {
  id: number;
  content: string;
  category: string; // 👈 NEU: Kategorie
  created_at: string;
};

// Die PARA Kategorien
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
  
  // Editor State
  const [newContent, setNewContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('inbox'); // 👈 NEU
  
  // Search State
  const [searchTerm, setSearchTerm] = useState(''); // 👈 NEU

  const { user } = useAuth();

  useEffect(() => {
    fetchNotes();
  }, []);

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
        category: selectedCategory // 👈 Hier speichern wir die Kategorie
      }]);

    if (error) {
      alert('Fehler: ' + error.message);
    } else {
      setNewContent('');
      setSelectedCategory('inbox'); // Reset auf Inbox
      fetchNotes();
    }
  };

  const deleteNote = async (id: number) => {
    if (!confirm('Notiz wirklich löschen?')) return;
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (!error) setNotes(notes.filter(n => n.id !== id));
  };

  // 🔍 FILTER LOGIK
  const filteredNotes = notes.filter(note => 
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Mein Second Brain 🧠</h1>

      {/* --- EDITOR BEREICH --- */}
      <div className="mb-12 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <label className="block text-sm font-bold text-gray-700 mb-3">Neue Notiz erfassen</label>
        
        <Editor content={newContent} onChange={(html) => setNewContent(html)} />
        
        <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Kategorie Auswahl */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm text-gray-500">Kategorie:</span>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-2 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={addNote}
            className="w-full sm:w-auto bg-blue-600 text-white px-8 py-2 rounded-lg hover:bg-blue-700 font-bold shadow-md transition"
          >
            Speichern
          </button>
        </div>
      </div>
      
      {/* --- SUCHE & LISTE --- */}
      <div className="space-y-6">
        
        {/* Suchleiste */}
        <div className="relative">
          <input 
            type="text"
            placeholder="🔍 Notizen durchsuchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-4 pl-12 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-lg"
          />
          <span className="absolute left-4 top-4 text-gray-400 text-xl">🔎</span>
        </div>

        {loading ? (
          <p className="text-center text-gray-400">Lade Gedanken...</p>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center p-10 border-2 border-dashed rounded-xl bg-gray-50 text-gray-500">
            {searchTerm ? 'Nichts gefunden. 🤷‍♂️' : 'Dein Gehirn ist leer. Schreib was auf! 👆'}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredNotes.map((note) => {
              // Finde die passenden Farben für die Kategorie
              const catInfo = CATEGORIES.find(c => c.id === note.category) || CATEGORIES[0];

              return (
                <div key={note.id} className="relative group bg-white border border-gray-200 p-6 rounded-xl shadow-sm hover:shadow-md transition">
                  
                  <div className="flex justify-between items-start mb-3">
                    {/* Kategorie Badge */}
                    <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide ${catInfo.color}`}>
                      {catInfo.label}
                    </span>
                    
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      🗑️
                    </button>
                  </div>

                  <div 
                    className="prose prose-sm max-w-none text-gray-800"
                    dangerouslySetInnerHTML={{ __html: note.content }} 
                  />
                  
                  <small className="text-gray-400 block mt-4 text-xs border-t pt-2">
                    {new Date(note.created_at).toLocaleString('de-DE')}
                  </small>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}