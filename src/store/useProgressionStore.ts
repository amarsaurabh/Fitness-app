import { create } from 'zustand';
import { getMMKV, setMMKV } from '@/utils/storage';

export type Block = 1 | 2 | 3 | 4 | 5;

const SEEN_UNLOCKS_KEY = 'seen_block_unlocks';

export function computeBlock(sessionCount: number, streakLongest: number): Block {
  if (sessionCount >= 30 || streakLongest >= 21) return 5;
  if (sessionCount >= 20) return 4;
  if (sessionCount >= 10) return 3;
  if (sessionCount >= 3) return 2;
  return 1;
}

export const BLOCK_REQUIREMENTS: Record<Block, string> = {
  1: '',
  2: '3 sessions',
  3: '10 sessions',
  4: '20 sessions',
  5: '30 sessions',
};

interface ProgressionState {
  seenUnlocks: Block[];
  hydrate(): void;
  markUnlockSeen(block: Block): void;
  hasSeenUnlock(block: Block): boolean;
}

export const useProgressionStore = create<ProgressionState>((set, get) => ({
  seenUnlocks: [],

  hydrate: () => {
    const stored = getMMKV<Block[]>(SEEN_UNLOCKS_KEY);
    set({ seenUnlocks: stored ?? [] });
  },

  markUnlockSeen: (block) => {
    const current = get().seenUnlocks;
    if (current.includes(block)) return;
    const updated = [...current, block];
    setMMKV(SEEN_UNLOCKS_KEY, updated);
    set({ seenUnlocks: updated });
  },

  hasSeenUnlock: (block) => get().seenUnlocks.includes(block),
}));
