import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronRight, Ear, Layers, Link2, Mic, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'wouter';
import { ThemeRow } from '@/components/ThemeRow';
import { Button } from '@/components/ui/Button';
import { TabBar } from '@/components/ui/TabBar';
import { dueTermIds } from '@/data/progress';
import { db } from '@/db/db';
import { usePath } from '@/lib/usePath';
import { accentStyle } from '@/screens/path/ThemeScreen';

const MODES = [
  { id: 'challenge', Icon: Trophy, bg: 'bg-sun', fg: 'text-sun-ink' },
  { id: 'listening', Icon: Ear, bg: 'bg-mist', fg: 'text-ocean' },
  { id: 'speaking', Icon: Mic, bg: 'bg-[#E3DCFB]', fg: 'text-[#5B4FC4]' },
  { id: 'match', Icon: Link2, bg: 'bg-mint', fg: 'text-mint-ink' }
] as const;

export function PracticeScreen() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { content, themes, progress, domain } = usePath();
  const mastered = useLiveQuery(async () => new Set((await db.userTerms.where('state').equals('mastered').toArray()).map((u) => u.termId)), [], new Set<string>());
  const [due, setDue] = useState<string[]>([]);
  useEffect(() => { void dueTermIds().then(setDue); }, []);
  const dueKnown = due.filter((id) => content.byId.has(id));

  return (
    <>
      <main style={accentStyle(domain)} className="mx-auto max-w-[640px] px-5 pb-28 pt-[calc(env(safe-area-inset-top)+16px)]">
        <h1 className="text-[1.75rem] font-black">{t('practice.title')}</h1>
        <p className="text-ink-2">{t('practice.subtitle')}</p>

        <h2 className="mt-6 text-lg font-extrabold">{t('path.title')}</h2>
        <p className="text-sm text-ink-2">{t('path.subtitle')}</p>
        <ul className="mt-3 grid gap-3">
          {themes.map((theme) => (
            <li key={theme.category}>
              <ThemeRow theme={theme} category={content.categories.get(theme.category)} progress={progress}
                mastered={theme.termIds.filter((id) => mastered.has(id)).length} />
            </li>
          ))}
        </ul>

        <h2 className="mt-8 text-lg font-extrabold">{t('practice.train')}</h2>

        <section className="mt-3 flex items-center gap-4 rounded-[var(--radius-card)] border-2 border-line bg-surface p-5 shadow-[0_4px_0_var(--color-line)]">
          <span className="grid h-14 w-14 flex-none place-items-center rounded-2xl bg-ocean text-on-ocean"><Layers size={26} aria-hidden /></span>
          <div className="flex-1">
            <p className="font-extrabold">{t('practice.revision.title')}</p>
            <p className="text-sm text-ink-2">{dueKnown.length ? t('practice.revision.due', { count: dueKnown.length }) : t('practice.revision.none')}</p>
          </div>
          {dueKnown.length > 0 && <Button block={false} onClick={() => navigate('/practice/review')}>{t('practice.revision.cta')}</Button>}
        </section>

        <ul className="mt-5 grid gap-3">
          {MODES.map(({ id, Icon, bg, fg }) => (
            <li key={id}>
              <Link href={`/practice/${id}`} className="flex min-h-[76px] items-center gap-4 rounded-[var(--radius-card)] border-2 border-line bg-surface p-4 shadow-[0_4px_0_var(--color-line)] active:translate-y-1 active:shadow-none">
                <span className={`grid h-12 w-12 flex-none place-items-center rounded-2xl ${bg} ${fg}`}><Icon size={24} aria-hidden /></span>
                <span className="flex-1"><span className="block font-extrabold">{t(`practice.modes.${id}.title`)}</span><span className="block text-sm text-ink-2">{t(`practice.modes.${id}.text`)}</span></span>
                <ChevronRight size={20} className="text-ink-2" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <TabBar />
    </>
  );
}
