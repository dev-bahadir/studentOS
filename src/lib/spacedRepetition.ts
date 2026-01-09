/**
 * FSRS (Free Spaced Repetition Scheduler) Algorithm
 * ─────────────────────────────────────────────────
 * Eine modernere Alternative zu SM-2 mit besserer Genauigkeit
 * Basierend auf: https://github.com/open-spaced-repetition/fsrs.js
 * 
 * Quality Skala:
 * 0 = again (< 30 mins)
 * 1 = hard (1-3 days)
 * 2 = good (4-7 days)
 * 3 = easy (10-16 days)
 */

export interface Card {
  id: string;
  front: string;           // ← Neu
  back: string;            // ← Neu
  due: Date;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: 'new' | 'learning' | 'review' | 'relearning';
  last_review?: Date;
}


export interface FSRSParams {
  request_retention: number; // Desired retention rate (0.85-0.95)
  maximum_interval: number; // Max days between reviews (36500)
  w: number[]; // Gewichte für Algorithmus
}

/**
 * Standard FSRS Parameter
 * Diese Werte sind optimiert für 90% Retention
 */
export const DEFAULT_FSRS_PARAMS: FSRSParams = {
  request_retention: 0.9,
  maximum_interval: 36500,
  w: [
    0.4, // w[0]: Initial difficulty
    0.6, // w[1]: Initial stability
    2.4, // w[2]: Difficulty change
    5.8, // w[3]: Stability change
    -0.5, // w[4]: Stability change
    -0.2, // w[5]: Stability change
    0.2, // w[6]: Stability change
    0.4, // w[7]: Easy bonus
    -0.6, // w[8]: Hard penalty
    0.039, // w[9]: Base difficulty
    1.97, // w[10]: Base stability
  ],
};

/**
 * Berechnet die initiale Schwierigkeit einer Karte
 */
const initDifficulty = (quality: number, params: FSRSParams): number => {
  return Math.min(
    10,
    Math.max(
      1,
      params.w[0] - Math.exp(params.w[1] * (quality - 2))
    )
  );
};

/**
 * Berechnet die initiale Stabilität einer Karte
 */
const initStability = (quality: number, params: FSRSParams): number => {
  const min = Math.min(
    Math.max(0.5, params.w[2] - 1),
    2
  );
  const max = Math.max(
    Math.max(1.5, params.w[2]),
    3
  );

  return min + (max - min) * quality / 5;
};

/**
 * Berechnet neue Schwierigkeit basierend auf Qualität
 */
const nextDifficulty = (
  difficulty: number,
  quality: number,
  params: FSRSParams
): number => {
  const new_d = difficulty +
    params.w[2] * (quality - 3);

  return Math.min(10, Math.max(1, new_d));
};

/**
 * Berechnet neue Stabilität basierend auf Qualität
 */
const nextStability = (
  stability: number,
  difficulty: number,
  quality: number,
  elapsed_days: number,
  params: FSRSParams
): number => {
  const interval_modifier = Math.log(elapsed_days + 1) / Math.log(2);
  let new_s = stability;

  if (quality === 0) {
    new_s = Math.min(
      stability * (1 + params.w[4] * (difficulty - 5) + params.w[5]),
      stability
    );
  } else if (quality === 1) {
    new_s = stability +
      params.w[3] * (difficulty - 5) +
      params.w[4] * (interval_modifier - 1);
  } else if (quality === 2) {
    new_s = stability +
      params.w[3] * (difficulty - 5) * 0.5 +
      (interval_modifier - 1) * params.w[5];
  } else if (quality === 3) {
    new_s = stability +
      params.w[6] * (interval_modifier - 1) +
      params.w[7] * difficulty;
  } else {
    new_s = stability +
      params.w[6] * (interval_modifier - 1) +
      params.w[7] * (difficulty - 2);
  }

  return Math.max(0.5, new_s);
};

/**
 * Berechnet das nächste Review-Intervall in Tagen
 */
const nextInterval = (
  stability: number,
  params: FSRSParams
): number => {
  const new_interval = Math.ceil(
    stability / Math.log(params.request_retention) * Math.log(0.9)
  );

  return Math.min(
    params.maximum_interval,
    Math.max(1, new_interval)
  );
};

/**
 * FSRS Scheduling
 * Gibt an, wann eine Karte nächstes Mal gelernt werden sollte
 */
export const schedule = (
  card: Card,
  quality: number, // 0-3
  now: Date = new Date(),
  params: FSRSParams = DEFAULT_FSRS_PARAMS
): Card => {
  // Elapsed days berechnen
  const last_review = card.last_review || now;
  const elapsed_days = Math.floor(
    (now.getTime() - last_review.getTime()) / (1000 * 60 * 60 * 24)
  );

  let new_card = { ...card, elapsed_days };

  // Neue Schwierigkeit & Stabilität berechnen
  if (card.reps === 0) {
    // Erste Wiederholung
    new_card.difficulty = initDifficulty(quality, params);
    new_card.stability = initStability(quality, params);
  } else {
    new_card.difficulty = nextDifficulty(
      card.difficulty,
      quality,
      params
    );
    new_card.stability = nextStability(
      card.stability,
      card.difficulty,
      quality,
      elapsed_days,
      params
    );
  }

  // State bestimmen
  if (quality < 2) {
    new_card.state = 'relearning';
    new_card.lapses++;
  } else if (card.state === 'learning' || card.state === 'relearning') {
    new_card.state = 'review';
  }

  // Nächstes Intervall berechnen
  if (quality < 2) {
    // Vergessen = 1 Tag
    new_card.scheduled_days = 1;
  } else {
    new_card.scheduled_days = nextInterval(new_card.stability, params);
  }

  // Due-Datum setzen
  const nextDue = new Date(now);
  nextDue.setDate(nextDue.getDate() + new_card.scheduled_days);
  new_card.due = nextDue;

  new_card.last_review = now;
  new_card.reps++;

  return new_card;
};

/**
 * Berechnet, wie wahrscheinlich eine Karte "forgotten" sein wird
 * Returns: 0-1 (0 = will remember, 1 = will forget)
 */
export const forgettingCurve = (
  stability: number,
  elapsed_days: number
): number => {
  return Math.pow(
    1 + (2 / stability) * elapsed_days,
    -1
  );
};

/**
 * Gibt ein "Difficulty Score" aus für die UI
 * Useful für Icons/Colors im Learning System
 */
export const getDifficultyColor = (difficulty: number): string => {
  if (difficulty < 3) return 'text-green-500'; // Easy
  if (difficulty < 5) return 'text-blue-500'; // Medium
  if (difficulty < 7) return 'text-yellow-500'; // Hard
  return 'text-red-500'; // Very Hard
};

/**
 * Gibt die nächste Review-Zeit als String aus
 */
export const formatNextReview = (due: Date, now: Date = new Date()): string => {
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Jetzt fällig!';
  if (diffDays === 0) return 'Heute';
  if (diffDays === 1) return 'Morgen';
  if (diffDays < 7) return `in ${diffDays} Tagen`;
  if (diffDays < 30) return `in ${Math.floor(diffDays / 7)} Wochen`;
  return `in ${Math.floor(diffDays / 30)} Monaten`;
};

/**
 * Batch-Scheduling für mehrere Karten
 * Useful für Deck Imports
 */
export const scheduleMultiple = (
  cards: Card[],
  quality: number,
  now: Date = new Date(),
  params: FSRSParams = DEFAULT_FSRS_PARAMS
): Card[] => {
  return cards.map(card => schedule(card, quality, now, params));
};

/**
 * Karten sortieren nach Priorität für Session
 * - New Karten zuerst
 * - Dann fällig (nach Dringlichkeit)
 * - Dann Learn-Karten
 */
export const sortByLearningPriority = (cards: Card[], now: Date = new Date()): Card[] => {
  return [...cards].sort((a, b) => {
    // New cards first
    if (a.state === 'new' && b.state !== 'new') return -1;
    if (a.state !== 'new' && b.state === 'new') return 1;

    // Then by due date (overdue first)
    const aOverdue = a.due < now;
    const bOverdue = b.due < now;
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;

    // Then by due date (most overdue first)
    return a.due.getTime() - b.due.getTime();
  });
};
