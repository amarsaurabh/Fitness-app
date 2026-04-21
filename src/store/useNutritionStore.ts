import { create } from 'zustand';
import type { FridgeItem } from '@/types/models';
import { getMMKV, setMMKV, STORAGE_KEYS } from '@/utils/storage';
import { todayString } from '@/utils/streak';

interface DailyProteinLog {
  date: string;
  loggedG: number;
}

interface NutritionState {
  fridgeItems: FridgeItem[];
  dailyLog: DailyProteinLog;
  hydrate: () => void;
  addFridgeItem: (item: FridgeItem) => void;
  removeFridgeItem: (id: string) => void;
  clearFridge: () => void;
  logProtein: (grams: number) => void;
  resetDailyLogIfNewDay: () => void;
  todayProteinG: () => number;
}

const emptyLog = (): DailyProteinLog => ({ date: todayString(), loggedG: 0 });

export const useNutritionStore = create<NutritionState>((set, get) => ({
  fridgeItems: [],
  dailyLog: emptyLog(),

  hydrate: () => {
    const fridge = getMMKV<FridgeItem[]>(STORAGE_KEYS.FRIDGE_ITEMS) ?? [];
    const log = getMMKV<DailyProteinLog>(STORAGE_KEYS.NUTRITION_LOG) ?? emptyLog();
    // Reset if it's a new day
    const today = todayString();
    set({
      fridgeItems: fridge,
      dailyLog: log.date === today ? log : emptyLog(),
    });
  },

  addFridgeItem: (item) => {
    const updated = [...get().fridgeItems, item];
    setMMKV(STORAGE_KEYS.FRIDGE_ITEMS, updated);
    set({ fridgeItems: updated });
  },

  removeFridgeItem: (id) => {
    const updated = get().fridgeItems.filter((i) => i.id !== id);
    setMMKV(STORAGE_KEYS.FRIDGE_ITEMS, updated);
    set({ fridgeItems: updated });
  },

  clearFridge: () => {
    setMMKV(STORAGE_KEYS.FRIDGE_ITEMS, []);
    set({ fridgeItems: [] });
  },

  logProtein: (grams) => {
    const today = todayString();
    const current = get().dailyLog;
    const updated: DailyProteinLog = {
      date: today,
      loggedG: (current.date === today ? current.loggedG : 0) + grams,
    };
    setMMKV(STORAGE_KEYS.NUTRITION_LOG, updated);
    set({ dailyLog: updated });
  },

  resetDailyLogIfNewDay: () => {
    const today = todayString();
    if (get().dailyLog.date !== today) {
      const fresh = emptyLog();
      setMMKV(STORAGE_KEYS.NUTRITION_LOG, fresh);
      set({ dailyLog: fresh });
    }
  },

  todayProteinG: () => {
    const log = get().dailyLog;
    return log.date === todayString() ? log.loggedG : 0;
  },
}));
