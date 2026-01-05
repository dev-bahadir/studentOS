// ============================================
// ⚡ GAMIFICATION HOOK
// src/hooks/useGamification.ts
// ============================================

'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { gamificationService, LevelStats, Achievement } from '@/services/gamification.service';
import { useAuth } from '@/components/providers/AuthProvider';

export function useGamification() {
  const { user } = useAuth();
  const [levelStats, setLevelStats] = useState<LevelStats>({
    currentLevel: 1,
    totalXP: 0,
    xpInCurrentLevel: 0,
    xpNeededForNextLevel: 1000,
    progressPercent: 0,
  });
  const [streakDays, setStreakDays] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);

    try {
      // Lade Profile für XP und Streak
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp_total, streak_days, last_activity_date')
        .eq('id', user.id)
        .single();

      if (profile) {
        const levelStats = gamificationService.getLevelStats(profile.xp_total);
        setLevelStats(levelStats);
        setStreakDays(profile.streak_days);

        // Lade Achievements
        const { data: reviews } = await supabase
          .from('card_review_history')
          .select('*')
          .eq('user_id', user.id);

        const achievements = gamificationService.getAchievements({
          totalXP: profile.xp_total,
          streakDays: profile.streak_days,
          cardsLearned: (reviews || []).length,
          perfectReviews: (reviews || []).filter((r: any) => r.quality === 5).length,
        });

        setAchievements(achievements);
      }
    } catch (error) {
      console.error('Failed to load gamification stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const addXP = useCallback(
    async (action: string, xpAmount: number) => {
      if (!user?.id) return;

      // Aktualisiere XP in Profile
      const { error } = await supabase
        .from('xp_logs')
        .insert({
          user_id: user.id,
          action,
          xp_gained: xpAmount,
        });

      if (!error) {
        await loadStats();
      }
    },
    [user?.id, loadStats]
  );

  return {
    levelStats,
    streakDays,
    achievements,
    isLoading,
    loadStats,
    addXP,
  };
}
