import { useMemo } from 'react';

const COLORS = ['#65BDF5', '#2B6CB0', '#FFD86B', '#2E9E66', '#F28C8C', '#9B8CF2'];

/** One-shot celebration burst. Purely decorative; disabled by prefers-reduced-motion. */
export function Confetti({ pieces = 70 }: { pieces?: number }) {
  const bits = useMemo(() => Array.from({ length: pieces }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.35,
    duration: 1.6 + Math.random() * 1.2,
    dx: `${(Math.random() - 0.5) * 160}px`,
    rot: `${(Math.random() - 0.5) * 900}deg`,
    color: COLORS[i % COLORS.length],
    w: 6 + Math.random() * 6,
    round: Math.random() > 0.6
  })), [pieces]);
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden motion-reduce:hidden">
      {bits.map((b, i) => (
        <span key={i} className="absolute -top-4 block"
          style={{
            left: `${b.left}%`, width: b.w, height: b.round ? b.w : b.w * 1.6, background: b.color, borderRadius: b.round ? '50%' : 2,
            animation: `confetti ${b.duration}s cubic-bezier(.2,.6,.4,1) ${b.delay}s forwards`,
            ['--dx' as string]: b.dx, ['--rot' as string]: b.rot
          }} />
      ))}
    </div>
  );
}
