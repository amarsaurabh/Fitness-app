import { create } from 'zustand';
import type { WeightEntry } from '@/types/models';
import { getMMKV, setMMKV, STORAGE_KEYS } from '@/utils/storage';

interface BodyWeightState {
  entries: WeightEntry[];
  hydrate: () => void;
  logWeight: (kg: number) => void;
  todayEntry: () => WeightEntry | null;
}

export const useBodyWeightStore = create<BodyWeightState>((set, get) => ({
  entries: [],

  hydrate: () => {
    const stored = getMMKV<WeightEntry[]>(STORAGE_KEYS.BODY_WEIGHT) ?? [];
    set({ entries: stored });
  },

  logWeight: (kg) => {
    const today = new Date().toISOString().split('T')[0];
    const existing = get().entries;
    const filtered = existing.filter((e) => e.date !== today);
    const updated = [{ date: today, kg }, ...filtered].sort((a, b) =>
      b.date.localeCompare(a.date),
    );
    setMMKV(STORAGE_KEYS.BODY_WEIGHT, updated);
    set({ entries: updated });
  },

  todayEntry: () => {
    const today = new Date().toISOString().split('T')[0];
    return get().entries.find((e) => e.date === today) ?? null;
  },
}));
