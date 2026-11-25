import { ChevronLeft, UserPlus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TabBar } from '@/components/ui/TabBar';
import { addFriend, type FriendRow, loadFriends, loadLeague, loadMyProfile, type LeagueRow } from '@/data/cloud';
import { cloudEnabled } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';

type State = { kind: 'loading' } | { kind: 'off' } | { kind: 'ready'; rows: LeagueRow[]; friends: FriendRow[] } | { kind: 'error' };

function Empty({ image, title, text, cta, href }: { image: string; title: string; text: string; cta: string; href: string }) {
  return (
    <div className="grid justify-items-center gap-3 pt-6 text-center">
      <img src={`/illustrations/empty/${image}.png`} alt="" width={220} height={220} className="h-48 w-48 object-contain" />
      <h2 className="text-xl font-black">{title}</h2>
      <p className="max-w-[34ch] text-ink-2">{text}</p>
      <Link href={href} className="mt-1 inline-flex min-h-12 items-center rounded-2xl bg-[var(--accent)] px-6 font-black text-on-ocean shadow-[0_4px_0_var(--accent-press)]">{cta}</Link>
    </div>
  );
}

export function LeagueScreen() {
  const { t } = useTranslation();
  const { ready, user } = useAuth();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [code, setCode] = useState('');
  const [friendError, setFriendError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const mine = await loadMyProfile(user.id);
      if (!mine?.league_opt_in) { setState({ kind: 'off' }); return; }
      const [rows, friends] = await Promise.all([loadLeague(), loadFriends()]);
      setState({ kind: 'ready', rows, friends });
    } catch { setState({ kind: 'error' }); }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  async function submitFriend() {
    setFriendError(null);
    const err = await addFriend(code);
    if (err) { setFriendError(t(`league.friendError.${err}`)); return; }
    setCode('');
    void load();
  }

  return (
    <>
      <main className="mx-auto max-w-[640px] px-5 pb-28 pt-[calc(env(safe-area-inset-top)+10px)]">
        <header className="mb-4 flex items-center gap-2">
          <Link href="/profile" aria-label={t('common.back')} className="grid h-11 w-11 place-items-center rounded-xl text-ink-2 active:bg-surface"><ChevronLeft size={26} aria-hidden /></Link>
          <h1 className="text-xl font-black">{t('league.title')}</h1>
        </header>

        {(!cloudEnabled || (ready && !user)) && <Empty image="no-league" title={t('league.needAccountTitle')} text={t('league.needAccountText')} cta={t('league.toAccount')} href="/compte" />}
        {cloudEnabled && ready && user && state.kind === 'loading' && <div className="skeleton h-64 rounded-2xl" aria-busy="true" />}
        {state.kind === 'off' && <Empty image="no-league" title={t('league.offTitle')} text={t('league.offText')} cta={t('league.enable')} href="/compte" />}
        {state.kind === 'error' && <Empty image="offline" title={t('league.errorTitle')} text={t('league.errorText')} cta={t('league.retry')} href="/ligue" />}

        {state.kind === 'ready' && (
          <div className="grid gap-4">
            <div className="flex items-center gap-4">
              <img src="/illustrations/leagues/league-1-bronze.png" alt="" width={96} height={96} className="h-20 w-20 flex-none object-contain" />
              <div>
                <p className="text-sm font-black uppercase tracking-wider text-[var(--accent)]">{t('league.tier1')}</p>
                <p className="text-ink-2">{t('league.weekHint')}</p>
              </div>
            </div>

            <Card className="p-1">
              <ol>
                {state.rows.map((r, i) => (
                  <li key={r.user_id} className={`flex min-h-14 items-center gap-3 rounded-2xl px-3 py-2 ${r.is_me ? 'bg-[var(--accent-soft)]' : ''} ${i > 0 ? 'border-t-2 border-line' : ''}`}>
                    <span className="w-6 text-center font-title font-black tabular-nums text-ink-2">{r.rank}</span>
                    <Avatar id={r.avatar} name={r.display_name} size={40} />
                    <span className="min-w-0 flex-1 truncate font-bold">{r.display_name}{r.is_me ? ` (${t('league.you')})` : ''}</span>
                    <span className="font-title font-black tabular-nums">{r.week_xp} <span className="text-xs font-bold text-ink-2">XP</span></span>
                  </li>
                ))}
              </ol>
            </Card>

            <section aria-labelledby="friends-h">
              <h2 id="friends-h" className="mb-2 text-sm font-black">{t('league.friends')}</h2>
              {state.friends.length > 0 && (
                <Card className="mb-3 p-1">
                  <ul>
                    {state.friends.map((f, i) => (
                      <li key={f.user_id} className={`flex min-h-14 items-center gap-3 px-3 py-2 ${i > 0 ? 'border-t-2 border-line' : ''}`}>
                        <Avatar id={f.avatar} name={f.display_name} size={40} />
                        <span className="min-w-0 flex-1 truncate font-bold">{f.display_name}</span>
                        <span className="font-title font-black tabular-nums">{f.week_xp} <span className="text-xs font-bold text-ink-2">XP</span></span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
              <form onSubmit={(e) => { e.preventDefault(); void submitFriend(); }} className="flex gap-2">
                <label className="min-w-0 flex-1">
                  <span className="sr-only">{t('league.codeLabel')}</span>
                  <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={8} placeholder={t('league.codePlaceholder')} autoCapitalize="characters" autoComplete="off"
                    className="min-h-12 w-full rounded-xl border-2 border-line bg-surface px-3.5 font-mono font-black uppercase tracking-widest outline-none focus:border-[var(--accent)]" />
                </label>
                <Button type="submit" block={false} icon={<UserPlus size={20} aria-hidden />} disabled={code.trim().length < 4}>{t('league.add')}</Button>
              </form>
              {friendError && <p role="alert" className="mt-2 text-sm font-bold text-danger">{friendError}</p>}
            </section>
          </div>
        )}
      </main>
      <TabBar />
    </>
  );
}
