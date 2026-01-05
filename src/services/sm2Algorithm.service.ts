// ============================================
// 🧠 SM-2 ALGORITHM SERVICE
// src/services/sm2Algorithm.service.ts
// ============================================
// Spaced Repetition System (SRS) Implementation
// Mathematik: I(n) = I(n-1) * EF
// EF := EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))

export interface SM2Result {
  newInterval: number; // Tage bis nächste Review
  newEaseFactor: number; // 1.3 - 2.5
  quality: number; // 0-5 (Antwort Qualität)
  nextReviewDate: Date;
}

export interface SM2State {
  interval: number;
  easeFactor: number;
  repetitions: number;
  lastReview: Date;
}

class SM2AlgorithmService {
  /**
   * Berechnet neue SM-2 Werte basierend auf Antwort-Qualität
   * @param quality 0-5 (0=total failure, 5=perfect)
   * @param currentInterval Aktuelles Interval in Tagen
   * @param currentEaseFactor Aktuelle Ease Factor (default 2.5)
   * @returns Neue Interval und Ease Factor
   */
  calculateSM2(
    quality: number,
    currentInterval: number,
    currentEaseFactor: number = 2.5
  ): SM2Result {
    // Validierung
    if (quality < 0 || quality > 5) {
      throw new Error('Quality must be between 0 and 5');
    }

    // SM-2 Formel für Ease Factor
    // EF := EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    let newEaseFactor =
      currentEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    // Minimum Ease Factor = 1.3
    if (newEaseFactor < 1.3) {
      newEaseFactor = 1.3;
    }

    // Interval Berechnung
    // I(1) := 1
    // I(2) := 3
    // I(n) := I(n-1) * EF
    let newInterval: number;

    if (currentInterval === 0) {
      newInterval = 1; // Erste Review
    } else if (currentInterval === 1) {
      newInterval = 3; // Zweite Review nach 3 Tagen
    } else {
      newInterval = Math.round(currentInterval * newEaseFactor);
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

    return {
      newInterval,
      newEaseFactor,
      quality,
      nextReviewDate,
    };
  }

  /**
   * Berechnet das nächste Review-Datum basierend auf Interval
   */
  getNextReviewDate(intervalDays: number): Date {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + intervalDays);
    return nextDate;
  }

  /**
   * Gibt Statistiken über die SM-2 Performance
   */
  getStatistics(reviews: SM2Result[]): {
    averageQuality: number;
    averageInterval: number;
    averageEaseFactor: number;
    totalReviews: number;
    masterCards: number; // Cards mit Interval > 30 Tagen
  } {
    if (reviews.length === 0) {
      return {
        averageQuality: 0,
        averageInterval: 0,
        averageEaseFactor: 2.5,
        totalReviews: 0,
        masterCards: 0,
      };
    }

    const totalQuality = reviews.reduce((sum, r) => sum + r.quality, 0);
    const totalInterval = reviews.reduce((sum, r) => sum + r.newInterval, 0);
    const totalEaseFactor = reviews.reduce((sum, r) => sum + r.newEaseFactor, 0);
    const masterCards = reviews.filter((r) => r.newInterval > 30).length;

    return {
      averageQuality: totalQuality / reviews.length,
      averageInterval: totalInterval / reviews.length,
      averageEaseFactor: totalEaseFactor / reviews.length,
      totalReviews: reviews.length,
      masterCards,
    };
  }

  /**
   * Bestimmt schwierige Karten (quality < 3)
   */
  getProblematicCards(
    reviews: SM2Result[],
    threshold: number = 3
  ): SM2Result[] {
    return reviews.filter((r) => r.quality < threshold);
  }

  /**
   * Berechnet "Due for Review" Karten
   */
  getDueCards(
    cards: Array<{ nextReviewDate: Date }>,
    now: Date = new Date()
  ): number {
    return cards.filter((card) => card.nextReviewDate <= now).length;
  }
}

export const sm2Service = new SM2AlgorithmService();
