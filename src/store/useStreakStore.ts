import { create } from 'zustand';
import type { Streak } from '@/types/models';
import { getMMKV, setMMKV, STORAGE_KEYS } from '@/utils/storage';
import {
  recordWorkoutToStreak,
  checkAndBreakStreak,
  resetWeeklyInsurance,
  getISOWeek,
} from '@/utils/streak';

const DEFAULT_STREAK: Streak = {
  current: 0,
  longest: 0,
  lastWorkoutDate: null,
  streakInsuranceCount: 1,
  insuranceLastResetWeek: getISOWeek(new Date()),
  history: [],
};

interface StreakState {
  streak: Streak;
  hydrate: () => void;
  recordWorkout: () => void;
  checkStreak: () => void;
  resetInsuranceIfNeeded: () => void;
}

export const useStreakStore = create<StreakState>((set, get) => ({
  streak: DEFAULT_STREAK,

  hydrate: () => {
    const stored = getMMKV<Streak>(STORAGE_KEYS.STREAK);
    set({ streak: stored ?? DEFAULT_STREAK });
  },

  recordWorkout: () => {
    const updated = recordWorkoutToStreak(get().streak);
    setMMKV(STORAGE_KEYS.STREAK, updated);
    set({ streak: updated });
  },

  checkStreak: () => {
    let streak = get().streak;
    streak = resetWeeklyInsurance(streak);
    streak = checkAndBreakStreak(streak);
    setMMKV(STORAGE_KEYS.STREAK, streak);
    set({ streak });
  },

  resetInsuranceIfNeeded: () => {
    const updated = resetWeeklyInsurance(get().streak);
    setMMKV(STORAGE_KEYS.STREAK, updated);
    set({ streak: updated });
  },
}));
