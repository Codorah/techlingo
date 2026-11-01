import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowRight, RotateCw, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Wheel, type WheelHandle } from '@/components/Wheel';
import type { Term } from '@/content/schema';
import { progressMap, recentSpins, recordSpin, type SpinStatus, spinStatus } from '@/data/progress';
import { db, type UserTerm } from '@/db/db';
import { localDay } from '@/learning/streak';
import { pickSpinTerm, roleCategories, spinCandidates } from '@/learning/wheel';
import { useContent } from '@/lib/useContent';

type Mode = 'random' | 'category';

export function SpinScreen() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const profile = useLiveQuery(() => db.profile.get('me'));
  const roles = profile?.primaryRole ? [profile.primaryRole, ...profile.secondaryRoles] : [];
  const content = useContent(roles);
  const wheel = useRef<WheelHandle>(null);

  const [status, setStatus] = useState<SpinStatus | null>(null);
  const [progress, setProgress] = useState<Map<string, UserTerm>>(new Map());
  const [recent, setRecent] = useState<{ termId: string; day: string }[]>([]);
  const [mode, setMode] = useState<Mode>('random');
  const [category, setCategory] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Term | null>(null);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    void (async () => { setStatus(await spinStatus()); setProgress(await progressMap()); setRecent(await recentSpins()); })();
  }, []);

  const categories = useMemo(() => roleCategories(content.terms, roles), [content.terms, roles.join()]); // eslint-disable-line react-hooks/exhaustive-deps

  const input = profile?.primaryRole && profile.level ? {
    terms: content.terms, progress, primaryRole: profile.primaryRole, secondaryRoles: profile.secondaryRoles,
    level: profile.level, recentSpins: recent, today: localDay()
  } : null;

  // What the wheel shows: the user's categories, or words of the chosen category.
  const [segments, setSegments] = useState<{ id: string; label: string }[]>([]);
  useEffect(() => {
    if (!input || spinning || result) return;
    if (mode === 'random' || !category) {
      setSegments(categories.slice(0, 8).map((c) => ({ id: c.id, label: content.categories.get(c.id)?.name_fr ?? c.id })));
    } else {
      const pool = spinCandidates({ ...input, category }).filter((c) => c.weight > 0).sort(() => Math.random() - 0.5).slice(0, 8);
      setSegments(pool.map((c) => ({ id: c.term.id, label: c.term.term_en })));
    }
  }, [mode, category, categories, content.terms.length, progress, spinning, result]); // eslint-disable-line react-hooks/exhaustive-deps

  const canSpin = !!status && (status.freeAvailable || status.bonusAvailable);
  const todaysTerm = status?.todaysTermId ? content.byId.get(status.todaysTermId) : undefined;

  async function spin() {
    if (!input || spinning || !status) return;
    setEmpty(false);
    const term = pickSpinTerm({ ...input, ...(mode === 'category' && category ? { category } : {}) });
    if (!term) { setEmpty(true); return; }
    let segs = segments.length ? [...segments] : [{ id: term.categories[0]!, label: term.term_en }];
    let index = mode === 'category' && category
      ? segs.findIndex((s) => s.id === term.id)
      : segs.findIndex((s) => term.categories.includes(s.id));
    if (index < 0) {
      const entry = mode === 'category' && category
        ? { id: term.id, label: term.term_en }
        : { id: term.categories[0]!, label: content.categories.get(term.categories[0]!)?.name_fr ?? term.categories[0]! };
      index = Math.min(segs.length, 7);
      segs = [...segs.slice(0, index), entry];
      setSegments(segs);
    }
    setSpinning(true);
    await new Promise((r) => requestAnimationFrame(r));
    await wheel.current?.spinTo(index);
    await recordSpin(term.id, mode, mode === 'category' ? category ?? undefined : undefined, !status.freeAvailable);
    navigator.vibrate?.(15);
    setResult(term);
    setSpinning(false);
    setStatus(await spinStatus());
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[640px] flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-[calc(env(safe-area-inset-top)+12px)]">
      <header className="mb-2 grid grid-cols-[44px_1fr_44px] items-center">
        <button type="button" onClick={() => navigate('/')} aria-label={t('common.close')} className="grid h-11 w-11 place-items-center rounded-xl text-ink-2 active:bg-surface"><X size={26} aria-hidden /></button>
        <h1 className="text-center text-lg font-extrabold">{t('spin.title')}</h1>
      </header>

      {!result && canSpin && (
        <div role="radiogroup" className="mx-auto mb-4 grid w-full max-w-sm grid-cols-2 rounded-2xl bg-surface p-1 shadow-[inset_0_0_0_2px_var(--color-line)]">
          {(['random', 'category'] as const).map((m) => (
            <button key={m} type="button" role="radio" aria-checked={mode === m} disabled={spinning} onClick={() => { setMode(m); if (m === 'random') setCategory(null); }}
              className={`min-h-11 rounded-xl font-bold ${mode === m ? 'bg-[var(--accent)] text-on-ocean' : 'text-ink-2'}`}>{t(`spin.modes.${m}`)}</button>
          ))}
        </div>
      )}

      {!result && canSpin && mode === 'category' && (
        <div className="-mx-5 mb-4 overflow-x-auto px-5 [scrollbar-width:none]">
          <p className="mb-2 text-sm font-bold text-ink-2">{t('spin.chooseCategory')}</p>
          <div className="flex gap-2">
            {categories.map((c) => (
              <button key={c.id} type="button" disabled={spinning} onClick={() => setCategory(c.id)} aria-pressed={category === c.id}
                className={`min-h-10 flex-none rounded-full border-2 px-4 text-sm font-bold ${category === c.id ? 'border-[var(--accent)] bg-[var(--accent)] text-on-ocean' : 'border-line bg-surface text-ink-2'}`}>
                {content.categories.get(c.id)?.name_fr ?? c.id}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col items-center justify-center">
        {(canSpin || result) && segments.length > 0 && <Wheel ref={wheel} labels={segments.map((s) => s.label)} onSpin={() => void spin()} spinLabel={t('spin.cta')}
          disabled={!canSpin || !!result || spinning || !input || (mode === 'category' && !category)} />}
        {!canSpin && !result && todaysTerm && (
          <Card className="w-full text-center">
            <p className="text-sm font-bold text-ink-2">{t('home.spin.done.title')}</p>
            <h2 className="mt-2 text-3xl font-black">{todaysTerm.term_en}</h2>
            <p className="mt-1 text-ink-2">{todaysTerm.translation_fr}</p>
          </Card>
        )}
        {empty && <p role="status" className="mt-4 text-center text-ink-2">{t('spin.empty')}</p>}
      </div>

      {result ? (
        <Card className="mt-4 animate-[pop_.4s_ease-out] text-center">
          <p className="text-sm font-bold text-ink-2">{t('spin.resultLabel')}</p>
          <h2 className="mt-1 text-3xl font-black">{result.term_en}</h2>
          <p className="mt-1 text-ink-2">{result.translation_fr}</p>
          <Button variant="success" className="mt-4" icon={<ArrowRight size={20} aria-hidden />} onClick={() => navigate(`/lesson/${result.id}`)}>{t('spin.start')}</Button>
        </Card>
      ) : canSpin ? (
        <Button className="mt-4" disabled={spinning || !input || (mode === 'category' && !category)} icon={<RotateCw size={20} aria-hidden />} onClick={() => void spin()}>
          {spinning ? t('spin.spinning') : status?.freeAvailable ? t('spin.cta') : t('spin.bonus')}
        </Button>
      ) : todaysTerm ? (
        <Button className="mt-4" icon={<ArrowRight size={20} aria-hidden />} onClick={() => navigate(`/lesson/${todaysTerm.id}`)}>{t('home.spin.done.cta')}</Button>
      ) : null}
    </main>
  );
}
