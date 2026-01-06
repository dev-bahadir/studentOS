'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import Editor from '@/components/Editor'; 
import { Search, Trash2, PenLine, Tag, Plus, Loader2 } from 'lucide-react';

// 1. Importiere die neuen Layer
import { NoteService } from '@/application/notes/NoteService';
import { SupabaseNoteRepository } from '@infrastructure/SupabaseNoteRepository';
import { Note } from '@/domain/notes/types'; // Für Typ-Sicherheit

// UI-Konfiguration für Kategorien
const CATEGORIES = [
  { id: 'inbox', label: '📥 Inbox', className: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700' },
  { id: 'projects', label: '🚀 Projekte', className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' },
  { id: 'areas', label: '🏡 Bereiche', className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' },
  { id: 'resources', label: '📚 Ressourcen', className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800' },
  { id: 'archives', label: '📦 Archiv', className: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' },
];

export default function NotesPage() {
  const { user } = useAuth();

  // 2. State-Definitionen (Fix für "Cannot find name 'loading/notes/searchTerm'")
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('inbox');
  const [searchTerm, setSearchTerm] = useState('');

  // 3. Service Instanziierung (Der "Kleber" zwischen UI und Logik)
  const noteService = useMemo(() => {
    const repository = new SupabaseNoteRepository();
    return new NoteService(repository);
  }, []);

  // Daten laden
  useEffect(() => {
    if (user) {
      fetchNotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchNotes = async () => {
    if (!user) return;
    try {
      const data = await noteService.getNotes(user.id);
      setNotes(data);
    } catch (error) {
      console.error("Fehler beim Laden:", error);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!user) { alert('Bitte einloggen'); return; }
    
    try {
      // Nutzt den Service für Validierung & Speicherung
      await noteService.createNote(user.id, newContent, selectedCategory as any);
      
      setNewContent(''); 
      fetchNotes(); // Liste aktualisieren
    } catch (error: any) {
      alert('Fehler: ' + error.message);
    }
  };

  const deleteNote = async (id: string) => {
    if (!user) return;
    if (!confirm('Notiz wirklich löschen?')) return;

    // Optimistic UI Update (Sofortiges Feedback)
    const previousNotes = [...notes];
    setNotes(prev => prev.filter(n => n.id !== id));

    try {
      // Repository direkt via Service-Logik aufrufen (falls im Service exposed) 
      // oder hier Hilfsfunktion nutzen. 
      // Da wir Hexagonal sind, sollte das Repo eigentlich privat im Service sein.
      // Wir erweitern kurzfristig den Service oder nutzen das Repo hier direkt:
      const repo = new SupabaseNoteRepository();
      await repo.deleteById(id, user.id);
    } catch (error: any) {
      alert("Löschen fehlgeschlagen: " + error.message);
      setNotes(previousNotes); // Rollback bei Fehler
    }
  };

  // 4. Nutzung der Domain-Logik für Filterung
  const filteredNotes = noteService.filterNotes(notes, searchTerm);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-500 gap-4">
      <Loader2 className="animate-spin h-10 w-10 text-cyan-500" />
      <p className="font-medium">Lade Second Brain...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto pb-32 text-zinc-900 dark:text-zinc-100">
      
      {/* HEADER */}
      <div className="mb-10">
        <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 mb-2">
          Second Brain 🧠
        </h1>
        <p className="text-zinc-500 font-medium">Capture ideas, organize life.</p>
      </div>

      {/* EDITOR */}
      <div className="mb-12 bg-white dark:bg-zinc-900 p-6 rounded-[2rem] shadow-xl shadow-zinc-200/50 dark:shadow-none border border-zinc-200 dark:border-zinc-800 transition-all">
        <div className="flex items-center gap-2 mb-4 text-zinc-500 dark:text-zinc-400">
          <PenLine size={18} className="text-cyan-500" />
          <label className="text-xs font-bold uppercase tracking-widest">Neuer Gedanke</label>
        </div>
        
        <div className="bg-zinc-50 dark:bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 focus-within:ring-2 focus-within:ring-cyan-500/50 transition-all">
           <Editor key={notes.length} content={newContent} onChange={(html) => setNewContent(html)} />
        </div>
        
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto bg-zinc-50 dark:bg-zinc-800 p-2 pr-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <span className="text-zinc-400 ml-2"><Tag size={16}/></span>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-sm font-bold outline-none cursor-pointer w-full text-zinc-700 dark:text-zinc-200 appearance-none"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id} className="bg-white dark:bg-zinc-900">
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <button 
            onClick={addNote}
            disabled={!newContent || newContent === '<p></p>'}
            className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-cyan-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Speichern
          </button>
        </div>
      </div>
      
      {/* SUCHE */}
      <div className="relative mb-8 group">
        <input 
          type="text"
          placeholder="Durchsuche deine Gedanken..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-4 pl-12 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm focus:ring-2 focus:ring-cyan-500 outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 transition-all"
        />
        <Search className="absolute left-4 top-4 text-zinc-400 group-focus-within:text-cyan-500 transition-colors" size={20} />
      </div>

      {/* LISTE */}
      <div className="space-y-4 columns-1 md:columns-2 gap-4 [column-fill:_balance]">
        {filteredNotes.map((note) => {
          const catInfo = CATEGORIES.find(c => c.id === note.category) || CATEGORIES[0];

          return (
            <div key={note.id} className="break-inside-avoid mb-4 group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative">
              
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border ${catInfo.className}`}>
                  {catInfo.label}
                </span>
                
                <button 
                  onClick={() => deleteNote(note.id)}
                  className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                  title="Löschen"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div 
                className="prose prose-sm prose-zinc dark:prose-invert prose-p:leading-relaxed prose-a:text-cyan-600 max-w-none text-zinc-600 dark:text-zinc-300 font-medium"
                dangerouslySetInnerHTML={{ __html: note.content }} 
              />
              
              <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <small className="text-zinc-400 dark:text-zinc-500 text-[10px] font-bold tracking-widest uppercase">
                  {/* WICHTIG: Domain nutzt 'createdAt', nicht 'created_at' */}
                  {new Date(note.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </small>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && filteredNotes.length === 0 && (
        <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-[3rem] border border-dashed border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95">
          <div className="text-6xl mb-4 opacity-50 grayscale">🌵</div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Hier ist es noch leer</h3>
          <p className="text-zinc-500 text-sm">Schreibe deinen ersten Gedanken oben in die Box.</p>
        </div>
      )}
    </div>
  );
}