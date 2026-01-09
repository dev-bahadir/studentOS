// @/types/index.ts

import type { FSRSCard } from "@/lib/scheduler";

// ============= ENUMS & TYPES =============

export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Status = 'backlog' | 'todo' | 'in_progress' | 'done';
export type SRSGrade = 0 | 1 | 2 | 3 | 4 | 5;

// ============= USER =============

export interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  avatar_url: string | null;
  level: number;
  total_xp: number;
  created_at: string;
}

// ============= TASKS =============

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: Status;
  due_date?: string;
  xp_reward: number;
  created_at: string;
  updated_at: string;
}

// ============= NOTES =============

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  is_pinned: boolean;
  updated_at: string;
  created_at: string;
}

// ============= DECKS (Flashcard Collections) =============

export interface Deck {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

// ============= FLASHCARDS - VOLLSTÄNDIG =============

/**
 * Flashcard mit vollständigem FSRS-System
 * Kombiniert alle Anforderungen:
 * - FSRS-Daten für Spaced Repetition
 * - Kategorisierung und Ordnerstruktur
 * - Benutzer-Bezug
 * - Timestamps für Auditing
 */
export interface Flashcard {
  // Primäre Identifikatoren
  id: string;
  user_id: string;
  deck_id?: string;

  // Inhalte
  front: string;           // Die Frage
  back: string;            // Die Antwort

  // Kategorisierung & Struktur
  category: string;        // z.B. "Math", "Languages"
  folder: string | null;   // z.B. "Chapter 3" (Optional)
  tags?: string[];         // Für flexible Filterung

  // ✅ FSRS-Daten (vollständig mit FSRSCard)
  fsrs: FSRSCard;

  // Legacy/kompatible Metriken (falls DB so speichert)
  interval: number;        // Tage zwischen Reviews
  ease_factor: number;     // SM-2 Ease Factor (default: 2.5)
  repetitions: number;     // Wie oft wiederholt
  next_review_at: string;  // ISO-String: Wann ist nächster Review?

  // Auditing
  created_at: string;      // ISO-DateTime
  updated_at: string;      // ISO-DateTime

  // Optional: Metadaten
  is_favorite?: boolean;
  notes?: string;
}

// ============= HABITS =============

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: string;
  streak: number;          // Aktuelle Streak
  best_streak: number;     // Best-Streak aller Zeiten
  completed_dates: string[]; // ISO-Dates: ["2023-10-25", "2023-10-26"]
  frequency: 'daily' | 'weekly' | 'monthly';
  created_at: string;
  updated_at: string;
}

// ============= UTILITY TYPES =============

/**
 * Für API Responses (ohne user_id, auto-fields)
 */
export type FlashcardInput = Omit<Flashcard, 'id' | 'created_at' | 'updated_at'>;

/**
 * Für Updates (alles optional außer id)
 */
export type FlashcardUpdate = Partial<FlashcardInput> & { id: string };

/**
 * Statistiken für Dashboard
 */
export interface ReviewStats {
  total_cards: number;
  due_today: number;
  learning: number;
  review: number;
  suspended: number;
  avg_stability: number;
  total_reviews: number;
}
