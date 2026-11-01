import { Flame, Keyboard, Mic, Shuffle, Square, Turtle, Volume2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { FeedbackSheet, type FeedbackTone } from '@/components/ui/FeedbackSheet';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { PathTerm } from '@/content/schema';
import type { WordResult } from '@/data/path';
import { gradeTyped, normalize, SPOKEN_PASS, spokenScore, tiles } from '@/learning/answer';
import { sounds } from '@/lib/sound';
import { canRecognize, listen, speak, stopSpeaking } from '@/lib/speech';

// Recall = production, not recognition: the learner types, rebuilds or SAYS the English.
type Kind = 'type' | 'dictation' | 'order' | 'say';
interface Exercise { kind: Kind; term: PathTerm; target: string }

const ROTATION: Kind[][] = [['type', 'say'], ['dictation', 'order'], ['type', 'order'], ['dictation', 'say'], ['type', 'say']];

function seededShuffle<T>(items: T[], seed: number): T[] {
  const out = [...items];
  let h = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export function buildExercises(terms: PathTerm[]): Exercise[] {
  const all = terms.flatMap((term, i) => ROTATION[i % ROTATION.length]!.flatMap((kind): Exercise[] => {
    const sentence = term.sentence_en && tiles(term.sentence_en).length <= 14 ? term.sentence_en : undefined;
    if (kind === 'order' || kind === 'say') {
      if (!sentence) return [{ kind: 'type', term, target: term.term_en }];
      return [{ kind, term, target: sentence }];
    }
    return [{ kind, term, target: term.term_en }];
  }));
  // Recall first, then sentences, then speaking as the finale.
  const rank: Record<Kind, number> = { type: 0, dictation: 0, order: 1, say: 2 };
  return all.sort((a, b) => rank[a.kind] - rank[b.kind]);
}

export function RecallSession({ terms, onClose, onDone }: {
  terms: PathTerm[]; onClose: () => void; onDone: (r: { results: WordResult[]; correct: number; total: number; bestCombo: number }) => void;
}) {
  const { t } = useTranslation();
  const exercises = useMemo(() => buildExercises(terms), [terms]);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<{ tone: FeedbackTone; ok: boolean } | null>(null);
  const [combo, setCombo] = useState(0);
  const results = useRef(new Map<string, WordResult>());
  const stats = useRef({ correct: 0, best: 0 });
  const ex = exercises[index];

  useEffect(() => () => stopSpeaking(), []);

  function answer(tone: FeedbackTone) {
    const ok = tone !== 'wrong';
    const r = results.current.get(ex!.term.id) ?? { termId: ex!.term.id, correct: 0, total: 0 };
    results.current.set(ex!.term.id, { ...r, correct: r.correct + Number(ok), total: r.total + 1 });
    if (ok) { stats.current.correct++; sounds.correct(); navigator.vibrate?.(10); } else { sounds.wrong(); navigator.vibrate?.([30, 40, 30]); }
    const next = ok ? combo + 1 : 0;
    stats.current.best = Math.max(stats.current.best, next);
    setCombo(next);
    setFeedback({ tone, ok });
  }

  function next() {
    setFeedback(null);
    if (index + 1 >= exercises.length) {
      onDone({ results: [...results.current.values()], correct: stats.current.correct, total: exercises.length, bestCombo: stats.current.best });
    } else setIndex(index + 1);
  }

  if (!ex) return null;
  return (
    <main className="mx-auto flex min-h-dvh max-w-[640px] flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+180px)] pt-[calc(env(safe-area-inset-top)+12px)]">
      <header className="mb-6 flex items-center gap-3">
        <button type="button" onClick={onClose} aria-label={t('common.close')} className="grid h-11 w-11 flex-none place-items-center rounded-xl text-ink-2 active:bg-surface"><X size={26} aria-hidden /></button>
        <ProgressBar value={index / exercises.length} label={t('course.node.recall')} className="flex-1" />
        {combo >= 2 && (
          <span key={combo} className="inline-flex animate-[pop_.25s_var(--ease-out-quart)] items-center gap-1 rounded-full bg-flame-soft px-2.5 py-1 text-sm font-black text-flame-ink" aria-label={t('recall.combo', { count: combo })}>
            <Flame size={16} aria-hidden />{combo}
          </span>
        )}
      </header>
      <div key={index} className="flex flex-1 animate-[enter_.25s_var(--ease-out-quart)] flex-col">
        {ex.kind === 'type' && <TypeIt ex={ex} locked={!!feedback} onAnswer={answer} />}
        {ex.kind === 'dictation' && <Dictation ex={ex} locked={!!feedback} onAnswer={answer} />}
        {ex.kind === 'order' && <Order ex={ex} seed={index + 7} locked={!!feedback} onAnswer={answer} />}
        {ex.kind === 'say' && <Say ex={ex} locked={!!feedback} onAnswer={answer} />}
      </div>
      {feedback && (
        <FeedbackSheet tone={feedback.tone} onContinue={next}
          title={feedback.tone === 'correct' ? t(combo >= 3 ? 'recall.fb.streak' : 'recall.fb.correct', { count: combo }) : feedback.tone === 'close' ? t('recall.fb.close') : t('recall.fb.wrong')}>
          {feedback.tone !== 'correct' && <p><span className="font-bold">{t('recall.fb.answer')} </span><span lang="en" className="font-black">{ex.target}</span></p>}
          {!feedback.ok && <p className="mt-1 text-sm text-ink-2">{ex.term.term_en} : {ex.term.translation_fr}. {ex.term.explanation_fr}</p>}
        </FeedbackSheet>
      )}
    </main>
  );
}

type StepProps = { ex: Exercise; locked: boolean; onAnswer: (tone: FeedbackTone) => void };

function Kicker({ Icon, children }: { Icon: typeof Mic; children: React.ReactNode }) {
  return <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[var(--accent)]"><Icon size={18} aria-hidden />{children}</p>;
}

function TextAnswer({ locked, onSubmit, placeholder }: { locked: boolean; onSubmit: (v: string) => void; placeholder: string }) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  return (
    <form className="mt-6 flex flex-1 flex-col" onSubmit={(e) => { e.preventDefault(); if (value.trim() && !locked) onSubmit(value); }}>
      <input value={value} onChange={(e) => setValue(e.target.value)} readOnly={locked} lang="en" autoFocus autoCapitalize="none" autoCorrect="off" spellCheck={false}
        aria-label={placeholder} placeholder={placeholder}
        className="min-h-14 w-full rounded-2xl border-2 border-line bg-surface px-4 text-lg font-semibold outline-none placeholder:font-normal placeholder:text-ink-2 focus:border-[var(--accent)]" />
      <span className="flex-1" />
      {!locked && <Button className="mt-6" variant="success" disabled={!value.trim()} type="submit">{t('quiz.check')}</Button>}
    </form>
  );
}

function TypeIt({ ex, locked, onAnswer }: StepProps) {
  const { t } = useTranslation();
  return (
    <>
      <Kicker Icon={Keyboard}>{t('recall.type.kicker')}</Kicker>
      <h1 className="mt-2 text-2xl font-black leading-snug">{t('recall.type.title')}</h1>
      <div className="mt-4 rounded-2xl border-2 border-line bg-surface p-5 shadow-[0_4px_0_var(--color-line)]">
        <p className="text-2xl font-black text-[var(--accent)]">{ex.term.translation_fr}</p>
        <p className="mt-2 text-ink-2">{ex.term.explanation_fr}</p>
      </div>
      <TextAnswer locked={locked} placeholder={t('recall.type.placeholder')} onSubmit={(v) => onAnswer(toTone(gradeTyped(v, ex.target)))} />
    </>
  );
}

function Dictation({ ex, locked, onAnswer }: StepProps) {
  const { t } = useTranslation();
  useEffect(() => { const id = setTimeout(() => speak(ex.target), 300); return () => clearTimeout(id); }, [ex.target]);
  return (
    <>
      <Kicker Icon={Volume2}>{t('recall.dictation.kicker')}</Kicker>
      <h1 className="mt-2 text-2xl font-black leading-snug">{t('recall.dictation.title')}</h1>
      <div className="mt-5 flex items-center justify-center gap-4">
        <button type="button" onClick={() => speak(ex.target)} aria-label={t('common.listen')}
          className="grid h-24 w-24 place-items-center rounded-3xl bg-[var(--accent)] text-on-ocean shadow-[0_6px_0_var(--accent-press)] active:translate-y-1.5 active:shadow-none"><Volume2 size={44} aria-hidden /></button>
        <button type="button" onClick={() => speak(ex.target, { slow: true })} aria-label={t('recall.slow')}
          className="grid h-16 w-16 place-items-center rounded-2xl border-2 border-line bg-surface text-[var(--accent)] shadow-[0_4px_0_var(--color-line)] active:translate-y-1 active:shadow-none"><Turtle size={28} aria-hidden /></button>
      </div>
      <TextAnswer locked={locked} placeholder={t('recall.dictation.placeholder')} onSubmit={(v) => onAnswer(toTone(gradeTyped(v, ex.target)))} />
    </>
  );
}

function Order({ ex, seed, locked, onAnswer }: StepProps & { seed: number }) {
  const { t } = useTranslation();
  const words = useMemo(() => tiles(ex.target), [ex.target]);
  const bank = useMemo(() => {
    const s = seededShuffle(words.map((w, i) => ({ w, i })), seed);
    return s.every((x, k) => x.i === k) ? [...s].reverse() : s;
  }, [words, seed]);
  const [picked, setPicked] = useState<number[]>([]);
  const built = picked.map((i) => words[i]!).join(' ');
  return (
    <>
      <Kicker Icon={Shuffle}>{t('recall.order.kicker')}</Kicker>
      <h1 className="mt-2 text-2xl font-black leading-snug">{t('recall.order.title')}</h1>
      {ex.term.sentence_fr && <p className="mt-2 text-lg text-ink-2">« {ex.term.sentence_fr} »</p>}
      <div className="mt-5 flex min-h-[112px] flex-wrap content-start gap-2 border-y-2 border-line py-3" aria-label={t('recall.order.answer')}>
        {picked.map((i, k) => (
          <button key={`${i}-${k}`} type="button" disabled={locked} onClick={() => setPicked(picked.filter((_, x) => x !== k))} lang="en"
            className="min-h-11 animate-[pop_.15s_var(--ease-out-quart)] rounded-xl border-2 border-line bg-surface px-3 font-semibold shadow-[0_3px_0_var(--color-line)]">{words[i]}</button>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {bank.map(({ w, i }) => {
          const used = picked.includes(i);
          return (
            <button key={i} type="button" disabled={used || locked} onClick={() => setPicked([...picked, i])} lang="en"
              className={`min-h-11 rounded-xl border-2 px-3 font-semibold ${used ? 'border-line bg-line text-transparent' : 'border-line bg-surface shadow-[0_3px_0_var(--color-line)] active:translate-y-0.5 active:shadow-none'}`}>{w}</button>
          );
        })}
      </div>
      <span className="flex-1" />
      {!locked && <Button className="mt-6" variant="success" disabled={picked.length !== words.length}
        onClick={() => onAnswer(normalize(built) === normalize(ex.target) ? 'correct' : 'wrong')}>{t('quiz.check')}</Button>}
    </>
  );
}

function Say({ ex, locked, onAnswer }: StepProps) {
  const { t } = useTranslation();
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState('');
  const [error, setError] = useState<string | null>(null);
  const stopRef = useRef<() => void>(() => {});
  const supported = canRecognize();
  useEffect(() => () => stopRef.current(), []);

  async function record() {
    if (listening) { stopRef.current(); return; }
    stopSpeaking(); setError(null); setHeard(''); setListening(true);
    const { done, stop } = listen(setHeard);
    stopRef.current = stop;
    try {
      const text = await done;
      setHeard(text);
      if (text) onAnswer(spokenScore(text, ex.target) >= SPOKEN_PASS ? 'correct' : spokenScore(text, ex.target) >= 0.45 ? 'close' : 'wrong');
      else setError(t('recall.say.nothing'));
    } catch (e) {
      setError(e === 'not-allowed' ? t('recall.say.denied') : t('recall.say.nothing'));
    } finally { setListening(false); }
  }

  return (
    <div style={{ ['--accent' as string]: 'var(--color-violet)', ['--accent-press' as string]: 'var(--color-violet-press)', ['--accent-soft' as string]: 'var(--color-violet-soft)' }} className="flex flex-1 flex-col">
      <Kicker Icon={Mic}>{t('recall.say.kicker')}</Kicker>
      <h1 className="mt-2 text-2xl font-black leading-snug">{t('recall.say.title')}</h1>
      <button type="button" onClick={() => speak(ex.target)} className="mt-4 flex gap-3 rounded-2xl border-2 border-line bg-surface p-4 text-left shadow-[0_4px_0_var(--color-line)] active:translate-y-1 active:shadow-none">
        <Volume2 size={24} className="mt-0.5 flex-none text-[var(--accent)]" aria-hidden />
        <span><span lang="en" className="block text-lg font-bold leading-snug">{ex.target}</span>{ex.term.sentence_fr && <span className="mt-1 block text-sm text-ink-2">{ex.term.sentence_fr}</span>}</span>
      </button>
      <div className="flex flex-1 flex-col items-center justify-center py-6">
        {supported ? (
          <>
            <button type="button" onClick={() => void record()} disabled={locked} aria-pressed={listening}
              aria-label={listening ? t('recall.say.stop') : t('recall.say.start')}
              className={`relative grid h-28 w-28 place-items-center rounded-full bg-[var(--accent)] text-white shadow-[0_6px_0_var(--accent-press)] active:translate-y-1.5 active:shadow-none disabled:opacity-50 ${listening ? 'animate-[glow_1.4s_ease-in-out_infinite]' : ''}`}>
              {listening ? <Square size={40} aria-hidden /> : <Mic size={48} aria-hidden />}
            </button>
            {listening && (
              <span className="mt-4 flex h-8 items-center gap-1" aria-hidden>
                {[0, 1, 2, 3, 4].map((i) => <span key={i} className="h-full w-1.5 origin-center animate-[wave_.9s_ease-in-out_infinite] rounded-full bg-[var(--accent)] motion-reduce:animate-none" style={{ animationDelay: `${i * 0.12}s` }} />)}
              </span>
            )}
            <p className="mt-4 text-center font-bold text-ink-2">{listening ? t('recall.say.listening') : t('recall.say.tap')}</p>
            {heard && <p lang="en" className="mt-2 max-w-sm text-center italic text-ink">« {heard} »</p>}
            {error && <p className="mt-2 text-center font-semibold text-danger">{error}</p>}
          </>
        ) : (
          <p className="max-w-sm text-center text-ink-2">{t('recall.say.unsupported')}</p>
        )}
      </div>
      {!locked && (
        <Button variant="ghost" onClick={() => { stopRef.current(); onAnswer(supported ? 'close' : 'correct'); }}>
          {supported ? t('recall.say.skip') : t('recall.say.said')}
        </Button>
      )}
    </div>
  );
}

const toTone = (g: ReturnType<typeof gradeTyped>): FeedbackTone => (g === 'exact' ? 'correct' : g === 'typo' ? 'close' : 'wrong');
