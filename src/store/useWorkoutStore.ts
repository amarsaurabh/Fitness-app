import { create } from 'zustand';
import type { WorkoutSession } from '@/types/models';
import { getMMKV, setMMKV, STORAGE_KEYS } from '@/utils/storage';
import { todayString } from '@/utils/streak';

interface ActiveSession {
  workoutId: string;
  workoutName: string;
  startedAt: number; // unix ms
  currentExerciseIndex: number;
  exercisesCompleted: string[];
  caloriesBurned: number;
  isOneMineMode: boolean;
}

interface WorkoutState {
  sessions: WorkoutSession[];
  activeSession: ActiveSession | null;
  hydrate: () => void;
  startSession: (workoutId: string, workoutName: string, oneMineMode?: boolean) => void;
  setCurrentExercise: (index: number) => void;
  completeExercise: (exerciseId: string) => void;
  updateCalories: (calories: number) => void;
  completeSession: (finalCalories: number) => WorkoutSession | null;
  abandonSession: () => void;
  getTodaySessions: () => WorkoutSession[];
  hasTodaySession: () => boolean;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  sessions: [],
  activeSession: null,

  hydrate: () => {
    const stored = getMMKV<WorkoutSession[]>(STORAGE_KEYS.SESSIONS);
    set({ sessions: stored ?? [] });
  },

  startSession: (workoutId, workoutName, oneMineMode = false) => {
    set({
      activeSession: {
        workoutId,
        workoutName,
        startedAt: Date.now(),
        currentExerciseIndex: 0,
        exercisesCompleted: [],
        caloriesBurned: 0,
        isOneMineMode: oneMineMode,
      },
    });
  },

  setCurrentExercise: (index) => {
    const active = get().activeSession;
    if (!active) return;
    set({ activeSession: { ...active, currentExerciseIndex: index } });
  },

  completeExercise: (exerciseId) => {
    const active = get().activeSession;
    if (!active) return;
    set({
      activeSession: {
        ...active,
        exercisesCompleted: [...active.exercisesCompleted, exerciseId],
      },
    });
  },

  updateCalories: (calories) => {
    const active = get().activeSession;
    if (!active) return;
    set({ activeSession: { ...active, caloriesBurned: calories } });
  },

  completeSession: (finalCalories) => {
    const active = get().activeSession;
    if (!active) return null;

    const durationMin = Math.round((Date.now() - active.startedAt) / 60000);
    const session: WorkoutSession = {
      id: `${Date.now()}`,
      date: todayString(),
      workoutId: active.workoutId,
      workoutName: active.workoutName,
      completed: true,
      durationMin,
      caloriesBurned: finalCalories,
      exercisesCompleted: active.exercisesCompleted,
      isOneMineMode: active.isOneMineMode,
    };

    const updated = [session, ...get().sessions];
    setMMKV(STORAGE_KEYS.SESSIONS, updated);
    set({ sessions: updated, activeSession: null });
    return session;
  },

  abandonSession: () => {
    set({ activeSession: null });
  },

  getTodaySessions: () => {
    const today = todayString();
    return get().sessions.filter((s) => s.date === today);
  },

  hasTodaySession: () => {
    const today = todayString();
    return get().sessions.some((s) => s.date === today && s.completed);
  },
}));
