'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { FlashcardImporter } from '@/components/FlashcardImporter';
import {
  Brain,
  FolderPlus,
  Layers,
  Settings2,
  Trash2,
  X,
  Search,
  Loader2,
  Upload
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Types
interface Deck {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

export default function FlashcardsPage() {
  const { user } = useAuth();

  // States
  const [decks, setDecks] = useState<Deck[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingMode, setIsCreatingMode] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [settingsTarget, setSettingsTarget] = useState<Deck | null>(null);
  const [error, setError] = useState<string | null>(null);

  // FIX: State für den Importer, damit er nicht sofort aufploppt
  const [isImporting, setIsImporting] = useState(false);

  // Load decks
  const loadDecks = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const { data, error: supabaseError } = await supabase
        .from('decks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;
      setDecks(data || []);
    } catch (err) {
      console.error('Load decks error:', err);
      setError(`Fehler: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDecks();
  }, [user?.id]);

  // Create Deck
  const handleCreateDeck = async () => {
    if (!newDeckName.trim() || !user) return;
    try {
      const { data, error } = await supabase
        .from('decks')
        .insert([{ name: newDeckName, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      setDecks([data, ...decks]);
      setNewDeckName('');
      setIsCreatingMode(false);
    } catch (err) {
      setError('Fehler beim Erstellen des Decks');
    }
  };

  // Delete Deck
  const handleDeleteDeck = async () => {
    if (!settingsTarget) return;
    if (!confirm(`Deck "${settingsTarget.name}" wirklich löschen? Alle Karten darin gehen verloren.`)) return;

    try {
      const { error } = await supabase
        .from('decks')
        .delete()
        .eq('id', settingsTarget.id);

      if (error) throw error;
      setDecks(decks.filter((d) => d.id !== settingsTarget.id));
      setSettingsTarget(null);
    } catch (err) {
      setError('Fehler beim Löschen');
    }
  };

  // Rename Deck
  const handleRenameDeck = async (newName: string) => {
    if (!settingsTarget || !newName.trim()) return;
    try {
      const { error } = await supabase
        .from('decks')
        .update({ name: newName })
        .eq('id', settingsTarget.id);

      if (error) throw error;
      setDecks(decks.map((d) => (d.id === settingsTarget.id ? { ...d, name: newName } : d)));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDecks = useMemo(() => {
    return decks.filter((deck) =>
      deck.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [decks, searchQuery]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="animate-spin text-cyan-500 w-10 h-10" />
      </div>
    );
  }

  return (
    // FIX: Layout w-full und padding angepasst
    <div className="p-6 w-full max-w-full mx-auto min-h-screen pb-32">
      
      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 p-4 bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 rounded-xl flex justify-between items-center"
          >
            <span className="text-red-800 dark:text-red-400 font-medium">{error}</span>
            <button onClick={() => setError(null)}>
              <X size={18} className="text-red-600" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
             <Brain className="text-cyan-500" /> Lern-Decks
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2 font-medium">
            Dein Wissen organisiert.
          </p>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            type="text"
            placeholder="Suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none text-zinc-900 dark:text-white transition-all"
          />
        </div>
      </header>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-10 overflow-x-auto pb-2">
        <button
          onClick={() => setIsCreatingMode(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-zinc-900 dark:text-zinc-300 whitespace-nowrap"
        >
          <FolderPlus size={18} className="text-cyan-500" /> Neues Deck
        </button>
        
        {/* FIX: Button aktiviert den Importer State */}
        <button
          onClick={() => setIsImporting(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-zinc-900 dark:text-zinc-300 whitespace-nowrap"
        >
           <Upload size={18} className="text-purple-500" /> Importieren
        </button>
      </div>

      {/* FIX: Conditional Rendering für den Importer */}
      <AnimatePresence>
        {isImporting && (
           <FlashcardImporter 
              onImportSuccess={() => {
                loadDecks();
                setIsImporting(false);
              }} 
              onClose={() => setIsImporting(false)} 
           />
        )}
      </AnimatePresence>

      {/* Create Deck Form */}
      <AnimatePresence>
        {isCreatingMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-8 p-4 bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-200 dark:border-cyan-500/30 rounded-2xl flex gap-4"
          >
            <input
              autoFocus
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
              placeholder="Deck Name..."
              className="flex-1 bg-transparent border-none outline-none font-bold text-zinc-900 dark:text-white placeholder:text-zinc-500"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateDeck()}
            />
            <button onClick={handleCreateDeck} className="text-cyan-600 font-bold">Speichern</button>
            <button onClick={() => setIsCreatingMode(false)}><X size={18} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decks Grid */}
      {filteredDecks.length === 0 ? (
        <div className="text-center py-16">
          <Layers size={48} className="mx-auto text-zinc-400 mb-4" />
          <h3 className="text-xl font-bold text-zinc-500">Keine Decks gefunden</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDecks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} onSettings={() => setSettingsTarget(deck)} />
          ))}
        </div>
      )}

      {/* Settings Modal */}
      {settingsTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl w-full max-w-sm border border-zinc-200 dark:border-zinc-800 shadow-xl">
              <h3 className="font-bold mb-4 text-zinc-900 dark:text-white">Deck bearbeiten</h3>
              <input 
                 className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl mb-4 text-zinc-900 dark:text-white"
                 defaultValue={settingsTarget.name}
                 onBlur={(e) => handleRenameDeck(e.target.value)}
              />
              <button onClick={handleDeleteDeck} className="w-full text-red-500 font-bold mb-3 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors">
                Löschen
              </button>
              <button onClick={() => setSettingsTarget(null)} className="w-full text-zinc-500 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
                Abbrechen
              </button>
           </div>
        </div>
      )}
    </div>
  );
}

function DeckCard({ deck, onSettings }: { deck: Deck; onSettings: () => void; }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl hover:border-cyan-500/40 transition-all shadow-sm flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between mb-4">
          <div className="h-12 w-12 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-500">
            <Layers size={24} />
          </div>
          <button onClick={onSettings} className="opacity-0 group-hover:opacity-100 p-2 text-zinc-400 hover:text-white transition-opacity">
            <Settings2 size={18} />
          </button>
        </div>
        <h3 className="text-lg font-bold mb-2 text-zinc-900 dark:text-white truncate">{deck.name}</h3>
      </div>
      
      <Link href={`/learn?deck=${encodeURIComponent(deck.id)}`}>
        <button className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-3 rounded-xl font-bold mt-4 transition-colors">
          Lernen
        </button>
      </Link>
    </motion.div>
  );
}