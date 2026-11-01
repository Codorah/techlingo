import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowRight, Check, Circle, Flame, Hand, RotateCw, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'wouter';
import { SituationsCard } from '@/components/SituationsCard';
import { ThemeRow } from '@/components/ThemeRow';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TabBar } from '@/components/ui/TabBar';
import { dueTermIds, type SpinStatus, spinStatus } from '@/data/progress';
import { db } from '@/db/db';
import { daysAway, displayedStreak, localDay } from '@/learning/streak';
import { nextTheme, themeProgress } from '@/learning/path';
import { usePath } from '@/lib/usePath';
import { accentStyle } from '@/screens/path/ThemeScreen';

// A weekly goal (4 active days out of 7) instead of punishing every missed day.
const WEEKLY_GOAL = 4;

export function HomeScreen() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { profile, content, themes, progress, domain } = usePath();
  const [status, setStatus] = useState<SpinStatus | null>(null);
  const [due, setDue] = useState<string[]>([]);
  const lessonsDone = useLiveQuery(() => db.lessonSessions.filter((l) => !!l.completedAt).toArray(), [], []);

  useEffect(() => { void spinStatus().then(setStatus); void dueTermIds().then(setDue); }, [lessonsDone.length]);

  if (!profile) return null;
  const today = localDay();
  const streak = displayedStreak(profile, today);
  const away = daysAway(profile, today);
  const roleName = content.manifest?.roles.find((r) => r.id === profile.primaryRole)?.name_fr ?? '';
  const dueKnown = due.filter((id) => content.byId.has(id));
  const studiedToday = lessonsDone.some((l) => l.completedAt && localDay(new Date(l.completedAt)) === today);
  const activeDays = new Set(lessonsDone.map((l) => localDay(new Date(l.completedAt!))).filter((d) => (Date.parse(today) - Date.parse(d)) / 86_400_000 < 7)).size;

  const resume = nextTheme(themes, progress);
  const recommended = themes.filter((th) => th !== resume && themeProgress(th, progress).done === 0).slice(0, 2);
  const spinCard = !status ? null : status.freeAvailable ? 'free' : status.bonusAvailable ? 'bonus' : 'done';
  const tasks = [
    { done: !!status && !status.freeAvailable, label: t('home.tasks.spin') },
    { done: studiedToday, label: t('home.tasks.lesson') },
    { done: dueKnown.length === 0, label: dueKnown.length ? t('home.tasks.review', { count: Math.min(dueKnown.length, 5) }) : t('home.tasks.noReview') }
  ];

  return (
    <>
      <main style={accentStyle(domain)} className="mx-auto max-w-[640px] px-5 pb-28 pt-[calc(env(safe-area-inset-top)+16px)]">
        <header className="flex items-center gap-3">
          <Link href="/profile" aria-label={t('profile.title')}><Avatar id={profile.avatar} name={profile.displayName || 'T'} size={44} /></Link>
          <span className="flex-1" />
          <span className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3 font-black ${streak ? 'text-[#C2410C]' : 'text-ink-2'}`}>
            <Flame size={22} aria-hidden />{streak}<span className="sr-only">{t('home.streak', { count: streak })}</span>
          </span>
          <span className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3 font-black text-ocean"><Zap size={22} aria-hidden />{profile.xp}<span className="sr-only">XP</span></span>
        </header>

        <h1 className="mt-5 text-[1.75rem] font-black leading-tight">{profile.displayName ? t('home.hello', { name: profile.displayName }) : t('home.helloAnon')}</h1>
        <p className="text-ink-2">{t('home.subtitle', { level: profile.level ?? '', role: roleName })}</p>
        {content.manifest?.includesDrafts && <p className="mt-2 inline-block rounded-full bg-sun px-3 py-1 text-xs font-bold text-sun-ink">{t('home.drafts')}</p>}

        {away >= 3 && (
          <Card className="mt-5 flex gap-3">
            <Hand size={26} className="flex-none text-ocean" aria-hidden />
            <div><p className="font-extrabold">{t('home.welcomeBack.title')}</p><p className="mt-0.5 text-sm text-ink-2">{t('home.welcomeBack.text', { count: away })}</p></div>
          </Card>
        )}

        <div className="mt-5"><SituationsCard /></div>

        {resume && (
          <section className="mt-5">
            <h2 className="mb-2 text-lg font-extrabold">{themeProgress(resume, progress).done ? t('path.resume') : t('path.startTheme')}</h2>
            <ThemeRow theme={resume} category={content.categories.get(resume.category)} progress={progress} />
          </section>
        )}

        {spinCard && (
          <section className="relative mt-5 overflow-hidden rounded-[var(--radius-card)] bg-ocean p-5 text-on-ocean shadow-[0_4px_0_var(--color-ocean-press)]">
            <svg viewBox="-100 -100 200 200" className="absolute -right-10 top-1/2 h-44 w-44 -translate-y-1/2 opacity-25" aria-hidden>
              {Array.from({ length: 8 }, (_, i) => {
                const a0 = (i * 45 * Math.PI) / 180, a1 = ((i + 1) * 45 * Math.PI) / 180;
                return <path key={i} d={`M0 0 L${90 * Math.cos(a0)} ${90 * Math.sin(a0)} A90 90 0 0 1 ${90 * Math.cos(a1)} ${90 * Math.sin(a1)} Z`} fill={i % 2 ? '#fff' : '#BFE3FB'} />;
              })}
            </svg>
            <div className="relative max-w-[72%]">
              <h2 className="text-xl font-black">{t(`home.spin.${spinCard}.title`)}</h2>
              <p className="mt-1 text-sm opacity-90">{t(`home.spin.${spinCard}.text`)}</p>
              <button type="button" onClick={() => navigate(spinCard === 'done' && status?.todaysTermId ? `/lesson/${status.todaysTermId}` : '/spin')}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 font-bold text-[#2B6CB0] shadow-[0_4px_0_rgba(0,20,50,0.25)] active:translate-y-1 active:shadow-none">
                {spinCard === 'done' ? <ArrowRight size={18} aria-hidden /> : <RotateCw size={18} aria-hidden />}{t(`home.spin.${spinCard}.cta`)}
              </button>
            </div>
          </section>
        )}

        <h2 className="mt-7 text-lg font-extrabold">{t('home.tasks.title')}</h2>
        <Card className="mt-3 p-2">
          <ul>{tasks.map((task) => (
            <li key={task.label} className="flex min-h-12 items-center gap-3 px-3">
              {task.done ? <span className="grid h-6 w-6 place-items-center rounded-full bg-mint-strong text-white"><Check size={16} aria-hidden /></span> : <Circle size={24} className="text-line" aria-hidden />}
              <span className={task.done ? 'text-ink-2 line-through' : 'font-semibold'}>{task.label}</span>
            </li>
          ))}</ul>
        </Card>

        {dueKnown.length > 0 && (
          <Card className="mt-4 flex items-center gap-4">
            <div className="flex-1"><p className="font-extrabold">{t('home.reviews.title', { count: dueKnown.length })}</p><p className="text-sm text-ink-2">{t('home.reviews.text')}</p></div>
            <Button block={false} onClick={() => navigate('/practice/review')}>{t('home.reviews.cta')}</Button>
          </Card>
        )}

        {recommended.length > 0 && (
          <>
            <h2 className="mt-7 text-lg font-extrabold">{t('path.recommended')}</h2>
            <ul className="mt-3 grid gap-3">
              {recommended.map((th) => <li key={th.category}><ThemeRow theme={th} category={content.categories.get(th.category)} progress={progress} /></li>)}
            </ul>
          </>
        )}

        <Card className="mt-6">
          <p className="font-extrabold">{t('home.week.title')}</p>
          <div className="mt-3 flex gap-1.5" aria-hidden>{Array.from({ length: WEEKLY_GOAL }, (_, i) => <span key={i} className={`h-2.5 flex-1 rounded-full ${i < activeDays ? 'bg-mint-strong' : 'bg-line'}`} />)}</div>
          <p className="mt-2 text-sm text-ink-2">{activeDays >= WEEKLY_GOAL ? t('home.week.reached') : t('home.week.goal', { count: activeDays, goal: WEEKLY_GOAL })}</p>
        </Card>
      </main>
      <TabBar />
    </>
  );
}
