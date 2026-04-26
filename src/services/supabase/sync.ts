import { supabase } from './client';
import { getMMKV, getAsync, STORAGE_KEYS } from '@/utils/storage';

// Supabase table: user_sync (user_id uuid, key text, value jsonb, updated_at timestamptz)
// Primary key: (user_id, key)
// RLS: auth.uid() = user_id

type SyncRow = {
  user_id: string;
  key: string;
  value: unknown;
  updated_at: string;
};

export async function syncLocalDataToSupabase(userId: string): Promise<void> {
  const now = new Date().toISOString();
  const rows: SyncRow[] = [];

  for (const [, storageKey] of Object.entries(STORAGE_KEYS)) {
    let value: unknown;

    if (storageKey === STORAGE_KEYS.USER_PROFILE) {
      value = await getAsync(storageKey);
    } else {
      value = getMMKV(storageKey);
    }

    if (value !== undefined && value !== null) {
      rows.push({ user_id: userId, key: storageKey, value, updated_at: now });
    }
  }

  if (rows.length === 0) return;

  await supabase
    .from('user_sync')
    .upsert(rows, { onConflict: 'user_id,key' });
}
