// src/lib/fsrs.ts

export type Rating = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy

// Input Interface (Was aus der DB kommt)
export interface FSRSCardInput {
  stability: number;  
  difficulty: number; 
  state: number;      
  last_review?: string;
}

// Output Interface (Was wir berechnen)
export interface FSRSResult {
  stability: number;
  difficulty: number;
  state: number;
  next_review_at: string; // WICHTIG: Muss exakt so heißen wie in der DB
  interval: number;
}

// Standard FSRS Parameter (v4.5)
const p = {
  w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61],
  request_retention: 0.9 
};

export const calculateFSRS = (card: FSRSCardInput, rating: Rating, now: Date = new Date()): FSRSResult => {
  let s = card.stability || 0;
  let d = card.difficulty || 0;
  let state = card.state || 0;

  // 1. Berechnung Difficulty (D)
  let new_d = d - 0.61 * (rating - 3);
  if (state === 0) {
      new_d = p.w[rating + 1]; 
  }
  new_d = Math.min(Math.max(new_d, 1), 10);

  // 2. Berechnung Stability (S)
  let new_s = s;
  
  if (state === 0) {
      // NEW -> Learning
      new_s = p.w[rating - 1]; 
      state = 1; 
  } else if (state === 1 || state === 3) {
      // Learning/Relearning
      if (rating >= 3) {
          state = 2; // Review
          new_s = p.w[rating - 1]; 
      } else {
          new_s = 0.5; 
      }
  } else if (state === 2) {
      // Review
      const lastRev = card.last_review ? new Date(card.last_review).getTime() : now.getTime();
      const elapsed_days = Math.max(0, (now.getTime() - lastRev) / (86400000));
      const retrievability = Math.exp(Math.log(0.9) * elapsed_days / s);

      if (rating === 1) {
          state = 3; // Relearning
          new_s = p.w[11] * Math.pow(d, -p.w[12]) * (Math.pow(s + 1, p.w[13]) - 1) * Math.exp(p.w[14] * (1 - retrievability));
      } else {
          const easy_bonus = rating === 4 ? p.w[15] : 1;
          const hard_penalty = rating === 2 ? p.w[16] : 1;
          const s_inc = Math.exp(p.w[8]) * (11 - d) * Math.pow(s, -p.w[9]) * (Math.exp((1 - retrievability) * p.w[10]) - 1) * easy_bonus * hard_penalty;
          new_s = s + s_inc;
      }
  }

  // 3. Intervall
  const next_interval = Math.max(1, Math.round(new_s * 9 * (1 / p.request_retention - 1)));
  const next_due = new Date(now);
  next_due.setDate(next_due.getDate() + next_interval);

  return {
      stability: parseFloat(new_s.toFixed(4)),
      difficulty: parseFloat(new_d.toFixed(4)),
      state: state,
      next_review_at: next_due.toISOString(), // FIX: Korrekter Property Name
      interval: next_interval
  };
};