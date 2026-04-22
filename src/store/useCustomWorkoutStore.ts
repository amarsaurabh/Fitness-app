import { create } from 'zustand';
import type { Workout } from '@/types/models';
import { getMMKV, setMMKV, STORAGE_KEYS } from '@/utils/storage';

interface CustomWorkoutState {
  workouts: Workout[];
  hydrate: () => void;
  saveWorkout: (workout: Workout) => void;
  deleteWorkout: (id: string) => void;
}

export const useCustomWorkoutStore = create<CustomWorkoutState>((set, get) => ({
  workouts: [],

  hydrate: () => {
    const stored = getMMKV<Workout[]>(STORAGE_KEYS.CUSTOM_WORKOUTS) ?? [];
    set({ workouts: stored });
  },

  saveWorkout: (workout) => {
    const existing = get().workouts;
    const idx = existing.findIndex((w) => w.id === workout.id);
    const updated =
      idx >= 0
        ? existing.map((w) => (w.id === workout.id ? workout : w))
        : [workout, ...existing];
    setMMKV(STORAGE_KEYS.CUSTOM_WORKOUTS, updated);
    set({ workouts: updated });
  },

  deleteWorkout: (id) => {
    const updated = get().workouts.filter((w) => w.id !== id);
    setMMKV(STORAGE_KEYS.CUSTOM_WORKOUTS, updated);
    set({ workouts: updated });
  },
}));
