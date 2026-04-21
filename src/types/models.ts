export type Goal = 'lose_weight' | 'build_muscle' | 'stay_active' | 'stress_relief';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active';

export type WorkoutType = 'home' | 'travel' | 'gym';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type FoodCulture =
  | 'south-asian'
  | 'east-asian'
  | 'latin'
  | 'west-african'
  | 'mediterranean'
  | 'middle-eastern'
  | 'european'
  | 'global';

export interface UserProfile {
  id: string;
  name: string;
  weightKg: number;
  heightCm: number;
  foodCulture: FoodCulture;
  goal: Goal;
  activityLevel: ActivityLevel;
  notificationsEnabled: boolean;
  proteinReminderTime: string; // 'HH:MM' 24h
  onboardingComplete: boolean;
  createdAt: string; // ISO date
  // Adaptive difficulty: auto-adjusted based on completion rate
  difficultyBias: -1 | 0 | 1; // -1 easier, 0 default, 1 harder
}

export interface Exercise {
  id: string;
  name: string;
  tags: WorkoutType[];
  met: number; // Metabolic Equivalent of Task
  muscleGroups: string[];
  instructions: string;
  durationSec?: number; // if timed (e.g. plank 30s); undefined = rep-based
  defaultReps?: number; // if rep-based
  defaultSets: number;
}

export interface Workout {
  id: string;
  name: string;
  type: WorkoutType;
  exerciseIds: string[];
  estimatedCalories: number; // for 70kg reference weight
  durationMin: number;
  difficulty: Difficulty;
  tags: string[]; // e.g. ['core', 'cardio', 'upper-body']
}

export interface WorkoutSession {
  id: string;
  date: string; // 'YYYY-MM-DD'
  workoutId: string;
  workoutName: string;
  completed: boolean;
  durationMin: number;
  caloriesBurned: number;
  exercisesCompleted: string[]; // exercise IDs
  isOneMineMode: boolean;
}

export interface StreakRecord {
  startDate: string;
  endDate: string;
  length: number;
}

export interface Streak {
  current: number;
  longest: number;
  lastWorkoutDate: string | null; // 'YYYY-MM-DD'
  streakInsuranceCount: number; // resets to 1 every Sunday
  insuranceLastResetWeek: number; // ISO week number
  history: StreakRecord[];
}

export interface NutritionGoal {
  dailyProteinG: number;
  dailyCalories: number;
  remindersEnabled: boolean;
}

export interface FridgeItem {
  id: string;
  name: string;
  category: 'protein' | 'carb' | 'fat' | 'vegetable' | 'dairy' | 'other';
  proteinPer100g: number;
}

export interface CulturalFood {
  name: string;
  proteinPer100g: number;
  servingG: number;
  category: FridgeItem['category'];
}

export interface LLMCacheEntry {
  key: string;
  response: string;
  generatedAt: number; // unix ms
  ttlMs: number;
}

export interface PatternInsight {
  type: 'skip_day' | 'preferred_type' | 'completion_rate' | 'streak_stability' | 'duration_trend';
  message: string;
  icon: string;
}
