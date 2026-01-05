'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';

// Erweiterter Typ für Decks inklusive Statistiken
type Deck = {
  id: number;
  title: string;
  created_at: string;
  user_id: string;
  // Berechnete Felder für das UI
  total_cards: number;
  due_cards: number;
  new_cards: number;
};

export default function FlashcardsList() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  const [isCreating, setIsCreating] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  
  const [isImporting, setIsImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string[]>([]);

  useEffect(() => {
    fetchDecks();
  }, [user]);

  const fetchDecks = async () => {
    if (!user) return;

    // Wir holen das Deck UND die dazugehörigen Karten (Box & Datum), um Stats zu berechnen
    const { data, error } = await supabase
      .from('decks')
      .select(`
        *,
        flashcards (
          id,
          box,
          next_review
        )
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const now = new Date();

      // Daten transformieren und Statistiken berechnen
      const formattedDecks: Deck[] = data.map((deck: any) => {
        const cards = deck.flashcards || [];
        
        // Fällig: Datum ist in der Vergangenheit oder heute
        const dueCount = cards.filter((c: any) => 
          c.next_review && new Date(c.next_review) <= now
        ).length;

        // Neu: Noch nie gelernt (Box 0 oder 1 und kein Review-Datum oder Datum ist null)
        // (Hier vereinfacht: Box 1 ist oft "Neu" im Leitner System, je nach Implementierung)
        
        return {
          id: deck.id,
          title: deck.title,
          created_at: deck.created_at,
          user_id: deck.user_id,
          total_cards: cards.length,
          due_cards: dueCount,
          new_cards: cards.length // Platzhalter, falls du spezifische "Neue" Logik brauchst
        };
      });

      setDecks(formattedDecks);
    }
    setLoading(false);
  };

  const createDeck = async () => {
    if (!newDeckTitle.trim() || !user) return;
    const { error } = await supabase.from('decks').insert([{ title: newDeckTitle, user_id: user.id }]);
    if (error) alert(error.message);
    else { setNewDeckTitle(''); setIsCreating(false); fetchDecks(); }
  };

  const deleteDeck = async (id: number, e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    if (!confirm('Deck wirklich löschen? Alle Karten darin gehen verloren.')) return;
    const { error } = await supabase.from('decks').delete().eq('id', id);
    if (!error) fetchDecks();
    else alert("Fehler beim Löschen: " + error.message);
  };

  const processFile = async (file: File) => {
    if (!user) return;
    const deckTitle = file.name.replace('.json', '');
    
    try {
      const text = await file.text();
      const cards = JSON.parse(text);
      if (!Array.isArray(cards)) throw new Error('Format ungültig');

      const { data: deck, error: deckError } = await supabase
        .from('decks')
        .insert([{ title: deckTitle, user_id: user.id }])
        .select().single();

      if (deckError || !deck) throw new Error('Deck-Erstellung fehlgeschlagen');

      // Beim Import: Box 1, Next Review = Jetzt (damit sie sofort lernbar sind)
      const cardsToInsert = cards.map((c: any) => ({
        deck_id: deck.id,
        front: c.front || c.Frage || '?',
        back: c.back || c.Antwort || '?',
        user_id: user.id,
        box: 1,
        next_review: new Date().toISOString()
      }));

      const { error: cardsError } = await supabase.from('flashcards').insert(cardsToInsert);
      if (cardsError) throw new Error('Karten-Import fehlgeschlagen');

      setUploadStatus(prev => [...prev, `✅ ${file.name} erfolgreich.`]);
    } catch (err: any) {
      setUploadStatus(prev => [...prev, `❌ ${file.name}: ${err.message}`]);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) await processFile(file);
    fetchDecks();
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-screen pb-24">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-800">Meine Decks 🗂️</h1>
          <p className="text-zinc-500 mt-1">Wähle ein Deck zum Lernen aus</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => setIsImporting(true)} className="flex-1 md:flex-none bg-zinc-800 text-white px-4 py-2 rounded-xl font-medium active:scale-95 transition flex items-center justify-center gap-2">
            <span>📥</span> Import
          </button>
          <button onClick={() => setIsCreating(true)} className="flex-1 md:flex-none bg-blue-600 text-white px-4 py-2 rounded-xl font-medium active:scale-95 transition flex items-center justify-center gap-2">
            <span>+</span> Neu
          </button>
        </div>
      </div>

      {/* MODAL: IMPORT */}
      {isImporting && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xl shadow-2xl">
            <h2 className="text-xl font-bold mb-4">JSON Import</h2>
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-4 border-dashed rounded-2xl p-10 text-center transition ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-zinc-100 bg-zinc-50'}`}
            >
              <p className="mb-4 text-zinc-500 font-medium">Dateien hierher ziehen</p>
              <label className="bg-white border border-zinc-200 px-4 py-2 rounded-xl cursor-pointer shadow-sm hover:bg-zinc-50 transition">
                Auswählen
                <input type="file" multiple accept=".json" onChange={async (e) => {
                  if (e.target.files) {
                    for (const f of Array.from(e.target.files)) await processFile(f);
                    fetchDecks();
                  }
                }} className="hidden" />
              </label>
            </div>
            <div className="mt-4 max-h-32 overflow-y-auto text-xs font-mono space-y-1">
              {uploadStatus.map((s, i) => <div key={i}>{s}</div>)}
            </div>
            <button onClick={() => setIsImporting(false)} className="mt-6 w-full bg-zinc-900 text-white py-3 rounded-xl font-bold">Fertig</button>
          </div>
        </div>
      )}

      {/* EINGABE: NEUES DECK */}
      {isCreating && (
        <div className="mb-8 p-4 bg-white border border-blue-100 shadow-sm rounded-2xl flex gap-2 animate-in fade-in slide-in-from-top-4">
          <input
            value={newDeckTitle}
            onChange={(e) => setNewDeckTitle(e.target.value)}
            placeholder="Name des neuen Decks..."
            className="flex-1 p-3 rounded-xl bg-zinc-50 border-none outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && createDeck()}
          />
          <button onClick={createDeck} className="bg-blue-600 text-white px-6 rounded-xl font-bold">Erstellen</button>
          <button onClick={() => setIsCreating(false)} className="bg-zinc-100 text-zinc-500 px-4 rounded-xl font-bold hover:bg-zinc-200">✕</button>
        </div>
      )}

      {/* LISTE */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>
      ) : decks.length === 0 ? (
        <div className="text-center py-20 bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
          <div className="text-4xl mb-4">📭</div>
          <h3 className="text-xl font-bold text-zinc-700">Keine Decks vorhanden</h3>
          <p className="text-zinc-500 mt-2">Erstelle ein neues Deck oder importiere Karten, um loszulegen.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck) => (
            <div key={deck.id} className="relative group">
              <Link href={`/flashcards/${deck.id}`}>
                <div className="p-6 bg-white rounded-3xl border border-zinc-100 shadow-sm hover:shadow-md hover:border-blue-200 active:scale-[0.98] transition-all h-full flex flex-col justify-between">
                  
                  {/* Deck Header */}
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center text-2xl">
                        📚
                      </div>
                      {/* Badge für fällige Karten */}
                      {deck.due_cards > 0 ? (
                        <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold shadow-sm animate-pulse">
                          {deck.due_cards} fällig
                        </span>
                      ) : (
                         <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-bold">
                          Alles erledigt
                        </span>
                      )}
                    </div>
                    
                    <h2 className="text-xl font-bold text-zinc-800 line-clamp-1" title={deck.title}>{deck.title}</h2>
                  </div>

                  {/* Deck Footer / Stats */}
                  <div className="mt-6 flex items-center gap-4 text-xs font-medium text-zinc-400 border-t border-zinc-50 pt-4">
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-800 font-bold">{deck.total_cards}</span> Karten
                    </div>
                    {deck.due_cards > 0 && (
                      <div className="text-blue-600 font-semibold flex items-center gap-1">
                        Jetzt lernen →
                      </div>
                    )}
                  </div>

                </div>
              </Link>
              
              {/* LÖSCHBUTTON */}
              <button 
                onClick={(e) => deleteDeck(deck.id, e)}
                className="absolute top-4 right-4 bg-white/80 hover:bg-red-50 text-zinc-300 hover:text-red-500 p-2 rounded-xl opacity-100 md:opacity-0 group-hover:opacity-100 transition-all shadow-sm backdrop-blur-sm"
                title="Deck löschen"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}