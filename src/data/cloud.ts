// Everything that talks to Supabase. All calls are best effort: the app never depends on them,
// and XP is only ever *requested* here: the server computes and caps it (record_xp).
import { supabase } from '@/lib/supabase';

export type CloudKind = 'lesson' | 'course' | 'recap' | 'practice' | 'review';

/** Reports a finished step so the server can award league XP. Silent when signed out or offline. */
export async function syncXp(nodeId: string, kind: CloudKind, ratio: number, firstTime: boolean): Promise<void> {
  if (!supabase) return;
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return;
    await supabase.rpc('record_xp', {
      p_node_id: nodeId.slice(0, 120), p_kind: kind,
      p_accuracy: Math.max(0, Math.min(100, Math.round(ratio * 100))), p_first_time: firstTime
    });
  } catch { /* offline or signed out: local progress is unaffected */ }
}

export type CloudProfile = { displayName: string; avatar: string; domain: string; primaryRole: string | null };

export async function pushProfile(userId: string, p: CloudProfile): Promise<boolean> {
  if (!supabase) return false;
  const name = p.displayName.trim().slice(0, 24);
  const { error } = await supabase.from('profiles').update({
    ...(name.length >= 2 ? { display_name: name } : {}),
    avatar: p.avatar.slice(0, 32), domain: p.domain, primary_role: p.primaryRole
  }).eq('id', userId);
  return !error;
}

export type MyCloudProfile = { display_name: string; avatar: string; league_opt_in: boolean; invite_code: string; total_xp: number };

export async function loadMyProfile(userId: string): Promise<MyCloudProfile | null> {
  if (!supabase) return null;
  const { data } = await supabase.from('profiles').select('display_name, avatar, league_opt_in, invite_code, total_xp').eq('id', userId).maybeSingle();
  return (data as MyCloudProfile | null) ?? null;
}

export async function setLeagueOptIn(userId: string, on: boolean): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('profiles').update({ league_opt_in: on }).eq('id', userId);
  return !error;
}

export type LeagueRow = { rank: number; user_id: string; display_name: string; avatar: string; week_xp: number; is_me: boolean };
export type FriendRow = { user_id: string; display_name: string; avatar: string; week_xp: number };

export async function loadLeague(): Promise<LeagueRow[]> {
  if (!supabase) return [];
  await supabase.rpc('join_league');
  const { data } = await supabase.rpc('my_league');
  return ((data as LeagueRow[] | null) ?? []).map((r) => ({ ...r, rank: Number(r.rank), week_xp: Number(r.week_xp) }));
}

export async function loadFriends(): Promise<FriendRow[]> {
  if (!supabase) return [];
  const { data } = await supabase.rpc('my_friends');
  return ((data as FriendRow[] | null) ?? []).map((r) => ({ ...r, week_xp: Number(r.week_xp) }));
}

/** Returns an error key for the UI, or null on success. */
export async function addFriend(code: string): Promise<'unknown' | 'self' | 'failed' | null> {
  if (!supabase) return 'failed';
  const { error } = await supabase.rpc('add_friend', { p_code: code });
  if (!error) return null;
  if (error.message.includes('inconnu')) return 'unknown';
  if (error.message.includes('tien')) return 'self';
  return 'failed';
}
