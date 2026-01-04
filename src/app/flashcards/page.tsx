'use client';

import { useEffect, useState, useCallback } from 'react';
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
  
  // States für UI
  const [isCreating, setIsCreating] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  
  // States für Import
  const [isImporting, setIsImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string[]>([]); // Protokoll was passiert

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
    e.preventDefault(); e.stopPropagation();
    if (!confirm('Deck wirklich löschen?')) return;
    const { error } = await supabase.from('decks').delete().eq('id', id);
    if (!error) fetchDecks();
  };

  // --- DRAG & DROP LOGIK ---
  
  const processFile = async (file: File) => {
    if (!user) return;
    
    // 1. Deck Name aus Dateiname (z.B. "Mathe.json" -> "Mathe")
    const deckTitle = file.name.replace('.json', '');
    
    try {
      const text = await file.text();
      const cards = JSON.parse(text);

      if (!Array.isArray(cards)) throw new Error('Keine Liste [...]');

      // 2. Deck erstellen
      const { data: deck, error: deckError } = await supabase
        .from('decks')
        .insert([{ title: deckTitle, user_id: user.id }])
        .select()
        .single();

      if (deckError || !deck) throw new Error('Deck konnte nicht erstellt werden');

      // 3. Karten vorbereiten
      const cardsToInsert = cards.map((c: any) => ({
        deck_id: deck.id,
        front: c.front || c.Frage || '?',
        back: c.back || c.Antwort || '?',
        user_id: user.id
      }));

      // 4. Karten speichern
      const { error: cardsError } = await supabase.from('flashcards').insert(cardsToInsert);
      
      if (cardsError) throw new Error('Karten fehlerhaft');

      setUploadStatus(prev => [...prev, `✅ ${file.name}: Deck "${deckTitle}" mit ${cards.length} Karten erstellt.`]);

    } catch (err: any) {
      setUploadStatus(prev => [...prev, `❌ ${file.name}: Fehler - ${err.message}`]);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setUploadStatus([]); // Reset Status

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    // Alle Dateien verarbeiten
    for (const file of files) {
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        await processFile(file);
      } else {
        setUploadStatus(prev => [...prev, `⚠️ ${file.name}: Nur JSON Dateien erlaubt.`]);
      }
    }
    fetchDecks(); // Liste aktualisieren
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadStatus([]);
      const files = Array.from(e.target.files);
      for (const file of files) await processFile(file);
      fetchDecks();
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">Meine Decks 🗂️</h1>
        <div className="flex gap-3">
          <button onClick={() => setIsImporting(true)} className="bg-gray-800 text-white px-5 py-2 rounded-lg hover:bg-black font-medium transition flex items-center gap-2 shadow-lg">
            📥 Importieren
          </button>
          <button onClick={() => setIsCreating(true)} className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium transition shadow-lg flex items-center gap-2">
            <span>+</span> Neues Deck
          </button>
        </div>
      </div>

      {/* --- MODAL: DRAG & DROP IMPORT --- */}
      {isImporting && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl relative">
            <button onClick={() => setIsImporting(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black">✕</button>
            
            <h2 className="text-2xl font-bold mb-2">Decks importieren</h2>
            <p className="text-gray-500 mb-6">Ziehe JSON-Dateien hierher. Der Dateiname wird der Deck-Name.</p>

            {/* DROP ZONE */}
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-4 border-dashed rounded-2xl p-10 text-center transition-all duration-300 ${
                isDragging ? 'border-blue-500 bg-blue-50 scale-105' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="text-5xl mb-4">📄</div>
              <p className="text-lg font-medium text-gray-700 mb-2">
                {isDragging ? 'Loslassen zum Hochladen!' : 'Dateien hier reinziehen'}
              </p>
              <p className="text-sm text-gray-400 mb-6">oder</p>
              
              <label className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-full cursor-pointer hover:bg-gray-100 transition shadow-sm font-medium">
                Dateien auswählen
                <input type="file" multiple accept=".json" onChange={handleFileSelect} className="hidden" />
              </label>
            </div>

            {/* STATUS PROTOKOLL */}
            {uploadStatus.length > 0 && (
              <div className="mt-6 bg-gray-50 rounded-xl p-4 max-h-40 overflow-y-auto border border-gray-100">
                {uploadStatus.map((msg, i) => (
                  <div key={i} className="text-sm mb-1 font-mono">{msg}</div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button onClick={() => setIsImporting(false)} className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-black font-medium">
                Fertig
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EINGABE: NEUES DECK --- */}
      {isCreating && (
        <div className="mb-8 p-4 border border-blue-100 bg-blue-50 rounded-xl flex gap-2 items-center">
          <input
            value={newDeckTitle}
            onChange={(e) => setNewDeckTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createDeck()}
            placeholder="Name des Decks..."
            className="flex-1 p-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button onClick={createDeck} className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-bold">Speichern</button>
        </div>
      )}

      {/* --- DECKS LISTE --- */}
      {loading ? <div className="text-center py-20 text-gray-400">Lade Decks...</div> : decks.length === 0 && !isCreating ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
          <p className="text-xl text-gray-500 font-medium">Keine Decks.</p>
          <p className="text-gray-400 mt-2">Importiere JSON Dateien oder erstelle ein Deck.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map((deck) => (
            <Link key={deck.id} href={`/flashcards/${deck.id}`}>
              <div className="relative border border-gray-200 p-6 rounded-2xl hover:shadow-xl hover:border-blue-400 transition-all cursor-pointer bg-white group h-full flex flex-col">
                <button 
                  onClick={(e) => deleteDeck(deck.id, e)}
                  className="absolute top-4 right-4 text-gray-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all"
                >
                  🗑️
                </button>
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-2xl mb-4">📚</div>
                <h2 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 mb-1">{deck.title}</h2>
                <p className="text-gray-400 text-xs">Erstellt: {new Date(deck.created_at).toLocaleDateString('de-DE')}</p>
                <div className="mt-auto pt-4 border-t border-gray-50 text-blue-600 text-sm font-medium flex items-center gap-1">Lernen starten →</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}