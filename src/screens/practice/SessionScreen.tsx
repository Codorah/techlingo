import { useLiveQuery } from 'dexie-react-hooks';
import { Trophy, X } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/Button';
import { Choice } from '@/components/ui/Choice';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { Term } from '@/content/schema';
import { addXP, logQuizAttempt, logSpeakingAttempt } from '@/data/progress';
import { db } from '@/db/db';
import { buildChallenge, buildListening, practicePool, shuffle } from '@/learning/practice';
import { useContent } from '@/lib/useContent';
import { type Playable, QuizStep } from '@/screens/lesson/QuizStep';
import { RepeatStep } from '@/screens/lesson/RepeatStep';

type Mode = 'challenge' | 'listening' | 'speaking' | 'match';
const XP_PER_CORRECT = 5;

export function SessionScreen() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { mode } = useParams<{ mode: Mode }>();
  const profile = useLiveQuery(() => db.profile.get('me'));
  const roles = profile?.primaryRole ? [profile.primaryRole, ...profile.secondaryRoles] : [];
  const content = useContent(roles);
  const learned = useLiveQuery(async () => new Set((await db.userTerms.toArray()).filter((u) => u.card).map((u) => u.termId)), [], new Set<string>());
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<{ correct: number; total: number } | null>(null);

  const pool = useMemo(() => practicePool(content.terms, learned), [content.terms, learned]);
  const items = useMemo<Playable[]>(() => {
    if (mode === 'challenge') return buildChallenge(pool, { fillGap: t('quiz.fillGap'), listen: t('practice.listening.prompt') });
    if (mode === 'listening') return buildListening(pool, t('practice.listening.prompt'));
    return [];
  }, [mode, pool, round, t]); // eslint-disable-line react-hooks/exhaustive-deps

  async function finish(correct: number, total: number) {
    if (correct) await addXP(correct * XP_PER_CORRECT);
    setResult({ correct, total });
  }

  const close = <button type="button" onClick={() => navigate('/practice')} aria-label={t('common.close')} className="grid h-11 w-11 place-items-center rounded-xl text-ink-2"><X size={26} aria-hidden /></button>;
  const shell = (children: ReactNode, progress?: number) => (
    <main className="mx-auto flex min-h-dvh max-w-[640px] flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-[calc(env(safe-area-inset-top)+12px)]">
      <header className="mb-5 flex items-center gap-3">{close}{progress != null && <ProgressBar value={progress} className="flex-1" />}</header>
      {children}
    </main>
  );

  if (content.loading) return shell(<p className="text-ink-2">{t('common.loading')}</p>);
  if (pool.length < 4) return shell(<p className="mt-10 text-center text-ink-2">{t('practice.needWords')}</p>);

  if (result) {
    return shell(
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <Trophy size={72} className="text-sun-ink" aria-hidden />
        <h1 className="mt-5 text-3xl font-black">{t('practice.result.title')}</h1>
        <p className="mt-2 text-xl font-bold">{t('practice.result.score', { correct: result.correct, total: result.total })}</p>
        {result.correct > 0 && <p className="mt-1 font-bold text-[var(--accent)]">{t('practice.result.xp', { xp: result.correct * XP_PER_CORRECT })}</p>}
        <div className="mt-8 grid w-full gap-2.5">
          <Button onClick={() => { setResult(null); setRound(round + 1); }}>{t('practice.result.again')}</Button>
          <Button variant="secondary" onClick={() => navigate('/practice')}>{t('practice.result.back')}</Button>
        </div>
      </div>
    );
  }

  if (mode === 'match') return shell(<MatchGame key={round} pool={pool} onDone={(c, total) => void finish(c, total)} />);

  if (mode === 'speaking') return shell(<SpeakingDrill key={round} pool={pool} onDone={(c, total) => void finish(c, total)} />);

  if (!items.length) return shell(<p className="mt-10 text-center text-ink-2">{t('practice.needWords')}</p>);
  return shell(
    <QuizStep key={round} questions={items}
      onAnswer={(q, choice, correct) => { if (q.termId) void logQuizAttempt(q.termId, q.id, correct, { choice }); }}
      onDone={(c) => void finish(c, items.length)} />
  );
}

function MatchGame({ pool, onDone }: { pool: Term[]; onDone: (correct: number, total: number) => void }) {
  const { t } = useTranslation();
  const words = useMemo(() => shuffle(pool).slice(0, 5), [pool]);
  const right = useMemo(() => shuffle(words.map((w) => w.id)), [words]);
  const [matched, setMatched] = useState<string[]>([]);
  const [left, setLeft] = useState<string | null>(null);
  const [rightSel, setRightSel] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);

  useEffect(() => {
    if (!left || !rightSel) return;
    if (left === rightSel) { setMatched((m) => [...m, left]); navigator.vibrate?.(10); }
    else { setMistakes((n) => n + 1); setWrong([`l-${left}`, `r-${rightSel}`]); navigator.vibrate?.([30, 40, 30]); setTimeout(() => setWrong([]), 500); }
    setLeft(null); setRightSel(null);
  }, [left, rightSel]);
  useEffect(() => { if (matched.length === words.length && words.length) onDone(Math.max(0, words.length - mistakes), words.length); }, [matched]); // eslint-disable-line react-hooks/exhaustive-deps

  const state = (key: string, selected: boolean) => (wrong.includes(key) ? 'wrong' : selected ? 'selected' : 'idle');
  return (
    <div>
      <h1 className="text-2xl font-black">{t('practice.match.prompt')}</h1>
      <p className="mt-1 text-sm text-ink-2">{t('practice.match.mistakes', { count: mistakes })}</p>
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <div className="grid content-start gap-2.5">
          {words.map((w) => matched.includes(w.id) ? <div key={w.id} className="min-h-[64px]" /> : (
            <Choice key={w.id} state={state(`l-${w.id}`, left === w.id)} onClick={() => setLeft(left === w.id ? null : w.id)} className="min-h-[64px] justify-center text-center" trailing={null}><span lang="en">{w.term_en}</span></Choice>
          ))}
        </div>
        <div className="grid content-start gap-2.5">
          {right.map((id) => {
            const w = words.find((x) => x.id === id)!;
            return matched.includes(id) ? <div key={id} className="min-h-[64px]" /> : (
              <Choice key={id} state={state(`r-${id}`, rightSel === id)} onClick={() => setRightSel(rightSel === id ? null : id)} className="min-h-[64px] justify-center text-center text-sm" trailing={null}>{w.translation_fr}</Choice>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SpeakingDrill({ pool, onDone }: { pool: Term[]; onDone: (correct: number, total: number) => void }) {
  const { t } = useTranslation();
  const items = useMemo(() => shuffle(pool).slice(0, 3).filter((x) => x.sentences[0]), [pool]);
  const [i, setI] = useState(0);
  const [good, setGood] = useState(0);
  const term = items[i];
  if (!term) return null;
  return (
    <div className="flex flex-1 flex-col">
      <p className="mb-3 text-sm font-bold text-ink-2">{t('quiz.progress', { n: i + 1, total: items.length })}</p>
      <RepeatStep key={term.id} sentence={term.sentences[0]!} onDone={(o) => {
        const score = o.score ?? (o.selfRated === 'easy' ? 8 : o.selfRated === 'hard' ? 4 : 0);
        if (o.score != null || o.selfRated) void logSpeakingAttempt({ termId: term.id, sentenceId: term.sentences[0]!.id, transcript: o.transcript, score, recognizedRatio: o.recognizedRatio, ...(o.selfRated ? { selfRated: o.selfRated } : {}) });
        const ok = score >= 7 ? 1 : 0;
        if (i + 1 >= items.length) onDone(good + ok, items.length);
        else { setGood(good + ok); setI(i + 1); }
      }} />
    </div>
  );
}
