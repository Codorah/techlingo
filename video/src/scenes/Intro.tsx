import { Hash } from 'lucide-react';
import { Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { C, SANS, TITLE, sceneOf } from '../theme';
import { Card, ease, Headline, Rise, Sfx, useLayout, useSpring } from '../ui';

const FLOATING = ['stack trace', 'rollback', 'deadline', 'stakeholders', 'deploy', 'reach', 'bug report', 'stand-up', 'KPI', 'feedback'];

/** 1. The problem: you read English, but the words do not come when you have to speak. */
export const Problem = () => {
  const frame = useCurrentFrame();
  const { vertical } = useLayout();
  const seg = sceneOf('problem').segments[0];
  const butAt = seg.localFrom + Math.round(seg.durationInFrames * 0.36);
  const size = vertical ? 104 : 100;

  // English words drift in the free bands (above and below the content), out of reach.
  const anchors: [number, number][] = vertical
    ? [[-300, -800], [80, -700], [300, -830], [-180, -600], [260, -560], [-320, 640], [40, 720], [300, 600], [-160, 840], [220, 860]]
    : [[-760, -420], [-330, -360], [80, -430], [470, -380], [800, -420], [-700, 400], [-260, 440], [160, 380], [540, 430], [820, 380]];
  const words = FLOATING.map((w, i) => {
    const [ax, ay] = anchors[i];
    const x = ax + Math.sin(frame / 50 + i * 1.7) * 30;
    const y = ay + Math.cos(frame / 60 + i) * 14;
    const appear = ease(frame, butAt + i * 2, butAt + 20 + i * 2);
    return { w, x, y, o: appear * 0.45 };
  });

  const card = (
    <Rise delay={14} distance={60}>
      <Card style={{ width: vertical ? 860 : 740, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 28px', borderBottom: `2px solid ${C.line}`, color: C.ink2, fontFamily: SANS, fontWeight: 700, fontSize: 28 }}>
          <Hash size={30} color={C.ocean} strokeWidth={2.5} /> Slack · #equipe
        </div>
        <div style={{ padding: '26px 28px 30px', display: 'flex', flexDirection: 'column', gap: 26 }}>
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ flex: 'none', width: 64, height: 64, borderRadius: 14, background: C.coral, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: TITLE, fontWeight: 900, fontSize: 30 }}>T</div>
            <div style={{ fontFamily: SANS, fontSize: 34, lineHeight: 1.4, color: C.ink }}>
              <div style={{ fontWeight: 700, fontSize: 28 }}>Tomasz</div>
              <span lang="en">Can you walk us through the bug at the stand-up?</span>
            </div>
          </div>
          <Rise delay={34} distance={30}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <div style={{ flex: 'none', width: 64, height: 64, borderRadius: 14, background: C.ocean, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: TITLE, fontWeight: 900, fontSize: 30 }}>A</div>
              <div style={{ display: 'flex', gap: 10, padding: '18px 24px', borderRadius: 16, background: C.mist }}>
                {[0, 1, 2].map((d) => (
                  <span key={d} style={{ width: 16, height: 16, borderRadius: 99, background: C.ink2, opacity: 0.25 + 0.75 * Math.max(0, Math.sin((frame - d * 5) / 6)) }} />
                ))}
              </div>
            </div>
          </Rise>
        </div>
      </Card>
    </Rise>
  );

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {words.map(({ w, x, y, o }) => (
        <div key={w} lang="en" style={{ position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`, opacity: o, fontFamily: TITLE, fontWeight: 800, fontSize: 40, color: C.ocean, whiteSpace: 'nowrap' }}>{w}</div>
      ))}
      {vertical ? (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 90, padding: '0 90px' }}>
          <Headline text="Tu lis l’anglais." size={size} align="center" delay={4} />
          {card}
          <Headline text={'Mais à l’oral,\n*tu bloques.*'} size={size} align="center" delay={butAt} accent={C.coral} />
        </div>
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 60, padding: '0 130px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40, width: 860, flex: 'none' }}>
            <Headline text="Tu lis l’anglais." size={size} delay={4} />
            <Headline text={'Mais à l’oral,\n*tu bloques.*'} size={size} delay={butAt} accent={C.coral} />
          </div>
          {card}
        </div>
      )}
      <Sfx at={14} name="pop" volume={0.35} />
      <Sfx at={34} name="tap" volume={0.3} />
    </div>
  );
};

/** 2. Brand reveal. */
export const Brand = () => {
  const frame = useCurrentFrame();
  const { vertical } = useLayout();
  const logo = useSpring(2, 11);
  const ring = ease(frame, 4, 40);
  const tag = sceneOf('brand').segments[0].localFrom + 34;
  const name = 'TechLingo';
  const logoSize = vertical ? 300 : 240;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: vertical ? 56 : 40 }}>
      <div style={{ position: 'relative', width: logoSize, height: logoSize }}>
        <div style={{ position: 'absolute', inset: -ring * 140, borderRadius: '50%', border: `4px solid ${C.sky}`, opacity: 0.6 * (1 - ring) }} />
        <div style={{ position: 'absolute', inset: -ring * 260, borderRadius: '50%', border: `3px solid ${C.sky}`, opacity: 0.35 * (1 - ring) }} />
        <Img src={staticFile('logo.svg')} style={{ width: logoSize, height: logoSize, transform: `scale(${logo}) rotate(${(1 - logo) * -12}deg)`, filter: 'drop-shadow(0 30px 40px rgba(37,96,160,.35))' }} />
      </div>
      <div style={{ display: 'flex', fontFamily: TITLE, fontWeight: 900, fontSize: vertical ? 150 : 140, letterSpacing: '-0.03em', color: C.ink, lineHeight: 1 }}>
        {name.split('').map((ch, i) => {
          const p = letterSpring(frame, 10 + i * 2);
          return <span key={i} style={{ display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * 60}px)`, color: i >= 4 ? C.ocean : C.ink }}>{ch}</span>;
        })}
      </div>
      <div style={{ opacity: ease(frame, tag, tag + 14), transform: `translateY(${ease(frame, tag, tag + 14, [24, 0])}px)`, fontFamily: SANS, fontWeight: 500, fontSize: vertical ? 50 : 46, color: C.ink2, textAlign: 'center', padding: '0 80px' }}>
        L’anglais de ton métier,{vertical ? <br /> : ' '}<b style={{ color: C.ink }}>5 minutes par jour</b>.
      </div>
      <Sfx at={0} name="whoosh" volume={0.35} />
      <Sfx at={4} name="success" volume={0.32} />
    </div>
  );
};

// Plain-math spring stand-in so it can be called inside map() without hook rules.
const letterSpring = (frame: number, delay: number) =>
  interpolate(frame - delay, [0, 6, 10, 14], [0, 0.85, 1.04, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
