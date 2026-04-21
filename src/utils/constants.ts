export const MAX_STREAK_INSURANCE = 1;
export const STREAK_INSURANCE_RESET_DAY = 0; // Sunday

// A session counts if the user completes at least 1 minute
export const MIN_SESSION_DURATION_SEC = 60;

// Adaptive difficulty: adjust after this many consecutive sessions
export const DIFFICULTY_ADJUST_WINDOW = 3; // lower if < 60% completion
export const DIFFICULTY_RAISE_WINDOW = 5;  // raise if > 95% completion
export const DIFFICULTY_LOW_THRESHOLD = 0.6;
export const DIFFICULTY_HIGH_THRESHOLD = 0.95;

// Groq daily call budget (free tier protection)
export const GROQ_DAILY_CALL_LIMIT = 20;

// LLM cache TTLs in milliseconds
export const TTL_FRIDGE_MEALS = 24 * 60 * 60 * 1000;       // 24h
export const TTL_WEEKLY_REVIEW = 7 * 24 * 60 * 60 * 1000;  // 7 days
export const TTL_MOTIVATION = 24 * 60 * 60 * 1000;          // 24h (per missed date)
export const TTL_WORKOUT_MODIFIER = 30 * 24 * 60 * 60 * 1000; // 30 days

// Social benchmark cache
export const SOCIAL_BENCHMARK_TTL_MS = 5 * 60 * 1000; // 5 min

// Protein multipliers by goal (g per kg bodyweight)
export const PROTEIN_MULTIPLIER: Record<string, number> = {
  lose_weight: 2.0,
  build_muscle: 2.4,
  stay_active: 1.6,
  stress_relief: 1.4,
};

// TDEE activity multipliers
export const ACTIVITY_MULTIPLIER: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
};
