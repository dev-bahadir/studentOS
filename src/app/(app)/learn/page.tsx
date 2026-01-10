'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Sparkles, Trophy, Target, Plus, Upload, Play, 
  Loader2, Layers, Clock, LayoutGrid, RotateCw, X, Check, Zap, ArrowLeft
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import confetti from 'canvas-confetti';

// Imports
import { FlashcardImporter } from '@/components/FlashcardImporter';
import { KnowledgeVault } from '@/components/KnowledgeVault/KnowledgeVault';
import { calculateFSRS, type Rating } from '@/lib/fsrs';

// Etwas reduziertes Padding/Shadow für cleaneren Look
const glassClass = "bg-white/5 dark:bg-zinc-900/20 backdrop-blur-xl border border-white/10 dark:border-zinc-800/50 shadow-lg";

interface Deck {
  id: string;
  name: string;
  card_count: number;
  due_count: number;
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
  deck_id: string;
  stability: number;
  difficulty: number;
  state: number;
  last_review_at: string;
  next_review_at: string;
  repetition_count: number;
}

export default function LearnPage() {
  const { user } = useAuth();
  
  // Tabs State
  const [activeTab, setActiveTab] = useState<'overview' | 'import'>('overview');
  
  // Data State
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  // --- LEARNING SESSION STATE ---
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionQueue, setSessionQueue] = useState<Flashcard[]>([]);
  const [currentCard, setCurrentCard] = useState<Flashcard | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });

  // Stats (Dummy data -> später dynamisch)
  const stats = { dailyGoal: 50, learned: 12, streak: 5, mastered: 142 };

  // 1. Lade Daten
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
            
            // FSRS "Due" Logik: next_review_at <= jetzt
            const { count: dueCount } = await supabase
              .from('flashcards')
              .select('*', { count: 'exact', head: true })
              .eq('deck_id', deck.id)
              .lte('next_review_at', now);
            
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

  useEffect(() => {
    if (user) loadDecks();
  }, [user]);

  // --- SESSION LOGIC ---

  const startSession = async (deckId?: string) => {
    if (!user) return;
    setLoading(true);
    const now = new Date().toISOString();
    
    // Hole Karten: Neu (state=0) ODER Fällig
    let query = supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', user.id)
      .or(`state.eq.0,next_review_at.lte.${now}`) 
      .order('next_review_at', { ascending: true }) // Dringendste zuerst
      .limit(50); // Session Limit

    if (deckId) {
        query = query.eq('deck_id', deckId);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Fetch Error:", error);
        alert("Fehler beim Starten der Session.");
    } else if (data && data.length > 0) {
        setSessionQueue(data as Flashcard[]);
        setCurrentCard(data[0] as Flashcard);
        setIsSessionActive(true);
        setSessionStats({ reviewed: 0, correct: 0 });
    } else {
        alert("Alles erledigt! Keine Karten fällig. Gönn dir eine Pause ☕");
    }
    setLoading(false);
  };

  const handleRating = async (rating: Rating) => {
    if (!currentCard || !user) return;

    // 1. Visuelles Feedback
    if (rating >= 3) confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });

    // 2. FSRS Berechnung
    const fsrsInput = {
        stability: currentCard.stability,
        difficulty: currentCard.difficulty,
        state: currentCard.state,
        last_review: currentCard.last_review_at
    };
    
    const result = calculateFSRS(fsrsInput, rating);

    // 3. Optimistic Update (Nächste Karte)
    const nextQueue = sessionQueue.slice(1);
    setSessionQueue(nextQueue);
    setCurrentCard(nextQueue.length > 0 ? nextQueue[0] : null);
    setIsFlipped(false);
    setSessionStats(prev => ({ 
        reviewed: prev.reviewed + 1, 
        correct: rating >= 3 ? prev.correct + 1 : prev.correct 
    }));

    // 4. DB Update (Hintergrund)
    await supabase.from('flashcards').update({
        stability: result.stability,
        difficulty: result.difficulty,
        state: result.state,
        last_review_at: new Date().toISOString(),
        next_review_at: result.next_review_at,
        repetition_count: (currentCard.repetition_count || 0) + 1
    }).eq('id', currentCard.id);

    // XP Award
    await supabase.rpc('increment_xp', { x: rating * 2, row_id: user.id });
  };

  const endSession = () => {
    setIsSessionActive(false);
    setCurrentCard(null);
    loadDecks(); // Stats aktualisieren
  };

  // --- RENDER ---

  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="animate-spin w-10 h-10 text-purple-500" />
      </div>
    );
  }

  // ANSICHT 1: ACTIVE SESSION
  if (isSessionActive) {
      if (!currentCard) {
          // Session Summary Screen
          return (
            <div className="flex h-screen items-center justify-center p-4 bg-[#0a0e12]">
                <div className={`max-w-md w-full p-8 text-center rounded-[2.5rem] ${glassClass}`}>
                    <div className="text-6xl mb-6 animate-bounce">🏆</div>
                    <h2 className="text-3xl font-black mb-2 text-white">Session Complete!</h2>
                    <p className="text-zinc-400 mb-8">Stark! Dein Gehirn dankt dir.</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-4 bg-white/5 rounded-2xl">
                            <div className="text-2xl font-black text-cyan-400">{sessionStats.reviewed}</div>
                            <div className="text-[10px] uppercase font-bold text-zinc-500">Karten</div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl">
                            <div className="text-2xl font-black text-emerald-400">{sessionStats.reviewed > 0 ? Math.round((sessionStats.correct / sessionStats.reviewed) * 100) : 100}%</div>
                            <div className="text-[10px] uppercase font-bold text-zinc-500">Genauigkeit</div>
                        </div>
                    </div>

                    <button onClick={endSession} className="w-full py-4 bg-white text-black rounded-2xl font-black hover:scale-105 transition-transform">
                        Zurück zur Übersicht
                    </button>
                </div>
            </div>
          );
      }

      // Flashcard UI
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-6 bg-[#0a0e12] overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-amber-500 opacity-50" />
            
            {/* Top Bar */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-center text-zinc-500 font-bold font-mono text-xs z-50">
                <div className="flex items-center gap-2"><Layers size={14} /> {sessionQueue.length} verbleibend</div>
                <button onClick={endSession} className="hover:text-white transition-colors flex items-center gap-2"><X size={14} /> Abbrechen</button>
            </div>

            {/* CARD CONTAINER */}
            <div className="w-full max-w-xl aspect-[4/3] relative perspective-1000 group mt-4">
                <motion.div 
                    className={`w-full h-full relative preserve-3d transition-all duration-500 cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    key={currentCard.id}
                    onClick={() => setIsFlipped(!isFlipped)}
                    style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                >
                    {/* FRONT */}
                    <div className={`absolute inset-0 backface-hidden p-8 flex flex-col items-center justify-center text-center rounded-[2.5rem] ${glassClass} border-cyan-500/20`}>
                        <span className="absolute top-6 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500">Frage</span>
                        <h2 className="text-xl md:text-3xl font-bold text-white leading-tight select-none">
                            {currentCard.front}
                        </h2>
                        <div className="absolute bottom-6 text-zinc-500 text-[10px] animate-pulse">Klicken zum Umdrehen</div>
                    </div>

                    {/* BACK */}
                    <div className={`absolute inset-0 backface-hidden p-8 flex flex-col items-center justify-center text-center rounded-[2.5rem] bg-zinc-900 border border-zinc-700 shadow-2xl rotate-y-180`}
                        style={{ transform: 'rotateY(180deg)' }}>
                        <span className="absolute top-6 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Antwort</span>
                        <p className="text-lg md:text-2xl font-medium text-zinc-100 leading-relaxed select-none">
                            {currentCard.back}
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* CONTROLS */}
            <div className={`mt-8 grid grid-cols-4 gap-3 w-full max-w-xl transition-all duration-300 ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                <button onClick={() => handleRating(1)} className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-all hover:scale-105 active:scale-95">
                    <X size={20} /><span className="text-[10px] font-black uppercase tracking-widest">Nochmal</span>
                </button>
                <button onClick={() => handleRating(2)} className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 border border-orange-500/20 transition-all hover:scale-105 active:scale-95">
                    <Clock size={20} /><span className="text-[10px] font-black uppercase tracking-widest">Schwer</span>
                </button>
                <button onClick={() => handleRating(3)} className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border border-blue-500/20 transition-all hover:scale-105 active:scale-95">
                    <Check size={20} /><span className="text-[10px] font-black uppercase tracking-widest">Gut</span>
                </button>
                <button onClick={() => handleRating(4)} className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 transition-all hover:scale-105 active:scale-95">
                    <Zap size={20} /><span className="text-[10px] font-black uppercase tracking-widest">Easy</span>
                </button>
            </div>
        </div>
      );
  }

  // ANSICHT 2: DASHBOARD (Standard)
  return (
    // PADDING FIX: p-4 md:p-6 lg:p-8 statt p-12
    <div className="w-full max-w-[1920px] mx-auto p-4 md:p-6 lg:p-8 min-h-screen pb-40 bg-transparent text-zinc-900 dark:text-zinc-100 overflow-x-hidden">
      
      {/* HEADER WITH TABS */}
      <header className={`mb-8 p-6 rounded-[2.5rem] ${glassClass} flex flex-col md:flex-row justify-between items-center gap-6`}>
        <div>
           <h1 className="text-3xl md:text-5xl font-black tracking-tighter flex items-center gap-3">
             Lern <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Zentrale</span>
           </h1>
           <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mt-2 pl-1">
             Verwalte dein Wissen
           </p>
        </div>

        <div className="flex bg-zinc-100 dark:bg-black/20 p-1 rounded-2xl w-full md:w-auto">
           <button 
             onClick={() => setActiveTab('overview')}
             className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'overview' ? 'bg-white dark:bg-zinc-800 shadow-md text-blue-600' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
           >
             <LayoutGrid size={16} /> Übersicht
           </button>
           <button 
             onClick={() => setActiveTab('import')}
             className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'import' ? 'bg-white dark:bg-zinc-800 shadow-md text-purple-500' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
           >
             <Upload size={16} /> Import
           </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        
        {/* === TAB 1: OVERVIEW === */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={<Target className="text-blue-400" />} label="Tagesziel" value={`${stats.learned}/${stats.dailyGoal}`} sub="Karten heute" />
                <StatCard icon={<Trophy className="text-yellow-400" />} label="Streak" value={`${stats.streak} Tage`} sub="Dranbleiben!" />
                <StatCard icon={<Brain className="text-pink-400" />} label="Mastered" value={stats.mastered} sub="Karten im Kopf" />
                <StatCard icon={<Sparkles className="text-emerald-400" />} label="XP Gain" value="+1240" sub="Diese Woche" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                
                {/* DECKS */}
                <div className="xl:col-span-3 space-y-6">
                  <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-black flex items-center gap-3 tracking-tight">
                          <Layers size={24} className="text-purple-500" /> Aktive Decks
                      </h2>
                      {/* START SMART SESSION BUTTON */}
                      <button 
                          onClick={() => startSession()} // Startet Mix
                          disabled={loading}
                          className="bg-zinc-900 dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform text-sm"
                      >
                          <Play fill="currentColor" size={14} /> Smart Session
                      </button>
                  </div>
                  
                  {loading ? (
                      <div className={`flex flex-col items-center justify-center py-20 rounded-[2.5rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 ${glassClass}`}>
                          <Loader2 className="animate-spin text-purple-500 mb-4" size={32} />
                          <p className="text-zinc-500 font-black uppercase tracking-widest text-xs">Lade Decks...</p>
                      </div>
                  ) : decks.length === 0 ? (
                      <div className={`text-center py-20 text-zinc-500 rounded-[2.5rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 ${glassClass}`}>
                          <p className="font-bold text-lg mb-4 text-zinc-900 dark:text-white">Noch keine Decks vorhanden.</p>
                          <button onClick={() => setActiveTab('import')} className="text-purple-500 font-black uppercase tracking-widest hover:underline text-xs">Jetzt erste Karten importieren</button>
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {decks.map((deck) => (
                              <DeckCard key={deck.id} deck={deck} color="bg-cyan-500" onPlay={() => startSession(deck.id)} />
                          ))}

                          <button 
                            onClick={() => setActiveTab('import')} 
                            className={`h-56 rounded-[2rem] border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-purple-500/50 hover:bg-purple-500/5 flex flex-col items-center justify-center gap-4 transition-all group ${glassClass}`}
                          >
                            <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-full group-hover:scale-110 transition-transform shadow-lg"><Plus className="text-purple-500" size={20} /></div>
                            <span className="font-black text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white uppercase tracking-widest text-xs">Neues Deck</span>
                          </button>
                      </div>
                  )}
                </div>
                
                {/* SIDEBAR */}
                <div className="space-y-6">
                  <h2 className="text-2xl font-black flex items-center gap-3 tracking-tight">
                      <Sparkles size={24} className="text-yellow-500" /> AI Assistant
                  </h2>
                  <div className={`p-8 rounded-[2.5rem] ${glassClass} border-yellow-500/10`}>
                      <div className="w-14 h-14 bg-yellow-500/10 rounded-2xl flex items-center justify-center mb-4 text-yellow-500">
                          <Sparkles size={28} />
                      </div>
                      <h3 className="font-black text-lg mb-2 text-zinc-900 dark:text-white">AI Helper</h3>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium mb-6">
                          Der AI-Helper analysiert deine PDFs und erstellt automatisch Lernkarten für dich.
                      </p>
                      <button 
                          onClick={() => setActiveTab('import')} 
                          className="px-4 py-3 bg-yellow-500 text-black rounded-xl text-xs font-black uppercase tracking-widest w-full hover:bg-yellow-400 transition-colors shadow-lg shadow-yellow-500/20"
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
             initial={{ opacity: 0, x: 10 }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: -10 }}
             className="grid grid-cols-1 xl:grid-cols-2 gap-8"
          >
             {/* LEFT: KnowledgeVault */}
             <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 mb-2">
                    <span className="p-2 bg-purple-500/10 text-purple-500 rounded-xl"><Sparkles size={20} /></span>
                    <h3 className="text-xl font-black">AI Generator (PDF)</h3>
                </div>
                <KnowledgeVault onCardsGenerated={() => {
                    loadDecks();
                }} />
             </div>

             {/* RIGHT: File Import */}
             <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 mb-2">
                    <span className="p-2 bg-zinc-500/10 text-zinc-500 rounded-xl"><Layers size={20} /></span>
                    <h3 className="text-xl font-black">Datei Import (CSV/JSON)</h3>
                </div>
                
                <div className={`p-8 rounded-[2.5rem] ${glassClass} h-full flex flex-col justify-center items-center text-center`}>
                    <FlashcardImporter 
                        onImportSuccess={loadDecks}
                    />
                    
                    <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-white/5 w-full">
                        <h4 className="font-bold mb-4 flex items-center justify-center gap-2 text-sm">Format Hilfe</h4>
                        <div className="text-[10px] text-zinc-500 space-y-2 font-mono bg-zinc-100 dark:bg-black/20 p-4 rounded-xl text-left">
                            <p><strong>CSV:</strong> Frage; Antwort; Kategorie</p>
                            <p><strong>JSON:</strong> Array von Objekten mit &quot;front&quot;, &quot;back&quot;</p>
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
    <div className={`p-6 rounded-[2rem] hover:-translate-y-1 transition-transform duration-300 ${glassClass}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl shadow-sm">{icon}</div>
        <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
      </div>
      <div className="text-3xl font-black mb-1 text-zinc-900 dark:text-white tracking-tight">{value}</div>
      <div className="text-[10px] text-zinc-500 font-bold">{sub}</div>
    </div>
  );
}

function DeckCard({ deck, color, onPlay }: { deck: Deck, color: string, onPlay: () => void }) {
  const hasDueCards = deck.due_count > 0;

  return (
    <div className="block group h-full cursor-pointer" onClick={onPlay}>
        <div className={`h-56 p-6 rounded-[2rem] flex flex-col justify-between relative overflow-hidden transition-all duration-300 group-hover:-translate-y-2 ${glassClass} group-hover:border-cyan-500/30`}>
            
            <div className={`absolute top-0 left-0 w-1.5 h-full ${color} shadow-[0_0_20px_rgba(6,182,212,0.6)]`} />
            
            <div>
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-xl truncate text-zinc-900 dark:text-white tracking-tight pr-4">{deck.name}</h3>
                    {hasDueCards && (
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]" title="Karten fällig!" />
                    )}
                </div>
                
                <div className="flex gap-2">
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800/50 px-2 py-1 rounded-md">
                    {deck.card_count} Karten
                    </p>
                    {hasDueCards && (
                        <p className="text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-500/10 px-2 py-1 rounded-md">
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
                    <div className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20">
                        Alles erledigt
                    </div>
                )}

                <div className="bg-zinc-900 dark:bg-white text-white dark:text-black p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 shadow-xl scale-90 group-hover:scale-100">
                    <Play size={16} fill="currentColor" />
                </div>
            </div>
        </div>
    </div>
  );
}