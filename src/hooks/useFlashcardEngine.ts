'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { sm2Service, SM2Result } from '@/services/sm2Algorithm.service';
import { gamificationService, LevelStats } from '@/services/gamification.service';
import { useAuth } from '@/components/providers/AuthProvider';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  category: string;
  tags: string[];
  interval: number;
  ease_factor: number;
  next_review_date: string;
  difficulty: 'easy' | 'medium' | 'hard';
  total_reviews: number;
  correct_reviews: number;
}

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

export function useFlashcardEngine() {
  const { user } = useAuth();
  const [state, setState] = useState<FlashcardEngineState>({
    cards: [],
    currentCard: null,
    dueCards: [],
    isLoading: false,
    error: null,
    reviewProgress: { reviewed: 0, total: 0, percentage: 0 },
  });

  // Lade alle Karten für den User
  const loadCards = useCallback(async () => {
    if (!user?.id) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', user.id)
        .order('next_review_date', { ascending: true });

      if (error) throw error;

      const cards = (data || []) as Flashcard[];
      const now = new Date();
      const dueCards = cards.filter(
        (card) => new Date(card.next_review_date) <= now
      );

      setState((prev) => ({
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
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: (err as Error).message,
        isLoading: false,
      }));
    }
  }, [user?.id]);

  // Lade Karten bei User-Wechsel
  useEffect(() => {
    loadCards();
  }, [loadCards]);

  // Speichere Card Review mit SM-2 Berechnung
  const reviewCard = useCallback(
    async (
      cardId: string,
      quality: number
    ): Promise<{ success: boolean; nextReviewDate: string }> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const card = state.cards.find((c) => c.id === cardId);
      if (!card) {
        throw new Error('Card not found');
      }

      // SM-2 Berechnung
      const sm2Result = sm2Service.calculateSM2(
        quality,
        card.interval,
        card.ease_factor
      );

      // Speichere Review in card_review_history
      const { error: historyError } = await supabase
        .from('card_review_history')
        .insert({
          card_id: cardId,
          user_id: user.id,
          quality,
          interval: sm2Result.newInterval,
          ease_factor: sm2Result.newEaseFactor,
          time_spent_ms: 0,
          next_review_date: sm2Result.nextReviewDate.toISOString(),
        });

      if (historyError) throw historyError;

      // Update Flashcard
      const { error: updateError } = await supabase
        .from('flashcards')
        .update({
          interval: sm2Result.newInterval,
          ease_factor: sm2Result.newEaseFactor,
          next_review_date: sm2Result.nextReviewDate.toISOString(),
          total_reviews: card.total_reviews + 1,
          correct_reviews:
            quality >= 3 ? card.correct_reviews + 1 : card.correct_reviews,
          last_reviewed: new Date().toISOString(),
        })
        .eq('id', cardId);

      if (updateError) throw updateError;

      // XP Log
      const xpGained = quality === 5 ? 25 : 10;
      await supabase.from('xp_logs').insert({
        user_id: user.id,
        action: quality === 5 ? 'perfect_review' : 'card_reviewed',
        xp_gained: xpGained,
        card_id: cardId,
      });

      // Reload Cards
      await loadCards();

      return {
        success: true,
        nextReviewDate: sm2Result.nextReviewDate.toISOString(),
      };
    },
    [user?.id, state.cards, loadCards]
  );

  // Erstelle neue Flashcard
  const createCard = useCallback(
    async (
      front: string,
      back: string,
      category: string,
      difficulty: 'easy' | 'medium' | 'hard' = 'medium'
    ) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('flashcards')
        .insert({
          user_id: user.id,
          front,
          back,
          category,
          difficulty,
          interval: 1,
          ease_factor: 2.5,
          next_review_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      await loadCards();
      return data;
    },
    [user?.id, loadCards]
  );

  // Lösche Flashcard
  const deleteCard = useCallback(
    async (cardId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;

      await loadCards();
    },
    [user?.id, loadCards]
  );

  // Nächste Karte laden
  const nextCard = useCallback(() => {
    const currentIndex = state.dueCards.findIndex(
      (c) => c.id === state.currentCard?.id
    );
    const nextIndex = currentIndex + 1;

    if (nextIndex < state.dueCards.length) {
      setState((prev) => ({
        ...prev,
        currentCard: prev.dueCards[nextIndex],
        reviewProgress: {
          ...prev.reviewProgress,
          reviewed: nextIndex + 1,
          percentage: ((nextIndex + 1) / prev.reviewProgress.total) * 100,
        },
      }));
    } else {
      setState((prev) => ({
        ...prev,
        currentCard: null,
      }));
    }
  }, [state.dueCards, state.currentCard?.id]);

  return {
    ...state,
    loadCards,
    reviewCard,
    createCard,
    deleteCard,
    nextCard,
  };
}
