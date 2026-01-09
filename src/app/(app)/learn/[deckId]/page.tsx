'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { 
  ChevronRight, ArrowLeft, Edit3, Save, X, Trash2, 
  ChevronDown, ChevronUp, Play, Plus, Clock, Layers, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Zentrale Glass-Klasse für Konsistenz
const glassClass = "bg-white/5 dark:bg-zinc-900/20 backdrop-blur-xl border border-white/10 dark:border-zinc-800/50 shadow-xl";

// Types
interface Deck {
  id: string;
  name: string;
  user_id: string;
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
  created_at: string;
  deck_id: string;
  next_review?: string;
  state?: number; // FSRS State: 0=New, 1=Learning, 2=Review, 3=Mastered
}

export default function DeckDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  
  // Sicherer ID-Abruf
  const deckId = params && params.deckId ? String(params.deckId) : '';

  // States
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'a-z'>('newest');

  // 1. Daten laden (Inklusive FSRS-Felder für Dashboard-Check)
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !deckId) return;
      
      setLoading(true);
      try {
        const { data: deckData, error: deckError } = await supabase
          .from('decks')
          .select('*')
          .eq('id', deckId)
          .single();

        if (deckError) throw deckError;
        setDeck(deckData);
        setEditedName(deckData.name);

        // Hier holen wir auch 'state' und 'next_review' für die Logik
        const { data: cardsData, error: cardsError } = await supabase
          .from('flashcards')
          .select('*')
          .eq('deck_id', deckId)
          .order('created_at', { ascending: false });

        if (cardsError) throw cardsError;
        setCards(cardsData || []);
      } catch (err) {
        console.error('Fehler beim Laden:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, deckId]);

  // 2. Deck Namen speichern
  const saveDeckName = async () => {
    if (!deck || !editedName.trim()) return;
    try {
      const { error } = await supabase
        .from('decks')
        .update({ name: editedName })
        .eq('id', deck.id);

      if (error) throw error;
      setDeck({ ...deck, name: editedName });
      setIsEditingTitle(false);
    } catch (err) {
      alert('Fehler beim Umbenennen');
    }
  };

  // 3. Karte löschen
  const deleteCard = async (cardId: string) => {
    if (!confirm('Karte wirklich löschen?')) return;
    try {
      const { error } = await supabase.from('flashcards').delete().eq('id', cardId);
      if (error) throw error;
      setCards(cards.filter(c => c.id !== cardId));
    } catch (err) {
      alert('Löschen fehlgeschlagen');
    }
  };

  const sortedCards = [...cards].sort((a, b) => {
    if (sortOrder === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortOrder === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortOrder === 'a-z') return a.front.localeCompare(b.front);
    return 0;
  });

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-500">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-500 mb-4"></div>
        <span className="text-xs font-black uppercase tracking-widest">Lade Deck...</span>
      </div>
    );
  }

  // Error Screen
  if (!deck) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-6 text-zinc-500">
        <p className="text-xl font-bold">Deck nicht gefunden.</p>
        <Link href="/learn" className="px-6 py-3 bg-zinc-900 rounded-xl font-bold text-white hover:bg-zinc-800 transition-colors">
           Zurück zur Übersicht
        </Link>
      </div>
    );
  }

  return (
    // FIX: Full Width Layout ohne Overflow
    <div className="w-full max-w-[1920px] p-4 md:p-8 lg:p-12 min-h-screen pb-40 bg-transparent text-zinc-900 dark:text-zinc-100 overflow-x-hidden">
      
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-bold text-zinc-500 mb-8 uppercase tracking-widest">
        <Link href="/learn" className="hover:text-cyan-500 transition-colors flex items-center gap-1">
          <ArrowLeft size={14} /> Lern-Zentrale
        </Link>
        <ChevronRight size={14} />
        <span className="text-zinc-900 dark:text-white">{deck.name}</span>
      </nav>

      {/* HEADER */}
      <header className={`flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-12 p-8 rounded-[3rem] ${glassClass}`}>
        <div className="flex-1 w-full">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-4 py-1.5 rounded-full bg-cyan-500/10 text-cyan-500 text-[10px] font-black uppercase tracking-widest border border-cyan-500/20 flex items-center gap-2">
              <Layers size={12} /> {cards.length} Karten
            </span>
            {/* Optional: Lern-Status Anzeige */}
            <span className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
               {cards.filter(c => c.state === 2 || c.state === 3).length} Gelernt
            </span>
          </div>

          {isEditingTitle ? (
            <div className="flex items-center gap-3 w-full max-w-xl">
              <input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="bg-black/10 dark:bg-white/5 border-b-2 border-cyan-500 text-3xl md:text-5xl font-black text-zinc-900 dark:text-white outline-none w-full py-2 px-4 rounded-t-xl"
                autoFocus
              />
              <button onClick={saveDeckName} className="p-4 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 transition-colors shadow-lg">
                <Save size={20} />
              </button>
              <button onClick={() => setIsEditingTitle(false)} className="p-4 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors">
                <X size={20} />
              </button>
            </div>
          ) : (
            <div className="group flex items-center gap-4">
              <h1 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white tracking-tighter">
                {deck.name}
              </h1>
              <button 
                onClick={() => setIsEditingTitle(true)}
                className="opacity-0 group-hover:opacity-100 transition-all p-3 bg-white/5 rounded-xl hover:bg-cyan-500 hover:text-white text-zinc-500"
              >
                <Edit3 size={20} />
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-4 w-full xl:w-auto">
            <Link href={`/flashcards/${deck.id}`} className="w-full xl:w-auto">
              <button className="w-full xl:w-auto flex items-center justify-center gap-3 px-8 py-5 bg-cyan-500 hover:bg-cyan-400 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-cyan-500/20 transition-all active:scale-95">
                 <Play size={20} fill="currentColor" /> Session Starten
              </button>
            </Link>
        </div>
      </header>

      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 px-2">
        <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <Filter className="text-cyan-500" size={24} /> Karten-Deck
        </h2>
        <div className="flex bg-zinc-200 dark:bg-zinc-900 p-1.5 rounded-2xl border border-zinc-300 dark:border-zinc-800">
          <button 
            onClick={() => setSortOrder('newest')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${sortOrder === 'newest' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-md' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
          >
            Neueste
          </button>
          <button 
            onClick={() => setSortOrder('a-z')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${sortOrder === 'a-z' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-md' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
          >
            A-Z
          </button>
        </div>
      </div>

      {/* CARD LIST */}
      <div className="space-y-4">
        {sortedCards.length === 0 ? (
          <div className={`text-center py-24 rounded-[3rem] border-4 border-dashed border-zinc-200 dark:border-zinc-800 ${glassClass}`}>
            <p className="text-zinc-500 font-bold text-xl mb-6">Dieses Deck ist leer.</p>
            <Link href={`/flashcards/${deck.id}`} className="inline-flex items-center gap-3 px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black hover:scale-105 transition-transform">
              <Plus size={20} /> Erste Karte erstellen
            </Link>
          </div>
        ) : (
          sortedCards.map((card) => {
            const isOpen = expandedCardId === card.id;
            // Bestimme Status Farbe basierend auf FSRS State (0-3)
            const statusColor = card.state === 3 ? 'bg-amber-500' : card.state === 2 ? 'bg-cyan-500' : card.state === 1 ? 'bg-blue-500' : 'bg-zinc-500';
            
            return (
              <motion.div 
                key={card.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`group rounded-[2rem] overflow-hidden transition-all duration-300 ${isOpen ? 'bg-zinc-100 dark:bg-zinc-900 border-cyan-500/30' : `${glassClass} border-transparent hover:border-zinc-700`}`}
              >
                <div 
                  onClick={() => setExpandedCardId(isOpen ? null : card.id)}
                  className="p-6 cursor-pointer flex items-center justify-between gap-6"
                >
                  <div className="flex items-center gap-6 overflow-hidden w-full">
                      <div className={`w-2 h-12 rounded-full ${statusColor}`} />
                      
                      <div className="flex-1 min-w-0">
                          <span className={`font-bold block truncate text-lg ${isOpen ? 'text-cyan-600 dark:text-cyan-400' : 'text-zinc-900 dark:text-white'}`}>
                            {card.front}
                          </span>
                          
                          <div className="flex items-center gap-4 mt-1">
                             {card.next_review && (
                               <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                                 <Clock size={12} /> Review: {new Date(card.next_review).toLocaleDateString()}
                               </span>
                             )}
                             {/* Debug/Info: Zeige State an */}
                             <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded-md">
                               Lvl {card.state || 0}
                             </span>
                          </div>
                      </div>
                  </div>
                  
                  <div className={`p-3 rounded-xl transition-all ${isOpen ? 'bg-cyan-500 text-white rotate-180' : 'bg-black/5 dark:bg-white/5 text-zinc-400 group-hover:text-white'}`}>
                     <ChevronDown size={20} />
                  </div>
                </div>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <div className="px-8 pb-8 pt-2 pl-[4.5rem]">
                        <div className="p-6 rounded-2xl bg-white dark:bg-black/20 border border-zinc-200 dark:border-white/5 text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
                           <span className="block text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-2">Antwort</span>
                           {card.back}
                        </div>
                        <div className="flex gap-4 mt-6 justify-end">
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteCard(card.id); }}
                            className="px-6 py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2"
                          >
                            <Trash2 size={16} /> Karte Löschen
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
  );
}