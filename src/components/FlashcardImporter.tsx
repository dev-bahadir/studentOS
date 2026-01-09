'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, AlertCircle, CheckCircle2, FileText, Download, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { AnimatePresence, motion } from 'framer-motion';

interface ImportedCard {
  front: string;
  back: string;
  valid: boolean;
  error?: string;
}

interface FlashcardImporterProps {
  onImportSuccess: () => void;
  onClose: () => void; // Die Fernbedienung zum Schließen
}

export default function FlashcardImporter({ onImportSuccess, onClose }: FlashcardImporterProps) {
  const { user } = useAuth();
  
  // HIER WAR DER FEHLER: Wir haben kein internes isOpen mehr!
  // Das Fenster existiert nur, wenn der Parent es rendert.
  
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [importText, setImportText] = useState('');
  const [deckName, setDeckName] = useState('');
  const [preview, setPreview] = useState<ImportedCard[]>([]);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // --- LOGIK: Text Parsen ---
  const parseTextToCards = (text: string): ImportedCard[] => {
    if (!text.trim()) return [];
    return text.split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        let parts: string[] = [];
        if (line.includes('\t')) parts = line.split('\t');
        else if (line.includes(';')) parts = line.split(';');
        else if (line.includes(',')) parts = line.split(',');
        else return { front: '', back: '', valid: false, error: 'Kein Trenner' };

        if (parts.length < 2) return { front: parts[0] || '', back: '', valid: false, error: 'Unvollständig' };
        return { front: parts[0].trim(), back: parts.slice(1).join(' ').trim(), valid: true };
      });
  };

  // --- LOGIK: Datei Verarbeitung ---
  const processFile = async (file: File) => {
    try {
      const text = await file.text();
      let cards: ImportedCard[] = [];
      if (!deckName) setDeckName(file.name.split('.')[0]);

      if (file.name.endsWith('.json')) {
        const jsonData = JSON.parse(text);
        if (Array.isArray(jsonData)) {
          cards = jsonData.map((item: any) => ({
            front: item.front || item.question || '',
            back: item.back || item.answer || '',
            valid: !!((item.front || item.question) && (item.back || item.answer))
          }));
        }
      } else {
        cards = parseTextToCards(text);
        setImportText(text);
      }
      setPreview(cards);
    } catch (err) { setError('Fehler beim Lesen der Datei'); }
  };

  // --- LOGIK: Import ---
  const handleImport = async () => {
    if (!user?.id || !deckName.trim()) return setError('Bitte Deck-Namen angeben');
    const validCards = preview.filter((c) => c.valid);
    if (validCards.length === 0) return setError('Keine gültigen Karten');

    try {
      setIsLoading(true);
      const { data: deck, error: deckErr } = await supabase.from('decks').insert([{ name: deckName.trim(), user_id: user.id }]).select().single();
      if (deckErr) throw deckErr;

      const dbCards = validCards.map(c => ({
        front: c.front,
        back: c.back,
        deck_id: deck.id,
        user_id: user.id,
        next_review_at: new Date().toISOString(),
        interval: 0,
        ease_factor: 2.5,
        repetitions: 0
      }));

      const { error: cardsErr } = await supabase.from('flashcards').insert(dbCards);
      if (cardsErr) throw cardsErr;

      setSuccess(`✅ ${dbCards.length} Karten erstellt!`);
      
      setTimeout(() => {
         onImportSuccess();
         onClose(); // Schließt das Fenster nach Erfolg
      }, 1500);
      
    } catch (err: any) { setError(err.message || 'Fehler'); } finally { setIsLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Upload className="text-purple-500" size={24} /> Karten importieren
          </h2>
          {/* SCHLIESSEN BUTTON */}
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left: Inputs */}
          <div className="w-full md:w-1/2 p-6 overflow-y-auto border-b md:border-r border-slate-800 space-y-6">
            <AnimatePresence>
              {error && <motion.div initial={{opacity:0}} animate={{opacity:1}} className="p-3 bg-red-500/10 text-red-400 rounded-lg text-sm border border-red-500/20">{error}</motion.div>}
              {success && <motion.div initial={{opacity:0}} animate={{opacity:1}} className="p-3 bg-green-500/10 text-green-400 rounded-lg text-sm border border-green-500/20">{success}</motion.div>}
            </AnimatePresence>

            <div>
              <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Deck Name</label>
              <input value={deckName} onChange={e => setDeckName(e.target.value)} placeholder="z.B. Englisch Vokabeln" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none" />
            </div>

            <div 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => {e.preventDefault(); setIsDragging(true)}} 
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => {e.preventDefault(); setIsDragging(false); if(e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0])}}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${isDragging ? 'border-purple-500 bg-purple-500/10' : 'border-slate-700 hover:bg-slate-900'}`}
            >
              <input type="file" ref={fileInputRef} onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} className="hidden" accept=".csv,.txt,.json" />
              <FileText className="mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-bold text-slate-300">Datei hier ablegen</p>
            </div>

            <textarea value={importText} onChange={e => {setImportText(e.target.value); setPreview(parseTextToCards(e.target.value))}} className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-4 font-mono text-xs text-slate-300 focus:ring-2 focus:ring-purple-500 outline-none resize-none" placeholder="Frage [TAB] Antwort" />
          </div>

          {/* Right: Preview */}
          <div className="w-full md:w-1/2 bg-slate-950/50 flex flex-col">
            <div className="p-4 border-b border-slate-800 flex justify-between text-xs font-bold uppercase text-slate-500">
              <span>Vorschau</span>
              <span>{preview.filter(c => c.valid).length} Karten</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {preview.map((card, i) => (
                <div key={i} className={`p-3 rounded-lg border text-sm flex gap-3 ${card.valid ? 'bg-slate-900 border-slate-800' : 'bg-red-900/10 border-red-900/30'}`}>
                  <div className={`w-1 h-full rounded-full ${card.valid ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div className="truncate text-slate-300">{card.valid ? `${card.front} → ${card.back}` : card.error}</div>
                </div>
              ))}
              {preview.length === 0 && <div className="text-center text-slate-600 mt-10">Keine Daten</div>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-white">Abbrechen</button>
          <button onClick={handleImport} disabled={isLoading || preview.filter(c => c.valid).length === 0} className="px-8 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-2">
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Erstellen'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}