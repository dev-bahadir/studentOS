import { create } from 'zustand';
import { supabase } from '@/lib/supabaseClient';
import { Note, Flashcard } from '@/typess';

interface BrainState {
  notes: Note[];
  flashcards: Flashcard[];
  loading: boolean;
  
  // Actions
  fetchInitialData: () => Promise<void>;
  updateNote: (id: string, content: string) => Promise<void>;
  syncFlashcardReview: (id: string, updates: Partial<Flashcard>) => Promise<void>;
}

export const useBrainStore = create<BrainState>((set, get) => ({
  notes: [],
  flashcards: [],
  loading: false,

  fetchInitialData: async () => {
    set({ loading: true });
    const { data: notes } = await supabase.from('notes').select('*').order('updated_at', { ascending: false });
    const { data: cards } = await supabase.from('flashcards').select('*');
    
    set({ 
      notes: notes || [], 
      flashcards: cards || [], 
      loading: false 
    });
  },

  updateNote: async (id, content) => {
    // 1. Optimistic Update (Sofort im UI)
    const previousNotes = get().notes;
    set({
      notes: previousNotes.map(n => n.id === id ? { ...n, content, updated_at: new Date().toISOString() } : n)
    });

    // 2. Hintergrund Sync
    const { error } = await supabase
      .from('notes')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error("Sync failed, rolling back...", error);
      set({ notes: previousNotes }); // Rollback bei Fehler
    }
  },

  syncFlashcardReview: async (id, updates) => {
    const previousCards = get().flashcards;
    set({
      flashcards: previousCards.map(c => c.id === id ? { ...c, ...updates } : c)
    });

    const { error } = await supabase
      .from('flashcards')
      .update(updates)
      .eq('id', id);

    if (error) {
      set({ flashcards: previousCards });
    }
  }
}));