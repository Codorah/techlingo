import { useEffect, useState } from 'react';

export function prefersReducedMotion(): boolean {
  try { return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}

const easeOut = (x: number) => 1 - (1 - x) ** 3;

/** Counts from 0 to `target` (default 800 ms, ease-out). Instant under prefers-reduced-motion. */
export function useCountUp(target: number, duration = 800, delay = 0): number {
  const instant = prefersReducedMotion() || target <= 0;
  const [value, setValue] = useState(instant ? target : 0);
  useEffect(() => {
    if (prefersReducedMotion() || target <= 0) { setValue(target); return; }
    let raf = 0;
    let start = 0;
    const timer = window.setTimeout(() => {
      const step = (now: number) => {
        if (!start) start = now;
        const p = Math.min(1, (now - start) / duration);
        setValue(Math.round(target * easeOut(p)));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => { window.clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [target, duration, delay]);
  return value;
}
