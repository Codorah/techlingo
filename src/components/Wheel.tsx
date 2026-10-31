import { forwardRef, useImperativeHandle, useRef } from 'react';

const COLORS = ['#BFE3FB', '#D9F5E5', '#FFF0C7', '#E3DCFB', '#FCE1E4', '#CFEFF7', '#E8F5D9', '#FDE8CF'];

export interface WheelHandle { spinTo(index: number): Promise<void> }

interface WheelProps { labels: string[]; size?: number; onSpin?: () => void; disabled?: boolean; spinLabel?: string }

/**
 * SVG wheel animated with the Web Animations API (no animation library: keeps the bundle
 * light for low-end phones). The pointer is at the top; spinTo() lands a segment under it.
 */
export const Wheel = forwardRef<WheelHandle, WheelProps>(function Wheel({ labels, size = 300, onSpin, disabled, spinLabel = 'SPIN' }, ref) {
  const disc = useRef<SVGGElement>(null);
  const angle = useRef(0);
  const n = Math.max(labels.length, 1);
  const seg = 360 / n;
  const r = 150;

  useImperativeHandle(ref, () => ({
    async spinTo(index: number) {
      const el = disc.current;
      if (!el) return;
      // Segment i is centred at i*seg degrees clockwise from the top: rotate it back to 0.
      const jitter = (Math.random() - 0.5) * seg * 0.5;
      const landing = (((-(index * seg) + jitter) % 360) + 360) % 360;
      const from = angle.current;
      const base = from - (from % 360);
      const to = base + 360 * 5 + landing;
      angle.current = to;
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.style.transform = `rotate(${to}deg)`; return; }
      // Ease out, overshoot slightly, settle: the "bounce at the stop".
      const anim = el.animate(
        [{ transform: `rotate(${from}deg)` }, { transform: `rotate(${to + 5}deg)`, offset: 0.9 }, { transform: `rotate(${to}deg)` }],
        { duration: 3800, easing: 'cubic-bezier(0.12, 0.8, 0.2, 1)', fill: 'forwards' }
      );
      await anim.finished;
      el.style.transform = `rotate(${to}deg)`;
      anim.cancel();
    }
  }), [seg]);

  const arc = (i: number) => {
    const a0 = ((i * seg - seg / 2 - 90) * Math.PI) / 180;
    const a1 = (((i + 1) * seg - seg / 2 - 90) * Math.PI) / 180;
    return `M0 0 L${r * Math.cos(a0)} ${r * Math.sin(a0)} A${r} ${r} 0 ${seg > 180 ? 1 : 0} 1 ${r * Math.cos(a1)} ${r * Math.sin(a1)} Z`;
  };

  return (
    <div className="relative mx-auto" style={{ width: size, maxWidth: '86vw', aspectRatio: '1' }}>
      <svg viewBox="-12 -24 24 30" className="absolute left-1/2 top-[-14px] z-10 w-9 -translate-x-1/2 drop-shadow" aria-hidden>
        <path d="M0 6 L-10 -14 A11 11 0 1 1 10 -14 Z" fill="var(--color-ocean)" stroke="#fff" strokeWidth="2.5" />
        <circle cx="0" cy="-15" r="4" fill="#fff" />
      </svg>
      <svg viewBox="-160 -160 320 320" className="h-full w-full drop-shadow-[0_12px_20px_rgba(23,50,77,0.15)]" role="img" aria-label={labels.join(', ')}>
        <circle r="158" fill="var(--color-ocean)" />
        <g ref={disc} style={{ transformOrigin: '0 0', transformBox: 'view-box' }}>
          {labels.map((label, i) => {
            const mid = i * seg;
            const short = label.length > 18 ? `${label.slice(0, 17)}…` : label;
            // Radial labels (centre → rim), flipped on the left half so they never read upside down.
            const flip = mid > 180;
            return (
              <g key={`${label}-${i}`}>
                <path d={arc(i)} fill={COLORS[i % COLORS.length]} stroke="#fff" strokeWidth="2" />
                <text transform={`rotate(${mid - 90}) translate(${r * 0.6} 0)${flip ? ' rotate(180)' : ''}`}
                  textAnchor="middle" dominantBaseline="middle" fill="#17324D" fontSize={short.length > 13 ? 10.5 : 12.5} fontWeight="700" fontFamily="DM Sans, system-ui, sans-serif">
                  {short}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      {/* The hub is a real button: tapping the centre spins the wheel, like the main button. */}
      <button type="button" onClick={onSpin} disabled={disabled || !onSpin} aria-label={spinLabel}
        className="absolute left-1/2 top-1/2 grid h-[24%] w-[24%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-line bg-surface font-title text-base font-black tracking-wide text-ocean shadow-[0_4px_0_var(--color-line)] transition-transform active:translate-y-[calc(-50%+3px)] active:shadow-none disabled:cursor-default">
        SPIN
      </button>
    </div>
  );
});
