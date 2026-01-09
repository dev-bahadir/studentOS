'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { calculateNextReview } from '@/lib/sm2';
import { Flashcard } from '@/typess';
import { useAuth } from '@/components/providers/AuthProvider';

export interface FlashcardEngineState {
  cards: Flashcard[];
  currentCard: Flashcard | null;
  dueCards: Flashcard[];
  isLoading: boolean;
  error: string | null;
  reviewProgress: {
    reviewed: number;
    total: number;
    percentage: number;
  };
}

// UPDATE: Akzeptiert jetzt optional eine Kategorie
export function useFlashcardEngine(categoryFilter?: string | null) {
  const { user } = useAuth();
  const [state, setState] = useState<FlashcardEngineState>({
    cards: [],
    currentCard: null,
    dueCards: [],
    isLoading: true,
    error: null,
    reviewProgress: { reviewed: 0, total: 0, percentage: 0 },
  });

  const loadCards = useCallback(async () => {
    if (!user?.id) return;
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      let query = supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', user.id)
        .order('next_review_at', { ascending: true });

      // FILTER LOGIK
      if (categoryFilter) {
        query = query.eq('category', categoryFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const cards = (data || []) as Flashcard[];
      const now = new Date();
      
      // Nur Karten laden, die fällig sind (Datum <= Jetzt)
      const dueCards = cards.filter(c => new Date(c.next_review_at) <= now);

      setState(prev => ({
        ...prev,
        cards,
        dueCards,
        currentCard: dueCards.length > 0 ? dueCards[0] : null,
        reviewProgress: {
          reviewed: 0,
          total: dueCards.length,
          percentage: 0,
        },
        isLoading: false,
      }));
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message, isLoading: false }));
    }
  }, [user?.id, categoryFilter]);

  useEffect(() => { loadCards(); }, [loadCards]);

  const reviewCard = useCallback(async (quality: number) => {
    if (!user?.id || !state.currentCard) return;

    const card = state.currentCard;
    const result = calculateNextReview(quality as any, card.interval, card.ease_factor);

    // Optimistic Update
    const nextDueCards = state.dueCards.filter(c => c.id !== card.id);
    
    setState(prev => ({
      ...prev,
      dueCards: nextDueCards,
      currentCard: nextDueCards[0] || null,
      reviewProgress: {
        ...prev.reviewProgress,
        reviewed: prev.reviewProgress.reviewed + 1,
        percentage: ((prev.reviewProgress.reviewed + 1) / prev.reviewProgress.total) * 100
      }
    }));

    await supabase.from('flashcards').update({
      interval: result.interval,
      ease_factor: result.ease_factor,
      next_review_at: result.next_review_at,
      repetitions: card.repetitions + 1,
    }).eq('id', card.id);
  }, [user?.id, state.currentCard, state.dueCards]);

  const deleteCard = useCallback(async (cardId: string) => {
    const { error } = await supabase.from('flashcards').delete().eq('id', cardId);
    if (!error) await loadCards();
  }, [loadCards]);

  return {
    ...state,
    refresh: loadCards,
    reviewCard,
    deleteCard
  };
}