import { create } from 'zustand';
import type { UserProfile } from '@/types/models';
import { getAsync, setAsync, STORAGE_KEYS } from '@/utils/storage';
import {
  PROTEIN_MULTIPLIER,
  ACTIVITY_MULTIPLIER,
} from '@/utils/constants';
import { calculateDailyProtein, calculateTDEE, calculateBMR } from '@/utils/calories';

interface UserState {
  profile: UserProfile | null;
  hydrated: boolean;
  setProfile: (profile: UserProfile) => Promise<void>;
  updateProfile: (partial: Partial<UserProfile>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  hydrate: () => Promise<void>;
  dailyProteinGoal: () => number;
  dailyCalorieGoal: () => number;
}

const DEFAULT_PROFILE: Omit<UserProfile, 'id' | 'name' | 'createdAt'> = {
  weightKg: 70,
  heightCm: 170,
  foodCulture: 'global',
  goal: 'stay_active',
  activityLevel: 'moderate',
  notificationsEnabled: false,
  proteinReminderTime: '13:00',
  onboardingComplete: false,
  difficultyBias: 0,
};

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  hydrated: false,

  hydrate: async () => {
    const stored = await getAsync<UserProfile>(STORAGE_KEYS.USER_PROFILE);
    set({ profile: stored ?? null, hydrated: true });
  },

  setProfile: async (profile) => {
    await setAsync(STORAGE_KEYS.USER_PROFILE, profile);
    set({ profile });
  },

  updateProfile: async (partial) => {
    const current = get().profile;
    if (!current) return;
    const updated = { ...current, ...partial };
    await setAsync(STORAGE_KEYS.USER_PROFILE, updated);
    set({ profile: updated });
  },

  completeOnboarding: async () => {
    const current = get().profile;
    if (!current) return;
    const updated = { ...current, onboardingComplete: true };
    await setAsync(STORAGE_KEYS.USER_PROFILE, updated);
    set({ profile: updated });
  },

  dailyProteinGoal: () => {
    const profile = get().profile;
    if (!profile) return 150;
    const multiplier = PROTEIN_MULTIPLIER[profile.goal] ?? 1.6;
    return calculateDailyProtein(profile.weightKg, multiplier);
  },

  dailyCalorieGoal: () => {
    const profile = get().profile;
    if (!profile) return 2000;
    // Approximate age as 30 if not stored
    const bmr = calculateBMR(profile.weightKg, profile.heightCm, 30, true);
    const multiplier = ACTIVITY_MULTIPLIER[profile.activityLevel] ?? 1.55;
    return calculateTDEE(bmr, multiplier);
  },
}));

export function buildNewProfile(
  id: string,
  partial: Partial<UserProfile>,
): UserProfile {
  return {
    ...DEFAULT_PROFILE,
    id,
    name: '',
    createdAt: new Date().toISOString(),
    ...partial,
  };
}
