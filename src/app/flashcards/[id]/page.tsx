'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../supabaseClient';
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

  // --- XP FUNKTION (Hier korrekt platziert) ---
  const awardXP = async (amount: number) => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('xp').eq('id', user.id).single();
    if (data) {
      await supabase.from('profiles').update({ xp: data.xp + amount }).eq('id', user.id);
      // Optional: Kleines Feedback für den User
      alert(`🎉 Session beendet! +${amount} XP verdient!`);
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
      awardXP(50); // 👈 Hier werden die Punkte vergeben!
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

  if (loading) return <div className="p-10 text-center">Lade Smart-Review... 🧠</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-lg mb-4 flex justify-between items-center">
         <button onClick={() => router.back()} className="text-gray-500 hover:text-black">← Zurück</button>
         <h1 className="font-bold text-gray-700">{deckTitle}</h1>
      </div>

      {sessionComplete ? (
        <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-md w-full animate-in zoom-in">
          <div className="text-6xl mb-4">🌟</div>
          <h2 className="text-2xl font-bold mb-2">Alles erledigt!</h2>
          <p className="text-gray-600 mb-6">
            +50 XP verdient! Komm morgen wieder.
          </p>
          <button onClick={() => router.push('/dashboard')} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Zurück zum Dashboard
          </button>
        </div>
      ) : cards.length > 0 ? (
        <div className="w-full max-w-md">
          <p className="text-center text-gray-400 text-sm mb-4">Noch {cards.length} fällige Karten</p>
          
          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className="relative h-80 w-full cursor-pointer perspective-1000"
            style={{ perspective: '1000px' }}
          >
             <div className={`w-full h-full duration-500 preserve-3d transition-transform relative ${isFlipped ? 'rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                <div className="absolute backface-hidden w-full h-full bg-white rounded-2xl shadow-lg border-b-4 border-gray-200 flex items-center justify-center p-8 text-2xl text-center" style={{ backfaceVisibility: 'hidden' }}>
                  {cards[0].front}
                  <span className="absolute top-4 left-4 text-xs text-gray-400 uppercase font-bold">Frage</span>
                </div>
                <div className="absolute backface-hidden w-full h-full bg-blue-50 rounded-2xl shadow-lg border-b-4 border-blue-200 flex items-center justify-center p-8 text-2xl text-center transform rotate-y-180" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                  {cards[0].back}
                  <span className="absolute top-4 left-4 text-xs text-blue-400 uppercase font-bold">Antwort</span>
                </div>
             </div>
          </div>

          {isFlipped ? (
            <div className="grid grid-cols-4 gap-2 mt-6 animate-in slide-in-from-bottom-4">
              <button onClick={(e) => { e.stopPropagation(); handleRate(1); }} className="p-3 rounded-lg bg-red-100 text-red-700 font-bold hover:bg-red-200 border border-red-200 flex flex-col items-center"><span className="text-xs font-normal">Nochmal</span><span>Wait</span></button>
              <button onClick={(e) => { e.stopPropagation(); handleRate(3); }} className="p-3 rounded-lg bg-orange-100 text-orange-700 font-bold hover:bg-orange-200 border border-orange-200 flex flex-col items-center"><span className="text-xs font-normal">Schwer</span><span>Hard</span></button>
              <button onClick={(e) => { e.stopPropagation(); handleRate(4); }} className="p-3 rounded-lg bg-blue-100 text-blue-700 font-bold hover:bg-blue-200 border border-blue-200 flex flex-col items-center"><span className="text-xs font-normal">Gut</span><span>Good</span></button>
              <button onClick={(e) => { e.stopPropagation(); handleRate(5); }} className="p-3 rounded-lg bg-green-100 text-green-700 font-bold hover:bg-green-200 border border-green-200 flex flex-col items-center"><span className="text-xs font-normal">Einfach</span><span>Easy</span></button>
            </div>
          ) : (
             <div className="mt-6 text-center text-gray-500 text-sm">Klicke auf die Karte, um die Antwort zu sehen 👆</div>
          )}
        </div>
      ) : (
        <div className="text-center mt-10"><p className="text-gray-500">Dieses Deck ist leer.</p></div>
      )}

      <div className="w-full max-w-lg mt-16 border-t pt-8">
        <h3 className="font-bold text-gray-700 mb-4">➕ Neue Karte hinzufügen</h3>
        <div className="bg-white p-4 rounded-xl shadow-sm space-y-3">
          <input suppressHydrationWarning value={newFront} onChange={(e) => setNewFront(e.target.value)} className="w-full p-2 border rounded bg-gray-50" placeholder="Frage" />
          <input suppressHydrationWarning value={newBack} onChange={(e) => setNewBack(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCard()} className="w-full p-2 border rounded bg-gray-50" placeholder="Antwort" />
          <button onClick={addCard} className="w-full bg-gray-800 text-white py-2 rounded font-medium">Speichern</button>
        </div>
      </div>
    </div>
  );
}