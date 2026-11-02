import { Check } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type State = 'idle' | 'selected' | 'correct' | 'wrong' | 'dim';

const look: Record<State, string> = {
  idle: 'border-line bg-surface shadow-[0_4px_0_var(--color-line)]',
  selected: 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] shadow-[0_4px_0_var(--accent)]',
  correct: 'border-mint-strong bg-mint text-mint-ink shadow-[0_4px_0_var(--color-mint-strong)] animate-[bounce-in_.35s_var(--ease-out-quart)]',
  wrong: 'border-danger bg-danger-soft text-danger shadow-[0_4px_0_var(--color-danger)] animate-[nudge_.42s_ease-in-out] motion-reduce:animate-none',
  dim: 'border-line bg-surface opacity-55 shadow-[0_4px_0_var(--color-line)]'
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> { state?: State; leading?: ReactNode; trailing?: ReactNode }

/** Selectable option card (onboarding choices, quiz answers). */
export function Choice({ state = 'idle', leading, trailing, children, className = '', ...rest }: Props) {
  return (
    <button type="button" aria-pressed={state === 'selected'}
      className={`mb-1 flex min-h-[58px] w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-semibold transition-[transform,box-shadow] duration-100 active:translate-y-1 active:shadow-none disabled:pointer-events-none ${look[state]} ${className}`}
      {...rest}>
      {leading}
      <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{children}</span>
      {trailing ?? (state === 'selected' ? <Check size={22} aria-hidden /> : null)}
    </button>
  );
}
