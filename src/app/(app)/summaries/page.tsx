'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Upload, Trash2, Search, FileText, X, 
  ChevronDown, Folder, Tag, CornerUpLeft, CheckSquare, Square, Move, FolderPlus
} from 'lucide-react';

// Zentrale Glass-Klasse (Mobile optimiert)
const glassClass = "bg-white/5 dark:bg-zinc-900/20 backdrop-blur-xl border border-white/10 dark:border-zinc-800/50 shadow-xl";

type Summary = {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
};

export default function SummariesPage() {
  const { user } = useAuth();
  
  // Data State
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [isImporting, setIsImporting] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Navigation State
  const [currentFolder, setCurrentFolder] = useState<string | null>(null); // null = Root

  // Selection / Bulk Action State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [moveTarget, setMoveTarget] = useState('');

  // Upload State
  const [uploadCategory, setUploadCategory] = useState('Allgemein');

  useEffect(() => {
    if (user) fetchSummaries();
  }, [user]);

  const fetchSummaries = async () => {
    const { data } = await supabase
      .from('summaries')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    if (data) setSummaries(data);
    setLoading(false);
  };

  // --- DERIVED STATE ---
  const structure = useMemo(() => {
    const folders = new Set<string>();
    const rootFiles: Summary[] = [];
    const folderFiles: Summary[] = [];

    // Alle verfügbaren Kategorien für das Menü sammeln
    const allCategories = new Set(summaries.map(s => s.category || 'Allgemein'));

    const filtered = summaries.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()));

    filtered.forEach(s => {
        const cat = s.category || 'Allgemein';
        if (currentFolder === null) {
            if (cat === 'Allgemein') rootFiles.push(s);
            else folders.add(cat);
        } else {
            if (cat === currentFolder) folderFiles.push(s);
        }
    });

    return {
        folders: Array.from(folders).sort(),
        files: currentFolder === null ? rootFiles : folderFiles,
        allCategories: Array.from(allCategories).sort()
    };
  }, [summaries, currentFolder, searchTerm]);

  // --- ACTIONS ---

  const handleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleBulkMove = async () => {
    if (!moveTarget.trim()) return alert("Bitte Ordnernamen eingeben!");
    
    const updates = Array.from(selectedIds).map(id => 
        supabase.from('summaries').update({ category: moveTarget }).eq('id', id)
    );

    await Promise.all(updates);
    await fetchSummaries();
    setIsSelectionMode(false);
    setSelectedIds(new Set());
    setMoveTarget('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
        alert("Bitte nur .html Dateien hochladen!");
        return;
    }

    const title = file.name.replace('.html', '').replace('.htm', '');
    const content = await file.text();

    // Priorität: User Auswahl im Modal > Aktueller Ordner > Allgemein
    const finalCategory = uploadCategory || currentFolder || 'Allgemein';

    const { error } = await supabase.from('summaries').insert([{
        user_id: user.id,
        title: title,
        content: content,
        category: finalCategory
    }]);

    if (error) {
        alert("Fehler: " + error.message);
    } else {
        setIsImporting(false);
        fetchSummaries();
        await supabase.rpc('increment_xp', { x: 20, row_id: user.id });
    }
  };

  const deleteSummary = async (id: string, e: any) => {
    e.stopPropagation();
    if (!confirm('Wirklich löschen?')) return;
    const { error } = await supabase.from('summaries').delete().eq('id', id);
    if (!error) setSummaries(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="w-full max-w-[1920px] p-4 md:p-6 lg:p-12 min-h-screen pb-40 bg-transparent text-zinc-900 dark:text-zinc-100 overflow-x-hidden">
      
      {/* HEADER (Mobile First) */}
      <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] ${glassClass}`}>
        <div className="w-full lg:w-auto">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2 overflow-x-auto">
             <button onClick={() => setCurrentFolder(null)} className="hover:text-blue-500 transition-colors whitespace-nowrap">Bibliothek</button>
             {currentFolder && (
                 <>
                    <ChevronDown className="-rotate-90 shrink-0" size={12} />
                    <span className="text-blue-500 whitespace-nowrap">{currentFolder}</span>
                 </>
             )}
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter flex items-center gap-3 text-zinc-900 dark:text-white">
            {currentFolder ? currentFolder : 'Deep Reader'}
          </h1>
          {/* KONTRAST FIX: Dunkleres Grau im Lightmode (zinc-600 statt 500) */}
          <p className="text-zinc-600 dark:text-zinc-400 font-bold text-xs md:text-sm mt-2 pl-1">
             {structure.files.length} Dateien {currentFolder === null && `• ${structure.folders.length} Ordner`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Suchen..."
                    className="w-full pl-12 pr-4 py-3.5 bg-zinc-100 dark:bg-black/20 border border-transparent focus:border-blue-500/30 rounded-2xl outline-none text-sm font-medium transition-all"
                />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
                {/* Selection Toggle */}
                <button 
                    onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedIds(new Set()); }}
                    className={`flex-1 sm:flex-none px-4 py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all ${isSelectionMode ? 'bg-blue-500 text-white' : 'bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10'}`}
                >
                    {isSelectionMode ? <CheckSquare size={18} /> : <Square size={18} />}
                    <span className="text-xs font-bold uppercase block sm:hidden xl:block">Wählen</span>
                </button>

                {/* Import Button */}
                <button 
                    onClick={() => setIsImporting(!isImporting)}
                    className="flex-1 sm:flex-none bg-zinc-900 dark:bg-white text-white dark:text-black px-6 py-3.5 rounded-2xl font-black shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                >
                    {isImporting ? <X size={18}/> : <Upload size={18} />}
                    <span className="hidden sm:inline">{isImporting ? 'Abbrechen' : 'Import'}</span>
                </button>
            </div>
        </div>
      </div>

      {/* BULK ACTION BAR (Mobile Fixed Bottom) */}
      <AnimatePresence>
        {isSelectionMode && selectedIds.size > 0 && (
            <motion.div 
                initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
                className="fixed bottom-24 md:bottom-10 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-50 bg-zinc-900 dark:bg-white text-white dark:text-black p-4 rounded-[2rem] shadow-2xl flex flex-col sm:flex-row items-center gap-4 border border-zinc-700 dark:border-zinc-200 max-w-lg mx-auto"
            >
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                    <span className="font-bold px-2 whitespace-nowrap">{selectedIds.size} markiert</span>
                    <button onClick={() => setIsSelectionMode(false)} className="sm:hidden p-2"><X size={16}/></button>
                </div>
                
                <div className="flex items-center gap-2 w-full">
                    <input 
                        value={moveTarget}
                        onChange={(e) => setMoveTarget(e.target.value)}
                        placeholder="Ordnername..."
                        className="flex-1 bg-white/10 dark:bg-black/5 rounded-xl px-4 py-2 outline-none text-sm font-medium placeholder:text-white/50 dark:placeholder:text-black/50"
                    />
                    <button onClick={handleBulkMove} className="bg-blue-500 hover:bg-blue-400 text-white p-2.5 rounded-xl transition-colors shrink-0">
                        <Move size={18} />
                    </button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* UPLOAD AREA */}
      <AnimatePresence>
        {isImporting && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-8"
          >
            <div className={`border-4 border-dashed border-blue-500/20 bg-blue-500/5 rounded-[2.5rem] p-6 md:p-12 flex flex-col items-center justify-center text-center ${glassClass}`}>
                
                {/* 1. Existing Folders Selection (Chips) */}
                {structure.allCategories.length > 0 && (
                    <div className="w-full max-w-2xl mb-8">
                        <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">In vorhandenen Ordner speichern</p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {structure.allCategories.filter(c => c !== 'Allgemein').map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setUploadCategory(cat)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                        uploadCategory === cat 
                                        ? 'bg-blue-500 border-blue-500 text-white shadow-lg' 
                                        : 'bg-white/40 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:border-blue-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Folder size={12} /> {cat}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* 2. New Folder Input */}
                <div className="flex flex-col items-center gap-2 mb-8 w-full max-w-xs">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Oder neu erstellen</label>
                    <div className="flex items-center gap-2 bg-white dark:bg-black/20 p-2 rounded-xl border border-zinc-200 dark:border-white/10 w-full focus-within:border-blue-500/50 transition-colors">
                        <FolderPlus size={18} className="text-blue-500 ml-2" />
                        <input 
                            value={uploadCategory}
                            onChange={(e) => setUploadCategory(e.target.value)}
                            placeholder="Ordnername..."
                            className="bg-transparent outline-none text-sm font-bold text-zinc-800 dark:text-white w-full placeholder:font-normal"
                        />
                    </div>
                </div>

                {/* 3. Upload Button */}
                <div className="flex flex-col gap-4 items-center">
                    <input type="file" accept=".html,.htm" onChange={handleFileUpload} className="hidden" id="summary-upload" />
                    <label htmlFor="summary-upload" className="bg-blue-500 text-white px-10 py-4 rounded-2xl font-black cursor-pointer hover:bg-blue-400 transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center gap-2">
                        <Upload size={20} />
                        HTML Datei wählen
                    </label>
                    <p className="text-zinc-400 text-xs">Unterstützt .html und .htm</p>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTENT GRID */}
      {loading ? (
         <div className="text-center py-20"><div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"/></div>
      ) : (
         <div className="space-y-8">
            
            {/* 1. ORDNER ANSICHT (Nur im Root) */}
            {currentFolder === null && structure.folders.length > 0 && (
                <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4 ml-2">Ordner ({structure.folders.length})</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                        {structure.folders.map(folder => (
                            <div 
                                key={folder}
                                onClick={() => setCurrentFolder(folder)}
                                className={`aspect-square rounded-[2rem] flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:-translate-y-1 hover:bg-blue-500/10 group border border-transparent hover:border-blue-500/30 bg-white/5 dark:bg-white/5 border-white/10 shadow-sm`}
                            >
                                <Folder size={32} className="text-blue-500 fill-blue-500/20 md:w-10 md:h-10" />
                                <span className="font-bold text-xs md:text-sm text-center px-2 truncate w-full">{folder}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 2. DATEIEN ANSICHT */}
            <div>
                <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">
                        {currentFolder ? 'Inhalt' : 'Unsortierte Dateien'} ({structure.files.length})
                    </h3>
                    
                    {currentFolder && (
                        <button onClick={() => setCurrentFolder(null)} className="flex items-center gap-1 text-zinc-500 hover:text-blue-500 font-bold text-xs uppercase tracking-widest transition-colors">
                            <CornerUpLeft size={14} /> Zurück
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {structure.files.length === 0 ? (
                        <div className={`text-center py-16 rounded-[2rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 ${glassClass}`}>
                            <p className="text-zinc-400 font-medium">Dieser Ordner ist leer.</p>
                        </div>
                    ) : (
                        structure.files.map((s) => {
                            const isOpen = openId === s.id;
                            const isSelected = selectedIds.has(s.id);

                            return (
                                <motion.div 
                                    layout
                                    key={s.id} 
                                    className={`rounded-[2rem] md:rounded-[2.5rem] overflow-hidden transition-all duration-300 border ${
                                        isSelected 
                                        ? 'border-blue-500 bg-blue-500/5' 
                                        : isOpen ? 'bg-zinc-50 dark:bg-black/40 border-blue-500/20' : `${glassClass} border-transparent hover:border-blue-500/20`
                                    }`}
                                >
                                    <div className="w-full flex justify-between items-center p-5 md:p-8">
                                        <div className="flex items-center gap-4 flex-1 cursor-pointer min-w-0" onClick={() => {
                                            if (isSelectionMode) handleSelection(s.id);
                                            else setOpenId(isOpen ? null : s.id);
                                        }}>
                                            {/* Icon Logic */}
                                            {isSelectionMode ? (
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shrink-0 ${isSelected ? 'bg-blue-500 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'}`}>
                                                    {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                                                </div>
                                            ) : (
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-colors shrink-0 ${isOpen ? 'bg-blue-500 text-white' : 'bg-blue-500/10 text-blue-500'}`}>
                                                    <FileText size={20} />
                                                </div>
                                            )}
                                            
                                            <div className="min-w-0">
                                                <h3 className={`font-bold text-base md:text-lg truncate ${isSelected ? 'text-blue-500' : 'text-zinc-900 dark:text-white'}`}>{s.title}</h3>
                                                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest truncate">
                                                    {new Date(s.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {!isSelectionMode && (
                                            <div className="flex items-center gap-2 pl-2">
                                                <button onClick={() => setOpenId(isOpen ? null : s.id)} className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${isOpen ? 'rotate-180 bg-zinc-200 dark:bg-zinc-800' : 'hover:bg-zinc-100 dark:hover:bg-white/10'}`}>
                                                    <ChevronDown size={20} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* CONTENT VIEW */}
                                    <AnimatePresence>
                                        {isOpen && !isSelectionMode && (
                                            <motion.div 
                                                initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                                                className="border-t border-zinc-200 dark:border-white/5"
                                            >
                                                <div className="p-6 md:p-12">
                                                    <article className="prose prose-lg prose-zinc dark:prose-invert max-w-none overflow-x-auto">
                                                        <div dangerouslySetInnerHTML={{ __html: s.content }} />
                                                    </article>
                                                    <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-white/5 flex justify-end">
                                                        <button 
                                                            onClick={(e) => deleteSummary(s.id, e)}
                                                            className="px-6 py-3 bg-red-500/10 text-red-500 rounded-xl font-bold flex items-center gap-2 hover:bg-red-500 hover:text-white transition-all text-xs uppercase tracking-widest"
                                                        >
                                                            <Trash2 size={16} /> Löschen
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>
         </div>
      )}
    </div>
  );
}