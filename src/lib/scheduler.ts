// @/lib/scheduler.ts

/**
 * FSRS (Free Spaced Repetition Scheduler) - Vollständige Implementierung
 * Basiert auf SM-2 und modernen Spaced Repetition Algorithmen
 */

export interface FSRSCard {
  // Primäre FSRS-Metriken
  stability: number;           // Wie stabil ist das Wissen? (Tage)
  difficulty: number;          // Wie schwer ist die Karte? (0-1, 0.5 = mittel)
  elapsed_days: number;        // Tage seit letztem Review
  scheduled_days: number;      // Empfohlene Tage bis nächster Review
  reps: number;                // Gesamte Wiederholungen
  lapses: number;              // Wie oft falsch beantwortet?
  state: "New" | "Learning" | "Review" | "Relearning";
  
  // Zusätzliche Metadaten
  due: number;                 // Unix-Timestamp: Wann ist Review fällig?
  last_review: number;         // Unix-Timestamp: Letzter Review
}

export type Rating = 1 | 2 | 3 | 4;

/**
 * Rating-Bedeutungen:
 * 1 = "Again" - Falsch beantwortet, sofort wiederholen
 * 2 = "Hard" - Schwierig, längerer Abstand
 * 3 = "Good" - Korrekt, normaler Abstand
 * 4 = "Easy" - Sehr leicht, großer Abstand
 */

export class FSRSScheduler {
  // FSRS-Parameter (SM-2 basiert)
  private readonly INIT_DIFFICULTY = 5;    // 0-10 Skala
  private readonly INIT_STABILITY = 0.3;   // Tage
  private readonly DECAY = -0.5;
  private readonly FACTOR = 19 / 81;
  private readonly HARD_PENALTY = 1.27;
  private readonly EASY_BONUS = 1.3;
  private readonly MIN_INTERVAL = 1;       // Mindestens 1 Tag

  constructor() {}

  /**
   * Erstelle eine neue Karte mit Standard-Werten
   */
  createCard(): FSRSCard {
    return {
      stability: this.INIT_STABILITY,
      difficulty: this.INIT_DIFFICULTY / 10,
      elapsed_days: 0,
      scheduled_days: 0,
      reps: 0,
      lapses: 0,
      state: "New",
      due: Date.now(),
      last_review: 0
    };
  }

  /**
   * Hauptfunktion: Review durchführen und neue Werte berechnen
   */
  review(card: FSRSCard, rating: Rating): FSRSCard {
    const now = Date.now();
    const elapsedSeconds = Math.max(0, (now - card.last_review) / 1000);
    const elapsedDays = elapsedSeconds / 86400;

    // 1. Schwierigkeit aktualisieren (Ease Factor)
    const newDifficulty = this.calculateDifficulty(card.difficulty, rating);

    // 2. Stabilität aktualisieren
    const newStability = this.calculateStability(
      card.stability,
      newDifficulty,
      rating,
      elapsedDays
    );

    // 3. Nächster Review-Interval
    const newScheduledDays = Math.ceil(newStability * this.getIntervalModifier(rating));

    // 4. State bestimmen
    const newState = this.calculateState(rating, newScheduledDays, card.state);

    // 5. Lapses tracken (für "Again"-Ratings)
    const newLapses = rating === 1 ? card.lapses + 1 : card.lapses;

    return {
      stability: Math.max(0.1, newStability),           // Min 0.1 Tage
      difficulty: Math.max(0, Math.min(1, newDifficulty)), // 0-1 Range
      elapsed_days: Math.ceil(elapsedDays),
      scheduled_days: Math.max(this.MIN_INTERVAL, newScheduledDays),
      reps: card.reps + 1,
      lapses: newLapses,
      state: newState,
      due: now + newScheduledDays * 86400000, // Millisekunden
      last_review: now
    };
  }

  /**
   * Schwierigkeit berechnen (SM-2 Ease Factor)
   * Rating-basierte Anpassung
   */
  private calculateDifficulty(current: number, rating: Rating): number {
    let adjustment = 0;

    switch (rating) {
      case 1: // Again
        adjustment = 0.2; // Schwierigkeit erhöhen
        break;
      case 2: // Hard
        adjustment = 0.1;
        break;
      case 3: // Good
        adjustment = 0;   // Keine Änderung
        break;
      case 4: // Easy
        adjustment = -0.2; // Schwierigkeit reduzieren
        break;
    }

    return current + adjustment;
  }

  /**
   * Stabilität berechnen (Hauptalgorithmus)
   * Wie schnell vergessen wir dieses Wissen?
   */
  private calculateStability(
    stability: number,
    difficulty: number,
    rating: Rating,
    elapsedDays: number
  ): number {
    // Decay-Faktor: Je länger her, desto mehr Verfall
    const decay = Math.pow(elapsedDays / stability, this.DECAY);
    
    let factor: number;
    switch (rating) {
      case 1: // Again - Stark zurücksetzen
        return stability * 0.1;
      case 2: // Hard - Schwach zunehmen
        factor = (1 + this.HARD_PENALTY * (difficulty - 0.5)) * this.FACTOR;
        break;
      case 3: // Good - Normal zunehmen
        factor = (1 + (difficulty - 0.5)) * this.FACTOR;
        break;
      case 4: // Easy - Stark zunehmen
        factor = (1 + this.EASY_BONUS * (difficulty - 0.5)) * this.FACTOR;
        break;
    }

    return stability * factor * decay;
  }

  /**
   * Interval-Modifizierer basierend auf Rating
   */
  private getIntervalModifier(rating: Rating): number {
    switch (rating) {
      case 1:
        return 0.05; // 5% der Stabilität → sofort wieder
      case 2:
        return 0.5;  // 50% der Stabilität
      case 3:
        return 1;    // 100% der Stabilität
      case 4:
        return 1.5;  // 150% der Stabilität
      default:
        return 1;
    }
  }

  /**
   * State basierend auf Interval bestimmen
   */
  private calculateState(
    rating: Rating,
    scheduledDays: number,
    currentState: string
  ): "New" | "Learning" | "Review" | "Relearning" {
    if (rating === 1) {
      // "Again" → Relearning
      return "Relearning";
    }

    if (scheduledDays <= 7) {
      return "Learning";
    }

    return "Review";
  }

  /**
   * Hilfsfunktion: Formatiere das nächste Review-Datum
   */
  getNextReviewLabel(card: FSRSCard): string {
    const days = card.scheduled_days;

    if (days === 0) return "< 10m";
    if (days === 1) return "Tomorrow";
    if (days < 7) return `${days}d`;
    if (days < 30) return `${Math.ceil(days / 7)}w`;
    if (days < 365) return `${Math.ceil(days / 30)}m`;
    return "> 1y";
  }

  /**
   * Statistiken für Dashboard
   */
  getStats(cards: FSRSCard[]) {
    const now = Date.now();
    const due = cards.filter(c => c.due <= now).length;
    const learning = cards.filter(c => c.state === "Learning").length;
    const review = cards.filter(c => c.state === "Review").length;
    const avgStability = cards.length > 0 
      ? cards.reduce((sum, c) => sum + c.stability, 0) / cards.length 
      : 0;

    return {
      total: cards.length,
      due,
      learning,
      review,
      avgStability: avgStability.toFixed(1)
    };
  }
}

/**
 * Beispiel-Verwendung:
 * 
 * const scheduler = new FSRSScheduler();
 * let card = scheduler.createCard();
 * 
 * // User antwortet falsch
 * card = scheduler.review(card, 1); // Again
 * 
 * // Später...
 * card = scheduler.review(card, 3); // Good
 * 
 * console.log(scheduler.getNextReviewLabel(card));
 * // "3d" → Review in 3 Tagen
 */
