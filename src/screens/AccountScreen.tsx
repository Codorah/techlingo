import { ChevronLeft, Copy, LogOut, Mail, Trophy } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TabBar } from '@/components/ui/TabBar';
import { loadMyProfile, type MyCloudProfile, pushProfile, setLeagueOptIn } from '@/data/cloud';
import { db } from '@/db/db';
import { domainOf } from '@/lib/domains';
import { cloudEnabled, supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { useContent } from '@/lib/useContent';

const redirect = () => `${window.location.origin}/compte`;

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

export function AccountScreen() {
  const { t } = useTranslation();
  const { ready, user } = useAuth();
  const profile = useLiveQuery(() => db.profile.get('me'), []);
  const content = useContent([]);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cloud, setCloud] = useState<MyCloudProfile | null>(null);
  const [copied, setCopied] = useState(false);

  const domain = domainOf(content.manifest, profile?.primaryRole);

  // On sign-in, copy the local identity to the account (name, avatar, domain), then read it back.
  useEffect(() => {
    if (!user || !profile) return;
    let cancelled = false;
    void (async () => {
      await pushProfile(user.id, { displayName: profile.displayName, avatar: profile.avatar, domain, primaryRole: profile.primaryRole });
      const mine = await loadMyProfile(user.id);
      if (!cancelled) setCloud(mine);
    })();
    return () => { cancelled = true; };
  }, [user?.id, profile?.displayName, profile?.avatar, profile?.primaryRole, domain]); // eslint-disable-line react-hooks/exhaustive-deps

  async function google() {
    if (!supabase) return;
    setError(null);
    const { error: e } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirect() } });
    if (e) setError(t('account.googleOff'));
  }

  async function sendLink() {
    if (!supabase || busy) return;
    setBusy(true); setError(null);
    const { error: e } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: redirect() } });
    setBusy(false);
    if (e) setError(t('account.mailError')); else setSent(true);
  }

  async function toggleLeague() {
    if (!user || !cloud) return;
    const next = !cloud.league_opt_in;
    setCloud({ ...cloud, league_opt_in: next });
    if (!(await setLeagueOptIn(user.id, next))) setCloud({ ...cloud, league_opt_in: !next });
  }

  async function copyCode() {
    if (!cloud) return;
    try { await navigator.clipboard.writeText(cloud.invite_code); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked */ }
  }

  return (
    <>
      <main className="mx-auto max-w-[640px] px-5 pb-28 pt-[calc(env(safe-area-inset-top)+10px)]">
        <header className="mb-4 flex items-center gap-2">
          <Link href="/profile" aria-label={t('common.back')} className="grid h-11 w-11 place-items-center rounded-xl text-ink-2 active:bg-surface"><ChevronLeft size={26} aria-hidden /></Link>
          <h1 className="text-xl font-black">{t('account.title')}</h1>
        </header>

        {!cloudEnabled && <Card className="p-4"><p className="text-ink-2">{t('account.off')}</p></Card>}

        {cloudEnabled && !ready && <div className="skeleton h-40 rounded-2xl" aria-busy="true" />}

        {cloudEnabled && ready && !user && (
          <div className="grid gap-4">
            <img src="/illustrations/onboarding/friendly-leagues.png" alt="" width={200} height={200} className="mx-auto h-40 w-40 object-contain" />
            <p className="text-center text-lg font-bold [text-wrap:balance]">{t('account.pitch')}</p>
            <Button variant="secondary" icon={<GoogleMark />} onClick={() => void google()}>{t('account.google')}</Button>
            <div className="flex items-center gap-3 text-sm font-bold text-ink-2" aria-hidden><span className="h-0.5 flex-1 bg-line" />{t('account.or')}<span className="h-0.5 flex-1 bg-line" /></div>
            {sent ? (
              <p role="status" className="rounded-2xl bg-mint p-4 font-bold text-mint-ink">{t('account.sent', { email })}</p>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); void sendLink(); }} className="grid gap-3">
                <label className="block">
                  <span className="text-sm font-bold text-ink-2">{t('account.email')}</span>
                  <input type="email" required autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 min-h-12 w-full rounded-xl border-2 border-line bg-surface px-3.5 font-bold outline-none focus:border-[var(--accent)]" />
                </label>
                <Button type="submit" icon={<Mail size={20} aria-hidden />} disabled={busy || !/.+@.+\..+/.test(email)}>{t('account.sendLink')}</Button>
              </form>
            )}
            {error && <p role="alert" className="text-sm font-bold text-danger">{error}</p>}
            <p className="text-center text-sm text-ink-2">{t('account.privacy')}</p>
          </div>
        )}

        {cloudEnabled && user && (
          <div className="grid gap-3">
            <Card className="flex items-center gap-3 p-4">
              <Avatar id={profile?.avatar ?? 'sky'} name={profile?.displayName || 'T'} size={56} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-black">{profile?.displayName || t('home.helloAnon')}</p>
                <p className="truncate text-sm text-ink-2">{user.email}</p>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-black">{t('account.leagueTitle')}</p>
                  <p className="mt-0.5 text-sm text-ink-2">{t('account.leagueText')}</p>
                </div>
                <button type="button" role="switch" aria-checked={!!cloud?.league_opt_in} aria-label={t('account.leagueTitle')} disabled={!cloud} onClick={() => void toggleLeague()}
                  className={`relative h-8 w-14 flex-none rounded-full transition-colors ${cloud?.league_opt_in ? 'bg-[var(--accent)]' : 'bg-line'}`}>
                  <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-[left] ${cloud?.league_opt_in ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              {cloud?.league_opt_in && <Link href="/ligue" className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--accent-soft)] font-black text-[var(--accent)]"><Trophy size={18} aria-hidden />{t('account.seeLeague')}</Link>}
            </Card>

            {cloud && (
              <Card className="p-4">
                <p className="font-black">{t('account.inviteTitle')}</p>
                <p className="mt-0.5 text-sm text-ink-2">{t('account.inviteText')}</p>
                <button type="button" onClick={() => void copyCode()} className="mt-3 flex min-h-12 w-full items-center justify-between rounded-xl border-2 border-line bg-surface px-4 active:bg-mist">
                  <span className="font-mono text-xl font-black tracking-[0.2em]">{cloud.invite_code}</span>
                  <span className="flex items-center gap-1.5 text-sm font-bold text-[var(--accent)]"><Copy size={16} aria-hidden />{copied ? t('account.copied') : t('account.copy')}</span>
                </button>
              </Card>
            )}

            <Button variant="ghost" icon={<LogOut size={20} aria-hidden />} onClick={() => void supabase?.auth.signOut()}>{t('account.signOut')}</Button>
          </div>
        )}
      </main>
      <TabBar />
    </>
  );
}
