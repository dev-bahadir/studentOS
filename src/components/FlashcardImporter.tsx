'use client';

import { useState, useRef } from 'react';
import { Upload, Loader2, FileText, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

// WICHTIG: Hier fügen wir onClose? als optionale Prop hinzu
export function FlashcardImporter({ 
  onImportSuccess, 
  onClose 
}: { 
  onImportSuccess: () => void; 
  onClose?: () => void; 
}) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht eingeloggt");

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          let newCards = [];

          if (file.name.endsWith('.json')) {
            const jsonData = JSON.parse(content);
            if (!Array.isArray(jsonData)) throw new Error("JSON muss ein Array sein.");
            
            newCards = jsonData.map((card: any) => ({
              user_id: user.id,
              front: card.front || card.question || "",
              back: card.back || card.answer || "",
              category: card.category || "Importiert",
              state: 0,
              due_date: new Date().toISOString()
            })).filter(c => c.front && c.back);

          } else {
            const lines = content.split('\n');
            newCards = lines.map(line => {
              const [front, back, category] = line.split(';');
              if (!front || !back) return null;
              return {
                user_id: user.id,
                front: front.trim(),
                back: back.trim(),
                category: category?.trim() || "Importiert",
                state: 0,
                due_date: new Date().toISOString()
              };
            }).filter(Boolean);
          }

          if (newCards.length === 0) throw new Error("Keine Daten gefunden.");

          const { error } = await supabase.from('flashcards').insert(newCards);
          if (error) throw error;

          alert(`Erfolg: ${newCards.length} Karten importiert!`);
          if (fileInputRef.current) fileInputRef.current.value = '';
          
          // Callbacks ausführen
          onImportSuccess();
          if (onClose) onClose(); // Schließt Modal, falls vorhanden

        } catch (err: any) {
          console.error(err);
          alert("Fehler: " + err.message);
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
    <div className="flex flex-col gap-1 items-center w-full">
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
        className="flex items-center justify-center gap-2 px-8 py-4 bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 rounded-2xl text-sm font-black transition-all hover:scale-[1.02] active:scale-95 shadow-lg disabled:opacity-50 w-full max-w-xs"
      >
        {loading ? (
          <Loader2 className="animate-spin w-4 h-4" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
        Lernpaket wählen
      </button>
      
      <p className="text-[10px] text-zinc-500 text-center font-bold uppercase tracking-wider mt-2">
        JSON oder CSV (;) unterstützt
      </p>
    </div>
  );
}