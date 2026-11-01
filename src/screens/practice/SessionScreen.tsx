import { useLiveQuery } from 'dexie-react-hooks';
import { Mic, Sparkles, Star, Trophy, Volume2, X } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/Button';
import { Choice } from '@/components/ui/Choice';
import { Confetti } from '@/components/ui/Confetti';
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
const ORAL_XP_PER_CORRECT = 10;

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
  const [challengeResult, setChallengeResult] = useState<{ quizScore: number; speakingScore: number; xp: number } | null>(null);

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
    if (correct) await addXP(correct * XP_PER_CORRECT);
    setResult({ correct, total });
  }

  function resetSession() {
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
              Quiz
            </span>
            <p className="mt-1 text-lg font-black text-ink">{challengeResult.quizScore} / 4</p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-3.5 text-center shadow-xs">
            <span className="inline-flex items-center gap-1 text-xs font-black uppercase text-violet">
              <Mic size={13} aria-hidden />
              Oral
            </span>
            <p className="mt-1 text-lg font-black text-ink">{challengeResult.speakingScore} / 2</p>
          </div>
        </div>

        {/* Total XP Gain */}
        {challengeResult.xp > 0 && (
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-4 py-1.5 font-black text-gold-ink text-sm ring-1 ring-gold/30">
            <Sparkles size={16} aria-hidden />
            +{challengeResult.xp} XP remportés
          </div>
        )}

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

  if (mode === 'match') return shell(<MatchGame key={round} pool={pool} onDone={(c, total) => void finish(c, total)} />);
  if (mode === 'speaking') return shell(<SpeakingDrill key={round} pool={pool} onDone={(c, total) => void finish(c, total)} />);

  // Challenge Mode: 4 quiz questions followed by 2 oral sentences
  if (mode === 'challenge') {
    if (!items.length) return shell(<p className="mt-10 text-center text-ink-2">{t('practice.needWords')}</p>);

    // Phase 1: 4 Quiz questions
    if (challengePhase === 'quiz') {
      return shell(
        <div className="flex flex-1 flex-col">
          <QuizStep
            key={`quiz-${round}`}
            questions={items}
            onAnswer={(q, choice, correct) => {
              if (q.termId) void logQuizAttempt(q.termId, q.id, correct, { choice });
            }}
            onDone={(score) => {
              setChallengeQuizScore(score);
              if (speakingPool.length >= 1) {
                setChallengePhase('speaking');
              } else {
                // If not enough sentences with speech, finish directly
                const xp = score * XP_PER_CORRECT;
                if (xp > 0) void addXP(xp);
                setChallengeResult({ quizScore: score, speakingScore: 0, xp });
              }
            }}
          />
        </div>,
        // Quiz progress is 0 to 4 out of 6
        items.length > 0 ? (4 / 6) * 0.7 : 0
      );
    }

    // Phase 2: 2 Oral Sentences
    const currentOralTerm = speakingPool[challengeSpeakingIndex];
    if (currentOralTerm && currentOralTerm.sentences?.[0]) {
      const sentence = currentOralTerm.sentences[0];
      const oralProgress = (4 + challengeSpeakingIndex) / (4 + speakingPool.length);

      return shell(
        <div className="flex flex-1 flex-col">
          {/* Oral Challenge Header Banner */}
          <div className="mb-4 rounded-2xl border border-violet/30 bg-violet-soft/60 p-3.5">
            <span className="text-xs font-black uppercase tracking-wider text-violet">
              {t('practice.challenge.oralKicker', 'Défi du jour · Étape orale')} ({challengeSpeakingIndex + 1}/{speakingPool.length})
            </span>
            <h2 className="mt-0.5 text-base font-black text-ink">
              {t('practice.challenge.oralTitle')}
            </h2>
            <p className="text-xs text-ink-2">
              {t('practice.challenge.oralSubtitle', 'Prononce ces phrases pour évaluer ton anglais parlé et valider ton défi.')}
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

              const isGood = score >= 6 ? 1 : 0;
              const nextGood = challengeSpeakingGood + isGood;

              if (challengeSpeakingIndex + 1 >= speakingPool.length) {
                // Done with all oral sentences!
                const totalXP = challengeQuizScore * XP_PER_CORRECT + nextGood * ORAL_XP_PER_CORRECT;
                if (totalXP > 0) await addXP(totalXP);
                setChallengeResult({
                  quizScore: challengeQuizScore,
                  speakingScore: nextGood,
                  xp: totalXP,
                });
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

  useEffect(() => {
    if (!left || !rightSel) return;
    if (left === rightSel) {
      setMatched((m) => [...m, left]);
      navigator.vibrate?.(10);
    } else {
      setMistakes((n) => n + 1);
      setWrong([`l-${left}`, `r-${rightSel}`]);
      navigator.vibrate?.([30, 40, 30]);
      setTimeout(() => setWrong([]), 500);
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

  return (
    <div>
      <h1 className="text-2xl font-black">{t('practice.match.prompt')}</h1>
      <p className="mt-1 text-sm text-ink-2">{t('practice.match.mistakes', { count: mistakes })}</p>
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
                trailing={null}
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
                trailing={null}
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
          const ok = score >= 7 ? 1 : 0;
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
