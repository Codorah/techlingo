import { BookOpen, CalendarCheck, ChevronRight, Database, Flame, HelpCircle, Map as MapIcon, Settings, Sparkles, Star, Target, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { Avatar } from '@/components/ui/Avatar';
import { BadgeMedal } from '@/components/ui/BadgeMedal';
import { BadgeSheet } from '@/components/ui/BadgeSheet';
import { Card } from '@/components/ui/Card';
import { TabBar } from '@/components/ui/TabBar';
import { type EvaluatedBadge, computeLevel, nearestBadges } from '@/learning/badges';
import { localDay } from '@/learning/streak';
import { useBadgeState } from '@/learning/useBadgeState';
import { domainOf } from '@/lib/domains';
import { useContent } from '@/lib/useContent';
import { accentStyle } from '@/screens/path/ThemeScreen';

type Tab = 'progres' | 'succes' | 'reglages';
const TABS: Tab[] = ['progres', 'succes', 'reglages'];
const TAB_KEY = 'techlingo.profileTab';

function initialTab(): Tab {
  const hash = window.location.hash.replace('#', '') as Tab;
  if (TABS.includes(hash)) return hash;
  try {
    const saved = sessionStorage.getItem(TAB_KEY) as Tab | null;
    if (saved && TABS.includes(saved)) return saved;
  } catch { /* storage unavailable */ }
  return 'progres';
}

function ProfileSkeleton() {
  return (
    <main className="mx-auto max-w-[680px] px-5 pb-28 pt-[calc(env(safe-area-inset-top)+14px)]" aria-busy="true">
      <div className="skeleton h-[148px] rounded-3xl" />
      <div className="skeleton mt-4 h-11" />
      <div className="skeleton mt-4 h-36" />
      <div className="mt-3 grid grid-cols-2 gap-3"><div className="skeleton h-24" /><div className="skeleton h-24" /></div>
    </main>
  );
}

export function ProfileScreen() {
  const { t } = useTranslation();
  const state = useBadgeState();
  const content = useContent([]);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [selected, setSelected] = useState<EvaluatedBadge | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const onHash = () => { const h = window.location.hash.replace('#', '') as Tab; if (TABS.includes(h)) setTab(h); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  function chooseTab(next: Tab) {
    setTab(next);
    try { sessionStorage.setItem(TAB_KEY, next); } catch { /* storage unavailable */ }
    try { window.history.replaceState(window.history.state, '', `#${next}`); } catch { /* ignore */ }
  }

  const sessions = state.ready ? state.sessions : null;
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(Date.now() - (6 - i) * 86_400_000);
      const dayStr = localDay(d);
      const xp = (sessions ?? [])
        .filter((s) => s.completedAt && localDay(new Date(s.completedAt)) === dayStr)
        .reduce((sum, s) => sum + (s.xpEarned || 0), 0);
      return { dayStr, label: d.toLocaleDateString('fr-FR', { weekday: 'narrow' }), xp, active: xp > 0 };
    });
  }, [sessions]);

  if (!state.ready) return <ProfileSkeleton />;
  const { profile, streak, wordsCount, mastered, favorites, evaluated, today, hasBackup } = state;

  const domain = domainOf(content.manifest, profile.primaryRole);
  const lvl = computeLevel(profile.xp);
  const activeDaysWeek = last7Days.filter((d) => d.active).length;
  const maxDayXp = Math.max(30, ...last7Days.map((d) => d.xp));
  const unlocked = evaluated.filter((b) => b.tier !== 'locked').length;
  const nearest = nearestBadges([...evaluated], 3);
  const goal = nearest[0];
  const list = showAll ? evaluated : nearest;

  const stats = [
    { Icon: Flame, color: 'text-flame-ink', bg: 'bg-flame-soft/80', value: streak, label: t('profile.stats.streak') },
    { Icon: Zap, color: 'text-gold-ink', bg: 'bg-sun/80', value: profile.xp, label: t('profile.stats.xp') },
    { Icon: BookOpen, color: 'text-[var(--accent)]', bg: 'bg-[var(--accent-soft)]', value: wordsCount, label: t('profile.stats.words') },
    { Icon: Star, color: 'text-mint-ink', bg: 'bg-mint/80', value: mastered, label: t('profile.stats.mastered') }
  ];

  const hub = [
    { href: '/settings', Icon: Settings, tone: 'bg-violet-soft text-violet', title: t('settings.title'), text: t('settings.subtitle') },
    { href: '/settings/data', Icon: Database, tone: 'bg-teal-soft text-teal', title: t('profile.data'), text: hasBackup ? t('profile.backedUp') : t('profile.dataText') },
    { href: '/settings/help', Icon: HelpCircle, tone: 'bg-sun text-sun-ink', title: t('help.title'), text: t('settings.helpText') },
    { href: '/knowledge', Icon: MapIcon, tone: 'bg-sky/20 text-ocean', title: t('knowledge.entry'), text: t('knowledge.entryText') }
  ];

  return (
    <>
      <main style={accentStyle(domain)} className="mx-auto max-w-[680px] px-5 pb-28 pt-[calc(env(safe-area-inset-top)+14px)]">
        <h1 className="sr-only">{t('profile.title')}</h1>

        {/* One compact hero: identity, level, XP, streak */}
        <section className="relative overflow-hidden rounded-3xl bg-[var(--accent)] p-4 text-on-ocean shadow-[0_5px_0_var(--accent-press)]">
          <svg aria-hidden className="pointer-events-none absolute -bottom-12 -right-8 h-40 w-40 opacity-15" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="6 6" />
          </svg>
          <div className="relative flex items-center gap-3.5">
            <Avatar id={profile.avatar} name={profile.displayName || 'T'} size={56} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-lg font-black">{profile.displayName || t('home.helloAnon')}</p>
                {profile.level && <span className="flex-none rounded-full bg-white/20 px-2 py-0.5 text-xs font-black">{profile.level}</span>}
              </div>
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs font-bold opacity-95">
                <Sparkles size={13} className="flex-none text-sun" aria-hidden />
                {t('profile.levelTitle', { level: lvl.level })} · {t(`badges.ranks.${lvl.titleKey}`)}
              </p>
            </div>
          </div>
          <div className="relative mt-3.5">
            <div
              className="h-2.5 overflow-hidden rounded-full bg-black/20"
              role="progressbar"
              aria-valuemin={lvl.levelFloorXp}
              aria-valuemax={lvl.nextLevelXp}
              aria-valuenow={profile.xp}
              aria-label={t('profile.level')}
            >
              <div className="h-full rounded-full bg-white transition-[width] duration-700" style={{ width: `${Math.max(5, Math.round(lvl.progressRatio * 100))}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-xs font-bold opacity-90">{t('profile.nextLevel', { xp: lvl.nextLevelXp - profile.xp, level: lvl.level + 1 })}</p>
              <div className="flex flex-none gap-1.5 text-xs font-black">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1"><Flame size={14} fill="currentColor" aria-hidden />{streak}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1"><Zap size={14} aria-hidden />{profile.xp}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Segmented control */}
        <div role="tablist" aria-label={t('profile.title')} className="mt-4 grid grid-cols-3 gap-1 rounded-2xl bg-mist p-1">
          {TABS.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-selected={tab === id}
              aria-controls={`panel-${id}`}
              onClick={() => chooseTab(id)}
              className={`min-h-11 rounded-xl text-sm font-black transition-colors ${tab === id ? 'bg-surface text-ink shadow-xs' : 'text-ink-2 active:bg-surface/60'}`}
            >
              {t(`profile.tabs.${id}`)}
            </button>
          ))}
        </div>

        {tab === 'progres' && (
          <div role="tabpanel" id="panel-progres" aria-labelledby="tab-progres" className="mt-4 space-y-3">
            <Card className="p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-sm font-black"><CalendarCheck size={18} className="text-mint-strong" aria-hidden />{t('profile.weekActivity')}</h2>
                <span className="rounded-full bg-mint/50 px-2.5 py-0.5 text-xs font-extrabold text-mint-ink">{t('profile.weekShort', { count: activeDaysWeek })}</span>
              </div>
              <div className="mt-3 grid grid-cols-7 items-end gap-2">
                {last7Days.map((d) => {
                  const h = d.xp ? Math.max(12, Math.round((d.xp / maxDayXp) * 40)) : 6;
                  const isToday = d.dayStr === today;
                  return (
                    <div key={d.dayStr} className="flex flex-col items-center gap-1">
                      <span className="h-4 text-xs font-bold text-ink-2">{d.xp ? `+${d.xp}` : ''}</span>
                      <div className="flex h-11 w-full items-end justify-center">
                        <span className={`w-full max-w-[26px] rounded-lg ${d.active ? 'bg-[var(--accent)]' : 'bg-line'} ${isToday ? 'ring-2 ring-[var(--accent)]/40' : ''}`} style={{ height: h }} />
                      </div>
                      <span className={`text-xs ${isToday ? 'font-black text-[var(--accent)]' : 'font-bold text-ink-2'}`}>{d.label}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              {stats.map(({ Icon, color, bg, value, label }) => (
                <Card key={label} className="flex items-center gap-3 p-3">
                  <span className={`grid h-10 w-10 flex-none place-items-center rounded-xl ${bg}`}><Icon size={20} className={color} aria-hidden /></span>
                  <div className="min-w-0">
                    <p className="font-title text-xl font-black leading-tight tabular-nums">{value}</p>
                    <p className="text-xs font-bold leading-tight text-ink-2">{label}</p>
                  </div>
                </Card>
              ))}
            </div>
            <p className="px-1 text-xs font-bold text-ink-2">
              {t('profile.bestStreak', { count: Math.max(profile.bestStreak, streak) })} · {t('profile.favorites', { count: favorites })}
            </p>

            {goal && (
              <button type="button" onClick={() => { chooseTab('succes'); setSelected(goal); }} className="block w-full text-left">
                <Card className="p-4 transition-transform active:scale-[0.99]">
                  <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[var(--accent)]"><Target size={14} aria-hidden />{t('profile.nextGoal')}</p>
                  <div className="mt-2.5 flex items-center gap-3">
                    <BadgeMedal icon={goal.icon} tier={goal.tier} ratio={goal.ratio} size={52} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-black">{t(`badges.list.${goal.id}.title`)}</p>
                      <p className="truncate text-xs text-ink-2">{t(`badges.list.${goal.id}.desc`)}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.round(goal.ratio * 100)}%` }} /></div>
                        <span className="text-xs font-extrabold tabular-nums text-ink-2">{goal.current}/{goal.nextTarget}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </button>
            )}
          </div>
        )}

        {tab === 'succes' && (
          <div role="tabpanel" id="panel-succes" aria-labelledby="tab-succes" className="mt-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-black">{showAll ? t('profile.allBadges') : t('profile.nearBadges')}</h2>
              <span className="rounded-full bg-sun/80 px-2.5 py-0.5 text-xs font-black text-sun-ink">{t('profile.unlocked', { count: unlocked, total: evaluated.length })}</span>
            </div>
            <ul className="mt-3 grid grid-cols-3 gap-2.5">
              {list.map((b) => (
                <li key={b.id}>
                  <button type="button" onClick={() => setSelected(b)} className="flex h-full w-full flex-col items-center gap-1.5 rounded-2xl border-2 border-line bg-surface px-1.5 py-3 text-center transition-transform active:scale-95">
                    <BadgeMedal icon={b.icon} tier={b.tier} ratio={b.ratio} size={60} />
                    <span className="line-clamp-2 min-h-[2lh] text-xs font-extrabold leading-tight">{t(`badges.list.${b.id}.title`)}</span>
                    <span className="text-xs font-bold tabular-nums text-ink-2">{b.current}/{b.nextTarget}</span>
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              aria-expanded={showAll}
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-2xl border-2 border-line bg-surface text-sm font-black text-[var(--accent)] active:bg-mist"
            >
              {showAll ? t('profile.fewer') : t('profile.seeAll', { count: evaluated.length })}
            </button>
          </div>
        )}

        {tab === 'reglages' && (
          <div role="tabpanel" id="panel-reglages" aria-labelledby="tab-reglages" className="mt-4">
            <Card className="p-1">
              {hub.map(({ href, Icon, tone, title, text }, i) => (
                <div key={href}>
                  {i > 0 && <div className="mx-3 h-0.5 bg-line" />}
                  <Link href={href} className="flex min-h-16 items-center gap-3 rounded-2xl px-3 py-2 active:bg-mist">
                    <span className={`grid h-10 w-10 flex-none place-items-center rounded-xl ${tone}`}><Icon size={20} aria-hidden /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-black">{title}</span>
                      <span className="block truncate text-xs text-ink-2">{text}</span>
                    </span>
                    <ChevronRight size={18} className="flex-none text-ink-2" aria-hidden />
                  </Link>
                </div>
              ))}
            </Card>
          </div>
        )}
      </main>
      {selected && <BadgeSheet badge={evaluated.find((b) => b.id === selected.id) ?? selected} onClose={() => setSelected(null)} />}
      <TabBar />
    </>
  );
}
