import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase/client';
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
  initialized: false,

  initAuth: async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      set({
        user: session.user,
        isAnonymous: session.user.is_anonymous ?? false,
        initialized: true,
      });
    } else {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (!error && data.user) {
        set({ user: data.user, isAnonymous: true, initialized: true });
      } else {
        set({ initialized: true });
      }
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      set({ user, isAnonymous: user?.is_anonymous ?? false });
    });
  },

  signUpWithEmail: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return error.message;
    if (data.user) {
      set({ user: data.user, isAnonymous: false });
      await syncLocalDataToSupabase(data.user.id);
    }
    return null;
  },

  signInWithGoogle: async () => {
    const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
  },
}));
