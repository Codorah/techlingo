import { useLiveQuery } from 'dexie-react-hooks';
import { CircleCheck, Volume2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { dueTermIds, getSetting, reviewTerm } from '@/data/progress';
import { db } from '@/db/db';
import { speak } from '@/lib/speech';
import { useContent } from '@/lib/useContent';

/** Revision Room: due words one card at a time, rated Again / Hard / Good / Easy (FSRS). */
export function ReviewScreen() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const profile = useLiveQuery(() => db.profile.get('me'));
  const roles = profile?.primaryRole ? [profile.primaryRole, ...profile.secondaryRoles] : [];
  const content = useContent(roles);
  const [queue, setQueue] = useState<string[] | null>(null);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (content.loading) return;
    void (async () => {
      const cap = await getSetting('dailyReviewCap', 20); // daily review ceiling (spec §5.7)
      setQueue((await dueTermIds()).filter((id) => content.byId.has(id)).slice(0, cap));
    })();
  }, [content.loading, content.byId]);

  if (!queue) return <main className="grid min-h-dvh place-items-center text-ink-2">{t('common.loading')}</main>;
  const term = content.byId.get(queue[i] ?? '');

  if (!term) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[640px] flex-col items-center justify-center px-5 text-center">
        <CircleCheck size={72} className="text-mint-strong" aria-hidden />
        <h1 className="mt-5 text-3xl font-black">{t('practice.review.done')}</h1>
        <p className="mt-2 text-ink-2">{t('practice.review.doneText', { count: queue.length })}</p>
        <Button className="mt-8" onClick={() => navigate('/practice')}>{t('practice.result.back')}</Button>
      </main>
    );
  }

  async function rate(r: 1 | 2 | 3 | 4) {
    await reviewTerm(term!.id, r);
    setShown(false);
    setI(i + 1);
  }

  const ratings = [
    { r: 1 as const, label: t('practice.review.again'), cls: 'danger' as const },
    { r: 2 as const, label: t('practice.review.hard'), cls: 'secondary' as const },
    { r: 3 as const, label: t('practice.review.good'), cls: 'primary' as const },
    { r: 4 as const, label: t('practice.review.easy'), cls: 'success' as const }
  ];

  return (
    <main className="mx-auto flex min-h-dvh max-w-[640px] flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-[calc(env(safe-area-inset-top)+12px)]">
      <header className="mb-5 flex items-center gap-3">
        <button type="button" onClick={() => navigate('/practice')} aria-label={t('common.close')} className="grid h-11 w-11 place-items-center rounded-xl text-ink-2"><X size={26} aria-hidden /></button>
        <ProgressBar value={i / queue.length} className="flex-1" />
        <span className="text-sm font-bold text-ink-2">{i + 1}/{queue.length}</span>
      </header>
      <Card className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="text-sm font-bold text-ink-2">{t('practice.review.recall')}</p>
        <h1 className="mt-3 text-4xl font-black" lang="en">{term.term_en}</h1>
        <button type="button" onClick={() => speak(term.term_en)} aria-label={t('common.listen')} className="mt-4 grid h-12 w-12 place-items-center rounded-2xl bg-mist text-[var(--accent)]"><Volume2 size={22} aria-hidden /></button>
        {shown && (
          <div className="mt-6 w-full animate-[enter_.25s_ease-out] border-t-2 border-line pt-5 text-left">
            <p className="text-xl font-extrabold text-mint-ink">{term.translation_fr}</p>
            <p className="mt-2 text-ink-2">{term.explanation_fr}</p>
            <p className="mt-3 italic" lang="en">{term.sentences[0]?.text_en}</p>
          </div>
        )}
      </Card>
      <div className="mt-4">
        {shown
          ? <div className="grid grid-cols-2 gap-2.5">{ratings.map(({ r, label, cls }) => <Button key={r} variant={cls} onClick={() => void rate(r)}>{label}</Button>)}</div>
          : <Button onClick={() => setShown(true)}>{t('practice.review.show')}</Button>}
      </div>
    </main>
  );
}
