'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { 
  Brain, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Info, 
  ChevronRight 
} from 'lucide-react';

type Flashcard = {
  id: number;
  question: string;
  answer: string;
  interval: number;
  ease: number;
  next_review: string;
};

export default function FlashcardsPage() {
  const { user } = useAuth();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, due: 0, learned: 0 });

  useEffect(() => {
    if (user) {
      fetchDueCards();
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    const { count: total } = await supabase.from('flashcards').select('*', { count: 'exact', head: true }).eq('user_id', user?.id);
    const { count: due } = await supabase.from('flashcards').select('*', { count: 'exact', head: true }).eq('user_id', user?.id).lte('next_review', new Date().toISOString());
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const { count: learned } = await supabase.from('flashcards').select('*', { count: 'exact', head: true }).eq('user_id', user?.id).gte('last_review', today.toISOString());

    setStats({ total: total || 0, due: due || 0, learned: learned || 0 });
  };

  const fetchDueCards = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', user?.id)
      .lte('next_review', new Date().toISOString())
      .order('next_review', { ascending: true });

    if (data) setCards(data as Flashcard[]);
    setLoading(false);
  };

  const handleRate = async (grade: number) => {
    const card = cards[currentCardIndex];
    let { interval, ease, id } = card;

    // SM-2 Algorithmus Logik
    if (grade >= 3) {
      if (interval === 0) interval = 1;
      else if (interval === 1) interval = 6;
      else interval = Math.round(interval * ease);
      ease = Math.max(1.3, ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)));
    } else {
      interval = 1;
      ease = Math.max(1.3, ease - 0.2);
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    const { error } = await supabase
      .from('flashcards')
      .update({
        interval: interval,
        ease: ease,
        next_review: nextReview.toISOString(),
        last_review: new Date().toISOString()
      })
      .eq('id', id);

    if (!error) {
      setShowAnswer(false);
      if (currentCardIndex < cards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
      } else {
        setCards([]); 
        fetchStats();
      }
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-500 gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500"></div>
      <p className="font-medium">Lade Decks...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto pb-32 text-zinc-900 dark:text-zinc-100 transition-colors">
      
      {/* Header mit kompakten Stats */}
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight dark:text-white">Flashcards 🧠</h1>
          <p className="text-zinc-500 font-medium">Daily Brain Training</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="flex-1 md:w-32 bg-zinc-100 dark:bg-zinc-800/50 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-700 text-center">
            <span className="block text-[10px] uppercase font-black text-zinc-400 mb-1">Due</span>
            <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400">{stats.due}</span>
          </div>
          <div className="flex-1 md:w-32 bg-zinc-900 dark:bg-zinc-100 p-4 rounded-3xl text-center shadow-xl">
            <span className="block text-[10px] uppercase font-black text-zinc-500 dark:text-zinc-400 mb-1">Done</span>
            <span className="text-2xl font-black text-white dark:text-zinc-900">{stats.learned}</span>
          </div>
        </div>
      </header>

      {cards.length > 0 ? (
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Progress Bar */}
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-zinc-200 dark:bg-zinc-800 h-3 rounded-full overflow-hidden shadow-inner">
              <div 
                className="bg-cyan-500 h-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(6,182,212,0.5)]" 
                style={{ width: `${((currentCardIndex + 1) / cards.length) * 100}%` }}
              />
            </div>
            <span className="text-xs font-bold text-zinc-400">{currentCardIndex + 1} / {cards.length}</span>
          </div>

          {/* Flashcard Box */}
          <div 
            onClick={() => !showAnswer && setShowAnswer(true)}
            className={`min-h-[420px] group flex flex-col items-center justify-center p-8 md:p-16 rounded-[3.5rem] border-2 transition-all duration-500 relative overflow-hidden ${
              showAnswer 
              ? 'bg-white dark:bg-zinc-900 border-cyan-500/30 shadow-2xl scale-[1.02]' 
              : 'bg-zinc-50 dark:bg-zinc-900/40 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-cyan-500/40'
            }`}
          >
            <div className="absolute top-8 left-1/2 -translate-x-1/2 px-4 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500">
                {showAnswer ? 'Beantwortet' : 'Frage'}
              </span>
            </div>
            
            <h2 className="text-2xl md:text-4xl font-bold text-center leading-[1.4] text-zinc-800 dark:text-zinc-100">
              {showAnswer ? cards[currentCardIndex].answer : cards[currentCardIndex].question}
            </h2>

            {!showAnswer && (
              <div className="absolute bottom-10 flex items-center gap-2 text-zinc-400 text-sm font-medium opacity-60 group-hover:opacity-100 transition-opacity">
                Tap to flip <ChevronRight size={16} className="animate-pulse" />
              </div>
            )}
          </div>

          {/* Buttons: Nur sichtbar wenn Antwort da ist */}
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 transition-all duration-300 ${showAnswer ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
            <button onClick={() => handleRate(0)} className="group flex flex-col items-center p-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] hover:border-red-500/50 transition-all active:scale-95">
              <XCircle className="text-zinc-300 group-hover:text-red-500 mb-2 transition-colors" size={28} />
              <span className="font-bold text-xs uppercase tracking-tighter text-zinc-500 group-hover:text-red-600">No Idea</span>
            </button>
            <button onClick={() => handleRate(3)} className="group flex flex-col items-center p-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] hover:border-amber-500/50 transition-all active:scale-95">
              <AlertCircle className="text-zinc-300 group-hover:text-amber-500 mb-2 transition-colors" size={28} />
              <span className="font-bold text-xs uppercase tracking-tighter text-zinc-500 group-hover:text-amber-600">Hard</span>
            </button>
            <button onClick={() => handleRate(4)} className="group flex flex-col items-center p-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] hover:border-blue-500/50 transition-all active:scale-95">
              <Brain className="text-zinc-300 group-hover:text-blue-500 mb-2 transition-colors" size={28} />
              <span className="font-bold text-xs uppercase tracking-tighter text-zinc-500 group-hover:text-blue-600">Good</span>
            </button>
            <button onClick={() => handleRate(5)} className="group flex flex-col items-center p-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] hover:border-green-500/50 transition-all active:scale-95">
              <CheckCircle2 className="text-zinc-300 group-hover:text-green-500 mb-2 transition-colors" size={28} />
              <span className="font-bold text-xs uppercase tracking-tighter text-zinc-500 group-hover:text-green-600">Easy</span>
            </button>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-20 px-6 bg-white dark:bg-zinc-900 rounded-[3.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm max-w-2xl mx-auto">
          <div className="w-24 h-24 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-3xl font-black mb-4">Focus Complete!</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-10 leading-relaxed font-medium">
            Du hast alle heute fälligen Flashcards gemeistert. Komm morgen wieder, um dein Wissen langfristig zu festigen.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 px-10 py-4 rounded-2xl font-black text-lg shadow-2xl hover:scale-[1.03] active:scale-95 transition-all"
          >
            Stats Refresh
          </button>
        </div>
      )}
    </div>
  );
}