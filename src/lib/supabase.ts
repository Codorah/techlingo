// Optional cloud account. Without the two public env vars (or without an account) the app is
// fully local, exactly as before. The publishable key is meant for browsers: every table is
// protected by row level security (see supabase/migrations).
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const supabase: SupabaseClient | null = url && key
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' } })
  : null;

export const cloudEnabled = supabase !== null;
