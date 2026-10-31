import { ArrowRight, Check, ChevronLeft, Clock, Sparkles } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'wouter';
import { Avatar, AVATARS } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Choice } from '@/components/ui/Choice';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { LEVELS, type Level } from '@/content/levels';
import type { Term } from '@/content/schema';
import { saveProfile } from '@/data/progress';
import type { Profile } from '@/db/db';
import { nextPlacementLevel, pickPlacementTerm, PLACEMENT_QUESTIONS, PLACEMENT_START, type PlacementAnswer, placementResult } from '@/learning/placement';
import { useContent } from '@/lib/useContent';

type Step = 'welcome' | 'role' | 'level' | 'placement' | 'placementDone' | 'goal' | 'rhythm' | 'profile';
const FLOW: Step[] = ['role', 'level', 'goal', 'rhythm', 'profile'];
const GOALS = ['docs', 'work', 'interviews', 'vocabulary'] as const;
const MINUTES = [5, 10, 15, 20] as const;

export function OnboardingScreen() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>('welcome');
  const [primary, setPrimary] = useState<string | null>(null);
  const [secondary, setSecondary] = useState<string[]>([]);
  const [level, setLevel] = useState<Level | null>(null);
  const [goal, setGoal] = useState<Profile['goal']>(null);
  const [minutes, setMinutes] = useState<Profile['dailyMinutes']>(5);
  const [reminder, setReminder] = useState('19:00');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string>('sky');

  const roles = primary ? [primary, ...secondary] : [];
  const content = useContent(roles.length ? roles : []);
  const manifestRoles = content.manifest?.roles ?? [];

  const flowIndex = FLOW.indexOf(step === 'placement' || step === 'placementDone' ? 'level' : step);
  const back = () => {
    if (step === 'placement' || step === 'placementDone') return setStep('level');
    setStep(flowIndex <= 0 ? 'welcome' : FLOW[flowIndex - 1]!);
  };

  function toggleRole(id: string) {
    if (id === primary) { setPrimary(secondary[0] ?? null); setSecondary(secondary.slice(1)); return; }
    if (secondary.includes(id)) { setSecondary(secondary.filter((r) => r !== id)); return; }
    if (!primary) setPrimary(id);
    else if (secondary.length < 2) setSecondary([...secondary, id]);
  }

  async function finish() {
    await saveProfile({
      displayName: name.trim().slice(0, 30), avatar, primaryRole: primary, secondaryRoles: secondary, level, goal,
      dailyMinutes: minutes, reminderTime: reminder || null, onboardedAt: new Date().toISOString()
    });
    navigate('/spin?first=1', { replace: true });
  }

  if (step === 'welcome') {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[640px] flex-col px-6 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-[calc(env(safe-area-inset-top)+24px)]">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <img src="/icons/icon.svg" width={112} height={112} alt="" className="drop-shadow-[0_14px_24px_rgba(23,50,77,0.18)]" />
          <h1 className="mt-8 text-3xl font-black leading-tight">{t('onboarding.welcome.title')}</h1>
          <p className="mt-3 max-w-[32ch] text-lg text-ink-2">{t('onboarding.welcome.text')}</p>
        </div>
        <Button onClick={() => setStep('role')} icon={<ArrowRight size={20} aria-hidden />}>{t('onboarding.welcome.start')}</Button>
        <Link href="/settings/data" className="mt-2 flex min-h-11 items-center justify-center font-bold text-ocean">{t('onboarding.welcome.restore')}</Link>
        <p className="mt-2 text-center text-sm text-ink-2">{t('onboarding.welcome.privacy')}</p>
      </main>
    );
  }

  const header = (
    <header className="mb-6 flex items-center gap-3">
      <button type="button" onClick={back} aria-label={t('common.back')} className="grid h-11 w-11 flex-none place-items-center rounded-xl text-ink-2 active:bg-surface">
        <ChevronLeft size={26} aria-hidden />
      </button>
      <ProgressBar value={(flowIndex + 1) / FLOW.length} label={t('onboarding.step', { n: flowIndex + 1, total: FLOW.length })} className="flex-1" />
    </header>
  );

  const shell = (title: string, text: string | null, body: ReactNode, cta: ReactNode) => (
    <main className="mx-auto flex min-h-dvh max-w-[640px] flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-[calc(env(safe-area-inset-top)+12px)]">
      {header}
      <h1 className="text-[1.65rem] font-black leading-tight">{title}</h1>
      {text && <p className="mt-2 text-ink-2">{text}</p>}
      <div className="mt-6 flex-1">{body}</div>
      <div className="sticky bottom-0 bg-mist pt-3">{cta}</div>
    </main>
  );

  if (step === 'role') {
    return shell(t('onboarding.role.title'), t('onboarding.role.text'),
      <ul className="grid gap-2.5">
        {manifestRoles.map((r) => {
          const isPrimary = r.id === primary;
          const isSecondary = secondary.includes(r.id);
          const disabled = r.termCount === 0;
          return (
            <li key={r.id}>
              <Choice state={isPrimary || isSecondary ? 'selected' : 'idle'} disabled={disabled} onClick={() => toggleRole(r.id)}
                leading={<span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-mist text-ocean"><DynamicIcon name={r.icon} /></span>}
                trailing={isPrimary ? <span className="rounded-full bg-ocean px-2.5 py-1 text-xs font-bold text-white">{t('onboarding.role.primary')}</span>
                  : isSecondary ? <span className="rounded-full bg-sky/30 px-2.5 py-1 text-xs font-bold text-ocean">{t('onboarding.role.secondary')}</span>
                  : disabled ? <span className="text-xs font-bold text-ink-2">{t('onboarding.role.soon')}</span> : null}>
                <span className="block">{r.name_fr}</span>
                <span className="block text-sm font-normal text-ink-2">{r.description_fr}</span>
              </Choice>
            </li>
          );
        })}
      </ul>,
      <Button disabled={!primary} onClick={() => setStep('level')}>{t('common.continue')}</Button>);
  }

  if (step === 'level') {
    return shell(t('onboarding.level.title'), t('onboarding.level.text'),
      <div className="grid gap-2.5">
        {LEVELS.map((l) => (
          <Choice key={l} state={level === l ? 'selected' : 'idle'} onClick={() => setLevel(l)}
            leading={<span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-mist font-title font-black text-ocean">{l}</span>}>
            <span className="block">{t(`levels.${l}.name`)}</span>
            <span className="block text-sm font-normal text-ink-2">{t(`levels.${l}.desc`)}</span>
          </Choice>
        ))}
        <Button variant="ghost" className="mt-1" icon={<Sparkles size={20} aria-hidden />} onClick={() => setStep('placement')}>{t('onboarding.level.unknown')}</Button>
      </div>,
      <Button disabled={!level} onClick={() => setStep('goal')}>{t('common.continue')}</Button>);
  }

  if (step === 'placement') {
    return <Placement terms={content.terms} header={header} onDone={(l) => { setLevel(l); setStep('placementDone'); }} />;
  }

  if (step === 'placementDone' && level) {
    return shell(t('onboarding.placement.resultTitle', { level }), t('onboarding.placement.resultText', { name: t(`levels.${level}.name`) }),
      <div className="grid place-items-center py-10"><span className="grid h-32 w-32 place-items-center rounded-full bg-mint font-title text-5xl font-black text-mint-ink">{level}</span></div>,
      <Button onClick={() => setStep('goal')}>{t('onboarding.placement.keep')}</Button>);
  }

  if (step === 'goal') {
    return shell(t('onboarding.goal.title'), t('onboarding.goal.text'),
      <div className="grid gap-2.5">
        {GOALS.map((g) => <Choice key={g} state={goal === g ? 'selected' : 'idle'} onClick={() => setGoal(g)}>{t(`goals.${g}`)}</Choice>)}
      </div>,
      <Button disabled={!goal} onClick={() => setStep('rhythm')}>{t('common.continue')}</Button>);
  }

  if (step === 'rhythm') {
    return shell(t('onboarding.rhythm.title'), t('onboarding.rhythm.text'),
      <div>
        <div className="grid grid-cols-2 gap-2.5">
          {MINUTES.map((m) => <Choice key={m} state={minutes === m ? 'selected' : 'idle'} onClick={() => setMinutes(m)} className="justify-center text-center">{t('onboarding.rhythm.minutes', { count: m })}</Choice>)}
        </div>
        <label className="mt-6 block">
          <span className="flex items-center gap-2 font-bold"><Clock size={18} aria-hidden />{t('onboarding.rhythm.reminder')} <span className="font-normal text-ink-2">({t('common.optional')})</span></span>
          <input type="time" value={reminder} onChange={(e) => setReminder(e.target.value)}
            className="mt-2 min-h-[52px] w-full rounded-2xl border-2 border-line bg-surface px-4 text-lg outline-none focus:border-ocean" />
          <span className="mt-1 block text-sm text-ink-2">{t('onboarding.rhythm.reminderHint')}</span>
        </label>
      </div>,
      <Button onClick={() => setStep('profile')}>{t('common.continue')}</Button>);
  }

  return shell(t('onboarding.profile.title'), t('onboarding.profile.text'),
    <div>
      <div className="flex justify-center"><Avatar id={avatar} name={name || '?'} size={88} /></div>
      <label className="mt-6 block">
        <span className="font-bold">{t('onboarding.profile.name')} <span className="font-normal text-ink-2">({t('common.optional')})</span></span>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={30} autoComplete="given-name" placeholder={t('onboarding.profile.placeholder')}
          className="mt-2 min-h-[52px] w-full rounded-2xl border-2 border-line bg-surface px-4 text-lg outline-none placeholder:text-ink-2 focus:border-ocean" />
      </label>
      <fieldset className="mt-6">
        <legend className="font-bold">{t('onboarding.profile.avatar')}</legend>
        <div className="mt-3 flex justify-between gap-2">
          {AVATARS.map((a) => (
            <button key={a.id} type="button" onClick={() => setAvatar(a.id)} aria-pressed={avatar === a.id} aria-label={a.id}
              className={`grid h-12 w-12 place-items-center rounded-full border-4 transition-transform ${avatar === a.id ? 'scale-110 border-ink' : 'border-transparent'}`}
              style={{ background: a.bg }}>
              {avatar === a.id && <Check size={20} className="text-white" aria-hidden />}
            </button>
          ))}
        </div>
      </fieldset>
    </div>,
    <Button onClick={() => void finish()} icon={<ArrowRight size={20} aria-hidden />}>{t('onboarding.profile.cta')}</Button>);
}

function Placement({ terms, header, onDone }: { terms: Term[]; header: ReactNode; onDone: (l: Level) => void }) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState<Level>(PLACEMENT_START);
  const [answers, setAnswers] = useState<PlacementAnswer[]>([]);
  const [asked, setAsked] = useState<Set<string>>(new Set());
  const [picked, setPicked] = useState<number | null>(null);

  const question = useMemo(() => {
    const term = pickPlacementTerm(terms, current, asked);
    if (!term) return null;
    const others = terms.filter((x) => x.id !== term.id && x.translation_fr !== term.translation_fr).sort(() => Math.random() - 0.5).slice(0, 3);
    const choices = [term.translation_fr, ...others.map((o) => o.translation_fr)].sort(() => Math.random() - 0.5);
    return { term, choices, answer: choices.indexOf(term.translation_fr) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terms, current, answers.length]);

  const finished = terms.length > 0 && (!question || answers.length >= PLACEMENT_QUESTIONS);
  useEffect(() => { if (finished) onDone(placementResult(answers)); }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!terms.length || !question || finished) return <main className="grid min-h-dvh place-items-center text-ink-2">{t('common.loading')}</main>;

  const done = picked !== null;
  const next = () => {
    const correct = picked === question.answer;
    setAnswers([...answers, { level: question.term.level, correct }]);
    setAsked(new Set(asked).add(question.term.id));
    setCurrent(nextPlacementLevel(current, correct));
    setPicked(null);
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-[640px] flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-[calc(env(safe-area-inset-top)+12px)]">
      {header}
      <p className="text-sm font-bold text-ink-2">{t('onboarding.placement.progress', { n: answers.length + 1, total: PLACEMENT_QUESTIONS })}</p>
      <h1 className="mt-2 text-2xl font-black">{t('onboarding.placement.prompt', { term: question.term.term_en })}</h1>
      <div className="mt-6 grid flex-1 content-start gap-2.5">
        {question.choices.map((c, i) => (
          <Choice key={c} disabled={done} onClick={() => setPicked(i)}
            state={!done ? 'idle' : i === question.answer ? 'correct' : i === picked ? 'wrong' : 'dim'}>{c}</Choice>
        ))}
      </div>
      <Button disabled={!done} onClick={next}>{t('common.continue')}</Button>
    </main>
  );
}
