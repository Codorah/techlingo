import { BriefcaseBusiness, Check, Download, Gift, Lightbulb, Mic, RotateCcw, Trophy, UserRoundX, WifiOff, Zap, type LucideIcon } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { C, MONO, SANS, TITLE, sceneOf } from '../theme';
import { Btn, Card, ease, Headline, headlineSize, Kicker, PhoneSlot, Rise, Sfx, TextSlot, useLayout, useSpring } from '../ui';

const Tile = ({ icon: Icon, color, soft, title, children, delay, style }: { icon: LucideIcon; color: string; soft: string; title: string; children?: ReactNode; delay: number; style?: CSSProperties }) => {
  const { vertical } = useLayout();
  const s = vertical ? 1 : 0.9;
  return (
    <Rise delay={delay} distance={50} style={style}>
      <Card style={{ padding: `${30 * s}px ${34 * s}px`, display: 'flex', gap: 26 * s, alignItems: 'center' }}>
        <span style={{ flex: 'none', display: 'grid', placeItems: 'center', width: 92 * s, height: 92 * s, borderRadius: 16, background: soft, color }}><Icon size={50 * s} strokeWidth={2.25} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 40 * s, color: C.ink }}>{title}</div>
          {children}
        </div>
      </Card>
    </Rise>
  );
};

const RightColumn = ({ children }: { children: ReactNode }) => {
  const { vertical } = useLayout();
  const style: CSSProperties = vertical
    ? { position: 'absolute', left: 90, right: 90, top: 560, display: 'flex', flexDirection: 'column', gap: 30 }
    : { position: 'absolute', left: 1000, right: 110, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 26 };
  return <div style={style}>{children}</div>;
};

/** 9. Spaced repetition, XP, weekly goal, trophy. */
export const Habit = () => {
  const frame = useCurrentFrame();
  const { vertical } = useLayout();
  const seg = sceneOf('habit').segments[0];
  const xpAt = seg.localFrom + Math.round(seg.durationInFrames * 0.5);
  const goalAt = seg.localFrom + Math.round(seg.durationInFrames * 0.7);
  const trophyAt = seg.localFrom + seg.durationInFrames - 2;
  const xp = Math.round(interpolate(frame, [xpAt, xpAt + 18], [320, 340], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const gain = useSpring(xpAt, 10);
  const trophy = useSpring(trophyAt, 10);
  const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const activeDays = [0, 1, 3, 4];
  const sub = { fontFamily: SANS, fontSize: vertical ? 28 : 25, color: C.ink2, marginTop: 4 } as const;
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <TextSlot>
        <div><Kicker size={vertical ? 34 : 30} color={C.teal}>Révisions au bon moment</Kicker></div>
        <Headline text={'Ça reste,\n*chaque semaine*'} size={headlineSize(vertical)} delay={4} accent={C.teal} />
      </TextSlot>
      <RightColumn>
        <Tile icon={RotateCcw} color={C.teal} soft={C.tealSoft} title="Révisions du jour" delay={8}>
          <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
            {['rollback', 'deploy', 'stack trace'].map((w, i) => (
              <Rise key={w} delay={16 + i * 4} distance={16}>
                <span lang="en" style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 999, background: C.tealSoft, color: C.teal, fontFamily: SANS, fontWeight: 700, fontSize: vertical ? 26 : 23 }}>{w}</span>
              </Rise>
            ))}
          </div>
        </Tile>
        <Tile icon={Zap} color={C.goldInk} soft={C.sun} title={`${xp} XP`} delay={xpAt - 14}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={sub}>Selon ta maîtrise, pas le volume</div>
            <span style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 12, background: C.gold, color: C.ink, fontFamily: TITLE, fontWeight: 900, fontSize: vertical ? 30 : 27, transform: `scale(${gain})`, opacity: Math.min(1, gain) }}>+20</span>
          </div>
        </Tile>
        <Tile icon={Check} color={C.mintInk} soft={C.mint} title="Objectif de la semaine" delay={goalAt - 12}>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            {days.map((d, i) => {
              const k = activeDays.indexOf(i);
              const on = k >= 0 ? ease(frame, goalAt + k * 5, goalAt + k * 5 + 8) : 0;
              return (
                <span key={i} style={{ flex: 1, height: vertical ? 50 : 42, borderRadius: 12, display: 'grid', placeItems: 'center', fontFamily: SANS, fontWeight: 700, fontSize: vertical ? 22 : 19, background: on > 0.5 ? C.mintStrong : C.line, color: on > 0.5 ? '#fff' : C.ink2, transform: `scale(${1 + 0.12 * Math.sin(Math.PI * on)})` }}>{d}</span>
              );
            })}
          </div>
          <div style={sub}>4 jours actifs sur 4 : objectif atteint</div>
        </Tile>
      </RightColumn>
      {trophy > 0.01 && (
        <div style={{ position: 'absolute', right: vertical ? 70 : 90, top: vertical ? 470 : 120, transform: `scale(${trophy}) rotate(${(1 - trophy) * -20}deg)`, display: 'flex', alignItems: 'center', gap: 14, padding: '16px 24px', borderRadius: 16, background: C.gold, boxShadow: `0 6px 0 ${C.goldPress}`, color: C.ink, fontFamily: TITLE, fontWeight: 900, fontSize: vertical ? 34 : 30 }}>
          <Trophy size={vertical ? 40 : 36} strokeWidth={2.5} /> Unité terminée !
        </div>
      )}
      <Sfx at={8} name="pop" volume={0.25} />
      <Sfx at={xpAt} name="success" volume={0.35} />
      {activeDays.map((_, k) => <Sfx key={k} at={goalAt + k * 5} name="tap" volume={0.22} />)}
      <Sfx at={trophyAt} name="correct" volume={0.4} />
    </div>
  );
};

/** 10. Career: mock interview. */
export const Career = () => {
  const frame = useCurrentFrame();
  const sc = sceneOf('career');
  const en = sc.segments[1];
  const q = 'Can you explain what DevOps is?';
  const { vertical } = useLayout();
  const typed = Math.round(ease(frame, en.localFrom - 4, en.localFrom + en.durationInFrames - 6, [0, q.length]));
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <TextSlot>
        <div><Kicker size={vertical ? 34 : 30} icon={<BriefcaseBusiness size={30} />}>Carrière</Kicker></div>
        <Headline text={'Prêt pour\n*l’entretien*'} size={headlineSize(vertical) * 1.1} delay={4} />
      </TextSlot>
      <PhoneSlot delay={0}>
        <div style={{ padding: '18px 22px 0', fontFamily: SANS }}>
          <div style={{ color: C.ocean, fontWeight: 700, fontSize: 15 }}>Carrière · DevOps et cloud</div>
          <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 28, color: C.ink, marginTop: 2 }}>Entretien blanc</div>
          <div style={{ fontSize: 14.5, color: C.ink2, marginTop: 4, lineHeight: 1.4 }}>Les questions qu’un recruteur de ton métier pose vraiment. Réponds à voix haute.</div>
          <Rise delay={8}>
            <Card style={{ marginTop: 18, padding: '18px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ display: 'grid', placeItems: 'center', width: 44, height: 44, borderRadius: 12, background: C.mist, color: C.ocean }}><BriefcaseBusiness size={24} /></span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>Recruteur</div>
                  <div style={{ fontSize: 13, color: C.ink2 }}>Question 1 sur 5</div>
                </div>
              </div>
              <div lang="en" style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 25, lineHeight: 1.25, color: C.ink, marginTop: 14, minHeight: 64 }}>
                {q.slice(0, typed)}
                {typed < q.length && <span style={{ display: 'inline-block', width: 3, height: 26, background: C.ocean, marginLeft: 2, verticalAlign: -4, opacity: Math.floor(frame / 8) % 2 ? 1 : 0.2 }} />}
              </div>
              <div style={{ fontSize: 15, color: C.ink2, marginTop: 6 }}>Pouvez-vous expliquer ce qu’est le DevOps ?</div>
            </Card>
          </Rise>
          <Rise delay={20}>
            <Card bg={C.sun} edge="#f3dc9a" style={{ marginTop: 16, padding: '14px 16px', display: 'flex', gap: 10, color: C.sunInk, fontSize: 15, lineHeight: 1.4 }}>
              <Lightbulb size={22} style={{ flex: 'none' }} />
              Une culture, pas un outil : collaboration dev et ops, automatisation, exemple concret.
            </Card>
          </Rise>
          <Rise delay={28}>
            <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['culture', 'automating', 'CI/CD pipeline'].map((k) => (
                <span key={k} lang="en" style={{ padding: '6px 12px', borderRadius: 999, background: C.surface, border: `2px solid ${C.line}`, fontFamily: MONO, fontSize: 13.5, color: C.ocean }}>{k}</span>
              ))}
            </div>
          </Rise>
        </div>
        <div style={{ position: 'absolute', left: 22, right: 22, bottom: 34 }}>
          <Rise delay={34}>
            <Btn bg={C.violet} press={C.violetPress} height={56}><Mic size={22} strokeWidth={2.5} /> Répondre à voix haute</Btn>
          </Rise>
        </div>
      </PhoneSlot>
      <Sfx at={0} name="whoosh" volume={0.3} />
      <Sfx at={8} name="pop" volume={0.25} />
    </div>
  );
};

/** 11. Free, offline, no account, installable. */
export const Perks = () => {
  const { vertical } = useLayout();
  const seg = sceneOf('perks').segments[0];
  const d = seg.durationInFrames;
  const at = [seg.localFrom, seg.localFrom + Math.round(d * 0.14), seg.localFrom + Math.round(d * 0.3), seg.localFrom + Math.round(d * 0.5)];
  const sub = { fontFamily: SANS, fontSize: vertical ? 28 : 25, color: C.ink2, marginTop: 2 } as const;
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <TextSlot>
        <Headline text={'Léger, libre,\n*toujours avec toi*'} size={headlineSize(vertical)} delay={4} />
      </TextSlot>
      <RightColumn>
        <Tile icon={Gift} color={C.ocean} soft={C.mist} title="Gratuit" delay={at[0]}><div style={sub}>Tout le parcours, sans abonnement</div></Tile>
        <Tile icon={WifiOff} color={C.teal} soft={C.tealSoft} title="Hors ligne" delay={at[1]}><div style={sub}>Même dans le métro, une fois installée</div></Tile>
        <Tile icon={UserRoundX} color={C.violet} soft={C.violetSoft} title="Sans compte" delay={at[2]}><div style={sub}>Ta progression reste sur ton téléphone</div></Tile>
        <Tile icon={Download} color={C.coral} soft={C.coralSoft} title="Installable" delay={at[3]}><div style={sub}>Depuis ton navigateur, sans store</div></Tile>
      </RightColumn>
      {at.map((a) => <Sfx key={a} at={a} name="pop" volume={0.3} />)}
    </div>
  );
};

/** 12. End card. */
export const End = () => {
  const frame = useCurrentFrame();
  const { vertical } = useLayout();
  const logo = useSpring(0, 12);
  const name = useSpring(6, 16);
  const tag = useSpring(14, 18);
  const cta = useSpring(26, 14);
  const glow = 0.5 + 0.5 * Math.sin(frame / 10);
  return (
    <div style={{ position: 'absolute', inset: 0, background: C.ocean, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: vertical ? 44 : 30, color: '#fff' }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% ${vertical ? 38 : 34}%, rgba(101,189,245,.45), transparent ${vertical ? 55 : 45}%)` }} />
      <Img src={staticFile('logo.svg')} style={{ position: 'relative', width: vertical ? 260 : 200, height: vertical ? 260 : 200, transform: `scale(${logo}) rotate(${(1 - logo) * 15}deg)`, filter: 'drop-shadow(0 24px 40px rgba(6,30,60,.45))' }} />
      <div style={{ position: 'relative', fontFamily: TITLE, fontWeight: 900, fontSize: vertical ? 150 : 132, letterSpacing: '-0.03em', lineHeight: 1, opacity: name, transform: `translateY(${(1 - name) * 50}px)` }}>TechLingo</div>
      <div style={{ position: 'relative', fontFamily: TITLE, fontWeight: 800, fontSize: vertical ? 58 : 52, opacity: tag, transform: `translateY(${(1 - tag) * 30}px)`, color: '#dff1ff' }}>L’anglais de ton métier</div>
      <div style={{ position: 'relative', marginTop: vertical ? 40 : 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26, opacity: cta, transform: `translateY(${(1 - cta) * 40}px)` }}>
        <Btn bg="#fff" press="rgba(0,20,50,.3)" color={C.ocean} height={vertical ? 104 : 88} fontSize={vertical ? 44 : 38} style={{ padding: '0 56px', boxShadow: `0 8px 0 rgba(0,20,50,.3), 0 0 0 ${glow * 14}px rgba(255,255,255,.12)` }}>
          Commencer gratuitement
        </Btn>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: vertical ? 42 : 36, letterSpacing: '0.01em' }}>techlinngo.vercel.app</div>
      </div>
      <Sfx at={0} name="whoosh" volume={0.35} />
      <Sfx at={2} name="success" volume={0.35} />
    </div>
  );
};
