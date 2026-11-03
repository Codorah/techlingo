import { Turtle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { speak } from '@/lib/speech';

type Variant = 'md' | 'sm' | 'lg' | 'link';

const STYLES: Record<Variant, { box: string; icon: number }> = {
  md: { box: 'grid h-12 w-12 flex-none place-items-center rounded-2xl border-2 border-line bg-surface text-[var(--accent)] active:translate-y-0.5', icon: 22 },
  sm: { box: 'grid h-11 w-11 flex-none place-items-center rounded-lg text-[var(--accent)] active:bg-mist', icon: 20 },
  lg: { box: 'grid h-16 w-16 flex-none place-items-center rounded-2xl border-2 border-line bg-surface text-[var(--accent)] active:translate-y-0.5', icon: 26 },
  link: { box: 'inline-flex min-h-11 items-center gap-2 rounded-xl px-2 font-bold text-[var(--accent)]', icon: 18 }
};

/** "Listen slowly" next to every normal listen button, so slowing down is available everywhere. */
export function SlowButton({ text, variant = 'md', className = '' }: { text: string; variant?: Variant; className?: string }) {
  const { t } = useTranslation();
  const s = STYLES[variant];
  return (
    <button type="button" onClick={() => speak(text, { slow: true })} aria-label={t('common.listenSlow')} className={`${s.box} ${className}`}>
      <Turtle size={s.icon} aria-hidden />{variant === 'link' && t('common.listenSlow')}
    </button>
  );
}
