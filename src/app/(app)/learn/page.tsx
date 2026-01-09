'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link'; 
import { 
  Brain, Sparkles, Trophy, Target, Plus, Upload, Play, 
  Loader2, Layers, Clock, LayoutGrid 
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';

// Imports
import { FlashcardImporter } from '@/components/FlashcardImporter';
import { KnowledgeVault } from '@/components/KnowledgeVault/KnowledgeVault';

const glassClass = "bg-white/5 dark:bg-zinc-900/20 backdrop-blur-xl border border-white/10 dark:border-zinc-800/50 shadow-xl";

interface Deck {
  id: string;
  name: string;
  card_count: number;
  due_count: number;
}

export default function LearnPage() {
  // 1. ALLE Hooks müssen immer ausgeführt werden (ganz oben)
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'import'>('overview');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const stats = { dailyGoal: 50, learned: 12, streak: 5, mastered: 142 };

  // 2. Funktion definieren
  const loadDecks = async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      const { data: decksData, error: deckError } = await supabase
        .from('decks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (deckError) throw deckError;

      if (decksData) {
        const now = new Date().toISOString();
        const decksWithCount = await Promise.all(
          decksData.map(async (deck) => {
            const { count: totalCount } = await supabase
              .from('flashcards')
              .select('*', { count: 'exact', head: true })
              .eq('deck_id', deck.id);
            
            const { count: dueCount } = await supabase
              .from('flashcards')
              .select('*', { count: 'exact', head: true })
              .eq('deck_id', deck.id)
              .lte('next_review', now); 
            
            return {
              ...deck,
              card_count: totalCount || 0,
              due_count: dueCount || 0
            };
          })
        );
        setDecks(decksWithCount);
      }
    } catch (e) {
      console.error("Fehler beim Laden:", e);
    } finally {
      setLoading(false);
    }
  };

  // 3. Effect
  useEffect(() => {
    if (user) loadDecks();
  }, [user]);

  // 4. SICHERHEITS-CHECK (Das repariert Fehler #310)
  // Statt "return null" zeigen wir einen Spinner. 
  // So bleibt der React-Tree stabil.
  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="animate-spin w-10 h-10 text-purple-500" />
      </div>
    );
  }

  // 5. Normaler Render
  return (
    <div className="w-full max-w-[1920px] mx-auto p-4 md:p-8 lg:p-12 min-h-screen pb-40 bg-transparent text-zinc-900 dark:text-zinc-100 overflow-x-hidden">
      
      {/* HEADER WITH TABS */}
      <header className={`mb-10 p-4 md:p-8 rounded-[3rem] ${glassClass} flex flex-col md:flex-row justify-between items-center gap-6`}>
        <div>
           <h1 className="text-4xl md:text-5xl font-black tracking-tighter flex items-center gap-3">
             Lern <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Zentrale</span>
           </h1>
           <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm mt-2 pl-1">
             Verwalte dein Wissen
           </p>
        </div>

        <div className="flex bg-zinc-100 dark:bg-black/20 p-1.5 rounded-2xl w-full md:w-auto">
           <button 
             onClick={() => setActiveTab('overview')}
             className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'overview' ? 'bg-white dark:bg-zinc-800 shadow-md text-blue-600' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
           >
             <LayoutGrid size={18} /> Übersicht
           </button>
           <button 
             onClick={() => setActiveTab('import')}
             className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'import' ? 'bg-white dark:bg-zinc-800 shadow-md text-purple-500' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
           >
             <Upload size={18} /> Import Center
           </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        
        {/* === TAB 1: OVERVIEW === */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <StatCard icon={<Target className="text-blue-400" />} label="Tagesziel" value={`${stats.learned}/${stats.dailyGoal}`} sub="Karten heute" />
                <StatCard icon={<Trophy className="text-yellow-400" />} label="Streak" value={`${stats.streak} Tage`} sub="Nicht abreißen lassen!" />
                <StatCard icon={<Brain className="text-pink-400" />} label="Im Kopf" value={stats.mastered} sub="Gemeisterte Karten" />
                <StatCard icon={<Sparkles className="text-emerald-400" />} label="Level 4" value="1,240 XP" sub="360 XP bis Level 5" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                
                {/* DECKS */}
                <div className="xl:col-span-3 space-y-8">
                <h2 className="text-3xl font-black flex items-center gap-3 tracking-tight">
                    <Layers size={28} className="text-purple-500" /> Aktive Decks
                </h2>
                
                {loading ? (
                    <div className={`flex flex-col items-center justify-center py-32 rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 ${glassClass}`}>
                        <Loader2 className="animate-spin text-purple-500 mb-4" size={40} />
                        <p className="text-zinc-500 font-black uppercase tracking-widest text-xs">Synchronisiere Decks...</p>
                    </div>
                ) : decks.length === 0 ? (
                    <div className={`text-center py-32 text-zinc-500 rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 ${glassClass}`}>
                        <p className="font-bold text-xl mb-4 text-zinc-900 dark:text-white">Noch keine Decks vorhanden.</p>
                        <button onClick={() => setActiveTab('import')} className="text-purple-500 font-black uppercase tracking-widest hover:underline text-sm">Jetzt erste Karten importieren</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {decks.map((deck) => (
                            <DeckCard key={deck.id} deck={deck} color="bg-cyan-500" />
                        ))}

                        <button 
                        onClick={() => setActiveTab('import')} 
                        className={`h-64 rounded-[2.5rem] border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-purple-500/50 hover:bg-purple-500/5 flex flex-col items-center justify-center gap-4 transition-all group ${glassClass}`}
                        >
                        <div className="p-5 bg-zinc-100 dark:bg-zinc-800 rounded-full group-hover:scale-110 transition-transform shadow-lg"><Plus className="text-purple-500" size={24} /></div>
                        <span className="font-black text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white uppercase tracking-widest text-xs">Neues Deck / Import</span>
                        </button>
                    </div>
                )}
                </div>
                
                {/* SIDEBAR */}
                <div className="space-y-8">
                <h2 className="text-3xl font-black flex items-center gap-3 tracking-tight">
                    <Sparkles size={28} className="text-yellow-500" /> AI Assistant
                </h2>
                <div className={`p-10 rounded-[3rem] ${glassClass} border-yellow-500/10`}>
                    <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center mb-6 text-yellow-500">
                        <Sparkles size={32} />
                    </div>
                    <h3 className="font-black text-xl mb-2 text-zinc-900 dark:text-white">AI Helper</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                        Der AI-Helper analysiert deine Lernschwächen und erstellt automatisch optimierte Übungen.
                    </p>
                    <button 
                        onClick={() => setActiveTab('import')} 
                        className="mt-6 px-4 py-2 bg-yellow-500 text-black rounded-lg text-xs font-black uppercase tracking-widest w-full hover:bg-yellow-400 transition-colors"
                    >
                        AI Generator öffnen
                    </button>
                </div>
                </div>
            </div>
          </motion.div>
        )}

        {/* === TAB 2: IMPORT CENTER === */}
        {activeTab === 'import' && (
          <motion.div 
             key="import"
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: -20 }}
             className="grid grid-cols-1 xl:grid-cols-2 gap-8"
          >
             {/* LEFT: KnowledgeVault */}
             <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3 mb-2">
                    <span className="p-2 bg-purple-500/10 text-purple-500 rounded-xl"><Sparkles size={20} /></span>
                    <h3 className="text-xl font-black">AI Generator (PDF)</h3>
                </div>
                <KnowledgeVault onCardsGenerated={() => {
                    loadDecks();
                }} />
             </div>

             {/* RIGHT: File Import */}
             <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3 mb-2">
                    <span className="p-2 bg-zinc-500/10 text-zinc-500 rounded-xl"><Layers size={20} /></span>
                    <h3 className="text-xl font-black">Datei Import (CSV/JSON)</h3>
                </div>
                
                <div className={`p-8 rounded-[3rem] ${glassClass} h-full flex flex-col justify-center items-center text-center`}>
                    <FlashcardImporter 
                        onImportSuccess={loadDecks}
                    />
                    
                    <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-white/5 w-full">
                        <h4 className="font-bold mb-4 flex items-center justify-center gap-2">Format Hilfe</h4>
                        <div className="text-xs text-zinc-500 space-y-2 font-mono bg-zinc-100 dark:bg-black/20 p-4 rounded-xl text-left">
                            <p><strong>CSV:</strong> Frage; Antwort; Kategorie</p>
                            <p><strong>JSON:</strong> Array von Objekten mit "front", "back"</p>
                        </div>
                    </div>
                </div>
             </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

// ------------------------------------------------------------------
// SUB-COMPONENTS
// ------------------------------------------------------------------

function StatCard({ icon, label, value, sub }: any) {
  return (
    <div className={`p-8 rounded-[2.5rem] hover:-translate-y-1 transition-transform duration-300 ${glassClass}`}>
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl shadow-sm">{icon}</div>
        <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
      </div>
      <div className="text-4xl font-black mb-1 text-zinc-900 dark:text-white tracking-tight">{value}</div>
      <div className="text-xs text-zinc-500 font-bold">{sub}</div>
    </div>
  );
}

function DeckCard({ deck, color }: { deck: Deck, color: string }) {
  const hasDueCards = deck.due_count > 0;

  return (
    <Link href={`/learn/${deck.id}`} className="block group h-full">
        <div className={`h-64 p-8 rounded-[2.5rem] flex flex-col justify-between relative overflow-hidden transition-all duration-300 group-hover:-translate-y-2 ${glassClass} group-hover:border-cyan-500/30`}>
            
            <div className={`absolute top-0 left-0 w-1.5 h-full ${color} shadow-[0_0_20px_rgba(6,182,212,0.6)]`} />
            
            <div>
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-2xl truncate text-zinc-900 dark:text-white tracking-tight pr-4">{deck.name}</h3>
                    {hasDueCards && (
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]" title="Karten fällig!" />
                    )}
                </div>
                
                <div className="flex gap-2">
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800/50 px-3 py-1 rounded-lg">
                    {deck.card_count} Karten
                    </p>
                    {hasDueCards && (
                        <p className="text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-500/10 px-3 py-1 rounded-lg">
                        {deck.due_count} Fällig
                        </p>
                    )}
                </div>
            </div>

            <div className="flex justify-between items-end">
                {hasDueCards ? (
                    <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold">
                        <Clock size={14} className="text-red-500" />
                        <span className="text-red-500">Zeit zu lernen</span>
                    </div>
                ) : (
                    <div className="px-4 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20">
                        Alles erledigt
                    </div>
                )}

                <div className="bg-zinc-900 dark:bg-white text-white dark:text-black p-4 rounded-2xl opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 shadow-xl scale-90 group-hover:scale-100">
                    <Play size={20} fill="currentColor" />
                </div>
            </div>
        </div>
    </Link>
  );
}