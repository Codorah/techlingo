import { useLiveQuery } from 'dexie-react-hooks';
import { Flame, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getSetting, setSetting } from '@/data/progress';
import { db } from '@/db/db';
import { computeLevel } from '@/learning/badges';
import { displayedStreak, localDay } from '@/learning/streak';
import { useCountUp } from '@/lib/motion';

/** Accuracy ring that fills (stroke transition, static under reduced motion). */
export function AccuracyRing({ value, size = 56, delay = 0 }: { value: number; size?: number; delay?: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = window.setTimeout(() => setShown(value), 60 + delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  const stroke = 6;
  const r = (size - stroke) / 2;
  const len = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-mint-strong)" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={len} strokeDashoffset={len * (1 - Math.min(100, Math.max(0, shown)) / 100)}
        style={{ transition: 'stroke-dashoffset 900ms var(--ease-out-quart)' }} />
    </svg>
  );
}

/**
 * Result tiles shared by the end-of-lesson screens: XP count-up, accuracy ring, streak flame
 * (pops the first time the day becomes active) and the level bar. Revealed one after the other.
 */
export function RewardSummary({ xp, accuracy }: { xp: number; accuracy?: number }) {
  const { t } = useTranslation();
  const profile = useLiveQuery(() => db.profile.get('me'));
  const countXp = useCountUp(xp, 800, 120);
  const countAcc = useCountUp(accuracy ?? 0, 800, 240);
  const [flamePop, setFlamePop] = useState(false);

  const today = localDay();
  const streak = profile ? displayedStreak(profile, today) : 0;
  const activeToday = !!profile && profile.lastActiveDay === today;

  // The streak flame celebrates only the first completed activity of the day.
  useEffect(() => {
    if (!activeToday) return;
    let alive = true;
    void getSetting<string | null>('rewards.streakDay', null).then((day) => {
      if (!alive || day === today) return;
      setFlamePop(true);
      void setSetting('rewards.streakDay', today);
    });
    return () => { alive = false; };
  }, [activeToday, today]);

  const lvl = profile ? computeLevel(profile.xp) : null;
  const tiles = accuracy != null ? 'grid-cols-3' : 'grid-cols-2';

  return (
    <>
      <div className={`mt-6 grid w-full max-w-sm gap-2.5 ${tiles}`}>
        <div className="reveal rounded-2xl border-2 border-gold bg-surface p-3" style={{ ['--i' as string]: 0 }}>
          <p className="text-xs font-black text-sun-ink">{t('result.xp')}</p>
          <p className="mt-2 flex items-center justify-center gap-1 text-xl font-black text-gold-ink tabular-nums"><Zap size={18} aria-hidden />+{countXp}</p>
        </div>
        {accuracy != null && (
          <div className="reveal rounded-2xl border-2 border-mint-strong bg-surface p-3" style={{ ['--i' as string]: 1 }}>
            <p className="text-xs font-black text-mint-ink">{t('path.accuracy')}</p>
            <div className="relative mt-1 grid place-items-center">
              <AccuracyRing value={accuracy} delay={240} />
              <span className="absolute text-sm font-black text-mint-ink tabular-nums">{countAcc}%</span>
            </div>
          </div>
        )}
        <div className="reveal rounded-2xl border-2 border-line bg-surface p-3" style={{ ['--i' as string]: accuracy != null ? 2 : 1 }}>
          <p className="text-xs font-black text-flame-ink">{t('profile.stats.streak')}</p>
          <p className="mt-2 flex items-center justify-center gap-1 text-xl font-black text-flame-ink tabular-nums">
            <Flame size={18} aria-hidden fill="currentColor" className={flamePop ? 'animate-[flame-pop_.7s_var(--ease-out-quart)_.5s_both] motion-reduce:animate-none' : ''} />
            {streak}
          </p>
          {flamePop && <p className="mt-0.5 text-xs font-bold text-flame-ink">{t('rewards.streakExtended')}</p>}
        </div>
      </div>

      {lvl && (
        <div className="reveal mt-5 w-full max-w-sm rounded-2xl border-2 border-line bg-surface p-3.5 text-left" style={{ ['--i' as string]: accuracy != null ? 3 : 2 }}>
          <div className="flex items-center justify-between text-xs font-extrabold">
            <span className="text-[var(--accent)]">{t('profile.levelTitle', { level: lvl.level })} · {t(`badges.ranks.${lvl.titleKey}`)}</span>
            <span className="text-ink-2">{lvl.currentXp}/{lvl.nextLevelXp} XP</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-700" style={{ width: `${Math.max(6, Math.round(lvl.progressRatio * 100))}%` }} />
          </div>
        </div>
      )}
    </>
  );
}
