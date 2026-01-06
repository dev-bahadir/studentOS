'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { FlashcardImporter } from '@/components/FlashcardImporter';
import { 
  Brain, CheckCircle2, XCircle, AlertCircle, ChevronRight, ChevronDown,
  Edit2, Save, X, Trash2, FolderPlus, Plus, Upload, MoreVertical,
  Folder, FolderOpen, Layers, Settings2
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// --- TYPEN ---
type Flashcard = {
  id: string;
  front: string;
  back: string;
  category: string;
  folder: string | null; // NEU: Ordner
  interval: number;
  ease_factor: number;
  due_date: string;
};

// Hilfstyp für die gruppierte Struktur
type GroupedData = {
  [folderName: string]: string[]; // FolderName -> Liste von Kategorien
};

export default function FlashcardsPage() {
  const { user } = useAuth();
  
  // --- STATES ---
  const [cards, setCards] = useState<Flashcard[]>([]);
  
  // Strukturierung
  const [folders, setFolders] = useState<string[]>([]); // Liste aller Ordner
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  // UI & Stats
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, due: 0 });
  const [newInput, setNewInput] = useState('');
  const [isCreatingMode, setIsCreatingMode] = useState<'category' | 'folder' | null>(null);

  // Management (Rename / Move)
  const [settingsTarget, setSettingsTarget] = useState<{ type: 'category' | 'folder', name: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [moveToFolderValue, setMoveToFolderValue] = useState('');

  // Add/Import Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [targetCategoryForAdd, setTargetCategoryForAdd] = useState('');
  const [addMode, setAddMode] = useState<'single' | 'import'>('single');
  const [newCardForm, setNewCardForm] = useState({ front: '', back: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importLoading, setImportLoading] = useState(false);

  // Edit Card State
  const [isEditingCard, setIsEditingCard] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [cardEditForm, setCardEditForm] = useState({ front: '', back: '', category: '' });

  // Lern-Session
  const [learningQueue, setLearningQueue] = useState<Flashcard[]>([]);
  const [isLearning, setIsLearning] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    if (user) loadAllData();
  }, [user]);

  // --- DATA FETCHING ---
  const loadAllData = async () => {
    setLoading(true);
    await fetchCards();
    setLoading(false);
  };

  const fetchCards = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      const loadedCards = data as Flashcard[];
      setCards(loadedCards);
      
      // Ordner extrahieren
      const uniqueFolders = Array.from(new Set(loadedCards.map(c => c.folder).filter(Boolean) as string[])).sort();
      setFolders(uniqueFolders);
      
      // Stats
      const dueCount = loadedCards.filter(c => c.due_date <= new Date().toISOString()).length;
      setStats({ total: loadedCards.length, due: dueCount });
    }
  };

  // --- GRUPPIERUNG LOGIK (WICHTIG!) ---
  // Wir bauen ein Objekt: { "Semester 1": ["Mathe", "Physik"], "Unsorted": ["Allgemein"] }
  const groupedStructure = useMemo(() => {
    const structure: GroupedData = {};
    const unsortedCats = new Set<string>();

    cards.forEach(card => {
      if (card.folder) {
        if (!structure[card.folder]) structure[card.folder] = [];
        if (!structure[card.folder].includes(card.category)) {
          structure[card.folder].push(card.category);
        }
      } else {
        unsortedCats.add(card.category || 'Allgemein');
      }
    });

    // Sortieren
    Object.keys(structure).forEach(key => structure[key].sort());
    
    return {
      folders: structure,
      unsorted: Array.from(unsortedCats).sort()
    };
  }, [cards]);

  // --- ACTIONS: RENAME / MOVE ---

  const handleRename = async () => {
    if (!settingsTarget || !renameValue.trim()) return;
    const { type, name: oldName } = settingsTarget;
    const newName = renameValue.trim();

    if (newName === oldName) { setSettingsTarget(null); return; }

    let error;
    if (type === 'category') {
      // Kategorie umbenennen: Update category column where category = oldName
      const { error: err } = await supabase
        .from('flashcards')
        .update({ category: newName })
        .eq('category', oldName)
        .eq('user_id', user?.id);
      error = err;
    } else {
      // Ordner umbenennen: Update folder column where folder = oldName
      const { error: err } = await supabase
        .from('flashcards')
        .update({ folder: newName })
        .eq('folder', oldName)
        .eq('user_id', user?.id);
      error = err;
    }

    if (!error) {
      loadAllData();
      setSettingsTarget(null);
    } else {
      alert("Fehler: " + error.message);
    }
  };

  const handleMoveCategoryToFolder = async (folderName: string | null) => {
    if (!settingsTarget || settingsTarget.type !== 'category') return;
    
    // Setze folder column für alle Karten dieser Kategorie
    const { error } = await supabase
      .from('flashcards')
      .update({ folder: folderName }) // null = "Kein Ordner"
      .eq('category', settingsTarget.name)
      .eq('user_id', user?.id);

    if (!error) {
      loadAllData();
      setSettingsTarget(null);
    } else {
      alert("Fehler beim Verschieben: " + error.message);
    }
  };

  const deleteItem = async () => {
    if (!settingsTarget) return;
    const { type, name } = settingsTarget;
    
    const msg = type === 'folder' 
      ? `Ordner "${name}" löschen? Alle enthaltenen Fächer werden 'Unsortiert'. (Karten bleiben erhalten)`
      : `Fach "${name}" und ALLE Karten darin löschen? (Unwiderruflich!)`;

    if (!confirm(msg)) return;

    if (type === 'folder') {
      // Ordner löschen -> Karten behalten, folder auf NULL setzen
      const { error } = await supabase
        .from('flashcards')
        .update({ folder: null })
        .eq('folder', name)
        .eq('user_id', user?.id);
      if (!error) loadAllData();
    } else {
      // Fach löschen -> Karten löschen
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('category', name)
        .eq('user_id', user?.id);
      if (!error) loadAllData();
    }
    setSettingsTarget(null);
  };

  // --- UI HELPERS ---
  const toggleFolder = (f: string) => setExpandedFolders(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  const toggleCategory = (c: string) => setExpandedCategories(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  // --- CREATION ---
  const handleCreate = () => {
    if (!newInput.trim()) return;
    // Da wir keine separate Tabellen haben, erstellen wir "virtuelle" Einträge im UI
    // Echte Persistenz passiert erst, wenn eine Karte erstellt wird. 
    // Trick: Wir merken uns diese neuen leeren Container lokal, bis Daten kommen
    // ODER wir lassen es wie beim letzten Mal (lokaler State)
    if (isCreatingMode === 'folder') {
        if(!folders.includes(newInput)) setFolders(prev => [...prev, newInput].sort());
    } else if (isCreatingMode === 'category') {
        // Fach wird bei "Unsortiert" angezeigt
    }
    setNewInput('');
    setIsCreatingMode(null);
  };

  // --- LERNEN & REST (wie vorher) ---
  const startLearning = (filterType: 'all' | 'folder' | 'category', name?: string) => {
    const now = new Date().toISOString();
    let queue = cards.filter(c => c.due_date <= now);

    if (filterType === 'folder') queue = queue.filter(c => c.folder === name);
    if (filterType === 'category') queue = queue.filter(c => c.category === name);

    if (queue.length === 0) { alert("Nichts fällig! 🎉"); return; }
    
    setLearningQueue(queue.sort(() => Math.random() - 0.5));
    setCurrentCardIndex(0); setShowAnswer(false); setIsLearning(true);
  };

  const handleRate = async (grade: number) => {
    const card = learningQueue[currentCardIndex];
    let { interval, ease_factor, id } = card;
    if (grade >= 3) {
        if (interval === 0) interval = 1; else if (interval === 1) interval = 6; else interval = Math.round(interval * ease_factor);
        ease_factor = Math.max(1.3, ease_factor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)));
    } else { interval = 1; }
    
    const nextDueDate = new Date(); nextDueDate.setDate(nextDueDate.getDate() + interval);
    await supabase.from('flashcards').update({ interval, ease_factor, due_date: nextDueDate.toISOString() }).eq('id', id);
    
    setShowAnswer(false);
    if (currentCardIndex < learningQueue.length - 1) setCurrentCardIndex(p => p + 1);
    else { setIsLearning(false); loadAllData(); }
  };

  const handleSaveSingleCard = async () => {
    if (!newCardForm.front.trim() || !user) return;
    const { error } = await supabase.from('flashcards').insert([{
        user_id: user.id, front: newCardForm.front, back: newCardForm.back, category: targetCategoryForAdd,
        folder: cards.find(c => c.category === targetCategoryForAdd)?.folder || null, // Ordner erben!
        due_date: new Date().toISOString()
    }]);
    if (!error) { setIsAddModalOpen(false); loadAllData(); }
  };
  
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(!file || !user) return;
    setImportLoading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
        const content = ev.target?.result as string;
        let newCards: any[] = [];
        // ... (Import Logic wie zuvor, aber wir setzen folder!)
        const folderToInherit = cards.find(c => c.category === targetCategoryForAdd)?.folder || null;
        
        if (file.name.endsWith('.json')) {
            newCards = JSON.parse(content).map((c:any) => ({
                user_id: user.id, front: c.front||c.question, back: c.back||c.answer, category: targetCategoryForAdd, folder: folderToInherit, due_date: new Date().toISOString()
            }));
        }
        // ... Batch Insert ...
        if(newCards.length > 0) await supabase.from('flashcards').insert(newCards);
        setIsAddModalOpen(false); loadAllData(); setImportLoading(false);
    };
    reader.readAsText(file);
  };
  
  // --- SUB-COMPONENT: CATEGORY ROW (Wiederverwendbar) ---
  const CategoryRow = ({ cat, folderName }: { cat: string, folderName: string | null }) => {
    const catCards = cards.filter(c => c.category === cat);
    const dueCount = catCards.filter(c => c.due_date <= new Date().toISOString()).length;
    const isOpen = expandedCategories.includes(cat);

    return (
        <div className="mb-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:border-zinc-300 transition-all">
            <div onClick={() => toggleCategory(cat)} className="p-4 flex items-center justify-between cursor-pointer select-none bg-zinc-50/50 dark:bg-zinc-950/30">
                <div className="flex items-center gap-3">
                    <ChevronRight size={18} className={`transition-transform text-zinc-400 ${isOpen ? 'rotate-90' : ''}`} />
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{cat}</span>
                    <span className="text-xs text-zinc-400 font-mono">({catCards.length})</span>
                </div>
                <div className="flex items-center gap-2">
                    {dueCount > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{dueCount}</span>}
                    <button onClick={(e) => { e.stopPropagation(); startLearning('category', cat); }} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-cyan-500 hover:text-white rounded-lg transition-colors"><Brain size={16}/></button>
                    <button onClick={(e) => { e.stopPropagation(); setRenameValue(cat); setSettingsTarget({ type: 'category', name: cat }); }} className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg"><Settings2 size={16}/></button>
                </div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                        <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                             <button onClick={() => { setTargetCategoryForAdd(cat); setIsAddModalOpen(true); }} className="flex items-center justify-center p-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400 hover:text-cyan-500 hover:border-cyan-500 transition-all gap-2 text-sm font-bold"><Plus size={16}/> Karte hinzufügen</button>
                             {catCards.map(c => (
                                 <div key={c.id} className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 text-sm">
                                     <div className="font-bold mb-1 truncate">{c.front}</div>
                                     <div className="text-zinc-500 truncate">{c.back}</div>
                                 </div>
                             ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
  };


  // --- MAIN RENDER ---
  if (isLearning) {
      /* ... (Lernansicht identisch zu vorher, hier gekürzt für Lesbarkeit) ... */
      const currentCard = learningQueue[currentCardIndex];
      return (
        <div className="min-h-screen p-10 flex flex-col justify-center max-w-2xl mx-auto">
            <div className="flex justify-between mb-4"><span className="font-bold text-zinc-500">{currentCardIndex+1}/{learningQueue.length}</span><button onClick={()=>setIsLearning(false)}><X/></button></div>
            <div onClick={()=>setShowAnswer(!showAnswer)} className="min-h-[400px] flex items-center justify-center bg-white dark:bg-zinc-900 rounded-3xl border-2 cursor-pointer shadow-xl text-center p-10">
                <div>
                   <p className="text-xs font-black uppercase tracking-widest text-cyan-500 mb-4">{showAnswer ? 'Antwort' : 'Frage'}</p>
                   <h2 className="text-3xl font-bold">{showAnswer ? currentCard.back : currentCard.front}</h2>
                </div>
            </div>
            {showAnswer && <div className="grid grid-cols-4 gap-4 mt-6">{[0,3,4,5].map(g => <button key={g} onClick={()=>handleRate(g)} className="p-4 bg-zinc-800 text-white rounded-xl font-bold">{g===0?'Wdh':g===3?'Schwer':g===4?'Gut':'Einfach'}</button>)}</div>}
        </div>
      )
  }

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto pb-40 transition-colors relative">
      
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center pt-14 lg:pt-0">
        <div>
           <h1 className="text-4xl font-black tracking-tight flex items-center gap-2">Bibliothek 📚</h1>
           <p className="text-zinc-500 font-medium mt-1">{stats.due} fällig • {stats.total} Gesamt</p>
        </div>
        <div className="flex gap-2">
            <FlashcardImporter onImportSuccess={loadAllData} />
            <button onClick={() => startLearning('all')} className="px-6 py-3 bg-cyan-500 text-white rounded-2xl font-bold shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center gap-2"><Brain size={20}/> Start</button>
        </div>
      </header>

      {/* CREATE BAR */}
      <div className="flex gap-4 mb-8">
        {!isCreatingMode ? (
            <>
                <button onClick={() => setIsCreatingMode('folder')} className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-900 rounded-xl text-sm font-bold hover:bg-zinc-200 transition-colors"><FolderPlus size={16}/> Ordner erstellen</button>
                <button onClick={() => setIsCreatingMode('category')} className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-900 rounded-xl text-sm font-bold hover:bg-zinc-200 transition-colors"><Layers size={16}/> Fach erstellen</button>
            </>
        ) : (
            <div className="flex items-center gap-2 w-full max-w-md animate-in slide-in-from-left-4">
                <input autoFocus value={newInput} onChange={e=>setNewInput(e.target.value)} placeholder={isCreatingMode === 'folder' ? "Ordner Name (z.B. Semester 1)" : "Fach Name (z.B. Chemie)"} className="flex-1 px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border-2 border-cyan-500 outline-none font-bold" />
                <button onClick={handleCreate} className="p-2 bg-cyan-500 text-white rounded-xl"><Save size={20}/></button>
                <button onClick={() => setIsCreatingMode(null)} className="p-2 text-zinc-400 hover:text-zinc-600"><X size={20}/></button>
            </div>
        )}
      </div>

      <div className="space-y-8">
        
        {/* 1. ORDNER RENDERN */}
        {Object.entries(groupedStructure.folders).map(([folderName, categories]) => {
           const isOpen = expandedFolders.includes(folderName);
           return (
             <div key={folderName} className="border-l-4 border-zinc-200 dark:border-zinc-800 pl-4 md:pl-6 py-2">
                {/* Folder Header */}
                <div className="flex items-center justify-between mb-4 group">
                    <div onClick={() => toggleFolder(folderName)} className="flex items-center gap-3 cursor-pointer select-none">
                        {isOpen ? <FolderOpen className="text-cyan-500" size={24}/> : <Folder className="text-zinc-400 group-hover:text-cyan-500 transition-colors" size={24}/>}
                        <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{folderName}</h2>
                        <span className="text-xs font-bold bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md text-zinc-500">{categories.length} Fächer</span>
                    </div>
                    <button onClick={() => { setRenameValue(folderName); setSettingsTarget({ type: 'folder', name: folderName }); }} className="opacity-0 group-hover:opacity-100 p-2 text-zinc-400 hover:text-zinc-600 transition-opacity"><Settings2 size={18}/></button>
                </div>

                {/* Folder Content */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                             {categories.map(cat => (
                                 <CategoryRow key={cat} cat={cat} folderName={folderName} />
                             ))}
                             {categories.length === 0 && <p className="text-sm text-zinc-400 italic mb-4">Dieser Ordner ist leer. Verschiebe Fächer hierher.</p>}
                        </motion.div>
                    )}
                </AnimatePresence>
             </div>
           )
        })}

        {/* 2. UNSORTIERTE FÄCHER RENDERN */}
        {groupedStructure.unsorted.length > 0 && (
            <div className="mt-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4 ml-1">Unsortierte Fächer</h3>
                {groupedStructure.unsorted.map(cat => (
                    <CategoryRow key={cat} cat={cat} folderName={null} />
                ))}
            </div>
        )}
      </div>

      {/* --- SETTINGS MODAL (Rename / Move / Delete) --- */}
      {settingsTarget && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
             <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95">
                 <div className="flex justify-between items-center mb-6">
                     <h3 className="text-lg font-black">{settingsTarget.type === 'folder' ? 'Ordner' : 'Fach'} bearbeiten</h3>
                     <button onClick={() => setSettingsTarget(null)}><X size={20} className="text-zinc-400"/></button>
                 </div>
                 
                 <div className="space-y-4">
                     {/* 1. Rename */}
                     <div>
                         <label className="text-xs font-bold text-zinc-400 uppercase">Umbenennen</label>
                         <div className="flex gap-2 mt-1">
                             <input value={renameValue} onChange={e => setRenameValue(e.target.value)} className="flex-1 px-3 py-2 bg-zinc-100 dark:bg-zinc-950 rounded-lg border-none font-bold outline-none focus:ring-2 focus:ring-cyan-500" />
                             <button onClick={handleRename} className="p-2 bg-cyan-500 text-white rounded-lg"><Save size={18}/></button>
                         </div>
                     </div>

                     {/* 2. Move (Only for Categories) */}
                     {settingsTarget.type === 'category' && (
                         <div>
                            <label className="text-xs font-bold text-zinc-400 uppercase">In Ordner verschieben</label>
                            <select 
                               value={folders.find(f => groupedStructure.folders[f]?.includes(settingsTarget.name)) || ''}
                                onChange={(e) => { const val = e.target.value; setMoveToFolderValue(val); handleMoveCategoryToFolder(val || null); }}
                                className="w-full mt-1 px-3 py-2 bg-zinc-100 dark:bg-zinc-950 rounded-lg font-bold outline-none cursor-pointer"
                            >
                                <option value="">(Kein Ordner)</option>
                                {folders.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                         </div>
                     )}
                     
                     <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-4" />
                     
                     {/* 3. Delete */}
                     <button onClick={deleteItem} className="w-full py-3 bg-red-50 dark:bg-red-900/10 text-red-500 font-bold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2">
                         <Trash2 size={18}/> Löschen
                     </button>
                 </div>
             </div>
         </div>
      )}

      {/* --- ADD CARD MODAL (Reuse from before) --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800">
             <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950">
                <h3 className="text-xl font-black">Zu "{targetCategoryForAdd}" hinzufügen</h3>
                <button onClick={() => setIsAddModalOpen(false)}><X size={20}/></button>
             </div>
             <div className="p-6">
                <div className="flex gap-2 mb-6 p-1 bg-zinc-100 dark:bg-zinc-950 rounded-xl">
                   <button onClick={() => setAddMode('single')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${addMode === 'single' ? 'bg-white dark:bg-zinc-800 shadow-sm text-cyan-600' : 'text-zinc-500'}`}>Einzeln</button>
                   <button onClick={() => setAddMode('import')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${addMode === 'import' ? 'bg-white dark:bg-zinc-800 shadow-sm text-cyan-600' : 'text-zinc-500'}`}>Import</button>
                </div>
                {addMode === 'single' ? (
                  <div className="space-y-4">
                    <textarea autoFocus value={newCardForm.front} onChange={e => setNewCardForm({...newCardForm, front: e.target.value})} className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl font-bold" placeholder="Frage" />
                    <textarea value={newCardForm.back} onChange={e => setNewCardForm({...newCardForm, back: e.target.value})} className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl" placeholder="Antwort" />
                    <button onClick={handleSaveSingleCard} className="w-full py-3 bg-cyan-500 text-white font-bold rounded-xl">Speichern</button>
                  </div>
                ) : (
                  <div className="text-center p-8 border-2 border-dashed rounded-2xl cursor-pointer hover:bg-zinc-50" onClick={() => fileInputRef.current?.click()}>
                     {importLoading ? <div className="animate-spin w-6 h-6 border-2 border-cyan-500 rounded-full mx-auto"/> : <Upload className="mx-auto text-zinc-300 mb-2"/>}
                     <p className="font-bold text-zinc-500">Datei wählen</p>
                     <input ref={fileInputRef} type="file" accept=".json,.csv" className="hidden" onChange={handleImport} />
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

    </div>
  );
}