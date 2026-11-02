import { ChevronsUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { getSetting, setSetting } from '@/data/progress';
import { type BadgeUnlock, computeLevel, type EvaluatedBadge, levelReached, newlyEarned, type SeenRanks, snapshotRanks } from '@/learning/badges';
import { useBadgeState } from '@/learning/useBadgeState';
import { sounds } from '@/lib/sound';
import { BadgeMedal } from './BadgeMedal';

const KEY_BADGES = 'rewards.badges';
const KEY_LEVEL = 'rewards.level';

type Reward = ({ kind: 'badge' } & BadgeUnlock) | { kind: 'level'; level: number; titleKey: string };

/**
 * Watches progress and announces, once, each newly earned badge tier and each new level.
 * The first run only records the current state, so existing learners are not flooded.
 */
export function RewardWatcher() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const state = useBadgeState();
  const [queue, setQueue] = useState<Reward[]>([]);
  const busy = useRef(false);
  const dirty = useRef(false);
  const latest = useRef<{ evaluated: EvaluatedBadge[]; xp: number } | null>(null);

  const evaluated = state.ready ? state.evaluated : null;
  const xp = state.ready ? state.profile.xp : 0;
  const sig = evaluated ? `${evaluated.map((b) => `${b.id}${b.tier}`).join('')}|${computeLevel(xp).level}` : '';
  latest.current = evaluated ? { evaluated, xp } : null;

  useEffect(() => {
    if (!sig) return;
    const run = async () => {
      if (busy.current) { dirty.current = true; return; }
      busy.current = true;
      try {
        const snap = latest.current;
        if (!snap) return;
        const seen = await getSetting<SeenRanks | null>(KEY_BADGES, null);
        const seenLevel = await getSetting<number | null>(KEY_LEVEL, null);
        const info = computeLevel(snap.xp);
        const rewards: Reward[] = [];
        if (seen && seenLevel != null) {
          const reached = levelReached(seenLevel, snap.xp);
          if (reached) rewards.push({ kind: 'level', level: reached, titleKey: info.titleKey });
          for (const u of newlyEarned(seen, snap.evaluated)) rewards.push({ kind: 'badge', ...u });
        }
        await setSetting(KEY_BADGES, snapshotRanks(snap.evaluated, seen ?? {}));
        await setSetting(KEY_LEVEL, Math.max(info.level, seenLevel ?? 0));
        if (rewards.length) setQueue((q) => [...q, ...rewards]);
      } finally {
        busy.current = false;
        if (dirty.current) { dirty.current = false; void run(); }
      }
    };
    void run();
  }, [sig]);

  const current = queue[0];
  useEffect(() => {
    if (!current) return;
    if (current.kind === 'badge') sounds.badge(); else sounds.levelUp();
    navigator.vibrate?.([10, 30, 10]);
    const timer = window.setTimeout(() => setQueue((q) => q.slice(1)), 5200);
    return () => window.clearTimeout(timer);
  }, [current]);

  if (!current) return null;
  const isBadge = current.kind === 'badge';
  const title = current.kind === 'badge' ? t(`badges.list.${current.id}.title`) : t('rewards.levelUp.title', { level: current.level });
  const text = current.kind === 'badge' ? t('rewards.badge.text', { tier: t(`badges.tier.${current.tier}`) }) : t(`badges.ranks.${current.titleKey}`);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex justify-center px-4 pt-[calc(env(safe-area-inset-top)+10px)]">
      <button
        key={current.kind === 'badge' ? `${current.id}-${current.tier}` : `lvl-${current.level}`}
        type="button"
        role="status"
        aria-live="polite"
        onClick={() => { setQueue((q) => q.slice(1)); if (isBadge) navigate('/profile#succes'); }}
        className="pointer-events-auto flex w-full max-w-[420px] animate-[toast-in_.35s_var(--ease-out-quart)] items-center gap-3 rounded-2xl border-2 border-gold bg-surface p-3 text-left shadow-[0_8px_24px_rgba(0,0,0,.18)] motion-reduce:animate-none"
      >
        <span className="relative grid h-16 w-16 flex-none place-items-center">
          <span aria-hidden className="absolute inset-0 rounded-full border-4 border-gold motion-reduce:hidden" style={{ animation: 'burst .9s var(--ease-out-quart) both' }} />
          <span aria-hidden className="absolute inset-0 rounded-full border-2 border-sky motion-reduce:hidden" style={{ animation: 'burst 1.1s var(--ease-out-quart) .15s both' }} />
          <span className="relative animate-[bounce-in_.6s_var(--ease-out-quart)] motion-reduce:animate-none">
            {current.kind === 'badge' ? (
              <BadgeMedal icon={current.icon} tier={current.tier} ratio={1} size={56} />
            ) : (
              <span className="grid h-14 w-14 place-items-center rounded-full bg-[var(--accent)] text-on-ocean"><ChevronsUp size={28} aria-hidden /></span>
            )}
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-black uppercase tracking-wider text-gold-ink">{isBadge ? t('rewards.badge.kicker') : t('rewards.levelUp.kicker')}</span>
          <span className="block truncate text-base font-black text-ink">{title}</span>
          <span className="block truncate text-xs font-bold text-ink-2">{text}</span>
        </span>
      </button>
    </div>
  );
}
