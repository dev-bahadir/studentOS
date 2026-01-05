// ============================================
// 🎮 GAMIFICATION SERVICE
// src/services/gamification.service.ts
// ============================================
// XP System, Leveling, Streaks und Achievements

export interface XPEvent {
  action: 'card_reviewed' | 'streak_7days' | 'level_up' | 'vault_completed' | 'perfect_review';
  xpGained: number;
  cardId?: string;
  vaultId?: string;
  metadata?: Record<string, any>;
}

export interface LevelStats {
  currentLevel: number;
  totalXP: number;
  xpInCurrentLevel: number;
  xpNeededForNextLevel: number;
  progressPercent: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress: number;
  maxProgress: number;
}

class GamificationService {
  // XP Configuration
  private readonly XP_RATES = {
    CARD_REVIEWED: 10, // Pro Karte
    PERFECT_REVIEW: 25, // Quality = 5
    STREAK_7_DAYS: 100,
    STREAK_30_DAYS: 500,
    STREAK_100_DAYS: 2000,
    VAULT_COMPLETED: 200,
    LEVEL_UP: 0, // Keine XP für Level Up
  };

  private readonly XP_PER_LEVEL = 1000; // Benötigte XP pro Level

  /**
   * Berechnet XP basierend auf Aktion
   */
  calculateXP(event: XPEvent): number {
    return this.XP_RATES[event.action as keyof typeof this.XP_RATES] || 0;
  }

  /**
   * Berechnet neues Level basierend auf Total XP
   */
  calculateLevel(totalXP: number): number {
    return Math.floor(totalXP / this.XP_PER_LEVEL) + 1;
  }

  /**
   * Gibt Level-Statistiken zurück
   */
  getLevelStats(totalXP: number): LevelStats {
    const currentLevel = this.calculateLevel(totalXP);
    const xpInCurrentLevel = totalXP % this.XP_PER_LEVEL;
    const xpNeededForNextLevel = this.XP_PER_LEVEL;
    const progressPercent = (xpInCurrentLevel / xpNeededForNextLevel) * 100;

    return {
      currentLevel,
      totalXP,
      xpInCurrentLevel,
      xpNeededForNextLevel,
      progressPercent,
    };
  }

  /**
   * Berechnet Streak basierend auf Daily Activity
   */
  calculateStreak(
    lastActivityDate: Date | null,
    currentDate: Date = new Date()
  ): {
    streakDays: number;
    isActive: boolean;
    willBreakTomorrow: boolean;
  } {
    if (!lastActivityDate) {
      return {
        streakDays: 0,
        isActive: false,
        willBreakTomorrow: false,
      };
    }

    const lastDate = new Date(lastActivityDate);
    const today = new Date(currentDate);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Stelle Zeiten auf 00:00:00
    lastDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);

    // Berechne Differenz in Tagen
    const daysDiff = Math.floor(
      (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const isActive = daysDiff === 0; // Activity heute
    const willBreakTomorrow = daysDiff === 1; // Letzte Activity gestern

    let streakDays = 0;
    if (daysDiff === 0 || daysDiff === 1) {
      // Streak aktiv oder aktivierbar
      streakDays = 1; // Minimal 1 Tag
    } else {
      // Streak ist weg
      streakDays = 0;
    }

    return {
      streakDays,
      isActive,
      willBreakTomorrow,
    };
  }

  /**
   * Gibt Unlocked Achievements zurück
   */
  getAchievements(stats: {
    totalXP: number;
    streakDays: number;
    cardsLearned: number;
    perfectReviews: number;
  }): Achievement[] {
    const achievements: Achievement[] = [];

    // Achievements
    if (stats.cardsLearned >= 1) {
      achievements.push({
        id: 'first_card',
        name: 'First Step',
        description: 'Created your first flashcard',
        icon: '🎴',
        unlockedAt: new Date(),
        progress: 1,
        maxProgress: 1,
      });
    }

    if (stats.cardsLearned >= 10) {
      achievements.push({
        id: 'collection',
        name: 'Collector',
        description: 'Created 10 flashcards',
        icon: '📚',
        unlockedAt: new Date(),
        progress: stats.cardsLearned,
        maxProgress: 10,
      });
    }

    if (stats.streakDays >= 7) {
      achievements.push({
        id: 'week_warrior',
        name: 'Week Warrior',
        description: '7-day learning streak',
        icon: '🔥',
        unlockedAt: new Date(),
        progress: stats.streakDays,
        maxProgress: 7,
      });
    }

    if (stats.streakDays >= 30) {
      achievements.push({
        id: 'month_master',
        name: 'Month Master',
        description: '30-day learning streak',
        icon: '👑',
        unlockedAt: new Date(),
        progress: stats.streakDays,
        maxProgress: 30,
      });
    }

    if (stats.perfectReviews >= 10) {
      achievements.push({
        id: 'perfectionist',
        name: 'Perfectionist',
        description: '10 perfect reviews',
        icon: '✨',
        unlockedAt: new Date(),
        progress: stats.perfectReviews,
        maxProgress: 10,
      });
    }

    if (stats.totalXP >= 10000) {
      achievements.push({
        id: 'xp_master',
        name: 'XP Master',
        description: 'Earned 10,000 XP',
        icon: '⚡',
        unlockedAt: new Date(),
        progress: stats.totalXP,
        maxProgress: 10000,
      });
    }

    return achievements;
  }

  /**
   * Gibt nächste Milestone zurück
   */
  getNextMilestone(totalXP: number): {
    milestoneName: string;
    xpNeeded: number;
    currentLevel: number;
    nextLevel: number;
  } {
    const currentLevel = this.calculateLevel(totalXP);
    const nextLevel = currentLevel + 1;
    const nextMilestoneXP = nextLevel * this.XP_PER_LEVEL;
    const xpNeeded = nextMilestoneXP - totalXP;

    return {
      milestoneName: `Level ${nextLevel}`,
      xpNeeded,
      currentLevel,
      nextLevel,
    };
  }

  /**
   * Generiert motivierende Nachrichten
   */
  getMotivationalMessage(stats: {
    streakDays: number;
    level: number;
    cardsToday: number;
  }): string {
    if (stats.cardsToday === 0) {
      return "Today's learning hasn't started yet. Go review some cards! 🚀";
    }

    if (stats.streakDays === 1) {
      return 'Great start! You are on a 1-day streak! 🔥';
    }

    if (stats.streakDays >= 7 && stats.streakDays % 7 === 0) {
      return `Amazing! You have a ${stats.streakDays}-day streak! You are unstoppable! 👑`;
    }

    if (stats.level % 5 === 0 && stats.level > 0) {
      return `Congratulations on reaching Level ${stats.level}! 🎉`;
    }

    return `Keep up the great work! You are on a ${stats.streakDays}-day streak! 💪`;
  }
}

export const gamificationService = new GamificationService();
