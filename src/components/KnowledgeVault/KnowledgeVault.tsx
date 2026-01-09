// ============================================
// 📚 KNOWLEDGE VAULT IMPORTER COMPONENT
// src/components/KnowledgeVault/KnowledgeVault.tsx
// ============================================

'use client';

import React, { useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { aiService } from '@/services/aiIntegration.service';
import { useFlashcardEngine } from '@/hooks/useFlashcardEngine';
import { 
  Upload, FileText, Loader2, CheckCircle, 
  AlertCircle, Sparkles, BookOpen, Layers 
} from 'lucide-react';

// Zentrale Glass-Klasse für konsistentes Design
const glassClass = "bg-white/5 dark:bg-zinc-900/20 backdrop-blur-xl border border-white/10 dark:border-zinc-800/50 shadow-xl";

// WICHTIG: Definiere den Typ für Difficulty
type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'mixed';

interface KnowledgeVaultProps {
  onCardsGenerated?: (count: number) => void;
}

export const KnowledgeVault: React.FC<KnowledgeVaultProps> = ({
  onCardsGenerated,
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);
  const [generatedCards, setGeneratedCards] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Options State mit korrektem Typ
  const [numCards, setNumCards] = useState(10);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('mixed');

  const flashcardEngine = useFlashcardEngine();

  // --- DRAG & DROP HANDLERS ---
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Bitte lade eine PDF-Datei hoch.');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      setError(null);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // --- MAIN GENERATION LOGIC ---
  const handleGenerateCards = async () => {
    if (!selectedFile) {
      setError('Bitte wähle zuerst eine Datei aus.');
      return;
    }

    if (!user) {
      setError('Du musst eingeloggt sein.');
      return;
    }

    setIsLoading(true);
    setGenerationStatus('PDF wird analysiert...');
    setError(null);

    try {
      // 1. PDF Parsen
      setGenerationStatus('Extrahiere Wissen aus PDF...');
      const pdfResult = await aiService.parsePDF(selectedFile);

      // 2. AI Generierung
      setGenerationStatus(`Generiere ${numCards} Flashcards mit AI...`);
      const cardResult = await aiService.generateCards(pdfResult.content, {
        numberOfCards: numCards,
        difficulty: difficulty, // Jetzt typsicher
        language: 'de', 
      });

      // 3. Speichern in DB (Batch Insert Fix)
      setGenerationStatus('Speichere Karten in die Datenbank...');
      
      const cardsToInsert = cardResult.cards.map((card: any) => ({
        user_id: user.id,
        front: card.front,
        back: card.back,
        category: card.category || 'AI Generated',
        state: 0, // FSRS: Neu
        due_date: new Date().toISOString()
      }));

      const { error: insertError } = await supabase.from('flashcards').insert(cardsToInsert);

      if (insertError) throw insertError;

      // 4. Abschluss
      const savedCount = cardsToInsert.length;
      setGeneratedCards(savedCount);
      setGenerationStatus(null);
      
      // UI Refresh & XP
      await flashcardEngine.refresh();
      await supabase.rpc('increment_xp', { x: savedCount * 5, row_id: user.id });
      
      onCardsGenerated?.(savedCount);
      setSelectedFile(null); // Reset File nach Erfolg

      // Erfolgsmeldung nach 5s ausblenden
      setTimeout(() => {
        setGeneratedCards(0);
      }, 5000);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Generierung fehlgeschlagen.');
      setGenerationStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`p-8 rounded-[3rem] ${glassClass} transition-all`}>
      <div className="mb-8">
        <h2 className="text-3xl font-black flex items-center gap-3 text-zinc-900 dark:text-white">
          <BookOpen className="text-purple-500" size={32} /> 
          Knowledge Vault
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
          Lade Vorlesungsskripte oder Bücher hoch – die AI erstellt deine Lernkarten.
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={`relative border-4 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer group
          ${isDragging 
            ? 'border-purple-500 bg-purple-500/10 scale-[1.02]' 
            : selectedFile 
              ? 'border-emerald-500/50 bg-emerald-500/5' 
              : 'border-zinc-200 dark:border-zinc-700 hover:border-purple-500/50 hover:bg-zinc-50 dark:hover:bg-white/5'
          }
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleUploadClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        {selectedFile ? (
          <div className="animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
              <FileText size={32} />
            </div>
            <p className="font-bold text-lg text-zinc-900 dark:text-white">{selectedFile.name}</p>
            <p className="text-zinc-500 text-sm font-mono mt-1">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <p className="text-emerald-500 text-xs font-black uppercase tracking-widest mt-4">Datei bereit</p>
          </div>
        ) : (
          <div>
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 group-hover:text-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors">
              <Upload size={32} />
            </div>
            <p className="font-bold text-lg text-zinc-900 dark:text-white">PDF hier ablegen</p>
            <p className="text-zinc-500 text-sm mt-1">oder klicken zum Auswählen</p>
          </div>
        )}
      </div>

      {/* Options & Actions */}
      <div className="mt-8 space-y-6">
        
        {/* Settings nur zeigen wenn Datei da ist */}
        {selectedFile && !isLoading && !generatedCards && (
          <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-4">
             <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-2">Anzahl</label>
                <select 
                  className="w-full p-4 bg-zinc-100 dark:bg-black/20 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-purple-500 transition-all text-zinc-900 dark:text-zinc-100"
                  value={numCards}
                  onChange={(e) => setNumCards(Number(e.target.value))}
                >
                  <option value="5">5 Karten</option>
                  <option value="10">10 Karten</option>
                  <option value="20">20 Karten</option>
                  <option value="50">50 Karten</option>
                </select>
             </div>
             <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-2">Level</label>
                <select 
                  className="w-full p-4 bg-zinc-100 dark:bg-black/20 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-purple-500 transition-all text-zinc-900 dark:text-zinc-100"
                  value={difficulty}
                  // HIER WAR DER FEHLER: Wir casten den String jetzt explizit zum Type
                  onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                >
                  <option value="mixed">Gemischt</option>
                  <option value="easy">Leicht</option>
                  <option value="medium">Mittel</option>
                  <option value="hard">Schwer</option>
                </select>
             </div>
          </div>
        )}

        {/* Status Messages */}
        {generationStatus && (
          <div className="flex flex-col items-center justify-center py-8 animate-in fade-in">
            <Loader2 className="animate-spin text-purple-500 w-10 h-10 mb-4" />
            <p className="font-bold text-zinc-700 dark:text-zinc-300 animate-pulse">{generationStatus}</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 font-bold">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        )}

        {generatedCards > 0 && (
          <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] text-center">
            <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/30">
               <CheckCircle size={24} />
            </div>
            <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400">Fertig!</h3>
            <p className="text-zinc-600 dark:text-zinc-400 font-medium">
              {generatedCards} Karten wurden erstellt und gespeichert.
            </p>
          </div>
        )}

        {/* Buttons */}
        {selectedFile && !isLoading && !generatedCards && (
          <div className="flex gap-4">
            <button
              className="flex-1 bg-zinc-900 dark:bg-white text-white dark:text-black py-4 rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              onClick={handleGenerateCards}
            >
              <Sparkles size={20} />
              Generieren
            </button>
            <button
              className="px-6 py-4 bg-zinc-100 dark:bg-white/5 text-zinc-500 hover:text-red-500 rounded-2xl font-bold transition-colors"
              onClick={() => {
                setSelectedFile(null);
                setError(null);
              }}
            >
              Abbrechen
            </button>
          </div>
        )}

        {/* Info Footer */}
        <div className="pt-8 border-t border-zinc-200 dark:border-white/5">
           <div className="flex justify-between items-center text-xs font-bold text-zinc-400 uppercase tracking-widest">
              <span className="flex items-center gap-1"><Layers size={14} /> AI-Powered</span>
              <span className="flex items-center gap-1"><Sparkles size={14} /> Instant</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeVault;