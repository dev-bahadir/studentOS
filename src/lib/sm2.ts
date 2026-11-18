import { SRSGrade } from '@/types';

export function calculateNextReview(
  grade: SRSGrade,
  prevInterval: number,
  prevEase: number
) {
  let interval: number;
  let easeFactor: number;

  // EF' = EF + (0.1 - (5-q)*(0.08 + (5-q)*0.02))
  easeFactor = prevEase + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  if (grade < 3) {
    interval = 1;
  } else {
    if (prevInterval === 0) interval = 1;
    else if (prevInterval === 1) interval = 6;
    else interval = Math.round(prevInterval * easeFactor);
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);

  return {
    interval,
    ease_factor: Number(easeFactor.toFixed(2)),
    next_review_at: nextDate.toISOString(),
  };
}