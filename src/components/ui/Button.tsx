import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';

// Thick "pressable" buttons: a solid bottom edge that collapses on press (spec §8).
const styles: Record<Variant, string> = {
  primary: 'bg-[var(--accent)] text-on-ocean shadow-[0_4px_0_var(--accent-press)]',
  secondary: 'bg-surface text-[var(--accent)] border-2 border-line shadow-[0_4px_0_var(--color-line)]',
  success: 'bg-mint-strong text-on-ocean shadow-[0_4px_0_#227a4e]',
  danger: 'bg-danger text-white shadow-[0_4px_0_#8f2a2a]',
  ghost: 'bg-transparent text-[var(--accent)]'
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
  block?: boolean;
}

export function Button({ variant = 'primary', icon, block = true, className = '', children, ...rest }: Props) {
  const pressable = variant !== 'ghost';
  return (
    <button
      type="button"
      className={[
        'inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-2xl px-5 font-bold text-base',
        'transition-[transform,box-shadow,filter] duration-100 disabled:pointer-events-none disabled:opacity-45',
        pressable ? 'mb-1 active:translate-y-1 active:shadow-none' : 'min-h-[44px] active:bg-mist',
        block ? 'w-full' : '',
        styles[variant],
        className
      ].join(' ')}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
