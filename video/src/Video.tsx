import type { ComponentType, ReactNode } from 'react';
import { AbsoluteFill, Html5Audio, interpolate, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { Problem, Brand } from './scenes/Intro';
import { Roles, PathScene } from './scenes/Path';
import { Word, Dialogue, Quiz, Speak } from './scenes/Lesson';
import { Habit, Career, Perks, End } from './scenes/Outro';
import { C } from './theme';
import { useLayout } from './ui';
import timeline from './timeline.json';

const SCENES: Record<string, ComponentType> = {
  problem: Problem, brand: Brand, roles: Roles, path: PathScene, word: Word, dialogue: Dialogue,
  quiz: Quiz, speak: Speak, habit: Habit, career: Career, perks: Perks, end: End,
};

/** Frames of cross-fade between two scenes. */
const OVER = 10;

const SceneFade = ({ children, duration, first }: { children: ReactNode; duration: number; first: boolean }) => {
  const frame = useCurrentFrame();
  const enter = first ? 1 : interpolate(frame, [0, 9], [0, 1], { extrapolateRight: 'clamp' });
  const exit = interpolate(frame, [duration, duration + OVER], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const lift = interpolate(frame, [duration, duration + OVER], [0, -40], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ opacity: Math.min(enter, exit), transform: `translateY(${lift}px)` }}>{children}</AbsoluteFill>;
};

/** Soft sky shapes drifting behind every scene (no blur filters, cheap to render). */
const Backdrop = () => {
  const frame = useCurrentFrame();
  const { vertical, width, height } = useLayout();
  const a = frame / 90;
  const blob = (x: number, y: number, r: number, color: string) => (
    <div style={{ position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%', background: `radial-gradient(circle, ${color}, transparent 68%)` }} />
  );
  return (
    <AbsoluteFill style={{ background: C.mist, overflow: 'hidden' }}>
      {blob(width * 0.85 + Math.cos(a) * 60, height * (vertical ? 0.62 : 0.5) + Math.sin(a) * 50, vertical ? 760 : 700, 'rgba(101,189,245,.32)')}
      {blob(width * 0.1 + Math.sin(a * 0.8) * 50, height * 0.12 + Math.cos(a * 0.7) * 40, vertical ? 520 : 480, 'rgba(255,255,255,.9)')}
      {blob(width * 0.2 + Math.cos(a * 0.6) * 40, height * 0.95, vertical ? 520 : 420, 'rgba(43,108,176,.10)')}
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(43,108,176,.10) 2px, transparent 2px)', backgroundSize: '44px 44px', opacity: 0.6 }} />
    </AbsoluteFill>
  );
};

const voiceRanges = timeline.scenes.flatMap((s) => s.segments.map((g) => [g.from, g.from + g.durationInFrames] as const));

/** Music bed: ducked under the voice with short ramps. */
const musicVolume = (f: number) => {
  let duck = 0;
  for (const [a, b] of voiceRanges) {
    duck = Math.max(duck, interpolate(f, [a - 8, a, b, b + 12], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  }
  return 0.2 - 0.12 * duck;
};

export const TechLingoVideo = () => {
  const last = timeline.scenes.length - 1;
  return (
    <AbsoluteFill style={{ background: C.mist }}>
      <Backdrop />
      {timeline.scenes.map((s, i) => {
        const Scene = SCENES[s.id];
        return (
          <Sequence key={s.id} name={s.id} from={s.from} durationInFrames={s.durationInFrames + (i === last ? 0 : OVER)}>
            <SceneFade duration={s.durationInFrames} first={i === 0}><Scene /></SceneFade>
          </Sequence>
        );
      })}
      <Html5Audio src={staticFile('music/bed.wav')} volume={musicVolume} />
      {timeline.scenes.flatMap((s) => s.segments.map((g) => (
        <Sequence key={g.src} name={`voice ${g.src}`} from={g.from} durationInFrames={g.durationInFrames + 6} layout="none">
          <Html5Audio src={staticFile(g.src)} volume={g.lang === 'fr' ? 1 : 0.95} />
        </Sequence>
      )))}
    </AbsoluteFill>
  );
};
