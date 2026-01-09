'use client';

import React, { useState } from 'react';
import { Upload, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
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
}

export default function FlashcardImporter({ onImportSuccess }: FlashcardImporterProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [deckName, setDeckName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportedCard[]>([]);

  const parseCards = (text: string): ImportedCard[] => {
    if (!text.trim()) return [];

    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        let parts: string[] = [];

        if (line.includes('\t')) {
          parts = line.split('\t');
        } else if (line.includes(';')) {
          parts = line.split(';');
        } else if (line.includes(',')) {
          parts = line.split(',');
        } else {
          return {
            front: '',
            back: '',
            valid: false,
            error: 'Keine Trennung erkannt (nutze TAB, ; oder ,)',
          };
        }

        if (parts.length < 2) {
          return {
            front: parts[0]?.trim() || '',
            back: '',
            valid: false,
            error: 'Nur eine Spalte gefunden',
          };
        }

        const front = parts[0].trim();
        const back = parts.slice(1).join(' ').trim();

        if (!front || !back) {
          return {
            front,
            back,
            valid: false,
            error: 'Frage oder Antwort leer',
          };
        }

        return {
          front,
          back,
          valid: true,
        };
      });
  };

  const handleTextChange = (text: string) => {
    setImportText(text);
    setPreview(parseCards(text));
    setError(null);
  };

  const handleImport = async () => {
    if (!user?.id) {
      setError('Du musst angemeldet sein');
      return;
    }

    if (!deckName.trim()) {
      setError('Bitte gib einen Deck-Namen ein');
      return;
    }

    const validCards = preview.filter((c) => c.valid);
    if (validCards.length === 0) {
      setError('Keine gültigen Karten gefunden');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data: deckData, error: deckError } = await supabase
        .from('decks')
        .insert([
          {
            name: deckName.trim(),
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (deckError) {
        console.error('Deck error:', deckError);
        setError(`Fehler beim Erstellen des Decks: ${deckError.message}`);
        return;
      }

      if (!deckData) {
        setError('Deck konnte nicht erstellt werden');
        return;
      }

      const cardsToInsert = validCards.map((card) => ({
        front: card.front,
        back: card.back,
        deck_id: deckData.id,
        user_id: user.id,
        interval: 0,
        repetition: 0,
        efactor: 2.5,
        next_review_at: new Date().toISOString(),
      }));

      const { error: cardsError } = await supabase
        .from('flashcards')
        .insert(cardsToInsert)
        .select();

      if (cardsError) {
        console.error('Cards error:', cardsError);
        await supabase.from('decks').delete().eq('id', deckData.id);
        setError(`Fehler beim Importieren der Karten: ${cardsError.message}`);
        return;
      }

      setSuccess(`✅ ${validCards.length} Karten in "${deckName}" importiert!`);
      setImportText('');
      setDeckName('');
      setPreview([]);

      onImportSuccess();

      setTimeout(() => {
        setIsOpen(false);
        setSuccess(null);
      }, 2000);
    } catch (err) {
      console.error('Import error:', err);
      setError(`Fehler: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-zinc-900 dark:text-zinc-300"
      >
        <Upload size={18} className="text-purple-500" /> Importieren
      </button>
    );
  }

  const validCount = preview.filter((c) => c.valid).length;
  const invalidCount = preview.filter((c) => !c.valid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Karten importieren</h2>
          <button
            onClick={() => {
              setIsOpen(false);
              setError(null);
              setSuccess(null);
            }}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X size={24} className="text-zinc-600 dark:text-zinc-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 rounded-xl flex gap-3"
              >
                <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0" size={20} />
                <span className="text-red-800 dark:text-red-400 text-sm">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 bg-green-100 dark:bg-green-500/10 border border-green-300 dark:border-green-500/30 rounded-xl flex gap-3"
              >
                <CheckCircle2 className="text-green-600 dark:text-green-400 flex-shrink-0" size={20} />
                <span className="text-green-800 dark:text-green-400 text-sm">{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-sm font-bold text-zinc-900 dark:text-white mb-2">
              Deck Name
            </label>
            <input
              type="text"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="z.B. Englisch Vokabeln"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-600 focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-900 dark:text-white mb-2">
              Karten (TAB, Semikolon oder Komma als Trennung)
            </label>
            <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-2 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
              <strong>Formate:</strong>
              <div>• Frage [TAB] Antwort</div>
              <div>• Frage ; Antwort</div>
              <div>• Frage , Antwort</div>
            </div>
            <textarea
              value={importText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={'Hauptstadt von Frankreich\tParis\nHTML steht für\tHyperText Markup Language\nWas ist 2+2?\t4'}
              disabled={isLoading}
              className="w-full h-64 px-4 py-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none text-zinc-900 dark:text-white font-mono text-sm placeholder:text-zinc-500 dark:placeholder:text-zinc-600 focus:ring-2 focus:ring-purple-500 disabled:opacity-50 resize-none"
            />
          </div>

          {preview.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-zinc-900 dark:text-white">Vorschau</h3>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="text-green-600 dark:text-green-400 font-bold">{validCount}</span> gültig,{' '}
                  <span className="text-red-600 dark:text-red-400 font-bold">{invalidCount}</span> ungültig
                </div>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-xl p-3">
                {preview.slice(0, 10).map((card, i) => (
                  <div
                    key={i}
                    className={`text-sm p-2 rounded-lg border ${
                      card.valid
                        ? 'bg-green-50 dark:bg-green-500/5 border-green-200 dark:border-green-500/20'
                        : 'bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20'
                    }`}
                  >
                    {card.valid ? (
                      <div className="text-zinc-900 dark:text-white">
                        <strong>{card.front}</strong> → {card.back}
                      </div>
                    ) : (
                      <div className="text-red-600 dark:text-red-400">
                        <strong>{card.front || '(leer)'}</strong> • {card.error}
                      </div>
                    )}
                  </div>
                ))}
                {preview.length > 10 && (
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 text-center py-2">
                    +{preview.length - 10} weitere...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-6 flex gap-3">
          <button
            onClick={() => {
              setIsOpen(false);
              setError(null);
              setSuccess(null);
            }}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            Abbrechen
          </button>
          <button
            onClick={handleImport}
            disabled={isLoading || validCount === 0}
            className="flex-1 px-4 py-3 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 size={18} className="animate-spin" />}
            {isLoading ? 'Importiere...' : `Importieren (${validCount})`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
