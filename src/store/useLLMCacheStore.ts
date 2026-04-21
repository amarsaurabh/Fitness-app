import { create } from 'zustand';
import type { LLMCacheEntry } from '@/types/models';
import { getMMKV, setMMKV, STORAGE_KEYS } from '@/utils/storage';

type CacheMap = Record<string, LLMCacheEntry>;

interface LLMCacheState {
  cache: CacheMap;
  hydrate: () => void;
  get: (key: string) => string | null;
  set: (key: string, response: string, ttlMs: number) => void;
  isValid: (key: string) => boolean;
  invalidate: (key: string) => void;
  // Groq call budget tracking
  groqCallsToday: () => number;
  incrementGroqCalls: () => void;
  isGroqBudgetAvailable: (limit: number) => boolean;
}

export const useLLMCacheStore = create<LLMCacheState>((set, get) => ({
  cache: {},

  hydrate: () => {
    const stored = getMMKV<CacheMap>(STORAGE_KEYS.LLM_CACHE) ?? {};
    set({ cache: stored });
  },

  get: (key) => {
    const entry = get().cache[key];
    if (!entry) return null;
    if (Date.now() > entry.generatedAt + entry.ttlMs) return null; // expired
    return entry.response;
  },

  set: (key, response, ttlMs) => {
    const entry: LLMCacheEntry = {
      key,
      response,
      generatedAt: Date.now(),
      ttlMs,
    };
    const updated = { ...get().cache, [key]: entry };
    setMMKV(STORAGE_KEYS.LLM_CACHE, updated);
    set({ cache: updated });
  },

  isValid: (key) => {
    const entry = get().cache[key];
    if (!entry) return false;
    return Date.now() <= entry.generatedAt + entry.ttlMs;
  },

  invalidate: (key) => {
    const updated = { ...get().cache };
    delete updated[key];
    setMMKV(STORAGE_KEYS.LLM_CACHE, updated);
    set({ cache: updated });
  },

  groqCallsToday: () => {
    const date = getMMKV<string>(STORAGE_KEYS.GROQ_CALLS_DATE);
    const today = new Date().toISOString().split('T')[0];
    if (date !== today) return 0;
    return getMMKV<number>(STORAGE_KEYS.GROQ_CALLS_TODAY) ?? 0;
  },

  incrementGroqCalls: () => {
    const today = new Date().toISOString().split('T')[0];
    const current = get().groqCallsToday();
    setMMKV(STORAGE_KEYS.GROQ_CALLS_DATE, today);
    setMMKV(STORAGE_KEYS.GROQ_CALLS_TODAY, current + 1);
  },

  isGroqBudgetAvailable: (limit) => {
    return get().groqCallsToday() < limit;
  },
}));
