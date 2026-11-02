import { CircleCheck, CircleX, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export type FeedbackTone = 'correct' | 'close' | 'wrong';

const LOOK: Record<FeedbackTone, { box: string; title: string; button: string; Icon: typeof CircleCheck }> = {
  correct: { box: 'bg-mint border-mint-strong', title: 'text-mint-ink', button: 'bg-mint-strong shadow-[0_4px_0_#227a4e]', Icon: CircleCheck },
  close: { box: 'bg-sun border-gold', title: 'text-sun-ink', button: 'bg-mint-strong shadow-[0_4px_0_#227a4e]', Icon: TriangleAlert },
  wrong: { box: 'bg-danger-soft border-danger', title: 'text-danger', button: 'bg-danger shadow-[0_4px_0_#8f2a2a]', Icon: CircleX }
};

/** Duolingo-style answer sheet: slides up from the bottom, says right or wrong with icon + text (never colour alone). */
export function FeedbackSheet({ tone, title, children, onContinue, label }: { tone: FeedbackTone; title: string; children?: ReactNode; onContinue: () => void; label?: string }) {
  const { t } = useTranslation();
  const look = LOOK[tone];
  return (
    <div role="status" aria-live="assertive"
      className={`fixed inset-x-0 bottom-0 z-40 max-h-[75dvh] animate-[sheet_.22s_var(--ease-out-quart)] overflow-y-auto border-t-2 px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4 ${look.box}`}>
      <div className="mx-auto max-w-[640px]">
        <p className={`flex items-center gap-2 text-xl font-black ${look.title}`}><look.Icon size={28} aria-hidden />{title}</p>
        {children && <div className="mt-1.5 text-ink">{children}</div>}
        <button type="button" autoFocus onClick={onContinue}
          className={`mt-4 inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl font-black uppercase tracking-wide text-white active:translate-y-1 active:shadow-none ${look.button}`}>
          {label ?? t('common.continue')}
        </button>
      </div>
    </div>
  );
}
