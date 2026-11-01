import { ArrowRight, ChevronLeft, Sparkles } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/Button';
import { DomainPicker, RolePicker } from '@/components/RolePicker';
import { Choice } from '@/components/ui/Choice';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { LEVELS, type Level } from '@/content/levels';
import type { Term } from '@/content/schema';
import { saveProfile } from '@/data/progress';
import { nextPlacementLevel, pickPlacementTerm, PLACEMENT_QUESTIONS, PLACEMENT_START, type PlacementAnswer, placementResult } from '@/learning/placement';
import { useContent } from '@/lib/useContent';

type Step = 'welcome' | 'domain' | 'role' | 'level' | 'placement' | 'placementDone';
// Short on purpose: domain, role, level, then straight into the app. Name, goal and rhythm
// can be set later in the profile.
const FLOW: Step[] = ['domain', 'role', 'level'];

export function OnboardingScreen() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>('welcome');
  const [domain, setDomain] = useState<string | null>(null);
  const [primary, setPrimary] = useState<string | null>(null);
  const [secondary, setSecondary] = useState<string[]>([]);
  const [level, setLevel] = useState<Level | null>(null);

  const roles = primary ? [primary, ...secondary] : [];
  const content = useContent(roles.length ? roles : []);

  const flowIndex = FLOW.indexOf(step === 'placement' || step === 'placementDone' ? 'level' : step);
  const back = () => {
    if (step === 'placement' || step === 'placementDone') return setStep('level');
    setStep(flowIndex <= 0 ? 'welcome' : FLOW[flowIndex - 1]!);
  };

  async function finish(chosen: Level | null = level) {
    await saveProfile({ primaryRole: primary, secondaryRoles: secondary, level: chosen, onboardedAt: new Date().toISOString() });
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
        <Button onClick={() => setStep('domain')} icon={<ArrowRight size={20} aria-hidden />}>{t('onboarding.welcome.start')}</Button>
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

  if (step === 'domain') {
    return shell(t('onboarding.domain.title'), t('onboarding.domain.text'),
      <DomainPicker manifest={content.manifest} value={domain}
        onChange={(d) => { if (d !== domain) { setPrimary(null); setSecondary([]); } setDomain(d); setStep('role'); }} />,
      null);
  }

  if (step === 'role') {
    return shell(t('onboarding.role.title'), t('onboarding.role.text'),
      <RolePicker manifest={content.manifest} domain={domain} primary={primary} secondary={secondary}
        onChange={(p, s) => { setPrimary(p); setSecondary(s); }} />,
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
      <Button disabled={!level} onClick={() => void finish()} icon={<ArrowRight size={20} aria-hidden />}>{t('onboarding.profile.cta')}</Button>);
  }

  if (step === 'placement') {
    return <Placement terms={content.terms} header={header} onDone={(l) => { setLevel(l); setStep('placementDone'); }} />;
  }

  if (step === 'placementDone' && level) {
    return shell(t('onboarding.placement.resultTitle', { level }), t('onboarding.placement.resultText', { name: t(`levels.${level}.name`) }),
      <div className="grid place-items-center py-10"><span className="grid h-32 w-32 place-items-center rounded-full bg-mint font-title text-5xl font-black text-mint-ink">{level}</span></div>,
      <Button onClick={() => void finish()} icon={<ArrowRight size={20} aria-hidden />}>{t('onboarding.placement.keep')}</Button>);
  }

  return null;
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
