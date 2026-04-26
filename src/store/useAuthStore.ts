import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from '@/services/supabase/client';
import { syncLocalDataToSupabase } from '@/services/supabase/sync';

interface AuthState {
  user: User | null;
  isAnonymous: boolean;
  initialized: boolean;
  initAuth(): Promise<void>;
  signUpWithEmail(email: string, password: string): Promise<string | null>;
  signInWithGoogle(): Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAnonymous: false,
  initialized: true,

  initAuth: async () => {
    const sb = getSupabase();
    if (!sb) return;

    const { data: { session } } = await sb.auth.getSession();

    if (session?.user) {
      set({
        user: session.user,
        isAnonymous: session.user.is_anonymous ?? false,
        initialized: true,
      });
    } else {
      const { data, error } = await sb.auth.signInAnonymously();
      if (!error && data.user) {
        set({ user: data.user, isAnonymous: true, initialized: true });
      }
    }

    sb.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      set({ user, isAnonymous: user?.is_anonymous ?? false });
    });
  },

  signUpWithEmail: async (email, password) => {
    const sb = getSupabase();
    if (!sb) return 'Supabase not available.';
    const { data, error } = await sb.auth.signUp({ email, password });
    if (error) return error.message;
    if (data.user) {
      set({ user: data.user, isAnonymous: false });
      await syncLocalDataToSupabase(data.user.id);
    }
    return null;
  },

  signInWithGoogle: async () => {
    const sb = getSupabase();
    if (!sb) return;
    const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
    await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
  },
}));
