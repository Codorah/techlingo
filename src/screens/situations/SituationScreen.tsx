import { ArrowRight, ChartColumn, Check, Circle, FileText, GitPullRequest, Hash, Languages, Lightbulb, Mail, Megaphone, Mic, Sparkles, Square, Trophy, Users, Video, Volume2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NotFound } from '@/components/NotFound';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/Button';
import { CardDeck, DeckCard } from '@/components/ui/CardDeck';
import { chunkSentences } from '@/lib/chunk';
import { Confetti } from '@/components/ui/Confetti';
import { RewardSummary } from '@/components/ui/RewardSummary';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { PathLesson, PathUnitDef, ShippedPath } from '@/content/schema';
import { completeNode } from '@/data/path';
import { db } from '@/db/db';
import { phraseHits } from '@/learning/situations';
import { useCountUp } from '@/lib/motion';
import { sounds } from '@/lib/sound';
import { canRecognize, listen, type ListenError, speak, stopSpeaking } from '@/lib/speech';
import { QuizStep, type Playable } from '@/screens/lesson/QuizStep';
import { accentStyle } from '@/screens/path/ThemeScreen';
import { useSituations } from './useSituations';

type Channel = PathLesson['production']['channel'];
const CHANNEL_ICON: Record<Channel, typeof Hash> = {
  slack: Hash, email: Mail, pull_request: GitPullRequest, standup: Users, meeting: Video, brief: FileText, report: ChartColumn, social_post: Megaphone
};
const AVATAR_COLORS = ['#2B6CB0', '#2E9E66', '#C4513A', '#7A5AF8', '#C28A00', '#0E7C86'];
const colorOf = (name: string) => AVATAR_COLORS[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_COLORS.length]!;

export function SituationScreen() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const params = useParams<{ nodeId: string }>();
  const nodeId = decodeURIComponent(params.nodeId);
  const { path, missing, domain } = useSituations();
  const back = () => navigate('/situations', { replace: true });

  if (missing) return <main className="grid min-h-dvh place-items-center p-6 text-center text-ink-2">{t('situations.soon')}</main>;
  if (!path) return <main className="grid min-h-dvh place-items-center text-ink-2">{t('common.loading')}</main>;

  const unit = path.units.find((u) => nodeId === `sit:${u.id}:guide`);
  const lessonUnit = path.units.find((u) => u.lessons.some((l) => nodeId === `sit:${l.id}`));
  const lesson = lessonUnit?.lessons.find((l) => nodeId === `sit:${l.id}`);

  return (
    <div style={accentStyle(domain)} className="min-h-dvh bg-mist">
      {unit ? <Guide unit={unit} nodeId={nodeId} onClose={back} />
        : lesson && lessonUnit ? <Lesson path={path} lesson={lesson} nodeId={nodeId} onClose={back} />
        : <NotFound />}
    </div>
  );
}

const Shell = ({ children, onClose, progress, label }: { children: React.ReactNode; onClose: () => void; progress?: number; label?: string }) => {
  const { t } = useTranslation();
  return (
    <main className="mx-auto flex min-h-dvh max-w-[640px] flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-[calc(env(safe-area-inset-top)+12px)]">
      <header className="mb-5 flex items-center gap-3">
        <button type="button" onClick={onClose} aria-label={t('common.close')} className="grid h-11 w-11 flex-none place-items-center rounded-xl text-ink-2 active:bg-surface"><X size={26} aria-hidden /></button>
        {progress != null && <ProgressBar value={progress} label={label ?? ''} className="flex-1" />}
      </header>
      {children}
    </main>
  );
};

export function Guide({ unit, nodeId, onClose }: { unit: PathUnitDef; nodeId: string; onClose: () => void }) {
  const { t } = useTranslation();
  const [xp, setXp] = useState<number | null>(null);
  const busy = useRef(false);
  async function start() {
    if (busy.current) return; // double tap
    busy.current = true;
    setXp((await completeNode(nodeId, 'course')).xp);
  }
  if (xp != null) return <Done xp={xp} title={t('path.courseDone')} onContinue={onClose} />;
  const cards = [
    <DeckCard key="cover" kicker={t('situations.guide')}>
      <h1 className="text-[clamp(1.5rem,7vw,1.9rem)] font-black leading-tight">{unit.title_fr}</h1>
      <p className="mt-2 font-semibold text-ink-2" lang="en">{unit.title_en}</p>
    </DeckCard>,
    ...chunkSentences(unit.guide.intro_fr).map((c, i) => (
      <DeckCard key={`intro${i}`} kicker={i === 0 ? t('deck.situation') : undefined}><p className="text-[1.0625rem] leading-relaxed [text-wrap:pretty]">{c}</p></DeckCard>
    )),
    ...unit.guide.key_phrases.map((k, i) => (
      <PhraseCard key={k.en} phrase={k} kicker={t('deck.phrase', { n: i + 1, total: unit.guide.key_phrases.length })} />
    )),
    <p key="tip" className="flex gap-3 rounded-2xl bg-sun p-5 text-sun-ink"><Lightbulb size={24} className="flex-none" aria-hidden /><span><span className="mb-1 block text-sm font-black">{t('deck.tip')}</span><span className="font-semibold leading-relaxed">{unit.guide.tip_fr}</span></span></p>
  ];
  return <CardDeck cards={cards} onClose={onClose} onFinish={() => void start()} finishLabel={t('path.start')} label={unit.title_fr} />;
}

export function PhraseCard({ phrase, kicker }: { phrase: { en: string; fr: string }; kicker: string }) {
  const { t } = useTranslation();
  const [said, setSaid] = useState(false);
  return (
    <DeckCard kicker={kicker}>
      <p lang="en" className="text-[clamp(1.35rem,6vw,1.65rem)] font-black leading-snug">{phrase.en}</p>
      <p className="mt-2 text-[1.0625rem] text-ink-2">{phrase.fr}</p>
      <div className="mt-4 flex items-center gap-2">
        <button type="button" onClick={() => speak(phrase.en)} aria-label={t('common.listen')} className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-[var(--accent)] text-on-ocean"><Volume2 size={24} aria-hidden /></button>
        <button type="button" onClick={() => setSaid(true)} aria-pressed={said} className={`inline-flex min-h-11 items-center gap-2 rounded-2xl border-2 px-4 font-bold ${said ? 'border-mint-strong bg-mint text-mint-ink' : 'border-line text-[var(--accent)]'}`}>
          {said ? <Check size={18} aria-hidden /> : <Mic size={18} aria-hidden />}{t('deck.said')}
        </button>
      </div>
    </DeckCard>
  );
}

type Step = 'words' | 'dialogue' | 'quiz' | 'production';
const STEPS: Step[] = ['words', 'dialogue', 'quiz', 'production'];

export function Lesson({ path, lesson, nodeId, onClose }: { path: ShippedPath; lesson: PathLesson; nodeId: string; onClose: () => void }) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('words');
  const [quizCorrect, setQuizCorrect] = useState(0);
  const [done, setDone] = useState<{ xp: number; firstTime: boolean; accuracy: number } | null>(null);
  const finishing = useRef(false);
  // Choices are shuffled on display so the right answer's position in the file never leaks.
  const questions = useMemo<Playable[]>(() => lesson.questions.map((q, i) => {
    const order = q.choices.map((_, k) => k).sort(() => Math.random() - 0.5);
    return { id: `${lesson.id}-q${i}`, prompt: q.prompt_fr, choices: order.map((k) => q.choices[k]!), answer: order.indexOf(q.answer_index), explanation: q.explanation_fr };
  }), [lesson]);
  const index = STEPS.indexOf(step);

  async function finish(hits: number) {
    if (finishing.current) return; // double tap on "Voir mon résultat"
    finishing.current = true;
    const total = questions.length + lesson.production.key_phrases.length;
    const correct = quizCorrect + hits;
    const r = await completeNode(nodeId, 'lesson', [], { correct, total });
    navigator.vibrate?.([12, 40, 12]);
    sounds.celebrate();
    setDone({ ...r, accuracy: Math.round((correct / total) * 100) });
  }

  if (done) return <Done xp={done.xp} title={t('path.lessonDone')} accuracy={done.accuracy} confetti={done.firstTime} replay={!done.firstTime} onContinue={onClose} />;

  if (step === 'words') {
    const words = lesson.term_ids.map((id) => path.terms[id]).filter((x): x is NonNullable<typeof x> => !!x);
    const cards = words.map((term, i) => (
      <DeckCard key={term.id} kicker={t('deck.word', { n: i + 1, total: words.length })}>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h1 lang="en" className="text-[clamp(1.6rem,8vw,2rem)] font-black leading-tight">{term.term_en}</h1>
            {term.ipa && <p className="mt-1 font-mono text-ink-2">{term.ipa}</p>}
          </div>
          <button type="button" onClick={() => speak(term.term_en)} aria-label={t('common.listen')} className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-[var(--accent)] text-on-ocean"><Volume2 size={24} aria-hidden /></button>
        </div>
        <p className="mt-3 text-xl font-extrabold text-[var(--accent)]">{term.translation_fr}</p>
        <p className="mt-2 leading-relaxed">{term.explanation_fr}</p>
      </DeckCard>
    ));
    return <CardDeck cards={cards} onClose={onClose} onFinish={() => setStep('dialogue')} finishLabel={t('situations.toDialogue')} label={lesson.title_fr} />;
  }

  if (step === 'dialogue') {
    const cards = lesson.dialogue.map((_, i) => (
      <DialogueCard key={i} lines={lesson.dialogue} upTo={i} channel={lesson.production.channel} />
    ));
    return <CardDeck cards={cards} onClose={() => { stopSpeaking(); onClose(); }} onFinish={() => { stopSpeaking(); setStep('quiz'); }} finishLabel={t('path.toQuiz')} label={t('situations.dialogueTitle')} />;
  }

  return (
    <Shell onClose={onClose} progress={index / STEPS.length} label={lesson.title_fr}>
      {step === 'quiz' && (
        <QuizStep questions={questions} onAnswer={() => {}} onDone={(c) => { setQuizCorrect(c); setStep('production'); }} />
      )}

      {step === 'production' && <Production lesson={lesson} onDone={(hits) => void finish(hits)} />}
    </Shell>
  );
}

function Workspace({ channel, children }: { channel: Channel; children: React.ReactNode }) {
  const { t } = useTranslation();
  const Icon = CHANNEL_ICON[channel];
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border-2 border-line bg-surface">
      <div className="flex items-center gap-2 border-b-2 border-line bg-mist/60 px-4 py-2.5 text-sm font-black text-ink-2">
        <Icon size={18} className="text-[var(--accent)]" aria-hidden />{t(`situations.channel.${channel}`)}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function DialogueCard({ lines, upTo, channel }: { lines: PathLesson['dialogue']; upTo: number; channel: Channel }) {
  const { t } = useTranslation();
  const [fr, setFr] = useState(false);
  const Icon = CHANNEL_ICON[channel];
  const line = lines[upTo]!;
  return (
    <section className="rounded-2xl border-2 border-line bg-surface [hyphens:auto] [overflow-wrap:anywhere]">
      <div className="flex items-center gap-2 border-b-2 border-line bg-mist/60 px-4 py-2 text-sm font-black text-ink-2">
        <Icon size={18} className="text-[var(--accent)]" aria-hidden />{t(`situations.channel.${channel}`)}<span className="ml-auto font-bold">{t('deck.line', { n: upTo + 1, total: lines.length })}</span>
      </div>
      <ul className="grid grid-cols-[minmax(0,1fr)] gap-1.5 p-3">
        {lines.slice(0, upTo).map((l, i) => (
          <li key={i} className="flex gap-2 text-sm text-ink-2"><span className="font-black" style={{ color: colorOf(l.speaker) }}>{l.speaker}</span><span lang="en" className="min-w-0 flex-1 truncate">{l.text_en}</span></li>
        ))}
        <li className="mt-1 flex gap-3 rounded-xl bg-mist/60 p-3">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-lg font-black text-white" style={{ background: colorOf(line.speaker) }} aria-hidden>{line.speaker[0]}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black">{line.speaker}</p>
            <p lang="en" className="text-[1.0625rem] leading-relaxed">{line.text_en}</p>
            {fr && <p className="mt-1 text-ink-2">{line.text_fr}</p>}
            <div className="mt-1 flex gap-1">
              <button type="button" onClick={() => speak(line.text_en)} aria-label={t('common.listen')} className="grid h-11 w-11 place-items-center rounded-lg text-[var(--accent)] active:bg-mist"><Volume2 size={20} aria-hidden /></button>
              <button type="button" onClick={() => setFr(true)} aria-label={t('situations.translate')} disabled={fr} className="grid h-11 w-11 place-items-center rounded-lg text-[var(--accent)] active:bg-mist disabled:opacity-40"><Languages size={20} aria-hidden /></button>
            </div>
          </div>
        </li>
      </ul>
    </section>
  );
}

function Production({ lesson, onDone }: { lesson: PathLesson; onDone: (hits: number) => void }) {
  const { t } = useTranslation();
  const p = lesson.production;
  const [text, setText] = useState('');
  const [checked, setChecked] = useState(false);
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const stopRef = useRef<() => void>(() => {});
  const abortRef = useRef<() => void>(() => {});
  const hits = phraseHits(text, p.key_phrases);
  const count = hits.filter(Boolean).length;
  // Leaving the step closes the microphone.
  useEffect(() => () => abortRef.current(), []);

  async function dictate() {
    if (listening) { stopRef.current(); return; }
    setListening(true); setMicError(null);
    const base = text ? `${text} ` : '';
    const { done, stop, abort } = listen((partial) => setText(base + partial), { continuous: true });
    stopRef.current = stop;
    abortRef.current = abort;
    try {
      const heard = await done;
      if (heard) setText(base + heard); else setMicError(t('recall.say.nothing'));
    } catch (e) {
      // Typing stays available; an aborted dictation keeps what was already written.
      const code = e as ListenError;
      if (code !== 'aborted') setMicError(code === 'not-allowed' || code === 'unsupported' ? t('recall.say.denied') : t('recall.say.nothing'));
    } finally { setListening(false); }
  }

  return (
    <div className="flex flex-1 animate-[enter_.25s_var(--ease-out-quart)] flex-col">
      <p className="text-sm font-bold text-[var(--accent)]">{t('situations.steps.production')}</p>
      <h1 className="mt-1 text-lg font-bold leading-relaxed [text-wrap:pretty]">{p.prompt_fr}</h1>
      {p.context_en && (
        <Workspace channel={p.channel}><p lang="en" className="p-1 leading-relaxed">{p.context_en}</p></Workspace>
      )}
      <label className="mt-4 block">
        <span className="sr-only">{t('situations.yourAnswer')}</span>
        <textarea value={text} onChange={(e) => setText(e.target.value)} readOnly={checked || listening} rows={4} lang="en" placeholder={t('situations.placeholder')}
          onFocus={(e) => e.currentTarget.scrollIntoView({ block: 'center', behavior: 'smooth' })} className="w-full rounded-2xl border-2 border-line bg-surface p-4 text-base leading-relaxed outline-none placeholder:text-ink-2 focus:border-[var(--accent)]" />
      </label>
      {micError && !checked && <p role="alert" className="mt-2 text-sm font-semibold text-danger">{micError}</p>}
      {!checked && canRecognize() && (
        <Button variant="secondary" className="mt-2" icon={listening ? <Square size={18} aria-hidden /> : <Mic size={20} aria-hidden />} onClick={() => void dictate()}>
          {listening ? t('situations.stop') : t('situations.speak')}
        </Button>
      )}

      {checked && (
        <div className="mt-4 animate-[enter_.25s_var(--ease-out-quart)]">
          <p className="font-extrabold">{t('situations.phrasesFound', { count, total: p.key_phrases.length })}</p>
          <ul className="mt-2 grid gap-1.5">
            {p.key_phrases.map((k, i) => (
              <li key={k} className={`flex items-center gap-2 font-semibold ${hits[i] ? 'text-mint-ink' : 'text-ink-2'}`}>
                {hits[i] ? <Check size={18} aria-hidden /> : <Circle size={18} aria-hidden />}<span lang="en">{k}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-2xl border-2 border-mint-strong bg-mint p-4 text-mint-ink">
            <div className="flex items-center justify-between gap-2">
              <p className="font-black">{t('situations.model')}</p>
              <button type="button" onClick={() => speak(p.model_answer_en)} aria-label={t('common.listen')} className="grid h-11 w-11 place-items-center rounded-xl bg-surface"><Volume2 size={20} aria-hidden /></button>
            </div>
            <p lang="en" className="mt-1 font-semibold leading-relaxed text-ink">{p.model_answer_en}</p>
            <p className="mt-1 text-sm">{p.model_answer_fr}</p>
          </div>
        </div>
      )}
      <span className="flex-1" />
      {checked
        ? <Button className="mt-6" variant="success" disabled={sent} onClick={() => { setSent(true); onDone(count); }}>{t('quiz.finish')}</Button>
        : <Button className="mt-6" variant="success" disabled={text.trim().length < 8} onClick={() => { abortRef.current(); setChecked(true); }}>{t('quiz.check')}</Button>}
    </div>
  );
}

export function Done({ xp, title, accuracy, confetti = true, replay, onContinue }: { xp: number; title: string; accuracy?: number; confetti?: boolean; replay?: boolean; onContinue: () => void }) {
  const { t } = useTranslation();
  const countXp = useCountUp(xp, 800);

  const perfect = accuracy != null && accuracy >= 100;

  return (
    <main className="mx-auto flex min-h-dvh max-w-[640px] flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-[calc(env(safe-area-inset-top)+24px)] text-center">
      {confetti && <Confetti />}
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="relative grid h-32 w-32 animate-[bounce-in_.55s_var(--ease-out-quart)] place-items-center rounded-full bg-sun text-sun-ink shadow-[0_6px_0_var(--color-gold-press)]">
          <Trophy size={54} strokeWidth={2.4} aria-hidden />
          <span className="absolute -bottom-3 rounded-full bg-[var(--accent)] px-3.5 py-1 font-title text-base font-black text-on-ocean shadow">+{countXp} XP</span>
        </div>
        {perfect && (
          <span className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-mint px-3.5 py-1 text-xs font-black uppercase tracking-wider text-mint-ink">
            <Sparkles size={14} aria-hidden />{t('badges.perfect')}
          </span>
        )}
        <h1 className="mt-4 text-3xl font-black">{title}</h1>
        {replay && <p className="mt-2 text-ink-2">{t('path.replay')}</p>}

        <RewardSummary xp={xp} accuracy={accuracy} />
      </div>
      <Button onClick={onContinue} icon={<ArrowRight size={20} aria-hidden />}>{t('common.continue')}</Button>
    </main>
  );
}
