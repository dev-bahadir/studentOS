'use client';

import { useState, useEffect } from 'react';

// 👇 WICHTIG: Einen hoch für Supabase, einen runter für Auth
import { supabase } from '../supabaseClient';
import { useAuth } from './providers/AuthProvider';

// ... (Rest bleibt gleich)
type Quote = {
  id: number;
  content: string;
  source: string;
};

export default function QuotePlayer() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [intervalSec, setIntervalSec] = useState(10);
  const [isImporting, setIsImporting] = useState(false);
  
  const [importText, setImportText] = useState('');
  const [bookTitle, setBookTitle] = useState('');

  useEffect(() => {
    if (user) fetchQuotes();
  }, [user]);

  useEffect(() => {
    if (quotes.length === 0) return;
    if (!currentQuote) pickRandom();

    const timer = setInterval(() => {
      pickRandom();
    }, intervalSec * 1000);

    return () => clearInterval(timer);
  }, [quotes, intervalSec, currentQuote]);

  const fetchQuotes = async () => {
    const { data } = await supabase.from('quotes').select('*');
    if (data) setQuotes(data);
  };

  const pickRandom = () => {
    if (quotes.length === 0) return;
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setCurrentQuote(quotes[randomIndex]);
  };

  // --- DER NEUE SUPER-IMPORTER ---
  const handleImport = async () => {
    if (!importText.trim() || !user) return;

    // 1. Zuerst am Punkt splitten
    const rawSegments = importText.split('.');
    
    // Wir bauen eine saubere Liste auf
    const structuredQuotes: { content: string; source: string }[] = [];
    const baseSource = bookTitle || 'Importiertes Buch';

    rawSegments.forEach((segment) => {
      let trimmed = segment.trim();
      if (!trimmed) return;

      // SCHRITT A: Quellen im Text finden und extrahieren
      // Sucht nach Klammern/Zahlen am Ende, z.B. "(63:9)" oder "[S. 12]"
      // Regex Erklärung: Sucht Klammer/Zahl-Kombinationen am Ende des Strings
      const citationMatch = trimmed.match(/\s*[\(\[][\d\s:.,-]+[\)\]]$/);
      let localCitation = "";

      if (citationMatch) {
        localCitation = citationMatch[0].trim(); // z.B. "(63:9)"
        trimmed = trimmed.replace(localCitation, "").trim(); // Schneidet es aus dem Text raus
      }

      // SCHRITT B: Ist der Rest-Text nur eine Zahl/Klammer? (Falls der Split es getrennt hat)
      // z.B. Text war "Satz. (63:9)" -> Split macht "Satz" und "(63:9)"
      const isStandaloneCitation = trimmed.length < 10 && /[\d\(\)]/.test(trimmed);

      if (structuredQuotes.length > 0 && (isStandaloneCitation || localCitation)) {
        // Wir haben eine Quelle gefunden!
        const sourceToAdd = localCitation || trimmed;
        
        // Hänge es an die Quelle des LETZTEN Zitats an
        // (Wir prüfen erst, ob es schon da steht, um Dopplungen zu vermeiden)
        if (!structuredQuotes[structuredQuotes.length - 1].source.includes(sourceToAdd)) {
           structuredQuotes[structuredQuotes.length - 1].source += ` ${sourceToAdd}`;
        }
        
        // Wenn es nur eine Standalone-Quelle war, sind wir fertig mit diesem Segment
        if (isStandaloneCitation) return; 
      }

      // SCHRITT C: Zusammenfügen ("Und"-Regel)
      // Wenn der Satz mit "Und", "Oder", "Aber" beginnt oder klein weitergeht...
      const startsWithConnector = /^(und|oder|aber|denn|doch)\b/i.test(trimmed);
      const startsLowerCase = /^[a-z]/.test(trimmed);

      if (structuredQuotes.length > 0 && (startsWithConnector || startsLowerCase)) {
        // ... dann kleben wir ihn an das vorherige Zitat an!
        structuredQuotes[structuredQuotes.length - 1].content += ` ${trimmed}.`;
      } else {
        // Ansonsten ist es ein neuer Satz.
        // Falls wir oben eine 'localCitation' extrahiert haben, nutzen wir die gleich.
        structuredQuotes.push({
          content: trimmed + ".",
          source: localCitation ? `${baseSource} ${localCitation}` : baseSource
        });
      }
    });

    // DB Speichern
    const finalPayload = structuredQuotes
      .filter(q => q.content.length > 10) // Leere Fetzen ignorieren
      .map(q => ({
        user_id: user.id,
        content: q.content,
        source: q.source 
      }));

    if (finalPayload.length === 0) {
      alert('Keine gültigen Sätze gefunden.');
      return;
    }

    const { error } = await supabase.from('quotes').insert(finalPayload);

    if (!error) {
      alert(`${finalPayload.length} Zitate importiert!`);
      setImportText('');
      setBookTitle('');
      setIsImporting(false);
      fetchQuotes();
    } else {
      alert('Fehler beim Import: ' + error.message);
    }
  };

  const deleteCurrent = async () => {
    if (!currentQuote || !user) return;
    setQuotes(quotes.filter(q => q.id !== currentQuote.id));
    await supabase.from('quotes').delete().eq('id', currentQuote.id);
    pickRandom();
  };

  if (quotes.length === 0 && !isImporting) {
    return (
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-2xl shadow-lg text-white text-center mb-8">
        <h3 className="font-bold text-xl mb-2">Dein Zitat-Player 🎧</h3>
        <p className="mb-4 text-sm opacity-90">Noch keine Bücher geladen.</p>
        <button onClick={() => setIsImporting(true)} className="bg-panel text-indigo-600 px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition">
          + Buch importieren
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg text-white mb-8 transition-all duration-500 overflow-hidden relative group">
      
      {isImporting ? (
        <div className="p-6 bg-panel text-gray-800">
          <h3 className="font-bold mb-4">Buch importieren 📚</h3>
          <input 
            className="w-full p-2 border rounded mb-2 bg-canvas" 
            placeholder="Buchtitel (Optional)"
            value={bookTitle}
            onChange={e => setBookTitle(e.target.value)}
          />
          <textarea 
            className="w-full p-2 border rounded mb-4 h-32 bg-canvas text-sm"
            placeholder="Füge hier deinen Text ein (z.B. Koranverse oder Buchzitate)."
            value={importText}
            onChange={e => setImportText(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setIsImporting(false)} className="text-zinc-500 px-4 py-2">Abbrechen</button>
            <button onClick={handleImport} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Zitate generieren</button>
          </div>
        </div>
      ) : (
        <div className="p-8 md:p-10 flex flex-col items-center justify-center text-center min-h-[200px] relative">
          
          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <input 
              type="number" 
              value={intervalSec} 
              onChange={e => setIntervalSec(Number(e.target.value))}
              className="w-12 text-black text-center rounded text-xs p-1"
              title="Intervall (Sek)"
            />
            <span className="text-xs pt-1">Sek.</span>
            <button onClick={() => setIsImporting(true)} className="bg-panel/20 hover:bg-panel/40 p-1 rounded text-xs" title="Import">➕</button>
            <button onClick={deleteCurrent} className="bg-red-500/20 hover:bg-red-500 p-1 rounded text-xs" title="Löschen">🗑️</button>
          </div>

          <div className="animate-in fade-in zoom-in duration-700 key={currentQuote?.id}">
            <p className="text-xl md:text-2xl font-serif italic leading-relaxed mb-4">
              "{currentQuote?.content || "Lade..."}"
            </p>
            <p className="text-sm font-bold uppercase tracking-widest opacity-70">
              — {currentQuote?.source}
            </p>
          </div>

          <div className="absolute bottom-0 left-0 h-1 bg-panel/30 w-full">
            <div 
                className="h-full bg-panel" 
                style={{ 
                    width: '100%', 
                    animation: `shrink ${intervalSec}s linear infinite` 
                }} 
            />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes shrink {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
