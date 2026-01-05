'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';

type Flashcard = {
  id: number;
  front: string;
  back: string;
  interval: number;
  repetitions: number;
  easiness_factor: number;
  next_review: string;
};

// --- DER SM-2 ALGORITHMUS ---
const calculateSM2 = (card: Flashcard, quality: number) => {
  let { interval, repetitions, easiness_factor } = card;

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easiness_factor);
    
    repetitions++;
  }

  easiness_factor = easiness_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easiness_factor < 1.3) easiness_factor = 1.3;

  return { interval, repetitions, easiness_factor };
};

export default function StudySession() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useAuth();

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [deckTitle, setDeckTitle] = useState('');
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);

  // States für neue Karte
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');

  useEffect(() => {
    if (id && user) fetchDueCards();
  }, [id, user]);

  const fetchDueCards = async () => {
    const { data: deck } = await supabase.from('decks').select('title').eq('id', id).single();
    if (deck) setDeckTitle(deck.title);

    const now = new Date().toISOString();
    
    const { data: cardsData } = await supabase
      .from('flashcards')
      .select('*')
      .eq('deck_id', id)
      .lte('next_review', now)
      .order('next_review', { ascending: true })
      .limit(20);

    if (cardsData) setCards(cardsData);
    setLoading(false);
  };

  const awardXP = async (amount: number) => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('xp').eq('id', user.id).single();
    if (data) {
      await supabase.from('profiles').update({ xp: data.xp + amount }).eq('id', user.id);
      // Optional: Toast oder Notification hier
    }
  };

  const handleRate = async (quality: number) => {
    if (cards.length === 0) return;

    const currentCard = cards[0];
    const { interval, repetitions, easiness_factor } = calculateSM2(currentCard, quality);

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + interval);

    // 1. Update in DB
    await supabase
      .from('flashcards')
      .update({
        interval,
        repetitions,
        easiness_factor,
        next_review: nextDate.toISOString()
      })
      .eq('id', currentCard.id);

    // 2. UI Update
    setIsFlipped(false);
    const remainingCards = cards.slice(1);
    setCards(remainingCards);

    // 3. Prüfen ob fertig & XP vergeben
    if (remainingCards.length === 0) {
      setSessionComplete(true);
      awardXP(20);
    }
  };

  const addCard = async () => {
    if (!newFront.trim() || !newBack.trim() || !user) return;
    const { error } = await supabase.from('flashcards').insert([
      { deck_id: id, front: newFront, back: newBack, user_id: user.id }
    ]);
    if (!error) {
      setNewFront(''); setNewBack('');
      if (cards.length === 0 && sessionComplete) {
         fetchDueCards();
         setSessionComplete(false);
      }
    }
  };

  // --- NEU: LÖSCH FUNKTION ---
  const deleteCurrentCard = async () => {
    if (cards.length === 0) return;
    if (!confirm('Diese Karte wirklich löschen?')) return;

    const currentCard = cards[0];

    // Optimistisches Update
    const remainingCards = cards.slice(1);
    setCards(remainingCards);
    setIsFlipped(false);

    // DB Löschen
    await supabase.from('flashcards').delete().eq('id', currentCard.id);

    if (remainingCards.length === 0) {
      setSessionComplete(true);
    }
  };

  if (loading) return <div className="p-10 text-center flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center py-6 px-4 pb-20">
      
      {/* HEADER */}
      <div className="w-full max-w-lg mb-6 flex justify-between items-center">
         <button 
           onClick={() => router.back()} 
           className="text-zinc-500 hover:text-black bg-panel px-4 py-2 rounded-xl shadow-sm border border-gray-100 font-medium active:scale-95 transition"
         >
           ← Zurück
         </button>
         <h1 className="font-bold text-gray-800 text-lg truncate ml-4">{deckTitle}</h1>
      </div>

      {sessionComplete ? (
        <div className="bg-panel p-10 rounded-3xl shadow-xl text-center max-w-md w-full animate-in zoom-in border border-gray-100">
          <div className="text-6xl mb-6">🎉</div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">Session Complete!</h2>
          <p className="text-zinc-500 mb-8 leading-relaxed">
            Starke Leistung! Du hast dir +50 XP verdient.
          </p>
          <button onClick={() => router.push('/dashboard')} className="w-full bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-blue-700 active:scale-95 transition shadow-lg shadow-blue-600/20">
            Zurück zum Dashboard
          </button>
        </div>
      ) : cards.length > 0 ? (
        <div className="w-full max-w-md flex flex-col flex-1">
          <p className="text-center text-gray-600 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">
            Noch {cards.length} Karten
          </p>
          
          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className="relative h-96 w-full cursor-pointer perspective-1000 group"
            style={{ perspective: '1000px' }}
          >
             <div className={`w-full h-full duration-500 preserve-3d transition-transform relative ${isFlipped ? 'rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
               
               {/* VORDERSEITE */}
               <div className="absolute backface-hidden w-full h-full bg-panel rounded-3xl shadow-xl border border-gray-100 flex items-center justify-center p-8 text-center" style={{ backfaceVisibility: 'hidden' }}>
                 <p className="text-2xl md:text-3xl font-medium text-zinc-800 leading-relaxed">
                    {cards[0].front}
                 </p>
                 <span className="absolute top-6 left-6 text-xs text-gray-600 dark:text-gray-400 uppercase font-extrabold tracking-widest">Frage</span>
               </div>
               
               {/* RÜCKSEITE */}
               <div className="absolute backface-hidden w-full h-full bg-blue-50/80 backdrop-blur-sm rounded-3xl shadow-xl border border-blue-100 flex items-center justify-center p-8 text-center transform rotate-y-180" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                 <p className="text-2xl md:text-3xl font-medium text-ink leading-relaxed">
                    {cards[0].back}
                 </p>
                 <span className="absolute top-6 left-6 text-xs text-blue-500 uppercase font-extrabold tracking-widest">Antwort</span>
               </div>

             </div>
          </div>

          {/* CONTROLS */}
          {isFlipped ? (
            <div className="grid grid-cols-4 gap-3 mt-8 animate-in slide-in-from-bottom-4">
              <button onClick={(e) => { e.stopPropagation(); handleRate(1); }} className="p-4 rounded-2xl bg-panel border-2 border-red-100 text-red-600 font-bold hover:bg-red-50 hover:border-red-200 active:scale-95 transition flex flex-col items-center shadow-sm">
                <span className="text-[10px] uppercase tracking-widest opacity-60 mb-1">Fail</span>
                <span>1</span>
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleRate(3); }} className="p-4 rounded-2xl bg-panel border-2 border-orange-100 text-orange-600 font-bold hover:bg-orange-50 hover:border-orange-200 active:scale-95 transition flex flex-col items-center shadow-sm">
                <span className="text-[10px] uppercase tracking-widest opacity-60 mb-1">Hard</span>
                <span>3</span>
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleRate(4); }} className="p-4 rounded-2xl bg-panel border-2 border-blue-100 text-blue-600 font-bold hover:bg-blue-50 hover:border-blue-200 active:scale-95 transition flex flex-col items-center shadow-sm">
                <span className="text-[10px] uppercase tracking-widest opacity-60 mb-1">Good</span>
                <span>4</span>
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleRate(5); }} className="p-4 rounded-2xl bg-panel border-2 border-green-100 text-green-600 font-bold hover:bg-green-50 hover:border-green-200 active:scale-95 transition flex flex-col items-center shadow-sm">
                <span className="text-[10px] uppercase tracking-widest opacity-60 mb-1">Easy</span>
                <span>5</span>
              </button>
            </div>
          ) : (
             <div className="mt-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 text-sm animate-pulse">Tippe auf die Karte zum Umdrehen</p>
             </div>
          )}

          {/* LÖSCH BUTTON (Immer sichtbar) */}
          <div className="mt-8 flex justify-center">
            <button 
              onClick={deleteCurrentCard}
              className="flex items-center gap-2 text-red-400 hover:text-red-600 px-4 py-2 rounded-xl hover:bg-red-50 transition text-sm font-medium"
            >
              <span className="text-lg">🗑️</span> Karte löschen
            </button>
          </div>

        </div>
      ) : (
        <div className="text-center mt-20 p-8 border-2 border-dashed border-gray-200 rounded-3xl">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-zinc-500 font-medium">Dieses Deck ist leer.</p>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Füge unten neue Karten hinzu.</p>
        </div>
      )}

      {/* QUICK ADD */}
      <div className="w-full max-w-lg mt-12 border-t border-gray-200 pt-8">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">＋</span>
          Schnell hinzufügen
        </h3>
        <div className="bg-panel p-5 rounded-3xl shadow-sm border border-gray-100 space-y-3">
          <input 
            suppressHydrationWarning 
            value={newFront} 
            onChange={(e) => setNewFront(e.target.value)} 
            className="w-full p-4 border border-gray-100 rounded-xl bg-canvas focus:bg-panel focus:ring-2 focus:ring-blue-500 outline-none transition text-gray-800 placeholder:text-gray-600 dark:text-gray-400" 
            placeholder="Frage eingeben..." 
          />
          <input 
            suppressHydrationWarning 
            value={newBack} 
            onChange={(e) => setNewBack(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && addCard()} 
            className="w-full p-4 border border-gray-100 rounded-xl bg-canvas focus:bg-panel focus:ring-2 focus:ring-blue-500 outline-none transition text-gray-800 placeholder:text-gray-600 dark:text-gray-400" 
            placeholder="Antwort eingeben..." 
          />
          <button 
            onClick={addCard} 
            className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black active:scale-95 transition"
          >
            Karte speichern
          </button>
        </div>
      </div>
    </div>
  );
}
