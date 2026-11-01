import { useLiveQuery } from 'dexie-react-hooks';
import { Award, BookOpen, CalendarCheck, ChevronRight, Database, Flame, HelpCircle, Lock, Map as MapIcon, Settings, Star, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { TabBar } from '@/components/ui/TabBar';
import { lastBackupAt } from '@/data/backup';
import { usePathProgress } from '@/data/path';
import { db } from '@/db/db';
import { type BadgeTier, computeLevel, type EvaluatedBadge, evaluateBadges } from '@/learning/badges';
import { displayedStreak, localDay } from '@/learning/streak';
import { domainOf } from '@/lib/domains';
import { useContent } from '@/lib/useContent';
import { accentStyle } from '@/screens/path/ThemeScreen';

const TIER_LOOK: Record<BadgeTier, string> = {
  locked: 'border-line bg-mist text-ink-2 opacity-75',
  bronze: 'border-[#D97706]/40 bg-[#FEF3C7] text-[#92400E]',
  silver: 'border-sky/50 bg-mist text-[var(--accent)]',
  gold: 'border-gold bg-sun text-sun-ink shadow-[0_3px_0_var(--color-gold-press)]'
};

export function ProfileScreen() {
  const { t } = useTranslation();
  const profile = useLiveQuery(() => db.profile.get('me'));
  const words = useLiveQuery(() => db.userTerms.filter((u) => !!u.card).toArray(), [], []);
  const sessions = useLiveQuery(() => db.lessonSessions.filter((l) => !!l.completedAt).toArray(), [], []);
  const spins = useLiveQuery(() => db.spins.toArray(), [], []);
  const speaking = useLiveQuery(() => db.speakingAttempts.count(), [], 0);
  const reviews = useLiveQuery(() => db.reviewLog.count(), [], 0);
  const drafts = useLiveQuery(() => db.answerDrafts.toArray(), [], []);
  const pathProgress = usePathProgress();
  const content = useContent([]);
  const [hasBackup, setHasBackup] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<EvaluatedBadge | null>(null);

  useEffect(() => { void lastBackupAt(db).then((d) => setHasBackup(!!d)); }, []);

  if (!profile) return null;
  const today = localDay();
  const domain = domainOf(content.manifest, profile.primaryRole);
  const domainName = content.manifest?.domains?.find((d) => d.id === domain)?.name_fr ?? '';
  const roleNames = [profile.primaryRole, ...profile.secondaryRoles].map((id) => content.manifest?.roles.find((r) => r.id === id)?.name_fr ?? id);
  const mastered = words.filter((w) => w.state === 'mastered').length;
  const favorites = words.filter((w) => w.favorite).length;
  const streak = displayedStreak(profile, today);
  const lvl = computeLevel(profile.xp);

  // Last 7 local days activity + XP chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86_400_000);
    const dayStr = localDay(d);
    const label = d.toLocaleDateString('fr-FR', { weekday: 'narrow' });
    const xpDay = sessions
      .filter((s) => s.completedAt && localDay(new Date(s.completedAt)) === dayStr)
      .reduce((sum, s) => sum + (s.xpEarned || 0), 0);
    return { dayStr, label, xp: xpDay, active: xpDay > 0 };
  });
  const activeDaysWeek = last7Days.filter((d) => d.active).length;
  const maxDayXp = Math.max(30, ...last7Days.map((d) => d.xp));

  const pathKeys = Object.keys(pathProgress);
  const recallsDone = pathKeys.filter((k) => k.startsWith('rap:')).length;
  const interviewsDone = drafts.filter((d) => d.checklist?.practiced).length + pathKeys.filter((k) => k.startsWith('itw:')).length;
  const perfectLessons = sessions.filter((s) => (s.score ?? 0) >= 1).length;
  const pitchSaved = drafts.some((d) => d.id === 'pitch' && d.text.trim().length > 10);

  const badges = evaluateBadges({
    xp: profile.xp,
    bestStreak: Math.max(profile.bestStreak, streak),
    wordsLearned: words.length,
    wordsMastered: mastered,
    favoritesCount: favorites,
    courseNodesDone: pathKeys.length,
    recallsDone,
    interviewsDone,
    perfectLessons,
    spinsCount: spins.length,
    speakingCount: speaking,
    reviewsCount: reviews,
    activeDaysWeek,
    pitchSaved,
    secondaryRolesCount: profile.secondaryRoles.length,
    hasBackup
  });
  const unlockedCount = badges.filter((b) => b.tier !== 'locked').length;

  const stats = [
    { Icon: Flame, color: 'text-flame-ink', value: streak, sub: t('profile.bestStreak', { count: Math.max(profile.bestStreak, streak) }), label: t('profile.stats.streak') },
    { Icon: Zap, color: 'text-gold-ink', value: profile.xp, sub: `${t('profile.levelTitle', { level: lvl.level })} · ${t(`badges.ranks.${lvl.titleKey}`)}`, label: t('profile.stats.xp') },
    { Icon: BookOpen, color: 'text-[var(--accent)]', value: words.length, sub: `${favorites} ★`, label: t('profile.stats.words') },
    { Icon: Star, color: 'text-mint-ink', value: mastered, sub: `${words.length ? Math.round((mastered / words.length) * 100) : 0} %`, label: t('profile.stats.mastered') }
  ];

  return (
    <>
      <main style={accentStyle(domain)} className="mx-auto max-w-[680px] px-5 pb-28 pt-[calc(env(safe-area-inset-top)+14px)]">
        <header className="flex items-center justify-between gap-3">
          <h1 className="text-[1.75rem] font-black">{t('profile.title')}</h1>
          <Link href="/settings" aria-label={t('settings.title')}
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border-2 border-line bg-surface px-3.5 text-sm font-extrabold text-ink shadow-[0_3px_0_var(--color-line)] active:translate-y-0.5 active:shadow-none">
            <Settings size={18} className="text-[var(--accent)]" aria-hidden />{t('settings.title')}
          </Link>
        </header>

        <section className="relative mt-4 overflow-hidden rounded-[var(--radius-card)] bg-[var(--accent)] p-5 text-on-ocean shadow-[0_5px_0_var(--accent-press)]">
          <div className="flex items-center gap-4">
            <Avatar id={profile.avatar} name={profile.displayName || 'T'} size={68} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-xl font-black">{profile.displayName || t('home.helloAnon')}</p>
                {profile.level && <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-black">{profile.level}</span>}
              </div>
              <p className="mt-0.5 truncate text-sm opacity-90">{domainName} · {roleNames.join(' · ')}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider opacity-90">
                {t('profile.levelTitle', { level: lvl.level })} — {t(`badges.ranks.${lvl.titleKey}`)}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs font-bold opacity-90">
              <span>{profile.xp} XP</span>
              <span>{t('profile.nextLevel', { xp: lvl.nextLevelXp - profile.xp, level: lvl.level + 1 })}</span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/25" role="progressbar"
              aria-valuemin={lvl.levelFloorXp} aria-valuemax={lvl.nextLevelXp} aria-valuenow={profile.xp} aria-label={t('profile.level')}>
              <div className="h-full rounded-full bg-white transition-[width] duration-700" style={{ width: `${Math.max(5, Math.round(lvl.progressRatio * 100))}%` }} />
            </div>
          </div>
        </section>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          {stats.map(({ Icon, color, value, label, sub }) => (
            <Card key={label} className="p-4">
              <div className="flex items-center justify-between">
                <Icon size={22} className={color} aria-hidden />
                <span className="text-xs font-bold text-ink-2">{sub}</span>
              </div>
              <p className="mt-2 font-title text-2xl font-black">{value}</p>
              <p className="text-sm font-semibold text-ink-2">{label}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-base font-extrabold">
              <CalendarCheck size={20} className="text-mint-strong" aria-hidden />
              {t('profile.weekActivity')}
            </h2>
            <span className="text-xs font-bold text-ink-2">
              {t('home.week.goal', { count: activeDaysWeek, goal: 4 })}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-7 items-end gap-2 pt-2">
            {last7Days.map((d) => {
              const h = d.xp ? Math.max(14, Math.round((d.xp / maxDayXp) * 56)) : 8;
              return (
                <div key={d.dayStr} className="flex flex-col items-center gap-1.5">
                  <span className="text-[11px] font-bold text-ink-2">{d.xp ? `+${d.xp}` : ''}</span>
                  <div className="flex h-14 w-full items-end justify-center">
                    <span className={`w-full max-w-[28px] rounded-lg transition-all ${d.active ? 'bg-[var(--accent)]' : 'bg-line'}`} style={{ height: h }} />
                  </div>
                  <span className={`text-xs font-bold ${d.dayStr === today ? 'text-[var(--accent)]' : 'text-ink-2'}`}>{d.label}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-extrabold"><Award size={22} className="text-gold-ink" aria-hidden />{t('badges.title')}</h2>
            <span className="rounded-full bg-sun px-3 py-0.5 text-xs font-black text-sun-ink">{unlockedCount}/{badges.length}</span>
          </div>
          <p className="mt-0.5 text-sm text-ink-2">{t('badges.subtitle')}</p>

          {selectedBadge && (
            <Card className="mt-3 border-[var(--accent)]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`grid h-12 w-12 flex-none place-items-center rounded-2xl border-2 ${TIER_LOOK[selectedBadge.tier]}`}>
                    <DynamicIcon name={selectedBadge.icon} size={24} />
                  </span>
                  <div>
                    <p className="font-extrabold">{t(`badges.list.${selectedBadge.id}.title`)} · <span className="text-xs uppercase">{t(`badges.tier.${selectedBadge.tier}`)}</span></p>
                    <p className="text-sm text-ink-2">{t(`badges.list.${selectedBadge.id}.desc`)}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setSelectedBadge(null)} className="text-xs font-bold text-ink-2">{t('common.close')}</button>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.round(selectedBadge.ratio * 100)}%` }} />
                </div>
                <span className="text-xs font-black text-ink-2">{selectedBadge.current}/{selectedBadge.nextTarget}</span>
              </div>
            </Card>
          )}

          <ul className="mt-3 grid grid-cols-4 gap-2">
            {badges.map((b) => {
              const locked = b.tier === 'locked';
              return (
                <li key={b.id} className="min-w-0">
                  <button type="button" onClick={() => setSelectedBadge(selectedBadge?.id === b.id ? null : b)}
                    className={`flex h-full w-full min-w-0 flex-col items-center justify-between rounded-2xl border-2 p-2 text-center transition-transform active:scale-95 ${TIER_LOOK[b.tier]}`}>
                    <span className="relative grid h-10 w-10 flex-none place-items-center rounded-xl bg-white/70 shadow-xs">
                      <DynamicIcon name={b.icon} size={20} />
                      {locked && <Lock size={11} className="absolute -bottom-1 -right-1 rounded-full bg-surface p-0.5 text-ink-2 shadow-xs" aria-hidden />}
                    </span>
                    <span className="mt-1.5 block w-full truncate text-[11px] font-extrabold leading-tight">
                      {t(`badges.list.${b.id}.title`)}
                    </span>
                    <span className="mt-0.5 block text-[10px] font-bold opacity-80">
                      {b.current}/{b.nextTarget}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <Card className="mt-6 p-1">
          <Link href="/knowledge" className="flex min-h-14 items-center gap-3 rounded-2xl px-3">
            <MapIcon size={22} className="text-[var(--accent)]" aria-hidden />
            <span className="flex-1"><span className="block font-bold">{t('knowledge.entry')}</span><span className="block text-sm text-ink-2">{t('knowledge.entryText')}</span></span>
            <ChevronRight size={20} className="text-ink-2" aria-hidden />
          </Link>
          <div className="mx-3 h-0.5 bg-line" />
          <Link href="/settings" className="flex min-h-14 items-center gap-3 rounded-2xl px-3">
            <Settings size={22} className="text-[var(--accent)]" aria-hidden />
            <span className="flex-1"><span className="block font-bold">{t('settings.title')}</span><span className="block text-sm text-ink-2">{t('settings.subtitle')}</span></span>
            <ChevronRight size={20} className="text-ink-2" aria-hidden />
          </Link>
          <div className="mx-3 h-0.5 bg-line" />
          <Link href="/settings/data" className="flex min-h-14 items-center gap-3 rounded-2xl px-3">
            <Database size={22} className="text-[var(--accent)]" aria-hidden />
            <span className="flex-1"><span className="block font-bold">{t('profile.data')}</span><span className="block text-sm text-ink-2">{t('profile.dataText')}</span></span>
            <ChevronRight size={20} className="text-ink-2" aria-hidden />
          </Link>
          <div className="mx-3 h-0.5 bg-line" />
          <Link href="/settings/help" className="flex min-h-14 items-center gap-3 rounded-2xl px-3">
            <HelpCircle size={22} className="text-[var(--accent)]" aria-hidden />
            <span className="flex-1"><span className="block font-bold">{t('help.title')}</span><span className="block text-sm text-ink-2">{t('settings.helpText')}</span></span>
            <ChevronRight size={20} className="text-ink-2" aria-hidden />
          </Link>
        </Card>
      </main>
      <TabBar />
    </>
  );
}
