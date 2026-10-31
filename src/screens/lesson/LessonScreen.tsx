import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowRight, Download, House, Lightbulb, MapPin, RotateCw, Turtle, Volume2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { Term } from '@/content/schema';
import { completeLesson, type LessonOutcome, logQuizAttempt, logSpeakingAttempt, saveLessonStep, spinStatus, startLesson } from '@/data/progress';
import { db } from '@/db/db';
import { canPromptInstall, promptInstall } from '@/lib/install';
import { speak } from '@/lib/speech';
import { useContent } from '@/lib/useContent';
import { QuizStep, toPlayable } from './QuizStep';
import { RepeatStep, type RepeatOutcome } from './RepeatStep';

type StepId = 'discover' | 'understand' | 'context' | 'examples' | 'related' | 'repeat' | 'quiz';

function stepsFor(term: Term): StepId[] {
  const s: StepId[] = ['discover', 'understand'];
  if (term.context_fr.length) s.push('context');
  s.push('examples');
  if (term.common_mistakes.length || term.related_terms.length) s.push('related');
  s.push('repeat', 'quiz');
  return s;
}

const relativeDay = (iso: string) => {
  const days = Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000);
  return new Intl.RelativeTimeFormat('fr', { numeric: 'auto' }).format(Math.max(0, days), 'day');
};

export function LessonScreen() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { termId } = useParams<{ termId: string }>();
  const profile = useLiveQuery(() => db.profile.get('me'));
  const roles = profile?.primaryRole ? [profile.primaryRole, ...profile.secondaryRoles] : [];
  const content = useContent(roles);
  const term = content.byId.get(termId);

  const [stepIndex, setStepIndex] = useState(0);
  const [session, setSession] = useState<string | null>(null);
  const [speakScore, setSpeakScore] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<(LessonOutcome & { quizCorrect: number; quizTotal: number; bonus: boolean }) | null>(null);
  const [installable, setInstallable] = useState(false);
  const started = useRef(false);

  // Resume an unfinished lesson on this word, or start a new one.
  useEffect(() => {
    if (!term || started.current) return;
    started.current = true;
    void (async () => {
      const open = (await db.lessonSessions.where('termId').equals(term.id).toArray())
        .filter((s) => !s.completedAt && Date.now() - Date.parse(s.startedAt) < 86_400_000)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
      if (open) { setSession(open.id); setStepIndex(Math.min(open.step, stepsFor(term).length - 1)); }
      else setSession(await startLesson(term.id));
    })();
  }, [term]);

  const steps = term ? stepsFor(term) : [];
  const step = steps[stepIndex];
  const questions = useMemo(() => (term?.quiz ?? [])
    .map((q) => toPlayable(q, t('quiz.fillGap')))
    .filter((q): q is NonNullable<typeof q> => !!q)
    .slice(0, 3), [term, t]);

  const goNext = () => {
    const n = stepIndex + 1;
    setStepIndex(n);
    if (session) void saveLessonStep(session, n);
    window.scrollTo({ top: 0 });
  };

  async function finish(quizCorrect: number) {
    if (!term || !session) return;
    const result = await completeLesson(session, term.id, quizCorrect, questions.length, speakScore);
    const status = await spinStatus();
    setOutcome({ ...result, quizCorrect, quizTotal: questions.length, bonus: status.bonusAvailable });
    setInstallable(canPromptInstall());
    navigator.vibrate?.([12, 40, 12]);
  }

  if (content.error) return <main className="grid min-h-dvh place-items-center p-6 text-center text-ink-2">{t('errors.content')}</main>;
  if (!term) return <main className="grid min-h-dvh place-items-center text-ink-2">{t('common.loading')}</main>;

  if (outcome) {
    const perfect = outcome.quizCorrect === outcome.quizTotal;
    return (
      <main className="mx-auto flex min-h-dvh max-w-[640px] flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-[calc(env(safe-area-inset-top)+24px)] text-center">
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="grid h-28 w-28 animate-[pop_.5s_var(--ease-out-quart)] place-items-center rounded-full bg-sun font-title text-5xl font-black text-sun-ink">+{outcome.xp}</div>
          <h1 className="mt-6 text-3xl font-black">{perfect ? t('result.title') : t('result.soft')}</h1>
          <p className="mt-2 text-lg text-ink-2">{t('result.text', { term: term.term_en })}</p>
          <div className="mt-6 grid w-full grid-cols-3 gap-2.5">
            <Card className="p-3"><p className="text-xs font-bold text-ink-2">{t('result.xp')}</p><p className="mt-1 text-xl font-black text-ocean">{outcome.xp}</p></Card>
            <Card className="p-3"><p className="text-xs font-bold text-ink-2">{t('result.quiz')}</p><p className="mt-1 text-xl font-black text-mint-ink">{outcome.quizCorrect}/{outcome.quizTotal}</p></Card>
            <Card className="p-3"><p className="text-xs font-bold text-ink-2">{t('result.next')}</p><p className="mt-1 text-base font-black">{relativeDay(outcome.nextDue)}</p></Card>
          </div>
          {outcome.usedFreeze && <p className="mt-4 rounded-2xl bg-mint p-3 text-sm font-bold text-mint-ink">{t('result.freeze')}</p>}
          {installable && (
            <Card className="mt-4 w-full text-left">
              <p className="font-extrabold">{t('result.install.title')}</p>
              <p className="mt-1 text-sm text-ink-2">{t('result.install.text')}</p>
              <Button variant="secondary" className="mt-3" icon={<Download size={20} aria-hidden />} onClick={() => void promptInstall().then(() => setInstallable(false))}>{t('result.install.cta')}</Button>
            </Card>
          )}
        </div>
        {outcome.bonus && <Button variant="secondary" className="mb-2" icon={<RotateCw size={20} aria-hidden />} onClick={() => navigate('/spin')}>{t('result.bonus')}</Button>}
        <Button icon={<House size={20} aria-hidden />} onClick={() => navigate('/', { replace: true })}>{t('result.home')}</Button>
      </main>
    );
  }

  const sentence = term.sentences[0]!;
  return (
    <main className="mx-auto flex min-h-dvh max-w-[640px] flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-[calc(env(safe-area-inset-top)+12px)]">
      <header className="mb-5 flex items-center gap-3">
        <button type="button" onClick={() => navigate('/')} aria-label={t('lesson.quit')} className="grid h-11 w-11 flex-none place-items-center rounded-xl text-ink-2 active:bg-surface"><X size={26} aria-hidden /></button>
        <ProgressBar value={(stepIndex + 1) / (steps.length + 1)} label={step ? t(`lesson.steps.${step}`) : ''} className="flex-1" />
      </header>

      <div key={step} className="flex flex-1 animate-[enter_.25s_var(--ease-out-quart)] flex-col">
        {step === 'discover' && (
          <>
            <p className="text-sm font-bold uppercase tracking-wide text-ink-2">{t('lesson.steps.discover')}</p>
            <div className="mt-3 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-[2.2rem] font-black leading-tight">{term.term_en}</h1>
                {term.ipa && <p className="mt-1 font-mono text-ink-2">{term.ipa}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-surface px-3 py-1 text-sm font-bold text-ocean shadow-[inset_0_0_0_2px_var(--color-line)]">{term.level}</span>
                  {term.categories.slice(0, 2).map((c) => <span key={c} className="rounded-full bg-surface px-3 py-1 text-sm font-bold text-ink-2 shadow-[inset_0_0_0_2px_var(--color-line)]">{content.categories.get(c)?.name_fr ?? c}</span>)}
                  {term.status !== 'validated' && <span className="rounded-full bg-sun px-3 py-1 text-sm font-bold text-sun-ink">{t('common.draft')}</span>}
                </div>
              </div>
              <button type="button" onClick={() => speak(term.term_en)} aria-label={t('common.listen')}
                className="grid h-16 w-16 flex-none place-items-center rounded-2xl bg-ocean text-on-ocean shadow-[0_4px_0_var(--color-ocean-press)] active:translate-y-1 active:shadow-none"><Volume2 size={28} aria-hidden /></button>
            </div>
            <Card className="mt-6"><p className="text-sm font-bold text-ink-2">{t('lesson.translation')}</p><p className="mt-1 text-2xl font-extrabold">{term.translation_fr}</p></Card>
          </>
        )}

        {step === 'understand' && (
          <>
            <p className="text-sm font-bold uppercase tracking-wide text-ink-2">{t('lesson.steps.understand')}</p>
            <h1 className="mt-2 text-2xl font-black">{term.term_en}</h1>
            <section className="mt-5"><h2 className="text-sm font-bold text-ink-2">{t('lesson.definition')}</h2><p className="mt-1 text-lg leading-relaxed" lang="en">{term.definition_en}</p>
              <button type="button" className="mt-1 inline-flex min-h-11 items-center gap-2 font-bold text-ocean" onClick={() => speak(term.definition_en)}><Volume2 size={18} aria-hidden />{t('common.listen')}</button></section>
            <section className="mt-3"><h2 className="text-sm font-bold text-ink-2">{t('lesson.explanation')}</h2><p className="mt-1 leading-relaxed text-ink-2">{term.explanation_fr}</p></section>
            <Card className="mt-5 bg-sun/60"><p className="flex items-center gap-2 font-extrabold text-sun-ink"><Lightbulb size={20} aria-hidden />{t('lesson.why')}</p><p className="mt-1 font-semibold">{term.why_it_matters_fr}</p></Card>
          </>
        )}

        {step === 'context' && (
          <>
            <p className="text-sm font-bold uppercase tracking-wide text-ink-2">{t('lesson.steps.context')}</p>
            <h1 className="mt-2 text-2xl font-black">{t('lesson.context')}</h1>
            <ul className="mt-5 grid gap-2.5">{term.context_fr.map((c) => <li key={c} className="flex gap-3 rounded-2xl bg-surface p-4"><MapPin size={20} className="flex-none text-ocean" aria-hidden />{c}</li>)}</ul>
          </>
        )}

        {step === 'examples' && (
          <>
            <p className="text-sm font-bold uppercase tracking-wide text-ink-2">{t('lesson.steps.examples')}</p>
            <h1 className="mt-2 text-2xl font-black">{term.term_en}</h1>
            <ul className="mt-5 grid gap-3">
              {term.sentences.map((s) => (
                <li key={s.id}><Card>
                  <p className="text-lg font-semibold leading-relaxed" lang="en">{s.text_en}</p>
                  <p className="mt-1 text-ink-2">{s.text_fr}</p>
                  <div className="mt-2 flex gap-1">
                    <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 font-bold text-ocean" onClick={() => speak(s.text_en)}><Volume2 size={18} aria-hidden />{t('common.listen')}</button>
                    <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 font-bold text-ocean" onClick={() => speak(s.text_en, { slow: true })}><Turtle size={18} aria-hidden />{t('common.listenSlow')}</button>
                  </div>
                </Card></li>
              ))}
            </ul>
          </>
        )}

        {step === 'related' && (
          <>
            <p className="text-sm font-bold uppercase tracking-wide text-ink-2">{t('lesson.steps.related')}</p>
            {term.common_mistakes.length > 0 && (
              <section className="mt-3"><h2 className="text-xl font-black">{t('lesson.mistakes')}</h2>
                <ul className="mt-3 grid gap-2.5">{term.common_mistakes.map((m) => (
                  <li key={m.wrong}><Card>
                    <p className="text-danger line-through decoration-2">{m.wrong}</p><p className="mt-1 font-bold text-mint-ink">{m.right}</p>
                    {m.note_fr && <p className="mt-1 text-sm text-ink-2">{m.note_fr}</p>}
                  </Card></li>
                ))}</ul>
              </section>
            )}
            {term.related_terms.length > 0 && (
              <section className="mt-5"><h2 className="text-xl font-black">{t('lesson.related')}</h2>
                <div className="mt-3 flex flex-wrap gap-2">{term.related_terms.map((r) => <span key={r} className="rounded-full bg-surface px-3 py-1.5 font-bold text-ocean shadow-[inset_0_0_0_2px_var(--color-line)]">{content.byId.get(r)?.term_en ?? r}</span>)}</div>
              </section>
            )}
          </>
        )}

        {step === 'repeat' && (
          <RepeatStep sentence={sentence} onDone={(o: RepeatOutcome) => {
            const score = o.score ?? (o.selfRated === 'easy' ? 8 : o.selfRated === 'hard' ? 4 : null);
            setSpeakScore(score);
            if (o.score != null || o.selfRated) void logSpeakingAttempt({ termId: term.id, sentenceId: sentence.id, transcript: o.transcript, score: score ?? 0, recognizedRatio: o.recognizedRatio, ...(o.selfRated ? { selfRated: o.selfRated } : {}) });
            goNext();
          }} />
        )}

        {step === 'quiz' && (questions.length
          ? <QuizStep questions={questions} onAnswer={(q, choice, correct) => void logQuizAttempt(term.id, q.id, correct, { choice })} onDone={(c) => void finish(c)} />
          : <Button onClick={() => void finish(0)}>{t('quiz.finish')}</Button>)}
      </div>

      {step && !['repeat', 'quiz'].includes(step) && (
        <div className="sticky bottom-0 bg-mist pt-4"><Button onClick={goNext} icon={<ArrowRight size={20} aria-hidden />}>{t('lesson.next')}</Button></div>
      )}
    </main>
  );
}
