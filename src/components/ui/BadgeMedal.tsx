import { Lock } from 'lucide-react';
import type { BadgeTier } from '@/learning/badges';
import { DynamicIcon } from './DynamicIcon';

export const TIER_COLOR: Record<BadgeTier, { ring: string; fill: string; icon: string }> = {
  locked: { ring: 'var(--color-ink-2)', fill: 'var(--color-mist)', icon: 'var(--color-ink-2)' },
  bronze: { ring: '#C2691A', fill: '#FEF3C7', icon: '#92400E' },
  silver: { ring: '#7E93AD', fill: '#E8EEF5', icon: '#475A73' },
  gold: { ring: '#E0A100', fill: '#FFF1BF', icon: '#8A5D00' }
};

/** Badge icon inside a tier-coloured ring. The arc shows progress to the next tier (full ring once gold). */
export function BadgeMedal({ icon, tier, ratio, size = 64 }: { icon: string; tier: BadgeTier; ratio: number; size?: number }) {
  const c = TIER_COLOR[tier];
  const stroke = Math.max(3, Math.round(size / 16));
  const r = (size - stroke) / 2;
  const len = 2 * Math.PI * r;
  const shown = tier === 'gold' ? 1 : Math.max(tier === 'locked' ? 0.04 : 0.08, ratio);
  const locked = tier === 'locked';
  return (
    <span className="relative inline-grid flex-none place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill={c.fill} stroke="var(--color-line)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c.ring} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={len} strokeDashoffset={len * (1 - shown)} opacity={locked ? 0.45 : 1} />
      </svg>
      <span className="relative" style={{ color: c.icon, opacity: locked ? 0.7 : 1 }}>
        <DynamicIcon name={icon} size={Math.round(size * 0.4)} />
      </span>
      {locked && <Lock size={Math.round(size * 0.2)} className="absolute -bottom-0.5 -right-0.5 rounded-full bg-surface p-0.5 text-ink-2" aria-hidden />}
    </span>
  );
}
