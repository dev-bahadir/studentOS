'use client';

import { useState, useRef } from 'react';
import { Upload, Loader2, FileJson, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export function FlashcardImporter({ onImportSuccess }: { onImportSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    try {
      // Aktuellen User abrufen für die Zuordnung
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht eingeloggt");

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          let newCards = [];

          // 1. Logik für JSON-Dateien
          if (file.name.endsWith('.json')) {
            const jsonData = JSON.parse(content);
            if (!Array.isArray(jsonData)) throw new Error("JSON muss ein Array von Objekten sein.");
            
            newCards = jsonData.map((card: any) => ({
              user_id: user.id,
              front: card.front || card.question || "", // Unterstützt beide Formate
              back: card.back || card.answer || "",
              category: card.category || "Importiert",
              due_date: new Date().toISOString()
            })).filter(c => c.front && c.back);

          } 
          // 2. Logik für CSV/TXT-Dateien
          else {
            const lines = content.split('\n');
            newCards = lines.map(line => {
              const [front, back, category] = line.split(';');
              return {
                user_id: user.id,
                front: front?.trim(),
                back: back?.trim(),
                category: category?.trim() || "Allgemein",
                due_date: new Date().toISOString()
              };
            }).filter(c => c.front && c.back);
          }

          if (newCards.length === 0) throw new Error("Keine gültigen Daten gefunden.");

          // Batch-Insert in Supabase
          const { error } = await supabase.from('flashcards').insert(newCards);
          if (error) throw error;

          alert(`Erfolg: ${newCards.length} Karten importiert!`);
          if (fileInputRef.current) fileInputRef.current.value = '';
          onImportSuccess(); // Löst den Refresh auf der Flashcards-Seite aus

        } catch (err: any) {
          console.error("Parsing-Fehler:", err);
          alert("Fehler beim Verarbeiten der Datei: " + err.message);
        }
      };
      reader.readAsText(file);
    } catch (err: any) {
      alert("Fehler: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <input 
        type="file" 
        accept=".json,.csv,.txt" 
        ref={fileInputRef}
        onChange={handleFileUpload} 
        className="hidden" 
      />
      
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 rounded-2xl text-sm font-black transition-all hover:scale-[1.02] active:scale-95 shadow-lg disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="animate-spin w-4 h-4" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
        Lernpaket importieren
      </button>
      
      <p className="text-[10px] text-zinc-500 text-center font-bold uppercase tracking-wider">
        JSON oder CSV (;) unterstützt
      </p>
    </div>
  );
}