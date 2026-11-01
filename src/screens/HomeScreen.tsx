import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowRight, CalendarCheck, ChevronRight, Flame, Hand, Layers, RotateCw, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'wouter';
import { Avatar } from '@/components/ui/Avatar';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { TabBar } from '@/components/ui/TabBar';
import { dueTermIds, type SpinStatus, spinStatus } from '@/data/progress';
import { db } from '@/db/db';
import { daysAway, displayedStreak, localDay } from '@/learning/streak';
import { domainOf, generalRoleOf } from '@/lib/domains';
import { courseRoles, useCourse } from '@/lib/useCourse';
import { useManifest } from '@/lib/useContent';
import { courseNodeHref } from '@/screens/course/CourseScreen';
import { accentStyle } from '@/screens/path/ThemeScreen';

// A weekly goal (4 active days out of 7) instead of punishing every missed day.
const WEEKLY_GOAL = 4;

export function HomeScreen() {
  const { t } = useTranslation();
  const profile = useLiveQuery(() => db.profile.get('me'));
  const manifest = useManifest();
  const [status, setStatus] = useState<SpinStatus | null>(null);
  const [due, setDue] = useState<number>(0);
  const lessonsDone = useLiveQuery(() => db.lessonSessions.filter((l) => !!l.completedAt).toArray(), [], []);
  useEffect(() => { void spinStatus().then(setStatus); void dueTermIds().then((d) => setDue(d.length)); }, [lessonsDone.length]);

  if (!profile) return null;
  const domain = domainOf(manifest, profile.primaryRole);
  const today = localDay();
  const streak = displayedStreak(profile, today);
  const away = daysAway(profile, today);
  const activeDays = new Set(lessonsDone.map((l) => localDay(new Date(l.completedAt!))).filter((d) => (Date.parse(today) - Date.parse(d)) / 86_400_000 < 7)).size;
  const roles = manifest ? courseRoles(manifest, profile.primaryRole, profile.secondaryRoles) : { mine: [], discover: [], otherDomain: [] };
  const [main, ...others] = roles.mine;
  const general = generalRoleOf(manifest, profile.primaryRole);
  const spinState = !status ? null : status.freeAvailable ? 'free' : status.bonusAvailable ? 'bonus' : 'done';

  return (
    <>
      <main style={accentStyle(domain)} className="mx-auto max-w-[1080px] px-5 pb-28 pt-[calc(env(safe-area-inset-top)+14px)] lg:px-8">
        <header className="flex items-center gap-2">
          <Link href="/profile" aria-label={t('profile.title')} className="rounded-full"><Avatar id={profile.avatar} name={profile.displayName || 'T'} size={44} /></Link>
          <div className="min-w-0 flex-1 pl-1">
            <p className="truncate font-title text-lg font-black leading-tight">{profile.displayName ? t('home.hello', { name: profile.displayName }) : t('home.helloAnon')}</p>
            <p className="truncate text-sm text-ink-2">{manifest?.roles.find((r) => r.id === profile.primaryRole)?.name_fr}</p>
          </div>
          <span className={`inline-flex min-h-10 items-center gap-1 rounded-xl px-2.5 font-black ${streak ? 'text-flame-ink' : 'text-ink-2'}`} title={t('home.streak', { count: streak })}>
            <Flame size={22} aria-hidden fill={streak ? 'currentColor' : 'none'} />{streak}<span className="sr-only">{t('home.streak', { count: streak })}</span>
          </span>
          <span className="inline-flex min-h-10 items-center gap-1 rounded-xl px-2.5 font-black text-gold-ink"><Zap size={22} aria-hidden fill="currentColor" />{profile.xp}<span className="sr-only">XP</span></span>
        </header>

        {away >= 3 && (
          <p className="mt-4 flex items-start gap-3 rounded-2xl bg-[var(--accent-soft)] p-4">
            <Hand size={24} className="flex-none text-[var(--accent)]" aria-hidden />
            <span><span className="block font-extrabold">{t('home.welcomeBack.title')}</span><span className="block text-sm text-ink-2">{t('home.welcomeBack.text', { count: away })}</span></span>
          </p>
        )}

        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
          <div className="min-w-0">
            {main ? <HeroCourse role={main} /> : <div className="skeleton h-64" />}

            {others.length > 0 && (
              <section className="mt-7">
                <h2 className="text-lg font-extrabold">{t('course.mine')}</h2>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                  {others.map((r) => <li key={r}><CourseRow role={r} general={r === general} /></li>)}
                </ul>
              </section>
            )}

            {roles.discover.length > 0 && (
              <section className="mt-8">
                <h2 className="text-lg font-extrabold">{t('course.discover')}</h2>
                <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {roles.discover.map((r) => {
                    const meta = manifest!.roles.find((x) => x.id === r)!;
                    return (
                      <li key={r}>
                        <Link href={`/parcours/${r}`} className="flex h-full flex-col rounded-2xl border-2 border-line bg-surface p-4 shadow-[0_4px_0_var(--color-line)] active:translate-y-1 active:shadow-none">
                          <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]"><DynamicIcon name={meta.icon} size={22} /></span>
                          <span className="mt-3 font-extrabold leading-snug">{meta.name_fr}</span>
                          <span className="mt-1 line-clamp-2 text-sm text-ink-2">{meta.description_fr}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </div>

          <aside className="grid gap-3">
            <h2 className="text-lg font-extrabold lg:mt-0">{t('home.today')}</h2>
            {spinState && (
              <Link href={spinState === 'done' && status?.todaysTermId ? `/lesson/${status.todaysTermId}` : '/spin'}
                className="flex items-center gap-3.5 rounded-2xl border-2 border-line bg-surface p-4 shadow-[0_4px_0_var(--color-line)] active:translate-y-1 active:shadow-none">
                <span className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-sun text-sun-ink"><RotateCw size={24} aria-hidden /></span>
                <span className="min-w-0 flex-1"><span className="block font-extrabold">{t(`home.spin.${spinState}.title`)}</span><span className="block text-sm text-ink-2">{t(`home.spin.${spinState}.text`)}</span></span>
                <ChevronRight size={20} className="text-ink-2" aria-hidden />
              </Link>
            )}
            <Link href={due ? '/practice/review' : '/practice'}
              className="flex items-center gap-3.5 rounded-2xl border-2 border-line bg-surface p-4 shadow-[0_4px_0_var(--color-line)] active:translate-y-1 active:shadow-none">
              <span className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-teal-soft text-teal"><Layers size={24} aria-hidden /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-extrabold">{due ? t('home.reviews.title', { count: due }) : t('home.reviews.none')}</span>
                <span className="block text-sm text-ink-2">{due ? t('home.reviews.text') : t('home.reviews.noneText')}</span>
              </span>
              <ChevronRight size={20} className="text-ink-2" aria-hidden />
            </Link>
            <div className="rounded-2xl border-2 border-line bg-surface p-4">
              <p className="flex items-center gap-2 font-extrabold"><CalendarCheck size={20} className="text-mint-strong" aria-hidden />{t('home.week.title')}</p>
              <div className="mt-3 flex gap-1.5" aria-hidden>{Array.from({ length: WEEKLY_GOAL }, (_, i) => <span key={i} className={`h-2.5 flex-1 rounded-full ${i < activeDays ? 'bg-mint-strong' : 'bg-line'}`} />)}</div>
              <p className="mt-2 text-sm text-ink-2">{activeDays >= WEEKLY_GOAL ? t('home.week.reached') : t('home.week.goal', { count: activeDays, goal: WEEKLY_GOAL })}</p>
            </div>
            {manifest?.includesDrafts && <p className="rounded-full bg-sun px-3 py-1.5 text-center text-xs font-bold text-sun-ink">{t('home.drafts')}</p>}
          </aside>
        </div>
        {roles.otherDomain.length > 0 && (
          <p className="mt-8 text-center text-sm text-ink-2">
            {t('course.otherDomain')} : <Link href="/settings/roles" className="font-bold text-[var(--accent)] underline-offset-2 hover:underline">{t('roles.title')}</Link>
          </p>
        )}
      </main>
      <TabBar />
    </>
  );
}

/** The main call to action of the app: the next step of the learner's own job course. */
function HeroCourse({ role }: { role: string }) {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { course, meta, stats } = useCourse(role);
  if (!course || !meta || !stats) return <div className="skeleton h-64" aria-busy="true" />;
  const finished = !stats.next;
  return (
    <section aria-labelledby="hero-course" className="relative overflow-hidden rounded-2xl bg-[var(--accent)] p-5 text-on-ocean shadow-[0_6px_0_var(--accent-press)] sm:p-6">
      <DynamicIcon name={meta.icon} size={170} className="pointer-events-none absolute -right-8 -top-8 opacity-[0.13]" />
      <svg aria-hidden className="pointer-events-none absolute -bottom-10 -left-6 h-40 w-40 opacity-20" viewBox="0 0 100 100">
        <path d="M10 80 C 30 40, 60 90, 90 30" fill="none" stroke="white" strokeWidth="4" strokeDasharray="1 9" strokeLinecap="round" />
      </svg>
      <div className="relative">
        <p className="text-sm font-bold opacity-90">{stats.unit ? t(`course.unitKind.${stats.unit.kind}`, { n: stats.unit.number }) : t('course.finished')}</p>
        <h1 id="hero-course" className="mt-1 text-2xl font-black leading-tight sm:text-3xl">{stats.unit?.title ?? meta.name_fr}</h1>
        <p className="mt-1 text-sm opacity-90">{meta.name_fr}</p>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/25" role="progressbar" aria-valuemin={0} aria-valuemax={stats.total} aria-valuenow={stats.done} aria-label={t('course.progress')}>
            <div className="h-full rounded-full bg-white transition-[width] duration-700" style={{ width: `${Math.max(4, stats.ratio * 100)}%` }} />
          </div>
          <span className="text-sm font-black">{Math.round(stats.ratio * 100)} %</span>
        </div>
        {stats.next && (
          <p className="mt-4 rounded-xl bg-white/15 px-3 py-2.5 text-sm">
            <span className="font-bold opacity-90">{t('course.next')} : </span><span className="font-black">{stats.next.title}</span>
          </p>
        )}
        <button type="button" onClick={() => navigate(stats.next ? courseNodeHref(role, stats.next) : `/parcours/${role}`)}
          className="mt-5 inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-white text-lg font-black uppercase tracking-wide text-[var(--accent)] shadow-[0_5px_0_rgba(0,20,50,0.25)] transition-transform active:translate-y-1 active:shadow-none">
          {finished ? t('course.redo') : stats.done ? t('course.continue') : t('course.begin')}<ArrowRight size={22} aria-hidden />
        </button>
        <Link href={`/parcours/${role}`} className="mt-3 flex min-h-11 items-center justify-center text-sm font-bold underline-offset-2 opacity-95 hover:underline">{t('course.seeMap')}</Link>
      </div>
    </section>
  );
}

function CourseRow({ role, general }: { role: string; general: boolean }) {
  const { t } = useTranslation();
  const { meta, stats, course } = useCourse(role);
  if (!meta) return <div className="skeleton h-20" />;
  const pct = stats ? Math.round(stats.ratio * 100) : 0;
  return (
    <Link href={`/parcours/${role}`} className="flex items-center gap-3.5 rounded-2xl border-2 border-line bg-surface p-4 shadow-[0_4px_0_var(--color-line)] active:translate-y-1 active:shadow-none">
      <span className="relative grid h-14 w-14 flex-none place-items-center">
        <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden>
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-line)" strokeWidth="3" />
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${pct * 0.974} 100`} />
        </svg>
        <DynamicIcon name={meta.icon} size={22} className="text-[var(--accent)]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-extrabold leading-snug">{general ? t('course.general') : meta.name_fr}</span>
        <span className="block text-sm text-ink-2">{course ? `${t('course.units', { count: course.units.length })} · ${pct} %` : meta.description_fr}</span>
      </span>
      <ChevronRight size={20} className="text-ink-2" aria-hidden />
    </Link>
  );
}

