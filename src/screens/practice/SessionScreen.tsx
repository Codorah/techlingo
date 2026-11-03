import { useLiveQuery } from 'dexie-react-hooks';
import { Info, Mic, Sparkles, Star, Trophy, Volume2, X } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/Button';
import { Choice } from '@/components/ui/Choice';
import { Confetti } from '@/components/ui/Confetti';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { Term } from '@/content/schema';
import { addXP, getSetting, logQuizAttempt, logSpeakingAttempt, setSetting } from '@/data/progress';
import { db } from '@/db/db';
import { buildChallenge, buildListening, practicePool, shuffle } from '@/learning/practice';
import { localDay } from '@/learning/streak';
import { useContent } from '@/lib/useContent';
import { type Playable, QuizStep } from '@/screens/lesson/QuizStep';
import { REPEAT_PASS_SCORE, RepeatStep } from '@/screens/lesson/RepeatStep';
import { OrderGame } from './OrderGame';

type Mode = 'challenge' | 'listening' | 'speaking' | 'match' | 'order';
const XP_PER_CORRECT = 5;
const ORAL_XP_PER_CORRECT = 10;
// The daily challenge rewards XP once per local day; replays are practice only.
const CHALLENGE_DAY_KEY = 'challengeDoneDay';

export function SessionScreen() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { mode } = useParams<{ mode: Mode }>();
  const profile = useLiveQuery(() => db.profile.get('me'));
  const roles = profile?.primaryRole ? [profile.primaryRole, ...profile.secondaryRoles] : [];
  const content = useContent(roles);
  const learned = useLiveQuery(async () => new Set((await db.userTerms.toArray()).filter((u) => u.card).map((u) => u.termId)), [], new Set<string>());
  const [round, setRound] = useState(0);

  // General result
  const [result, setResult] = useState<{ correct: number; total: number } | null>(null);

  // Challenge-specific state
  const [challengePhase, setChallengePhase] = useState<'quiz' | 'speaking'>('quiz');
  const [challengeQuizScore, setChallengeQuizScore] = useState<number>(0);
  const [challengeSpeakingIndex, setChallengeSpeakingIndex] = useState<number>(0);
  const [challengeSpeakingGood, setChallengeSpeakingGood] = useState<number>(0);
  const [challengeQuizIndex, setChallengeQuizIndex] = useState(0);
  const [challengeResult, setChallengeResult] = useState<{ quizScore: number; quizTotal: number; speakingScore: number; speakingTotal: number; xp: number; replay: boolean } | null>(null);
  const challengeDoneToday = useLiveQuery(async () => (await db.settings.get(CHALLENGE_DAY_KEY))?.value === localDay(), [], false);
  // XP is awarded once per finished session, even on a double tap.
  const awarded = useRef(false);

  const pool = useMemo(() => practicePool(content.terms, learned), [content.terms, learned]);
  const items = useMemo<Playable[]>(() => {
    if (mode === 'challenge') return buildChallenge(pool, { fillGap: t('quiz.fillGap'), listen: t('practice.listening.prompt') });
    if (mode === 'listening') return buildListening(pool, t('practice.listening.prompt'));
    return [];
  }, [mode, pool, round, t]); // eslint-disable-line react-hooks/exhaustive-deps

  const speakingPool = useMemo(() => {
    if (mode !== 'challenge') return [];
    return shuffle(pool.filter((term) => term.sentences && term.sentences.length > 0)).slice(0, 2);
  }, [mode, pool, round]);

  async function finish(correct: number, total: number) {
    if (awarded.current) return;
    awarded.current = true;
    if (correct) await addXP(correct * XP_PER_CORRECT);
    setResult({ correct, total });
  }

  async function finishChallenge(quizScore: number, speakingScore: number, speakingTotal: number) {
    if (awarded.current) return;
    awarded.current = true;
    const today = localDay();
    const replay = (await getSetting<string | null>(CHALLENGE_DAY_KEY, null)) === today;
    const xp = replay ? 0 : quizScore * XP_PER_CORRECT + speakingScore * ORAL_XP_PER_CORRECT;
    if (!replay) await setSetting(CHALLENGE_DAY_KEY, today);
    if (xp > 0) await addXP(xp);
    setChallengeResult({ quizScore, quizTotal: items.length, speakingScore, speakingTotal, xp, replay });
  }

  function resetSession() {
    awarded.current = false;
    setChallengeQuizIndex(0);
    setResult(null);
    setChallengeResult(null);
    setChallengePhase('quiz');
    setChallengeQuizScore(0);
    setChallengeSpeakingIndex(0);
    setChallengeSpeakingGood(0);
    setRound((r) => r + 1);
  }

  const close = (
    <button
      type="button"
      onClick={() => navigate('/practice')}
      aria-label={t('common.close')}
      className="grid h-11 w-11 place-items-center rounded-xl text-ink-2 transition-transform active:scale-95 hover:bg-mist"
    >
      <X size={26} aria-hidden />
    </button>
  );

  const shell = (children: ReactNode, progress?: number) => (
    <main className="mx-auto flex min-h-dvh max-w-[640px] flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-[calc(env(safe-area-inset-top)+12px)]">
      <header className="mb-5 flex items-center gap-3">
        {close}
        {progress != null && <ProgressBar value={progress} className="flex-1" />}
      </header>
      {children}
    </main>
  );

  if (content.loading) return shell(<p className="text-ink-2">{t('common.loading')}</p>);
  if (pool.length < 4) return shell(<p className="mt-10 text-center text-ink-2">{t('practice.needWords')}</p>);

  // Celebration screen for Daily Challenge
  if (challengeResult) {
    return shell(
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <Confetti pieces={80} />
        <div className="relative mb-3 grid h-24 w-24 place-items-center rounded-full bg-sun/40 ring-4 ring-gold/30">
          <Trophy size={54} className="text-sun-ink animate-bounce" aria-hidden />
          <span className="absolute -top-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-gold text-white font-black text-xs shadow-md"><Star size={14} fill="currentColor" aria-hidden /></span>
        </div>

        <h1 className="mt-2 text-2xl sm:text-3xl font-black text-ink">
          {t('practice.challenge.summaryTitle', 'Défi du jour validé !')}
        </h1>
        <p className="mt-1 max-w-sm text-sm text-ink-2 font-medium">
          {t('practice.challenge.summarySubtitle', 'Tu as travaillé ta compréhension écrite, ton écoute et ta prononciation.')}
        </p>

        {/* Score Breakdown Cards */}
        <div className="mt-6 grid w-full grid-cols-2 gap-3 max-w-sm">
          <div className="rounded-2xl border border-line bg-surface p-3.5 text-center shadow-xs">
            <span className="inline-flex items-center gap-1 text-xs font-black uppercase text-ocean">
              <Volume2 size={13} aria-hidden />
              {t('practice.challenge.quizLabel')}
            </span>
            <p className="mt-1 text-lg font-black text-ink">{challengeResult.quizScore} / {challengeResult.quizTotal}</p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-3.5 text-center shadow-xs">
            <span className="inline-flex items-center gap-1 text-xs font-black uppercase text-violet">
              <Mic size={13} aria-hidden />
              {t('practice.challenge.oralLabel')}
            </span>
            <p className="mt-1 text-lg font-black text-ink">{challengeResult.speakingScore} / {challengeResult.speakingTotal}</p>
          </div>
        </div>

        {/* Total XP Gain */}
        {challengeResult.xp > 0 && (
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-4 py-1.5 font-black text-gold-ink text-sm ring-1 ring-gold/30">
            <Sparkles size={16} aria-hidden />
            {t('practice.challenge.xpWon', { xp: challengeResult.xp })}
          </div>
        )}
        {challengeResult.replay && <p className="mt-4 max-w-sm text-sm font-semibold text-ink-2">{t('practice.challenge.replayNoXp')}</p>}

        <div className="mt-8 grid w-full max-w-sm gap-2.5">
          <Button onClick={resetSession}>{t('practice.result.again')}</Button>
          <Button variant="secondary" onClick={() => navigate('/practice')}>
            {t('practice.result.back')}
          </Button>
        </div>
      </div>
    );
  }

  // Standard Result Screen for listening / match / speaking
  if (result) {
    return shell(
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <Trophy size={72} className="text-sun-ink" aria-hidden />
        <h1 className="mt-5 text-3xl font-black">{t('practice.result.title')}</h1>
        <p className="mt-2 text-xl font-bold">{t('practice.result.score', { correct: result.correct, total: result.total })}</p>
        {result.correct > 0 && <p className="mt-1 font-bold text-[var(--accent)]">{t('practice.result.xp', { xp: result.correct * XP_PER_CORRECT })}</p>}
        <div className="mt-8 grid w-full gap-2.5">
          <Button onClick={resetSession}>{t('practice.result.again')}</Button>
          <Button variant="secondary" onClick={() => navigate('/practice')}>{t('practice.result.back')}</Button>
        </div>
      </div>
    );
  }

  if (mode === 'order') return shell(<OrderGame key={round} pool={pool} onDone={(c, total) => void finish(c, total)} />);
  if (mode === 'match') return shell(<MatchGame key={round} pool={pool} onDone={(c, total) => void finish(c, total)} />);
  if (mode === 'speaking') return shell(<SpeakingDrill key={round} pool={pool} onDone={(c, total) => void finish(c, total)} />);

  // Challenge Mode: the quiz questions (up to 6) followed by up to 2 oral sentences
  if (mode === 'challenge') {
    const steps = items.length + speakingPool.length;
    if (!items.length) return shell(<p className="mt-10 text-center text-ink-2">{t('practice.needWords')}</p>);

    // Phase 1: the quiz questions
    if (challengePhase === 'quiz') {
      return shell(
        <div className="flex flex-1 flex-col">
          {challengeDoneToday && (
            <p className="mb-4 flex items-start gap-2 rounded-2xl bg-surface p-3 text-sm font-semibold text-ink-2">
              <Info size={18} className="mt-0.5 flex-none" aria-hidden />{t('practice.challenge.replayNoXp')}
            </p>
          )}
          <QuizStep
            key={`quiz-${round}`}
            questions={items}
            onProgress={setChallengeQuizIndex}
            onAnswer={(q, choice, correct) => {
              if (q.termId) void logQuizAttempt(q.termId, q.id, correct, { choice });
            }}
            onDone={(score) => {
              setChallengeQuizScore(score);
              if (speakingPool.length >= 1) setChallengePhase('speaking');
              else void finishChallenge(score, 0, 0); // no sentence to say: finish directly
            }}
          />
        </div>,
        steps ? challengeQuizIndex / steps : 0
      );
    }

    // Phase 2: the oral sentences
    const currentOralTerm = speakingPool[challengeSpeakingIndex];
    if (currentOralTerm && currentOralTerm.sentences?.[0]) {
      const sentence = currentOralTerm.sentences[0];
      const oralProgress = (items.length + challengeSpeakingIndex) / steps;

      return shell(
        <div className="flex flex-1 flex-col">
          {/* Oral Challenge Header Banner */}
          <div className="mb-4 rounded-2xl border border-violet/30 bg-violet-soft/60 p-3.5">
            <span className="text-xs font-black uppercase tracking-wider text-violet">
              {t('practice.challenge.oralKicker')} ({challengeSpeakingIndex + 1}/{speakingPool.length})
            </span>
            <h2 className="mt-0.5 text-base font-black text-ink">
              {t('practice.challenge.oralTitle')}
            </h2>
            <p className="text-xs text-ink-2">
              {t('practice.challenge.oralSubtitle', { count: speakingPool.length })}
            </p>
          </div>

          <RepeatStep
            key={`challenge-oral-${currentOralTerm.id}-${challengeSpeakingIndex}`}
            sentence={sentence}
            onDone={async (o) => {
              const score = o.score ?? (o.selfRated === 'easy' ? 8 : o.selfRated === 'hard' ? 4 : 0);
              if (o.score != null || o.selfRated) {
                void logSpeakingAttempt({
                  termId: currentOralTerm.id,
                  sentenceId: sentence.id,
                  transcript: o.transcript,
                  score,
                  recognizedRatio: o.recognizedRatio,
                  ...(o.selfRated ? { selfRated: o.selfRated } : {}),
                });
              }

              const isGood = score >= REPEAT_PASS_SCORE ? 1 : 0;
              const nextGood = challengeSpeakingGood + isGood;

              if (challengeSpeakingIndex + 1 >= speakingPool.length) {
                // Done with all oral sentences!
                await finishChallenge(challengeQuizScore, nextGood, speakingPool.length);
              } else {
                setChallengeSpeakingGood(nextGood);
                setChallengeSpeakingIndex((i) => i + 1);
              }
            }}
          />
        </div>,
        oralProgress
      );
    }
  }

  // Listening Mode
  if (!items.length) return shell(<p className="mt-10 text-center text-ink-2">{t('practice.needWords')}</p>);
  return shell(
    <QuizStep
      key={round}
      questions={items}
      onAnswer={(q, choice, correct) => {
        if (q.termId) void logQuizAttempt(q.termId, q.id, correct, { choice });
      }}
      onDone={(c) => void finish(c, items.length)}
    />
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
  const wrongTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(wrongTimer.current), []);

  useEffect(() => {
    if (!left || !rightSel) return;
    if (left === rightSel) {
      setMatched((m) => [...m, left]);
      navigator.vibrate?.(10);
    } else {
      setMistakes((n) => n + 1);
      setWrong([`l-${left}`, `r-${rightSel}`]);
      navigator.vibrate?.([30, 40, 30]);
      clearTimeout(wrongTimer.current);
      wrongTimer.current = setTimeout(() => setWrong([]), 900);
    }
    setLeft(null);
    setRightSel(null);
  }, [left, rightSel]);

  useEffect(() => {
    if (matched.length === words.length && words.length) {
      onDone(Math.max(0, words.length - mistakes), words.length);
    }
  }, [matched]); // eslint-disable-line react-hooks/exhaustive-deps

  const state = (key: string, selected: boolean) => (wrong.includes(key) ? 'wrong' : selected ? 'selected' : 'idle');
  // A wrong pair is shown with an icon and a message too, never by colour alone.
  const mark = (key: string) => (wrong.includes(key) ? <X size={20} aria-hidden /> : null);

  return (
    <div>
      <h1 className="text-2xl font-black">{t('practice.match.prompt')}</h1>
      <p className="mt-1 text-sm text-ink-2" aria-live="polite">
        {wrong.length > 0 && <span className="font-bold text-danger">{t('practice.match.wrongPair')} </span>}
        {t('practice.match.mistakes', { count: mistakes })}
      </p>
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <div className="grid content-start gap-2.5">
          {words.map((w) =>
            matched.includes(w.id) ? (
              <div key={w.id} className="min-h-[64px]" />
            ) : (
              <Choice
                key={w.id}
                state={state(`l-${w.id}`, left === w.id)}
                onClick={() => setLeft(left === w.id ? null : w.id)}
                className="min-h-[64px] justify-center text-center"
                trailing={mark(`l-${w.id}`)}
              >
                <span lang="en">{w.term_en}</span>
              </Choice>
            )
          )}
        </div>
        <div className="grid content-start gap-2.5">
          {right.map((id) => {
            const w = words.find((x) => x.id === id)!;
            return matched.includes(id) ? (
              <div key={id} className="min-h-[64px]" />
            ) : (
              <Choice
                key={id}
                state={state(`r-${id}`, rightSel === id)}
                onClick={() => setRightSel(rightSel === id ? null : id)}
                className="min-h-[64px] justify-center text-center text-sm"
                trailing={mark(`r-${id}`)}
              >
                {w.translation_fr}
              </Choice>
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
      <RepeatStep
        key={term.id}
        sentence={term.sentences[0]!}
        onDone={(o) => {
          const score = o.score ?? (o.selfRated === 'easy' ? 8 : o.selfRated === 'hard' ? 4 : 0);
          if (o.score != null || o.selfRated) {
            void logSpeakingAttempt({
              termId: term.id,
              sentenceId: term.sentences[0]!.id,
              transcript: o.transcript,
              score,
              recognizedRatio: o.recognizedRatio,
              ...(o.selfRated ? { selfRated: o.selfRated } : {}),
            });
          }
          const ok = score >= REPEAT_PASS_SCORE ? 1 : 0;
          if (i + 1 >= items.length) onDone(good + ok, items.length);
          else {
            setGood(good + ok);
            setI(i + 1);
          }
        }}
      />
    </div>
  );
}
