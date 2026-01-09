'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Save, Edit3, X, FileText, Trash2, ArrowLeft, 
  Calendar, ChevronDown, Ghost, RotateCcw
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';

// Zentrale Glass-Klasse
const glassClass = "bg-white/5 dark:bg-zinc-900/20 backdrop-blur-xl border border-white/10 dark:border-zinc-800/50 shadow-xl";

// --- KONFIGURATION ---
const CATEGORIES = ["Uni", "Alltag", "Arbeit", "Finanzen", "Ideen", "Journal"];
const PRIORITIES = {
  'Hoch': { color: 'bg-red-500', label: '🔥 Hoch' },
  'Mittel': { color: 'bg-amber-500', label: '⚡ Mittel' },
  'Niedrig': { color: 'bg-emerald-500', label: '☕ Niedrig' }
};

// ════════════════════════════════════════
// 🎨 TYPE DEFINITIONS
// ════════════════════════════════════════
interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: keyof typeof PRIORITIES;
  is_deleted: boolean; // Wichtig für Papierkorb
  updated_at: string;
  created_at: string;
}

// ════════════════════════════════════════
// 🎨 UTILITY FUNCTIONS
// ════════════════════════════════════════
const cn = (...classes: (string | undefined | null | false)[]): string =>
  classes.filter(Boolean).join(' ');

export default function SecondBrainPage() {
  const { user } = useAuth();

  // ════════════════════════════════════════
  // 📊 STATE MANAGEMENT
  // ════════════════════════════════════════
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Alle');
  const [showTrash, setShowTrash] = useState(false); // Der Papierkorb-Modus
  
  // Editor State
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Temp Edit States
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPriority, setEditPriority] = useState<keyof typeof PRIORITIES>('Mittel');

  // ════════════════════════════════════════
  // 🔄 DATA FETCHING
  // ════════════════════════════════════════
  const loadNotes = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // ════════════════════════════════════════
  // 💾 HANDLERS
  // ════════════════════════════════════════
  
  const filteredNotes = useMemo(
    () => notes.filter(note => {
      const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            note.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Alle' || note.category === selectedCategory;
      
      // WICHTIG: Filtern nach "Gelöscht" Status
      // Wenn showTrash true ist, zeigen wir NUR gelöschte.
      // Wenn showTrash false ist, zeigen wir NUR nicht-gelöschte.
      const matchesTrashState = note.is_deleted === showTrash;

      return matchesSearch && matchesCategory && matchesTrashState;
    }),
    [notes, searchTerm, selectedCategory, showTrash]
  );

  const openNote = (note: Note) => {
    setActiveNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditCategory(note.category);
    setEditPriority(note.priority || 'Mittel');
    setIsEditing(false);
  };

  const closeEditor = () => {
    setActiveNote(null);
    setIsEditing(false);
  };

  const saveNote = async () => {
    if (!activeNote || !user?.id) return;

    try {
      const { error } = await supabase
        .from('notes')
        .update({
          title: editTitle,
          content: editContent,
          category: editCategory,
          priority: editPriority,
          updated_at: new Date().toISOString(),
        })
        .eq('id', activeNote.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setNotes(prev =>
        prev.map(n =>
          n.id === activeNote.id
            ? { ...n, title: editTitle, content: editContent, category: editCategory, priority: editPriority, updated_at: new Date().toISOString() }
            : n
        )
      );
      setIsEditing(false);
    } catch (error) {
      alert('Fehler beim Speichern');
    }
  };

  // Soft-Delete (In den Papierkorb verschieben)
  const moveToTrash = async () => {
    if (!activeNote) return;
    const { error } = await supabase.from('notes').update({ is_deleted: true }).eq('id', activeNote.id);
    if (!error) {
      setNotes(prev => prev.map(n => n.id === activeNote.id ? { ...n, is_deleted: true } : n));
      closeEditor();
    }
  };

  // Wiederherstellen
  const restoreNote = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const { error } = await supabase.from('notes').update({ is_deleted: false }).eq('id', id);
    if (!error) {
        setNotes(prev => prev.map(n => n.id === id ? { ...n, is_deleted: false } : n));
    }
  };

  // Endgültig löschen
  const permanentDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Endgültig löschen? Das kann nicht rückgängig gemacht werden.")) return;
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (!error) {
        setNotes(prev => prev.filter(n => n.id !== id));
    }
  };

  const createNewNote = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert([{
            user_id: user.id,
            title: 'Neuer Gedanke',
            content: '',
            category: 'Alltag',
            priority: 'Mittel',
            is_deleted: false, // Standardmäßig nicht gelöscht
            updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setNotes(prev => [data, ...prev]);
        openNote(data);
        setIsEditing(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // ════════════════════════════════════════
  // 🎮 MAIN RENDER
  // ════════════════════════════════════════
  return (
    <div className="w-full max-w-[1920px] p-4 md:p-8 lg:p-12 min-h-screen pb-40 bg-transparent text-zinc-900 dark:text-zinc-100 overflow-x-hidden">
      
      {/* HEADER */}
      <header className={`mb-10 p-8 rounded-[3rem] flex flex-col md:flex-row justify-between items-center gap-6 ${glassClass}`}>
        <div>
           <h1 className="text-3xl md:text-5xl font-black tracking-tighter flex items-center gap-4">
              <FileText className="text-cyan-500" size={40} /> Second Brain
           </h1>
           <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest pl-2 mt-2">
             {showTrash ? 'Papierkorb Modus' : `${notes.filter(n => !n.is_deleted).length} aktive Synapsen`}
           </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Gedanken suchen..."
                className="w-full pl-12 pr-4 py-3 bg-black/5 dark:bg-white/5 border border-transparent focus:border-cyan-500/30 rounded-2xl outline-none text-sm font-medium transition-all"
              />
           </div>
           
           {/* Plus Button nur zeigen, wenn NICHT im Papierkorb */}
           {!showTrash && (
             <button onClick={createNewNote} className="bg-cyan-500 text-white p-3 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-cyan-500/20">
                <Plus size={24} />
             </button>
           )}
        </div>
      </header>

      {/* CATEGORY TABS & TRASH TOGGLE */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {['Alle', ...CATEGORIES].map(cat => (
            <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                'px-6 py-2 rounded-2xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border',
                selectedCategory === cat 
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-transparent shadow-lg' 
                    : 'bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                )}
            >
                {cat}
            </button>
            ))}
        </div>

        {/* DAS VERSTECK: Der Geist-Button für den Papierkorb */}
        <button 
            onClick={() => setShowTrash(!showTrash)} 
            className={cn("p-3 rounded-2xl transition-all ml-4 flex-shrink-0", showTrash ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-white/5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200")}
            title="Versteckter Papierkorb"
        >
            <Ghost size={20} />
        </button>
      </div>

      {/* CONTENT: GRID VIEW (MASONRY STYLE) */}
      {loading ? (
         <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent"/></div>
      ) : filteredNotes.length === 0 ? (
         <div className={`py-32 text-center rounded-[3rem] border-4 border-dashed border-zinc-200 dark:border-zinc-800 ${glassClass}`}>
            <p className="text-zinc-400 font-bold text-xl">{showTrash ? 'Papierkorb leer.' : 'Keine Gedanken gefunden.'}</p>
         </div>
      ) : (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max">
            {filteredNotes.map((note) => {
               // Prioritäts-Indikator
               const prioColor = PRIORITIES[note.priority as keyof typeof PRIORITIES]?.color || 'bg-zinc-500';
               
               return (
                 <motion.div
                   layoutId={`note-${note.id}`}
                   // SNAPPY TRANSITION (500/40)
                   transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.8 }} 
                   key={note.id}
                   onClick={() => openNote(note)}
                   whileHover={{ y: -5 }}
                   className={`p-6 rounded-[2.5rem] cursor-pointer border transition-all group flex flex-col justify-between min-h-[200px] ${glassClass} hover:border-cyan-500/30 border-transparent relative overflow-hidden`}
                 >
                    {/* Prio Strip */}
                    <div className={`absolute top-0 left-0 w-full h-1.5 ${prioColor}`} />

                    <div>
                       <div className="flex justify-between items-start mb-4 mt-2">
                          <span className="px-3 py-1 rounded-lg bg-zinc-100 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                             {note.category}
                          </span>
                          
                          {/* Wenn im Papierkorb: Zeige Wiederherstellen-Icon statt Pfeil */}
                          {showTrash ? (
                             <button onClick={(e) => restoreNote(e, note.id)} className="p-1.5 hover:bg-emerald-500/10 rounded-full text-zinc-400 hover:text-emerald-500 transition-colors">
                                <RotateCcw size={16} />
                             </button>
                          ) : (
                             <ArrowLeft size={16} className="text-zinc-300 dark:text-zinc-700 rotate-135 group-hover:text-cyan-500 transition-colors" />
                          )}
                       </div>
                       
                       <h3 className="font-black text-xl text-zinc-900 dark:text-white mb-2 leading-tight line-clamp-2">
                          {note.title || 'Neuer Gedanke'}
                       </h3>
                       <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-4 font-medium leading-relaxed">
                          {note.content || 'Kein Inhalt...'}
                       </p>
                    </div>
                    
                    {/* Footer der Kachel */}
                    <div className="mt-6 pt-4 border-t border-zinc-200/50 dark:border-white/5 flex items-center justify-between text-zinc-400 text-xs font-bold">
                       {showTrash ? (
                          // Im Papierkorb: Endgültig löschen Button
                          <button 
                            onClick={(e) => permanentDelete(e, note.id)}
                            className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors"
                          >
                             <Trash2 size={12} /> Endgültig löschen
                          </button>
                       ) : (
                          // Normal: Datum anzeigen
                          <div className="flex items-center gap-2"><Calendar size={12} /> {new Date(note.updated_at).toLocaleDateString()}</div>
                       )}
                    </div>
                 </motion.div>
               );
            })}
         </div>
      )}

      {/* EDITOR OVERLAY (FOCUS MODE) */}
      <AnimatePresence>
        {activeNote && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              onClick={closeEditor}
              className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm z-40"
            />
            
            {/* Modal */}
            <motion.div 
              layoutId={`note-${activeNote.id}`}
              // SNAPPY TRANSITION FIX (500/40)
              transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.8 }}
              className={`fixed inset-4 md:inset-10 lg:inset-20 z-50 flex flex-col overflow-hidden rounded-[3rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl bg-zinc-50 dark:bg-zinc-900`}
            >
               {/* Toolbar */}
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 md:p-8 border-b border-zinc-200 dark:border-white/5 bg-white/50 dark:bg-black/20 backdrop-blur-md gap-4">
                  <div className="flex-1 w-full mr-4">
                     {isEditing ? (
                        <div className="space-y-4">
                           <input 
                              value={editTitle} 
                              onChange={e => setEditTitle(e.target.value)} 
                              className="text-2xl md:text-4xl font-black bg-transparent outline-none w-full text-zinc-900 dark:text-white placeholder:text-zinc-700" 
                              placeholder="Titel..."
                              autoFocus
                           />
                           {/* Category & Priority Selector */}
                           <div className="flex gap-4">
                              <div className="relative">
                                 <select 
                                    value={editCategory}
                                    onChange={(e) => setEditCategory(e.target.value)}
                                    className="appearance-none bg-black/5 dark:bg-white/5 px-4 py-2 pr-8 rounded-xl text-xs font-bold uppercase tracking-widest outline-none cursor-pointer hover:bg-black/10 transition-colors"
                                 >
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                 </select>
                                 <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" size={14} />
                              </div>

                              <div className="relative">
                                 <select 
                                    value={editPriority}
                                    onChange={(e) => setEditPriority(e.target.value as any)}
                                    className="appearance-none bg-black/5 dark:bg-white/5 px-4 py-2 pr-8 rounded-xl text-xs font-bold uppercase tracking-widest outline-none cursor-pointer hover:bg-black/10 transition-colors"
                                 >
                                    {Object.entries(PRIORITIES).map(([key, val]) => (
                                       <option key={key} value={key}>{key}</option>
                                    ))}
                                 </select>
                                 <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" size={14} />
                              </div>
                           </div>
                        </div>
                     ) : (
                        <div>
                           <h2 className="text-2xl md:text-4xl font-black text-zinc-900 dark:text-white truncate mb-2">
                              {editTitle}
                           </h2>
                           <div className="flex gap-3">
                              <span className="px-3 py-1 rounded-lg bg-zinc-200 dark:bg-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-300">
                                 {editCategory}
                              </span>
                              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-white ${PRIORITIES[editPriority as keyof typeof PRIORITIES]?.color || 'bg-zinc-500'}`}>
                                 {PRIORITIES[editPriority as keyof typeof PRIORITIES]?.label || editPriority}
                              </span>
                           </div>
                        </div>
                     )}
                  </div>
                  
                  <div className="flex items-center gap-2 self-end md:self-auto">
                     {isEditing ? (
                        <button onClick={saveNote} className="bg-cyan-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-cyan-400 transition-colors shadow-lg"><Save size={18} /> Speichern</button>
                     ) : (
                        <>
                           {/* Bearbeiten Button */}
                           <button onClick={() => setIsEditing(true)} className="p-3 bg-zinc-200 dark:bg-white/10 rounded-xl text-zinc-700 dark:text-white hover:bg-zinc-300 dark:hover:bg-white/20 transition-colors"><Edit3 size={20} /></button>
                           
                           {/* Löschen / Wiederherstellen Logik */}
                           {showTrash ? (
                               <button onClick={(e) => restoreNote(e, activeNote.id)} className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-colors" title="Wiederherstellen"><RotateCcw size={20} /></button>
                           ) : (
                               <button onClick={moveToTrash} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors" title="Löschen"><Trash2 size={20} /></button>
                           )}
                        </>
                     )}
                     <button onClick={closeEditor} className="p-3 bg-zinc-100 dark:bg-white/5 text-zinc-500 rounded-xl hover:bg-zinc-200 dark:hover:bg-white/10 ml-2"><X size={20} /></button>
                  </div>
               </div>

               {/* Content Area */}
               <div className="flex-1 overflow-hidden bg-white/50 dark:bg-black/20">
                  {isEditing ? (
                     <textarea 
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        className="w-full h-full p-8 md:p-12 resize-none outline-none bg-transparent text-lg font-medium leading-loose text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-500 font-sans"
                        placeholder="Schreibe deine Gedanken nieder..."
                     />
                  ) : (
                     <div className="w-full h-full overflow-y-auto p-8 md:p-12 custom-scrollbar">
                        <article className="prose prose-zinc dark:prose-invert max-w-none prose-lg prose-headings:font-black prose-p:leading-loose">
                           <div className="whitespace-pre-wrap">{editContent || <span className="text-zinc-500 italic">Keine Notizen vorhanden...</span>}</div>
                        </article>
                     </div>
                  )}
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(120, 120, 120, 0.3); border-radius: 10px; }
      `}</style>
    </div>
  );
}