'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../supabaseClient'; 
import { useAuth } from '@/components/providers/AuthProvider';

type Deck = {
  id: number;
  title: string;
  created_at: string;
  user_id: string;
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
  }, []);

  const fetchDecks = async () => {
    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setDecks(data || []);
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
    if (!confirm('Deck wirklich löschen?')) return;
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

      const cardsToInsert = cards.map((c: any) => ({
        deck_id: deck.id,
        front: c.front || c.Frage || '?',
        back: c.back || c.Antwort || '?',
        user_id: user.id
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
        <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-800">Meine Decks 🗂️</h1>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => setIsImporting(true)} className="flex-1 md:flex-none bg-zinc-800 text-white px-4 py-2 rounded-xl font-medium active:scale-95 transition">
            📥 Import
          </button>
          <button onClick={() => setIsCreating(true)} className="flex-1 md:flex-none bg-blue-600 text-white px-4 py-2 rounded-xl font-medium active:scale-95 transition">
            + Neu
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
              <label className="bg-white border border-zinc-200 px-4 py-2 rounded-xl cursor-pointer shadow-sm">
                Auswählen
                <input type="file" multiple accept=".json" onChange={async (e) => {
                  if (e.target.files) {
                    for (const f of Array.from(e.target.files)) await processFile(f);
                    fetchDecks();
                  }
                }} className="hidden" />
              </label>
            </div>
            <div className="mt-4 max-h-32 overflow-y-auto text-xs font-mono">
              {uploadStatus.map((s, i) => <div key={i}>{s}</div>)}
            </div>
            <button onClick={() => setIsImporting(false)} className="mt-6 w-full bg-zinc-900 text-white py-3 rounded-xl font-bold">Fertig</button>
          </div>
        </div>
      )}

      {/* EINGABE: NEUES DECK */}
      {isCreating && (
        <div className="mb-8 p-4 bg-blue-50 rounded-2xl flex gap-2">
          <input
            value={newDeckTitle}
            onChange={(e) => setNewDeckTitle(e.target.value)}
            placeholder="Name..."
            className="flex-1 p-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button onClick={createDeck} className="bg-blue-600 text-white px-6 rounded-xl font-bold">OK</button>
        </div>
      )}

      {/* LISTE */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck) => (
            <div key={deck.id} className="relative group">
              <Link href={`/flashcards/${deck.id}`}>
                <div className="p-6 bg-white rounded-3xl border border-zinc-100 shadow-sm active:scale-[0.98] transition-all h-full">
                  <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mb-4 text-xl">📚</div>
                  <h2 className="text-xl font-bold text-zinc-800">{deck.title}</h2>
                  <p className="text-zinc-400 text-xs mt-1 italic">Smarter lernen</p>
                </div>
              </Link>
              {/* LÖSCHBUTTON: Auf Mobile immer sichtbar durch opacity-100 md:opacity-0 */}
              <button 
                onClick={(e) => deleteDeck(deck.id, e)}
                className="absolute top-4 right-4 bg-red-50 text-red-500 p-2 rounded-xl opacity-100 md:opacity-0 group-hover:opacity-100 transition-all shadow-sm active:scale-90"
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