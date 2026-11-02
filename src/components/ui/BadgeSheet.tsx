import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { EvaluatedBadge } from '@/learning/badges';
import { BadgeMedal, TIER_COLOR } from './BadgeMedal';

/** Bottom sheet with the detail of one badge: description, progress and the three tier targets. */
export function BadgeSheet({ badge, onClose }: { badge: EvaluatedBadge; onClose: () => void }) {
  const { t } = useTranslation();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const tiers = (['bronze', 'silver', 'gold'] as const).map((k, i) => ({ k, target: badge.tiers[i]! }));
  const nextTier = badge.tier === 'locked' ? 'bronze' : badge.tier === 'bronze' ? 'silver' : 'gold';
  const done = badge.tier === 'gold';
  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={t(`badges.list.${badge.id}.title`)}>
      <button type="button" aria-label={t('common.close')} onClick={onClose} className="absolute inset-0 bg-black/40" tabIndex={-1} />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-h-[85dvh] max-w-[640px] animate-[sheet_.24s_var(--ease-out-quart)] overflow-y-auto rounded-t-3xl border-t-2 border-line bg-surface px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-3">
        <div className="mx-auto h-1 w-10 rounded-full bg-line" aria-hidden />
        <div className="mt-1 flex justify-end">
          <button type="button" onClick={onClose} aria-label={t('common.close')} className="-mr-2 grid h-11 w-11 place-items-center rounded-xl text-ink-2 active:bg-mist"><X size={22} aria-hidden /></button>
        </div>
        <div className="-mt-5 flex flex-col items-center text-center">
          <BadgeMedal icon={badge.icon} tier={badge.tier} ratio={badge.ratio} size={96} />
          <h2 className="mt-3 text-xl font-black">{t(`badges.list.${badge.id}.title`)}</h2>
          <span className="mt-1 rounded-full px-3 py-0.5 text-xs font-black uppercase tracking-wider" style={{ background: TIER_COLOR[badge.tier].fill, color: TIER_COLOR[badge.tier].icon }}>
            {t(`badges.tier.${badge.tier}`)}
          </span>
          <p className="mt-3 max-w-[36ch] text-sm leading-relaxed text-ink-2">{t(`badges.list.${badge.id}.desc`)}</p>
        </div>
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs font-extrabold">
            <span className="text-ink-2">{done ? t('badges.sheet.complete') : t('badges.sheet.next', { tier: t(`badges.tier.${nextTier}`) })}</span>
            <span>{badge.current} / {badge.nextTarget}</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500" style={{ width: `${Math.round(badge.ratio * 100)}%` }} />
          </div>
        </div>
        <ul className="mt-4 grid grid-cols-3 gap-2">
          {tiers.map(({ k, target }) => {
            const reached = badge.current >= target;
            return (
              <li key={k} className="rounded-xl border-2 border-line px-2 py-2 text-center" style={reached ? { borderColor: TIER_COLOR[k].ring, background: TIER_COLOR[k].fill } : undefined}>
                <p className="text-xs font-black uppercase tracking-wide" style={{ color: reached ? TIER_COLOR[k].icon : 'var(--color-ink-2)' }}>{t(`badges.tier.${k}`)}</p>
                <p className="mt-0.5 font-title text-base font-black" style={reached ? { color: TIER_COLOR[k].icon } : undefined}>{target}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
