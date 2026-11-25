import { ArrowRight, Mic, MessagesSquare, Route, Trophy, Volume2, type LucideIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { Button } from '@/components/ui/Button';
import { speak } from '@/lib/speech';

const SLIDES: { key: string; icon: LucideIcon; sample: string }[] = [
  { key: 'job', icon: MessagesSquare, sample: 'Can you explain what DevOps is?' },
  { key: 'path', icon: Route, sample: 'Let me walk you through this campaign.' },
  { key: 'speak', icon: Mic, sample: 'I’ll follow up by email today.' },
  { key: 'progress', icon: Trophy, sample: 'You’re on a 4-day streak.' }
];

/**
 * First-run intro: swipeable slides (native scroll-snap, so it works with touch, trackpad,
 * keyboard and screen readers). Illustrations are drawn here; real artwork can replace the tile later.
 */
export function IntroCarousel({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const last = index === SLIDES.length - 1;

  const goTo = (i: number) => {
    const el = scroller.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ left: i * el.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <main className="mx-auto flex h-dvh max-w-[640px] flex-col pb-[calc(env(safe-area-inset-bottom)+20px)] pt-[calc(env(safe-area-inset-top)+8px)]">
      <header className="flex h-12 items-center justify-end px-4">
        {!last && <button type="button" onClick={onDone} className="min-h-11 rounded-xl px-3 font-bold text-ink-2 active:bg-surface">{t('onboarding.intro.skip')}</button>}
      </header>

      <div ref={scroller} role="group" aria-roledescription="carousel" aria-label={t('onboarding.intro.label')}
        onScroll={(e) => { const el = e.currentTarget; setIndex(Math.round(el.scrollLeft / el.clientWidth)); }}
        className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SLIDES.map(({ key, icon: Icon, sample }, i) => (
          <section key={key} aria-roledescription="slide" aria-label={t('deck.progress', { n: i + 1, total: SLIDES.length })}
            className="flex w-full flex-none snap-center flex-col items-center justify-center px-8 text-center">
            <div className="relative grid h-56 w-56 place-items-center" aria-hidden>
              <span className="absolute inset-0 rounded-full bg-[var(--accent)] opacity-10" />
              <span className="absolute inset-6 rounded-full bg-[var(--accent)] opacity-10" />
              <span className={`grid h-28 w-28 place-items-center rounded-2xl bg-[var(--accent)] text-on-ocean shadow-[0_6px_0_rgba(15,34,56,0.18)] ${i === index ? 'motion-safe:animate-[bounce-in_.55s_var(--ease-out-quart)]' : ''}`}>
                <Icon size={56} strokeWidth={2.2} />
              </span>
            </div>
            <h1 className="mt-6 text-[1.75rem] font-black leading-tight [text-wrap:balance]">{t(`onboarding.intro.${key}.title`)}</h1>
            <p className="mt-3 max-w-[34ch] text-lg leading-relaxed text-ink-2 [text-wrap:pretty]">{t(`onboarding.intro.${key}.text`)}</p>
            <button type="button" onClick={() => speak(sample)} className="mt-6 inline-flex min-h-11 max-w-full items-center gap-2 rounded-2xl border-2 border-line bg-surface px-4 py-2 text-left font-bold">
              <Volume2 size={20} className="flex-none text-[var(--accent)]" aria-hidden />
              <span lang="en">{sample}</span>
              <span className="sr-only">{t('common.listen')}</span>
            </button>
          </section>
        ))}
      </div>

      <div className="px-6">
        <div className="mb-5 flex justify-center gap-2" aria-hidden>
          {SLIDES.map((_, i) => <span key={i} className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-[var(--accent)]' : 'w-2 bg-line'}`} />)}
        </div>
        <Button onClick={() => (last ? onDone() : goTo(index + 1))} icon={<ArrowRight size={20} aria-hidden />} variant={last ? 'success' : 'primary'}>
          {last ? t('onboarding.welcome.start') : t('deck.next')}
        </Button>
        {last && (
          <>
            <Link href="/settings/data" className="mt-2 flex min-h-11 items-center justify-center font-bold text-[var(--accent)]">{t('onboarding.welcome.restore')}</Link>
            <p className="mt-1 text-center text-sm text-ink-2">{t('onboarding.welcome.privacy')}</p>
          </>
        )}
      </div>
    </main>
  );
}
