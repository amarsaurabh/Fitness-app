import { MMKV } from 'react-native-mmkv';
import AsyncStorage from '@react-native-async-storage/async-storage';

// MMKV for hot-path reads (streak, sessions, LLM cache)
// Note: requires Expo Dev Client — does not work in Expo Go
export const mmkv = new MMKV({ id: 'fytnu-store' });

export function getMMKV<T>(key: string): T | undefined {
  const raw = mmkv.getString(key);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export function setMMKV<T>(key: string, value: T): void {
  mmkv.set(key, JSON.stringify(value));
}

export function deleteMMKV(key: string): void {
  mmkv.delete(key);
}

// AsyncStorage for user profile (written rarely, larger payload)
export async function getAsync<T>(key: string): Promise<T | undefined> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return undefined;
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export async function setAsync<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function deleteAsync(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

// Typed storage keys
export const STORAGE_KEYS = {
  USER_PROFILE: 'user_profile',
  STREAK: 'streak',
  SESSIONS: 'workout_sessions',
  NUTRITION_LOG: 'nutrition_log',
  FRIDGE_ITEMS: 'fridge_items',
  LLM_CACHE: 'llm_cache',
  GROQ_CALLS_TODAY: 'groq_calls_today',
  GROQ_CALLS_DATE: 'groq_calls_date',
  SOCIAL_BENCHMARK_CACHE: 'social_benchmark_cache',
  SOCIAL_BENCHMARK_DATE: 'social_benchmark_date',
  CUSTOM_WORKOUTS: 'custom_workouts',
  BODY_WEIGHT: 'body_weight_log',
} as const;
