import { create } from 'zustand';
import type { FridgeItem } from '@/types/models';
import { getMMKV, setMMKV, STORAGE_KEYS } from '@/utils/storage';
import { todayString } from '@/utils/streak';

interface DailyProteinLog {
  date: string;
  loggedG: number;
  loggedKcal?: number;
}

// Record<'YYYY-MM-DD', proteinG> — every day we logged at least 1g
type WeeklyLog = Record<string, number>;

interface NutritionState {
  fridgeItems: FridgeItem[];
  dailyLog: DailyProteinLog;
  weeklyLog: WeeklyLog;
  hydrate: () => void;
  addFridgeItem: (item: FridgeItem) => void;
  removeFridgeItem: (id: string) => void;
  clearFridge: () => void;
  logProtein: (grams: number) => void;
  logCalories: (kcal: number) => void;
  resetDailyLogIfNewDay: () => void;
  todayProteinG: () => number;
  todayCaloriesKcal: () => number;
  // Weekly streak helpers
  nutritionStreak: () => number;
  weeklyProteinDays: () => number; // days hit in last 7
}

const emptyLog = (): DailyProteinLog => ({ date: todayString(), loggedG: 0, loggedKcal: 0 });

/** Returns the last N date strings in 'YYYY-MM-DD' format, newest first */
function lastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export const useNutritionStore = create<NutritionState>((set, get) => ({
  fridgeItems: [],
  dailyLog: emptyLog(),
  weeklyLog: {},

  hydrate: () => {
    const fridge = getMMKV<FridgeItem[]>(STORAGE_KEYS.FRIDGE_ITEMS) ?? [];
    const log = getMMKV<DailyProteinLog>(STORAGE_KEYS.NUTRITION_LOG) ?? emptyLog();
    const weekly = getMMKV<WeeklyLog>('nutrition_weekly_log') ?? {};
    const today = todayString();
    set({
      fridgeItems: fridge,
      dailyLog: log.date === today ? log : emptyLog(),
      weeklyLog: weekly,
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
    const newG = (current.date === today ? current.loggedG : 0) + grams;
    const updated: DailyProteinLog = {
      ...current,
      date: today,
      loggedG: newG,
    };
    setMMKV(STORAGE_KEYS.NUTRITION_LOG, updated);
    // Update weekly log
    const weekly = { ...get().weeklyLog, [today]: newG };
    setMMKV('nutrition_weekly_log', weekly);
    set({ dailyLog: updated, weeklyLog: weekly });
  },

  logCalories: (kcal) => {
    const today = todayString();
    const current = get().dailyLog;
    const updated: DailyProteinLog = {
      ...current,
      date: today,
      loggedKcal: (current.date === today ? (current.loggedKcal ?? 0) : 0) + kcal,
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

  todayCaloriesKcal: () => {
    const log = get().dailyLog;
    return log.date === todayString() ? (log.loggedKcal ?? 0) : 0;
  },

  nutritionStreak: () => {
    const weekly = get().weeklyLog;
    let streak = 0;
    // Walk backwards from yesterday (today is in progress)
    for (let i = 1; i <= 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      if ((weekly[dateStr] ?? 0) > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  },

  weeklyProteinDays: () => {
    const weekly = get().weeklyLog;
    const days = lastNDays(7);
    return days.filter((d) => (weekly[d] ?? 0) > 0).length;
  },
}));
