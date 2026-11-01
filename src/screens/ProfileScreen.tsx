import { useLiveQuery } from 'dexie-react-hooks';
import {
  Award,
  BookOpen,
  CalendarCheck,
  Check,
  ChevronRight,
  Database,
  Flame,
  HelpCircle,
  Lock,
  Map as MapIcon,
  Settings,
  Sparkles,
  Star,
  X,
  Zap
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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

const TIER_BADGE_STYLE: Record<BadgeTier, { border: string; bg: string; text: string; iconBg: string }> = {
  locked: {
    border: 'border-line',
    bg: 'bg-surface',
    text: 'text-ink-2',
    iconBg: 'bg-mist text-ink-2'
  },
  bronze: {
    border: 'border-[#D97706]/40',
    bg: 'bg-[#FFFBEB]',
    text: 'text-[#92400E]',
    iconBg: 'bg-[#FEF3C7] text-[#B45309]'
  },
  silver: {
    border: 'border-sky/50',
    bg: 'bg-mist',
    text: 'text-[var(--accent)]',
    iconBg: 'bg-sky/20 text-[var(--accent)]'
  },
  gold: {
    border: 'border-gold',
    bg: 'bg-sun/40',
    text: 'text-gold-ink',
    iconBg: 'bg-gold text-white shadow-xs'
  }
};

type BadgeFilter = 'all' | 'unlocked' | 'in_progress';

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
  const [badgeFilter, setBadgeFilter] = useState<BadgeFilter>('all');

  useEffect(() => {
    void lastBackupAt(db).then((d) => setHasBackup(!!d));
  }, []);

  const today = localDay();
  const domain = domainOf(content.manifest, profile?.primaryRole);
  const domainName = content.manifest?.domains?.find((d) => d.id === domain)?.name_fr ?? '';
  const roleNames = [profile?.primaryRole, ...(profile?.secondaryRoles ?? [])]
    .filter(Boolean)
    .map((id) => content.manifest?.roles.find((r) => r.id === id)?.name_fr ?? id);

  const mastered = words.filter((w) => w.state === 'mastered').length;
  const favorites = words.filter((w) => w.favorite).length;
  const streak = profile ? displayedStreak(profile, today) : 0;
  const lvl = computeLevel(profile?.xp ?? 0);

  // Last 7 local days activity + XP chart
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(Date.now() - (6 - i) * 86_400_000);
      const dayStr = localDay(d);
      const label = d.toLocaleDateString('fr-FR', { weekday: 'narrow' });
      const xpDay = sessions
        .filter((s) => s.completedAt && localDay(new Date(s.completedAt)) === dayStr)
        .reduce((sum, s) => sum + (s.xpEarned || 0), 0);
      return { dayStr, label, xp: xpDay, active: xpDay > 0 };
    });
  }, [sessions]);

  const activeDaysWeek = last7Days.filter((d) => d.active).length;
  const maxDayXp = Math.max(30, ...last7Days.map((d) => d.xp));

  const pathKeys = Object.keys(pathProgress);
  const recallsDone = pathKeys.filter((k) => k.startsWith('rap:')).length;
  const interviewsDone = drafts.filter((d) => d.checklist?.practiced).length + pathKeys.filter((k) => k.startsWith('itw:')).length;
  const perfectLessons = sessions.filter((s) => (s.score ?? 0) >= 1).length;
  const pitchSaved = drafts.some((d) => d.id === 'pitch' && d.text.trim().length > 10);

  const allBadges = useMemo(() => {
    if (!profile) return [];
    return evaluateBadges({
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
  }, [
    profile,
    streak,
    words.length,
    mastered,
    favorites,
    pathKeys.length,
    recallsDone,
    interviewsDone,
    perfectLessons,
    spins.length,
    speaking,
    reviews,
    activeDaysWeek,
    pitchSaved,
    hasBackup
  ]);

  const unlockedCount = allBadges.filter((b) => b.tier !== 'locked').length;

  const filteredBadges = useMemo(() => {
    if (badgeFilter === 'unlocked') return allBadges.filter((b) => b.tier !== 'locked');
    if (badgeFilter === 'in_progress') return allBadges.filter((b) => b.tier === 'locked');
    return allBadges;
  }, [allBadges, badgeFilter]);

  if (!profile) return null;

  const stats = [
    {
      Icon: Flame,
      color: 'text-flame-ink',
      bg: 'bg-flame-soft/80',
      value: streak,
      sub: t('profile.bestStreak', { count: Math.max(profile.bestStreak, streak) }),
      label: t('profile.stats.streak')
    },
    {
      Icon: Zap,
      color: 'text-gold-ink',
      bg: 'bg-sun/80',
      value: profile.xp,
      sub: `${t('profile.levelTitle', { level: lvl.level })} · ${t(`badges.ranks.${lvl.titleKey}`)}`,
      label: t('profile.stats.xp')
    },
    {
      Icon: BookOpen,
      color: 'text-[var(--accent)]',
      bg: 'bg-[var(--accent-soft)]',
      value: words.length,
      sub: `${favorites} favoris`,
      label: t('profile.stats.words')
    },
    {
      Icon: Star,
      color: 'text-mint-ink',
      bg: 'bg-mint/80',
      value: mastered,
      sub: `${words.length ? Math.round((mastered / words.length) * 100) : 0} % rétention`,
      label: t('profile.stats.mastered')
    }
  ];

  return (
    <>
      <main style={accentStyle(domain)} className="mx-auto max-w-[680px] px-5 pb-28 pt-[calc(env(safe-area-inset-top)+14px)]">
        {/* Screen Header */}
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-ink tracking-tight">{t('profile.title')}</h1>
            <p className="text-xs text-ink-2 font-medium">Tes progrès, ton niveau et tes récompenses</p>
          </div>
          <Link
            href="/settings"
            aria-label={t('settings.title')}
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border-2 border-line bg-surface px-3.5 text-xs font-black text-ink shadow-[0_3px_0_var(--color-line)] transition-transform active:translate-y-0.5 active:shadow-none hover:bg-mist"
          >
            <Settings size={18} className="text-[var(--accent)]" aria-hidden />
            <span>{t('settings.title')}</span>
          </Link>
        </header>

        {/* Hero Card: Level, Avatar & Progression */}
        <section className="relative mt-4 overflow-hidden rounded-3xl bg-[var(--accent)] p-5 text-on-ocean shadow-[0_6px_0_var(--accent-press)] sm:p-6">
          <svg aria-hidden className="pointer-events-none absolute -bottom-12 -right-8 h-48 w-48 opacity-15" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="6 6" />
          </svg>

          <div className="relative flex items-center gap-4">
            <div className="relative flex-none">
              <Avatar id={profile.avatar} name={profile.displayName || 'T'} size={68} />
              <Link
                href="/settings"
                className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-white text-ink shadow-sm"
                title="Modifier l'avatar"
              >
                <Settings size={13} className="text-[var(--accent)]" />
              </Link>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-xl font-black">{profile.displayName || t('home.helloAnon')}</p>
                {profile.level && (
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-black tracking-wide">
                    {profile.level}
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-xs font-medium opacity-90">
                {domainName} · {roleNames.join(' · ')}
              </p>

              {/* Professional Rank pill */}
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-0.5 text-xs font-black">
                <Sparkles size={13} className="text-sun" aria-hidden />
                <span>
                  {t('profile.levelTitle', { level: lvl.level })} — {t(`badges.ranks.${lvl.titleKey}`)}
                </span>
              </div>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="relative mt-5 pt-3 border-t border-white/20">
            <div className="flex justify-between text-xs font-bold opacity-90">
              <span>{profile.xp} XP acquis</span>
              <span>{t('profile.nextLevel', { xp: lvl.nextLevelXp - profile.xp, level: lvl.level + 1 })}</span>
            </div>
            <div
              className="mt-2 h-3 overflow-hidden rounded-full bg-black/20 p-0.5"
              role="progressbar"
              aria-valuemin={lvl.levelFloorXp}
              aria-valuemax={lvl.nextLevelXp}
              aria-valuenow={profile.xp}
              aria-label={t('profile.level')}
            >
              <div
                className="h-full rounded-full bg-white shadow-xs transition-[width] duration-700"
                style={{ width: `${Math.max(5, Math.round(lvl.progressRatio * 100))}%` }}
              />
            </div>
          </div>
        </section>

        {/* Key Stats Grid */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          {stats.map(({ Icon, color, bg, value, label, sub }) => (
            <Card key={label} className="p-4 shadow-[0_3px_0_var(--color-line)]">
              <div className="flex items-center justify-between">
                <span className={`grid h-10 w-10 place-items-center rounded-2xl ${bg}`}>
                  <Icon size={20} className={color} aria-hidden />
                </span>
                <span className="text-[11px] font-bold text-ink-2 text-right">{sub}</span>
              </div>
              <p className="mt-2 font-title text-2xl font-black text-ink">{value}</p>
              <p className="text-xs font-bold text-ink-2">{label}</p>
            </Card>
          ))}
        </div>

        {/* Weekly Activity Card */}
        <Card className="mt-5 p-4 shadow-[0_3px_0_var(--color-line)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-black text-ink">
              <CalendarCheck size={18} className="text-mint-strong" aria-hidden />
              {t('profile.weekActivity', 'Activité de la semaine')}
            </h2>
            <span className="rounded-full bg-mint/50 px-2.5 py-0.5 text-xs font-extrabold text-mint-ink">
              {t('home.week.goal', { count: activeDaysWeek, goal: 4 })}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-7 items-end gap-2 pt-1">
            {last7Days.map((d) => {
              const h = d.xp ? Math.max(14, Math.round((d.xp / maxDayXp) * 52)) : 8;
              const isToday = d.dayStr === today;

              return (
                <div key={d.dayStr} className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-bold text-ink-2 h-3.5">
                    {d.xp ? `+${d.xp}` : ''}
                  </span>
                  <div className="flex h-14 w-full items-end justify-center">
                    <span
                      className={`w-full max-w-[28px] rounded-lg transition-all ${
                        d.active ? 'bg-[var(--accent)] shadow-xs' : 'bg-line'
                      } ${isToday ? 'ring-2 ring-[var(--accent)]/40' : ''}`}
                      style={{ height: h }}
                    />
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      isToday ? 'text-[var(--accent)] font-black' : 'text-ink-2'
                    }`}
                  >
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Badges & Achievements Section (Spacious & Responsive) */}
        <section className="mt-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-black text-ink">
                <Award size={22} className="text-gold-ink" aria-hidden />
                {t('badges.title', 'Succès & Badges')}
              </h2>
              <p className="text-xs text-ink-2 font-medium">{t('badges.subtitle')}</p>
            </div>
            <span className="rounded-full bg-sun/80 px-3 py-1 text-xs font-black text-sun-ink shadow-xs">
              {unlockedCount} / {allBadges.length} débloqués
            </span>
          </div>

          {/* Filter Pills */}
          <div className="mt-3 flex gap-2">
            {[
              { id: 'all', label: `Tous (${allBadges.length})` },
              { id: 'unlocked', label: `Obtenus (${unlockedCount})` },
              { id: 'in_progress', label: `À débloquer (${allBadges.length - unlockedCount})` },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setBadgeFilter(f.id as BadgeFilter)}
                className={`min-h-9 rounded-full px-3.5 text-xs font-black transition-transform active:scale-95 ${
                  badgeFilter === f.id
                    ? 'bg-ink text-surface shadow-xs'
                    : 'border border-line bg-surface text-ink-2 hover:bg-mist'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Selected Badge Focus Card */}
          {selectedBadge && (
            <Card className="mt-3 border-2 border-[var(--accent)] bg-surface p-4 shadow-sm animate-[pop_.2s_ease-out]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-12 w-12 flex-none place-items-center rounded-2xl border-2 ${
                      TIER_BADGE_STYLE[selectedBadge.tier].border
                    } ${TIER_BADGE_STYLE[selectedBadge.tier].iconBg}`}
                  >
                    <DynamicIcon name={selectedBadge.icon} size={24} />
                  </span>
                  <div>
                    <p className="font-black text-sm text-ink">
                      {t(`badges.list.${selectedBadge.id}.title`)} ·{' '}
                      <span className="text-xs font-bold uppercase text-[var(--accent)]">
                        {t(`badges.tier.${selectedBadge.tier}`)}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-ink-2 leading-relaxed">
                      {t(`badges.list.${selectedBadge.id}.desc`)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBadge(null)}
                  aria-label={t('common.close')}
                  className="grid h-11 w-11 place-items-center rounded-lg text-ink-2 hover:bg-mist"
                >
                  <X size={20} aria-hidden />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500"
                    style={{ width: `${Math.round(selectedBadge.ratio * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-black text-ink">
                  {selectedBadge.current} / {selectedBadge.nextTarget}
                </span>
              </div>
            </Card>
          )}

          {/* 2-Column Spacious Badge Grid: Zero cramped text, clear progress & tier status */}
          <ul className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {filteredBadges.map((b) => {
              const locked = b.tier === 'locked';
              const style = TIER_BADGE_STYLE[b.tier];

              return (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedBadge(selectedBadge?.id === b.id ? null : b)}
                    className={`flex h-full w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition-all active:scale-[0.98] ${
                      style.border
                    } ${style.bg} ${
                      selectedBadge?.id === b.id ? 'ring-2 ring-[var(--accent)]' : ''
                    } shadow-xs hover:border-[var(--accent)]/50`}
                  >
                    {/* Badge Icon Crest */}
                    <span
                      className={`relative grid h-12 w-12 flex-none place-items-center rounded-2xl border ${
                        style.border
                      } ${style.iconBg}`}
                    >
                      <DynamicIcon name={b.icon} size={22} />
                      {locked ? (
                        <Lock
                          size={12}
                          className="absolute -bottom-1 -right-1 rounded-full bg-surface p-0.5 text-ink-2 shadow-xs"
                          aria-hidden
                        />
                      ) : (
                        <Check
                          size={12}
                          className="absolute -bottom-1 -right-1 rounded-full bg-mint-strong p-0.5 text-white shadow-xs"
                          aria-hidden
                        />
                      )}
                    </span>

                    {/* Badge Info & Progress */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <p className="truncate text-xs font-black text-ink">
                          {t(`badges.list.${b.id}.title`)}
                        </p>
                        <span
                          className={`flex-none text-[10px] font-black uppercase tracking-wider ${
                            locked ? 'text-ink-2' : style.text
                          }`}
                        >
                          {t(`badges.tier.${b.tier}`)}
                        </span>
                      </div>

                      <p className="mt-0.5 line-clamp-1 text-[11px] text-ink-2">
                        {t(`badges.list.${b.id}.desc`)}
                      </p>

                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                          <div
                            className={`h-full rounded-full transition-all ${
                              locked ? 'bg-ink-2/40' : 'bg-[var(--accent)]'
                            }`}
                            style={{ width: `${Math.round(b.ratio * 100)}%` }}
                          />
                        </div>
                        <span className="flex-none text-[10px] font-extrabold text-ink-2">
                          {b.current}/{b.nextTarget}
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Grouped Hub: Knowledge, Settings, Data & Help (Fluid, Modern iOS/Android style) */}
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-ink-2">
            Compte & Préférences
          </h2>

          <div className="space-y-2.5">
            {/* Knowledge Map */}
            <Link
              href="/knowledge"
              className="flex items-center gap-3.5 rounded-2xl border-2 border-line bg-surface p-4 shadow-[0_3px_0_var(--color-line)] transition-transform active:translate-y-0.5 active:shadow-none hover:bg-mist"
            >
              <span className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-sky/20 text-ocean">
                <MapIcon size={22} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-ink">{t('knowledge.entry')}</span>
                  <span className="rounded-full bg-sky/20 px-2 py-0.5 text-[10px] font-black text-ocean">
                    Nouveau
                  </span>
                </div>
                <p className="truncate text-xs text-ink-2">{t('knowledge.entryText')}</p>
              </div>
              <ChevronRight size={18} className="text-ink-2 flex-none" aria-hidden />
            </Link>

            {/* Settings */}
            <Link
              href="/settings"
              className="flex items-center gap-3.5 rounded-2xl border-2 border-line bg-surface p-4 shadow-[0_3px_0_var(--color-line)] transition-transform active:translate-y-0.5 active:shadow-none hover:bg-mist"
            >
              <span className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-violet-soft text-violet">
                <Settings size={22} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <span className="block font-black text-sm text-ink">{t('settings.title')}</span>
                <p className="truncate text-xs text-ink-2">{t('settings.subtitle')}</p>
              </div>
              <ChevronRight size={18} className="text-ink-2 flex-none" aria-hidden />
            </Link>

            {/* Data & Backup */}
            <Link
              href="/settings/data"
              className="flex items-center gap-3.5 rounded-2xl border-2 border-line bg-surface p-4 shadow-[0_3px_0_var(--color-line)] transition-transform active:translate-y-0.5 active:shadow-none hover:bg-mist"
            >
              <span className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-teal-soft text-teal">
                <Database size={22} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-ink">{t('profile.data')}</span>
                  {hasBackup && (
                    <span className="rounded-full bg-mint/50 px-2 py-0.5 text-[10px] font-black text-mint-ink">
                      Sauvegardé
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-ink-2">{t('profile.dataText')}</p>
              </div>
              <ChevronRight size={18} className="text-ink-2 flex-none" aria-hidden />
            </Link>

            {/* Help & Support */}
            <Link
              href="/settings/help"
              className="flex items-center gap-3.5 rounded-2xl border-2 border-line bg-surface p-4 shadow-[0_3px_0_var(--color-line)] transition-transform active:translate-y-0.5 active:shadow-none hover:bg-mist"
            >
              <span className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-sun text-sun-ink">
                <HelpCircle size={22} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <span className="block font-black text-sm text-ink">{t('help.title')}</span>
                <p className="truncate text-xs text-ink-2">{t('settings.helpText')}</p>
              </div>
              <ChevronRight size={18} className="text-ink-2 flex-none" aria-hidden />
            </Link>
          </div>
        </section>
      </main>
      <TabBar />
    </>
  );
}
