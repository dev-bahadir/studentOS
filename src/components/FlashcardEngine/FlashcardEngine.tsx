// ============================================
// 💎 FLASHCARD ENGINE COMPONENT
// src/components/FlashcardEngine/FlashcardEngine.tsx
// ============================================
// Beautiful Card-Flip Animation mit SM-2 Integration

'use client';

import React, { useState } from 'react';
import { useFlashcardEngine } from '@/hooks/useFlashcardEngine';
import { Flashcard } from '@/hooks/useFlashcardEngine';
import styles from './FlashcardEngine.module.css';

interface FlashcardEngineProps {
  autoFlip?: boolean;
  focusMode?: boolean; // 30s Timer Mode
}

export const FlashcardEngine: React.FC<FlashcardEngineProps> = ({
  autoFlip = false,
  focusMode = false,
}) => {
  const engine = useFlashcardEngine();
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (engine.isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loader}>Loading your cards...</div>
      </div>
    );
  }

  if (!engine.currentCard) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <h2>🎉 All caught up!</h2>
          <p>No cards due for review today.</p>
          <p>Great job staying on top of your learning!</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (selectedQuality === null) return;

    setIsSubmitting(true);
    try {
      await engine.reviewCard(engine.currentCard!.id, selectedQuality);
      setIsFlipped(false);
      setSelectedQuality(null);
      engine.nextCard();
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const card = engine.currentCard;

  return (
    <div className={styles.container}>
      {/* Progress Bar */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill}>
          <span className={styles.progressText}>
            {engine.reviewProgress.reviewed + 1} / {engine.reviewProgress.total}
          </span>
        </div>
        <progress
          className={styles.progress}
          value={engine.reviewProgress.reviewed}
          max={engine.reviewProgress.total}
        />
      </div>

      {/* Main Card */}
      <div className={styles.cardWrapper}>
        <div
          className={`${styles.card} ${isFlipped ? styles.flipped : ''}`}
          onClick={() => !isSubmitting && setIsFlipped(!isFlipped)}
        >
          {/* Front */}
          <div className={styles.cardFront}>
            <div className={styles.cardContent}>
              <p className={styles.label}>Question</p>
              <h2 className={styles.cardText}>{card.front}</h2>
            </div>
            <p className={styles.hint}>Click to reveal answer</p>
          </div>

          {/* Back */}
          <div className={styles.cardBack}>
            <div className={styles.cardContent}>
              <p className={styles.label}>Answer</p>
              <h2 className={styles.cardText}>{card.back}</h2>
            </div>
            <p className={styles.hint}>Click to hide answer</p>
          </div>
        </div>
      </div>

      {/* Card Meta */}
      <div className={styles.cardMeta}>
        <span className={styles.category}>{card.category}</span>
        <span className={styles.difficulty}>{card.difficulty}</span>
        <span className={styles.stats}>
          {card.correct_reviews}/{card.total_reviews} correct
        </span>
      </div>

      {/* Quality Selector (nur wenn geflippt) */}
      {isFlipped && (
        <div className={styles.qualitySelector}>
          <p className={styles.qualityLabel}>How well did you know this?</p>

          <div className={styles.qualityButtons}>
            {/* 0 - Again */}
            <button
              className={`${styles.qualityBtn} ${styles.quality0} ${
                selectedQuality === 0 ? styles.selected : ''
              }`}
              onClick={() => setSelectedQuality(0)}
              disabled={isSubmitting}
            >
              <span className={styles.emoji}>😫</span>
              <span className={styles.label}>Again</span>
            </button>

            {/* 1 - Hard */}
            <button
              className={`${styles.qualityBtn} ${styles.quality1} ${
                selectedQuality === 1 ? styles.selected : ''
              }`}
              onClick={() => setSelectedQuality(1)}
              disabled={isSubmitting}
            >
              <span className={styles.emoji}>😕</span>
              <span className={styles.label}>Hard</span>
            </button>

            {/* 2 - Good */}
            <button
              className={`${styles.qualityBtn} ${styles.quality2} ${
                selectedQuality === 2 ? styles.selected : ''
              }`}
              onClick={() => setSelectedQuality(2)}
              disabled={isSubmitting}
            >
              <span className={styles.emoji}>😐</span>
              <span className={styles.label}>Good</span>
            </button>

            {/* 3 - Easy */}
            <button
              className={`${styles.qualityBtn} ${styles.quality3} ${
                selectedQuality === 3 ? styles.selected : ''
              }`}
              onClick={() => setSelectedQuality(3)}
              disabled={isSubmitting}
            >
              <span className={styles.emoji}>😊</span>
              <span className={styles.label}>Easy</span>
            </button>

            {/* 5 - Perfect */}
            <button
              className={`${styles.qualityBtn} ${styles.quality5} ${
                selectedQuality === 5 ? styles.selected : ''
              }`}
              onClick={() => setSelectedQuality(5)}
              disabled={isSubmitting}
            >
              <span className={styles.emoji}>🤯</span>
              <span className={styles.label}>Perfect</span>
            </button>
          </div>

          {/* Submit Button */}
          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={selectedQuality === null || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      )}

      {/* Debug Info (Optional) */}
      {process.env.NODE_ENV === 'development' && (
        <div className={styles.debugInfo}>
          <small>
            Interval: {card.interval} days | Ease: {card.ease_factor.toFixed(2)}
          </small>
        </div>
      )}
    </div>
  );
};

export default FlashcardEngine;
