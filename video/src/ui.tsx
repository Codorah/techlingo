import { BatteryFull, Signal, Wifi } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { Easing, Html5Audio, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, SANS, TITLE } from './theme';

export const useLayout = () => {
  const { width, height } = useVideoConfig();
  const vertical = height > width;
  return { vertical, width, height };
};

/** 0 → 1 spring starting at `delay` frames. */
export const useSpring = (delay = 0, damping = 18, durationInFrames?: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, mass: 0.8, stiffness: 140 }, durationInFrames });
};

export const ease = (frame: number, from: number, to: number, out: [number, number] = [0, 1]) =>
  interpolate(frame, [from, to], out, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.25, 1, 0.5, 1) });

/** One-shot UI sound placed at a local frame. */
export const Sfx = ({ at, name, volume = 0.5 }: { at: number; name: 'whoosh' | 'tap' | 'pop' | 'correct' | 'success' | 'rise'; volume?: number }) => (
  <Sequence from={Math.max(0, Math.round(at))} durationInFrames={60} layout="none" name={`sfx ${name}`}>
    <Html5Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
  </Sequence>
);

/** Kinetic headline: each word rises out of a mask, one after the other. `*word*` = accent color. */
export const Headline = ({ text, delay = 0, size, color = C.ink, accent = C.ocean, align = 'left', stagger = 3, style }: {
  text: string; delay?: number; size: number; color?: string; accent?: string; align?: 'left' | 'center'; stagger?: number; style?: CSSProperties;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lines = text.split('\n');
  let k = 0;
  return (
    <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: size, lineHeight: 1.08, letterSpacing: '-0.02em', color, textAlign: align, ...style }}>
      {lines.map((line, li) => (
        <div key={li} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: align === 'center' ? 'center' : 'flex-start', columnGap: size * 0.26 }}>
          {line.split(' ').map((w, wi) => {
            const i = k++;
            const p = spring({ frame: frame - delay - i * stagger, fps, config: { damping: 20, stiffness: 160, mass: 0.7 } });
            const hl = w.startsWith('*');
            const word = w.replace(/\*/g, '');
            return (
              <span key={wi} style={{ display: 'inline-block', overflow: 'hidden', paddingBottom: size * 0.12, marginBottom: -size * 0.12 }}>
                <span style={{ display: 'inline-block', transform: `translateY(${(1 - p) * 105}%) rotate(${(1 - p) * 4}deg)`, color: hl ? accent : undefined }}>{word}</span>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export const Kicker = ({ children, color = C.ocean, delay = 0, size = 30, icon }: { children: ReactNode; color?: string; delay?: number; size?: number; icon?: ReactNode }) => {
  const p = useSpring(delay, 20);
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.4, padding: `${size * 0.32}px ${size * 0.7}px`, borderRadius: 999, background: C.surface, border: `3px solid ${C.line}`, color, fontFamily: SANS, fontWeight: 700, fontSize: size, opacity: p, transform: `translateY(${(1 - p) * 20}px)` }}>
      {icon}
      {children}
    </div>
  );
};

/** Thick pressable button, like the app (shadow = 3D edge). */
export const Btn = ({ children, bg = C.ocean, press = C.oceanPress, color = '#fff', pressed = 0, style, height = 52, fontSize = 17 }: {
  children: ReactNode; bg?: string; press?: string; color?: string; pressed?: number; style?: CSSProperties; height?: number; fontSize?: number;
}) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, height, borderRadius: 16, background: bg, color, fontFamily: SANS, fontWeight: 700, fontSize, boxShadow: `0 ${4 * (1 - pressed)}px 0 ${press}`, transform: `translateY(${4 * pressed}px)`, ...style }}>
    {children}
  </div>
);

/** Press curve: 0 → 1 → 0 around frame `at`. */
export const usePress = (at: number) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [at - 3, at, at + 5], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
};

/** Finger tap feedback: an expanding ring. */
export const TapRing = ({ at, x, y, color = C.ocean }: { at: number; x: number; y: number; color?: string }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < -6 || t > 18) return null;
  const dot = interpolate(t, [-6, 0, 6, 14], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ring = ease(t, 0, 16);
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: 0, height: 0, pointerEvents: 'none', zIndex: 20 }}>
      <div style={{ position: 'absolute', left: -22, top: -22, width: 44, height: 44, borderRadius: 999, background: color, opacity: 0.22 * dot }} />
      <div style={{ position: 'absolute', left: -22 - ring * 26, top: -22 - ring * 26, width: 44 + ring * 52, height: 44 + ring * 52, borderRadius: 999, border: `3px solid ${color}`, opacity: t >= 0 ? 0.6 * (1 - ring) : 0 }} />
    </div>
  );
};

export const SCREEN_W = 390;
export const SCREEN_H = 844;

/** Phone with an app screen inside (390 x 844 logical pixels). */
export const Phone = ({ children, bg = C.mist }: { children: ReactNode; bg?: string }) => (
  <div style={{ width: SCREEN_W + 28, height: SCREEN_H + 28, padding: 14, borderRadius: 64, background: '#10263d', boxShadow: '0 60px 120px -40px rgba(23,50,77,.55), 0 0 0 2px #2a4560 inset' }}>
    <div style={{ position: 'relative', width: SCREEN_W, height: SCREEN_H, borderRadius: 50, overflow: 'hidden', background: bg }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 30px 0 34px', fontFamily: SANS, fontWeight: 700, fontSize: 15, color: C.ink, zIndex: 10 }}>
        <span>9:41</span>
        <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Signal size={16} strokeWidth={2.5} /><Wifi size={16} strokeWidth={2.5} /><BatteryFull size={20} strokeWidth={2} />
        </span>
      </div>
      <div style={{ position: 'absolute', top: 11, left: '50%', marginLeft: -55, width: 110, height: 32, borderRadius: 20, background: '#0b1a2a', zIndex: 11 }} />
      <div style={{ position: 'absolute', inset: 0, paddingTop: 52 }}>{children}</div>
    </div>
  </div>
);

/** Places the phone: right column in landscape, below the headline in vertical. Springs in from below. */
export const PhoneSlot = ({ children, delay = 4, bg }: { children: ReactNode; delay?: number; bg?: string }) => {
  const { vertical } = useLayout();
  const frame = useCurrentFrame();
  const p = useSpring(delay, 16);
  const scale = vertical ? 1.6 : 1.12;
  const float = Math.sin(frame / 38) * 6;
  const style: CSSProperties = vertical
    ? { position: 'absolute', left: '50%', top: 510, transformOrigin: 'top center', transform: `translateX(-50%) translateY(${(1 - p) * 500 + float}px) scale(${scale})` }
    : { position: "absolute", left: 1380, top: 50, transformOrigin: 'top center', transform: `translateX(-50%) translateY(${(1 - p) * 420 + float}px) scale(${scale}) rotate(${(1 - p) * 4}deg)` };
  return <div style={{ ...style, opacity: Math.min(1, p * 1.6) }}><Phone bg={bg}>{children}</Phone></div>;
};

/** Text column: top of the frame in vertical, left half in landscape. */
export const TextSlot = ({ children }: { children: ReactNode }) => {
  const { vertical } = useLayout();
  const style: CSSProperties = vertical
    ? { position: 'absolute', left: 90, right: 90, top: 120, display: 'flex', flexDirection: 'column', gap: 30 }
    : { position: 'absolute', left: 150, width: 880, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 40 };
  return <div style={style}>{children}</div>;
};

export const headlineSize = (vertical: boolean) => (vertical ? 92 : 96);

/** App-like card (radius 16, 2px line, 4px bottom edge). */
export const Card = ({ children, style, edge = C.line, bg = C.surface }: { children: ReactNode; style?: CSSProperties; edge?: string; bg?: string }) => (
  <div style={{ background: bg, border: `2px solid ${edge}`, borderRadius: 16, boxShadow: `0 4px 0 ${edge}`, ...style }}>{children}</div>
);

/** Small "rises in" wrapper for list items. */
export const Rise = ({ delay, children, distance = 40, style }: { delay: number; children: ReactNode; distance?: number; style?: CSSProperties }) => {
  const p = useSpring(delay, 17);
  return <div style={{ opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * distance}px) scale(${0.96 + 0.04 * p})`, ...style }}>{children}</div>;
};
