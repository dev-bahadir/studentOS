// ============================================
// 🎮 GAMIFICATION DASHBOARD COMPONENT
// src/components/GamificationDashboard/GamificationDashboard.tsx
// ============================================
// Real-time Stats, Level Progress, Achievements

'use client';

import React, { useEffect, useState } from 'react';
import { useGamification } from '@/hooks/useGamification';
import styles from './GamificationDashboard.module.css';

interface GamificationDashboardProps {
  compact?: boolean; // Compact mode für Sidebars
}

export const GamificationDashboard: React.FC<GamificationDashboardProps> = ({
  compact = false,
}) => {
  const { levelStats, streakDays, achievements, isLoading } = useGamification();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return <div className={styles.loader}>Loading stats...</div>;
  }

  return (
    <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
      {/* ========== LEVEL CARD ========== */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.title}>Level</h3>
          <span className={styles.badge}>{levelStats.currentLevel}</span>
        </div>

        <div className={styles.levelVisual}>
          <svg viewBox="0 0 100 100" className={styles.progressRing}>
            <circle
              cx="50"
              cy="50"
              r="45"
              className={styles.progressRingBackground}
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              className={styles.progressRingCircle}
              style={{
                strokeDasharray: `${
                  (levelStats.progressPercent / 100) * 282.7
                } 282.7`,
              }}
            />
            <text
              x="50"
              y="50"
              className={styles.progressRingText}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {Math.round(levelStats.progressPercent)}%
            </text>
          </svg>
        </div>

        <div className={styles.progressDetails}>
          <p className={styles.label}>
            {levelStats.xpInCurrentLevel} / {levelStats.xpNeededForNextLevel} XP
          </p>
          <progress
            className={styles.progressBar}
            value={levelStats.xpInCurrentLevel}
            max={levelStats.xpNeededForNextLevel}
          />
        </div>

        <div className={styles.xpInfo}>
          <span className={styles.statLabel}>Total XP</span>
          <span className={styles.statValue}>{levelStats.totalXP}</span>
        </div>
      </div>

      {/* ========== STREAK CARD ========== */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.title}>Streak</h3>
          <span className={`${styles.badge} ${styles.streakBadge}`}>
            🔥 {streakDays}
          </span>
        </div>

        <div className={styles.streakVisual}>
          {streakDays === 0 ? (
            <div className={styles.noStreak}>
              <p>No active streak</p>
              <p className={styles.subtitle}>Review a card to start!</p>
            </div>
          ) : (
            <>
              <div className={styles.streakDisplay}>
                <span className={styles.streakNumber}>{streakDays}</span>
                <span className={styles.streakLabel}>
                  {streakDays === 1 ? 'day' : 'days'}
                </span>
              </div>
              <div className={styles.motivationalText}>
                <p>🚀 Keep it up!</p>
              </div>
            </>
          )}
        </div>

        {/* Milestone Tracker */}
        <div className={styles.milestones}>
          {[7, 30, 100].map((milestone) => (
            <div
              key={milestone}
              className={`${styles.milestone} ${
                streakDays >= milestone ? styles.completed : ''
              }`}
            >
              <span className={styles.milestoneDay}>{milestone}d</span>
            </div>
          ))}
        </div>
      </div>

      {/* ========== ACHIEVEMENTS CARD ========== */}
      <div className={`${styles.card} ${styles.achievementsCard}`}>
        <div className={styles.cardHeader}>
          <h3 className={styles.title}>Achievements</h3>
          <span className={styles.count}>
            {achievements.length} unlocked
          </span>
        </div>

        <div className={styles.achievementsList}>
          {achievements.length === 0 ? (
            <p className={styles.emptyState}>
              Earn XP and streak days to unlock achievements!
            </p>
          ) : (
            achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`${styles.achievement} ${
                  achievement.unlockedAt ? styles.unlocked : ''
                }`}
              >
                <span className={styles.achievementIcon}>
                  {achievement.icon}
                </span>
                <div className={styles.achievementContent}>
                  <p className={styles.achievementName}>
                    {achievement.name}
                  </p>
                  <p className={styles.achievementDesc}>
                    {achievement.description}
                  </p>
                  {achievement.maxProgress > 1 && (
                    <div className={styles.achievementProgress}>
                      <progress
                        value={achievement.progress}
                        max={achievement.maxProgress}
                      />
                      <span>
                        {achievement.progress} / {achievement.maxProgress}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ========== STATS GRID (Compact View) ========== */}
      {!compact && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>⚡</span>
            <span className={styles.statLabel}>XP This Week</span>
            <span className={styles.statValue}>
              {Math.round(levelStats.totalXP * 0.2)}
            </span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statIcon}>📈</span>
            <span className={styles.statLabel}>Cards Learned</span>
            <span className={styles.statValue}>
              {achievements.length > 0 ? '10+' : '0'}
            </span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statIcon}>🎯</span>
            <span className={styles.statLabel}>Perfect Reviews</span>
            <span className={styles.statValue}>
              {Math.round(levelStats.totalXP / 25)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamificationDashboard;
