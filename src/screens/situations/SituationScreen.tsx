import { ArrowRight, ChartColumn, Check, Circle, FileText, GitPullRequest, Hash, Languages, Lightbulb, Mail, Megaphone, Mic, Square, Users, Video, Volume2, X, Zap } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/Button';
import { Confetti } from '@/components/ui/Confetti';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { PathLesson, PathUnitDef, ShippedPath } from '@/content/schema';
import { completeNode } from '@/data/path';
import { phraseHits } from '@/learning/situations';
import { canRecognize, listen, speak, stopSpeaking } from '@/lib/speech';
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
        : <main className="grid min-h-dvh place-items-center p-6 text-center text-ink-2">{t('path.notFound')}</main>}
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

function Guide({ unit, nodeId, onClose }: { unit: PathUnitDef; nodeId: string; onClose: () => void }) {
  const { t } = useTranslation();
  const [xp, setXp] = useState<number | null>(null);
  if (xp != null) return <Done xp={xp} title={t('path.courseDone')} onContinue={onClose} />;
  return (
    <Shell onClose={onClose}>
      <p className="text-sm font-bold text-[var(--accent)]">{t('situations.guide')}</p>
      <h1 className="mt-1 text-[1.75rem] font-black leading-tight">{unit.title_fr}</h1>
      <p className="mt-1 font-semibold text-ink-2" lang="en">{unit.title_en}</p>
      <p className="mt-4 text-lg leading-relaxed [text-wrap:pretty]">{unit.guide.intro_fr}</p>
      <h2 className="mt-6 text-lg font-extrabold">{t('situations.keyPhrases')}</h2>
      <ul className="mt-3 divide-y-2 divide-line rounded-2xl border-2 border-line bg-surface">
        {unit.guide.key_phrases.map((k) => (
          <li key={k.en} className="flex min-h-14 items-center gap-3 px-4 py-2.5">
            <span className="flex-1"><span lang="en" className="block font-bold">{k.en}</span><span className="block text-sm text-ink-2">{k.fr}</span></span>
            <button type="button" onClick={() => speak(k.en)} aria-label={t('common.listen')} className="grid h-11 w-11 flex-none place-items-center rounded-xl text-[var(--accent)] active:bg-mist"><Volume2 size={22} aria-hidden /></button>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex gap-3 rounded-2xl bg-sun p-4 text-sun-ink"><Lightbulb size={22} className="flex-none" aria-hidden /><span className="font-semibold">{unit.guide.tip_fr}</span></p>
      <span className="flex-1" />
      <Button className="mt-6" icon={<ArrowRight size={20} aria-hidden />}
        onClick={async () => setXp((await completeNode(nodeId, 'course')).xp)}>{t('path.start')}</Button>
    </Shell>
  );
}

type Step = 'words' | 'dialogue' | 'quiz' | 'production';
const STEPS: Step[] = ['words', 'dialogue', 'quiz', 'production'];

function Lesson({ path, lesson, nodeId, onClose }: { path: ShippedPath; lesson: PathLesson; nodeId: string; onClose: () => void }) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('words');
  const [quizCorrect, setQuizCorrect] = useState(0);
  const [done, setDone] = useState<{ xp: number; firstTime: boolean; accuracy: number } | null>(null);
  // Choices are shuffled on display so the right answer's position in the file never leaks.
  const questions = useMemo<Playable[]>(() => lesson.questions.map((q, i) => {
    const order = q.choices.map((_, k) => k).sort(() => Math.random() - 0.5);
    return { id: `${lesson.id}-q${i}`, prompt: q.prompt_fr, choices: order.map((k) => q.choices[k]!), answer: order.indexOf(q.answer_index), explanation: q.explanation_fr };
  }), [lesson]);
  const index = STEPS.indexOf(step);

  async function finish(hits: number) {
    const total = questions.length + lesson.production.key_phrases.length;
    const correct = quizCorrect + hits;
    const r = await completeNode(nodeId, 'lesson', [], { correct, total });
    navigator.vibrate?.([12, 40, 12]);
    setDone({ ...r, accuracy: Math.round((correct / total) * 100) });
  }

  if (done) return <Done xp={done.xp} title={t('path.lessonDone')} accuracy={done.accuracy} confetti={done.firstTime} replay={!done.firstTime} onContinue={onClose} />;

  return (
    <Shell onClose={onClose} progress={index / STEPS.length} label={lesson.title_fr}>
      {step === 'words' && (
        <div className="flex flex-1 animate-[enter_.25s_var(--ease-out-quart)] flex-col">
          <p className="text-sm font-bold text-[var(--accent)]">{t('situations.steps.words')}</p>
          <h1 className="mt-1 text-2xl font-black leading-tight">{lesson.title_fr}</h1>
          <ul className="mt-4 grid gap-2.5">
            {lesson.term_ids.map((id) => path.terms[id]).filter(Boolean).map((term) => (
              <li key={term!.id} className="rounded-2xl border-2 border-line bg-surface p-4 shadow-[0_3px_0_var(--color-line)]">
                <div className="flex items-center gap-3">
                  <span className="min-w-0 flex-1">
                    <span lang="en" className="block text-lg font-black">{term!.term_en}</span>
                    <span className="block font-bold text-[var(--accent)]">{term!.translation_fr}</span>
                  </span>
                  <button type="button" onClick={() => speak(term!.term_en)} aria-label={t('common.listen')} className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-mist text-[var(--accent)]"><Volume2 size={22} aria-hidden /></button>
                </div>
                <p className="mt-1.5 text-sm text-ink-2">{term!.explanation_fr}</p>
              </li>
            ))}
          </ul>
          <span className="flex-1" />
          <Button className="mt-6" onClick={() => setStep('dialogue')} icon={<ArrowRight size={20} aria-hidden />}>{t('situations.toDialogue')}</Button>
        </div>
      )}

      {step === 'dialogue' && (
        <div className="flex flex-1 animate-[enter_.25s_var(--ease-out-quart)] flex-col">
          <p className="text-sm font-bold text-[var(--accent)]">{t('situations.steps.dialogue')}</p>
          <h1 className="mt-1 text-2xl font-black leading-tight">{t('situations.dialogueTitle')}</h1>
          <p className="text-sm text-ink-2">{t('situations.dialogueHint')}</p>
          <Workspace channel={lesson.production.channel}>
            <Dialogue lines={lesson.dialogue} />
          </Workspace>
          <span className="flex-1" />
          <Button className="mt-6" onClick={() => { stopSpeaking(); setStep('quiz'); }} icon={<ArrowRight size={20} aria-hidden />}>{t('path.toQuiz')}</Button>
        </div>
      )}

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

function Dialogue({ lines }: { lines: PathLesson['dialogue'] }) {
  const { t } = useTranslation();
  const [shown, setShown] = useState<Set<number>>(new Set());
  return (
    <ul className="grid gap-1">
      {lines.map((line, i) => (
        <li key={i} className="flex animate-[enter_.3s_var(--ease-out-quart)_both] gap-3 rounded-xl p-2" style={{ animationDelay: `${i * 70}ms` }}>
          <span className="grid h-9 w-9 flex-none place-items-center rounded-lg font-black text-white" style={{ background: colorOf(line.speaker) }} aria-hidden>{line.speaker[0]}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black">{line.speaker}</p>
            <p lang="en" className="leading-relaxed">{line.text_en}</p>
            {shown.has(i) && <p className="mt-1 text-sm text-ink-2">{line.text_fr}</p>}
            <div className="mt-1 flex gap-1">
              <button type="button" onClick={() => speak(line.text_en)} aria-label={t('common.listen')} className="grid h-9 w-9 place-items-center rounded-lg text-[var(--accent)] active:bg-mist"><Volume2 size={18} aria-hidden /></button>
              <button type="button" onClick={() => setShown(new Set(shown).add(i))} aria-label={t('situations.translate')} disabled={shown.has(i)}
                className="grid h-9 w-9 place-items-center rounded-lg text-[var(--accent)] active:bg-mist disabled:opacity-40"><Languages size={18} aria-hidden /></button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Production({ lesson, onDone }: { lesson: PathLesson; onDone: (hits: number) => void }) {
  const { t } = useTranslation();
  const p = lesson.production;
  const [text, setText] = useState('');
  const [checked, setChecked] = useState(false);
  const [listening, setListening] = useState(false);
  const stopRef = useRef<() => void>(() => {});
  const hits = phraseHits(text, p.key_phrases);
  const count = hits.filter(Boolean).length;

  async function dictate() {
    if (listening) { stopRef.current(); return; }
    setListening(true);
    const base = text ? `${text} ` : '';
    const { done, stop } = listen((partial) => setText(base + partial), { continuous: true });
    stopRef.current = stop;
    try { setText(base + (await done)); } catch { /* typing stays available */ } finally { setListening(false); }
  }

  return (
    <div className="flex flex-1 animate-[enter_.25s_var(--ease-out-quart)] flex-col">
      <p className="text-sm font-bold text-[var(--accent)]">{t('situations.steps.production')}</p>
      <h1 className="mt-1 text-[1.35rem] font-black leading-snug">{p.prompt_fr}</h1>
      {p.context_en && (
        <Workspace channel={p.channel}><p lang="en" className="p-1 leading-relaxed">{p.context_en}</p></Workspace>
      )}
      <label className="mt-4 block">
        <span className="sr-only">{t('situations.yourAnswer')}</span>
        <textarea value={text} onChange={(e) => setText(e.target.value)} readOnly={checked} rows={4} lang="en" placeholder={t('situations.placeholder')}
          className="w-full rounded-2xl border-2 border-line bg-surface p-4 text-base leading-relaxed outline-none placeholder:text-ink-2 focus:border-[var(--accent)]" />
      </label>
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
              <button type="button" onClick={() => speak(p.model_answer_en)} aria-label={t('common.listen')} className="grid h-10 w-10 place-items-center rounded-xl bg-surface"><Volume2 size={20} aria-hidden /></button>
            </div>
            <p lang="en" className="mt-1 font-semibold leading-relaxed text-ink">{p.model_answer_en}</p>
            <p className="mt-1 text-sm">{p.model_answer_fr}</p>
          </div>
        </div>
      )}
      <span className="flex-1" />
      {checked
        ? <Button className="mt-6" variant="success" onClick={() => onDone(count)}>{t('quiz.finish')}</Button>
        : <Button className="mt-6" variant="success" disabled={text.trim().length < 8} onClick={() => { stopRef.current(); setChecked(true); }}>{t('quiz.check')}</Button>}
    </div>
  );
}

function Done({ xp, title, accuracy, confetti = true, replay, onContinue }: { xp: number; title: string; accuracy?: number; confetti?: boolean; replay?: boolean; onContinue: () => void }) {
  const { t } = useTranslation();
  return (
    <main className="mx-auto flex min-h-dvh max-w-[640px] flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-[calc(env(safe-area-inset-top)+24px)] text-center">
      {confetti && <Confetti />}
      <div className="flex flex-1 flex-col items-center justify-center">
        <span className="grid h-28 w-28 animate-[bounce-in_.55s_var(--ease-out-quart)] place-items-center rounded-full bg-sun font-title text-4xl font-black text-sun-ink">+{xp}</span>
        <h1 className="mt-6 text-3xl font-black">{title}</h1>
        {replay && <p className="mt-2 text-ink-2">{t('path.replay')}</p>}
        {accuracy != null && (
          <div className="mt-7 grid w-full max-w-sm grid-cols-2 gap-2.5">
            <div className="rounded-2xl border-2 border-gold bg-surface p-3"><p className="text-xs font-black text-sun-ink">{t('result.xp')}</p><p className="mt-1 flex items-center justify-center gap-1 text-2xl font-black text-[#C28A00]"><Zap size={20} aria-hidden />{xp}</p></div>
            <div className="rounded-2xl border-2 border-mint-strong bg-surface p-3"><p className="text-xs font-black text-mint-ink">{t('path.accuracy')}</p><p className="mt-1 text-2xl font-black text-mint-ink">{accuracy} %</p></div>
          </div>
        )}
      </div>
      <Button onClick={onContinue} icon={<ArrowRight size={20} aria-hidden />}>{t('common.continue')}</Button>
    </main>
  );
}
