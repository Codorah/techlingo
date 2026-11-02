import { ArrowRight, Lightbulb, RotateCw, Target, Trophy, Volume2, X, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NotFound } from '@/components/NotFound';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/Button';
import { CardDeck, DeckCard } from '@/components/ui/CardDeck';
import { chunkSentences } from '@/lib/chunk';
import { Confetti } from '@/components/ui/Confetti';
import { RewardSummary } from '@/components/ui/RewardSummary';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { Term } from '@/content/schema';
import { completeNode, type WordResult } from '@/data/path';
import { logQuizAttempt } from '@/data/progress';
import { PATH, type PathNode } from '@/learning/path';
import { sounds } from '@/lib/sound';
import { speak } from '@/lib/speech';
import { usePath } from '@/lib/usePath';
import { QuizStep, type Playable, toPlayable } from '../lesson/QuizStep';
import { accentStyle } from './ThemeScreen';

// Seeded shuffle so a node always asks its questions in the same order within a session.
function shuffled<T>(items: T[], seed: string): T[] {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) | 0;
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) | 0;
    const j = Math.abs(h) % (i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

function questionsFor(terms: Term[], variant: number, max: number, seed: string, fillGap: string): Playable[] {
  const qs = terms.flatMap((term) => {
    const playable = term.quiz.map((q) => toPlayable(q, fillGap)).filter((q): q is Playable => !!q);
    const q = playable[variant % Math.max(1, playable.length)];
    return q ? [{ ...q, termId: term.id }] : [];
  });
  return shuffled(qs, seed).slice(0, max);
}

type Outcome = { xp: number; correct: number; total: number; passed: boolean; firstTime: boolean };

export function NodeScreen() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { category, nodeId } = useParams<{ category: string; nodeId: string }>();
  const { content, themes, domain } = usePath();
  const theme = themes.find((x) => x.category === category);
  const node = theme?.units.flatMap((u) => u.nodes).find((n) => n.id === nodeId);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [attempt, setAttempt] = useState(0);
  const back = () => navigate(`/path/${category}`, { replace: true });

  if (content.loading) return <main className="grid min-h-dvh place-items-center text-ink-2">{t('common.loading')}</main>;
  if (!theme || !node) return <NotFound />;

  // A recap reviews the previous unit; everything else works on the node's own words.
  const unit = theme.units[node.unitIndex]!;
  const sourceIds = node.kind === 'recap' ? theme.units[node.unitIndex - 1]?.termIds ?? unit.termIds : node.termIds;
  const terms = sourceIds.map((id) => content.byId.get(id)).filter((x): x is Term => !!x);
  const unitDone = node.kind === 'challenge' && outcome?.passed;

  return (
    <div style={accentStyle(domain)} className="min-h-dvh bg-mist">
      {outcome ? (
        <Result outcome={outcome} kind={node.kind} unitDone={!!unitDone} onContinue={back}
          onRetry={() => { setOutcome(null); setAttempt((a) => a + 1); }} />
      ) : node.kind === 'course' ? (
        <Course categoryId={theme.category} terms={terms} onClose={back}
          onDone={async () => { const r = await completeNode(node.id, 'course'); setOutcome({ ...r, correct: 0, total: 0, passed: true }); }} />
      ) : (
        <Practice key={attempt} node={node} terms={terms} onClose={back} onDone={setOutcome} />
      )}
    </div>
  );
}

function Course({ categoryId, terms, onClose, onDone }: { categoryId: string; terms: Term[]; onClose: () => void; onDone: () => void }) {
  const { t } = useTranslation();
  const { content } = usePath();
  const cat = content.categories.get(categoryId);
  const cards = [
    <DeckCard key="cover" kicker={t('path.kind.course')}>
      <h1 className="text-[clamp(1.5rem,7vw,1.9rem)] font-black leading-tight">{cat?.name_fr}</h1>
    </DeckCard>,
    ...chunkSentences(cat?.course_fr ?? '').map((c, i) => (
      <DeckCard key={`c${i}`}><p className="text-[1.0625rem] leading-relaxed [text-wrap:pretty]">{c}</p></DeckCard>
    )),
    ...(cat?.tip_fr ? [<p key="tip" className="flex gap-3 rounded-2xl bg-sun p-5 text-sun-ink"><Lightbulb size={24} className="flex-none" aria-hidden /><span><span className="mb-1 block text-sm font-black">{t('deck.tip')}</span><span className="font-semibold leading-relaxed">{cat.tip_fr}</span></span></p>] : []),
    ...terms.map((term, i) => (
      <DeckCard key={term.id} kicker={t('deck.word', { n: i + 1, total: terms.length })}>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p lang="en" className="text-[clamp(1.5rem,7vw,1.9rem)] font-black leading-tight">{term.term_en}</p>
            <p className="mt-1 text-xl font-extrabold text-[var(--accent)]">{term.translation_fr}</p>
          </div>
          <button type="button" onClick={() => speak(term.term_en)} aria-label={t('common.listen')} className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-[var(--accent)] text-on-ocean"><Volume2 size={24} aria-hidden /></button>
        </div>
      </DeckCard>
    ))
  ];
  return <CardDeck cards={cards} onClose={onClose} onFinish={onDone} finishLabel={t('path.start')} label={cat?.name_fr} />;
}

function Practice({ node, terms, onClose, onDone }: { node: PathNode; terms: Term[]; onClose: () => void; onDone: (o: Outcome) => void }) {
  const { t } = useTranslation();
  const learnFirst = node.kind === 'lesson';
  const [learnIndex, setLearnIndex] = useState(learnFirst ? 0 : terms.length);
  const [results] = useState(() => new Map<string, WordResult>());

  const questions = useMemo(() => {
    const variant = node.kind === 'challenge' ? 1 : node.kind === 'recap' ? 2 : 0;
    const max = node.kind === 'challenge' ? 8 : node.kind === 'recap' ? 5 : 6;
    const qs = questionsFor(terms, variant, max, node.id, t('quiz.fillGap'));
    // Short lessons get a second round on the same words so there are at least 5 questions.
    return qs.length >= 5 || node.kind !== 'lesson' ? qs : [...qs, ...questionsFor(terms, 1, 5 - qs.length, `${node.id}+`, t('quiz.fillGap'))];
  }, [terms, node, t]);

  const learning = learnIndex < terms.length;
  const totalSteps = (learnFirst ? terms.length : 0) + questions.length;
  const term = terms[learnIndex];

  async function finish(correct: number) {
    const total = questions.length;
    const passed = node.kind !== 'challenge' || (total > 0 && correct / total >= PATH.challengePass);
    if (!passed) { onDone({ xp: 0, correct, total, passed, firstTime: false }); return; }
    const r = await completeNode(node.id, node.kind, [...results.values()]);
    navigator.vibrate?.([12, 40, 12]);
    sounds.celebrate();
    onDone({ ...r, correct, total, passed });
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[640px] flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-[calc(env(safe-area-inset-top)+12px)]">
      <header className="mb-5 flex items-center gap-3">
        <button type="button" onClick={onClose} aria-label={t('common.close')} className="grid h-11 w-11 flex-none place-items-center rounded-xl text-ink-2 active:bg-surface"><X size={26} aria-hidden /></button>
        <ProgressBar value={learning ? learnIndex / totalSteps : (terms.length * Number(learnFirst)) / totalSteps} label={t(`path.kind.${node.kind}`)} className="flex-1" />
      </header>

      {learning && term ? (
        <div key={term.id} className="flex flex-1 animate-[enter_.25s_var(--ease-out-quart)] flex-col">
          <p className="text-sm font-bold text-[var(--accent)]">{t('path.newWord', { n: learnIndex + 1, total: terms.length })}</p>
          <div className="mt-3 rounded-2xl border-2 border-line bg-surface p-5 shadow-[0_4px_0_var(--color-line)]">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <h1 lang="en" className="text-3xl font-black leading-tight">{term.term_en}</h1>
                {term.ipa && <p className="mt-1 font-mono text-ink-2">{term.ipa}</p>}
              </div>
              <button type="button" onClick={() => speak(term.term_en)} aria-label={t('common.listen')}
                className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-[var(--accent)] text-on-ocean shadow-[0_4px_0_var(--accent-press)] active:translate-y-1 active:shadow-none"><Volume2 size={24} aria-hidden /></button>
            </div>
            <p className="mt-4 text-xl font-extrabold text-[var(--accent)]">{term.translation_fr}</p>
            <p className="mt-2 leading-relaxed">{term.explanation_fr}</p>
          </div>
          {term.sentences[0] && (
            <button type="button" onClick={() => speak(term.sentences[0]!.text_en)} className="mt-4 flex gap-3 rounded-2xl bg-surface p-4 text-left active:bg-mist">
              <Volume2 size={20} className="mt-0.5 flex-none text-[var(--accent)]" aria-hidden />
              <span><span lang="en" className="block font-semibold">{term.sentences[0].text_en}</span><span className="mt-1 block text-sm text-ink-2">{term.sentences[0].text_fr}</span></span>
            </button>
          )}
          <span className="flex-1" />
          <Button className="mt-6" onClick={() => setLearnIndex(learnIndex + 1)} icon={<ArrowRight size={20} aria-hidden />}>
            {learnIndex + 1 < terms.length ? t('common.continue') : t('path.toQuiz')}
          </Button>
        </div>
      ) : questions.length ? (
        <QuizStep questions={questions}
          onAnswer={(q, choice, correct) => {
            if (!q.termId) return;
            const r = results.get(q.termId) ?? { termId: q.termId, correct: 0, total: 0 };
            results.set(q.termId, { ...r, correct: r.correct + Number(correct), total: r.total + 1 });
            void logQuizAttempt(q.termId, q.id, correct, choice);
          }}
          onDone={(c) => void finish(c)} />
      ) : (
        <Button onClick={() => void finish(0)}>{t('common.continue')}</Button>
      )}
    </main>
  );
}

function Result({ outcome, kind, unitDone, onContinue, onRetry }: { outcome: Outcome; kind: PathNode['kind']; unitDone: boolean; onContinue: () => void; onRetry: () => void }) {
  const { t } = useTranslation();
  const accuracy = outcome.total ? Math.round((outcome.correct / outcome.total) * 100) : 100;
  if (!outcome.passed) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[640px] flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-[calc(env(safe-area-inset-top)+24px)] text-center">
        <div className="flex flex-1 flex-col items-center justify-center">
          <span className="grid h-24 w-24 animate-[pop_.4s_var(--ease-out-quart)] place-items-center rounded-full bg-coral-soft text-coral"><Target size={44} aria-hidden /></span>
          <h1 className="mt-6 text-3xl font-black">{t('path.almost')}</h1>
          <p className="mt-2 max-w-[34ch] text-lg text-ink-2">{t('path.almostText', { correct: outcome.correct, total: outcome.total, pass: Math.round(PATH.challengePass * 100) })}</p>
        </div>
        <Button className="mb-2" icon={<RotateCw size={20} aria-hidden />} onClick={onRetry}>{t('path.retry')}</Button>
        <Button variant="ghost" onClick={onContinue}>{t('path.backToMap')}</Button>
      </main>
    );
  }
  return (
    <main className="mx-auto flex min-h-dvh max-w-[640px] flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-[calc(env(safe-area-inset-top)+24px)] text-center">
      {outcome.firstTime && <Confetti pieces={unitDone ? 110 : 60} />}
      <div className="flex flex-1 flex-col items-center justify-center">
        <span className="relative grid place-items-center">
          {unitDone && (
            <span aria-hidden className="absolute h-56 w-56 animate-[rays_12s_linear_infinite] rounded-full opacity-60 motion-reduce:hidden"
              style={{ background: 'repeating-conic-gradient(from 0deg, var(--color-gold) 0deg 10deg, transparent 10deg 30deg)', maskImage: 'radial-gradient(circle, black 30%, transparent 70%)' }} />
          )}
          <span className={`relative grid h-28 w-28 animate-[bounce-in_.55s_var(--ease-out-quart)] place-items-center rounded-full ${unitDone ? 'bg-gold text-white shadow-[0_6px_0_var(--color-gold-press)]' : 'bg-sun text-sun-ink'}`}>
            {unitDone ? <Trophy size={52} aria-hidden /> : <span className="font-title text-4xl font-black">+{outcome.xp}</span>}
          </span>
        </span>
        <h1 className="mt-6 text-3xl font-black">{unitDone ? t('path.unitDone') : kind === 'course' ? t('path.courseDone') : accuracy === 100 ? t('result.title') : t('path.lessonDone')}</h1>
        {!outcome.firstTime && <p className="mt-2 text-ink-2">{t('path.replay')}</p>}
        {outcome.total > 0 && <RewardSummary xp={outcome.xp} accuracy={accuracy} />}
      </div>
      <Button onClick={onContinue} icon={<ArrowRight size={20} aria-hidden />}>{t('common.continue')}</Button>
    </main>
  );
}
