import {
  BookOpen, BriefcaseBusiness, ChartColumn, Check, ChevronLeft, Cloud, Globe, Laptop, Lock, type LucideIcon,
  Megaphone, MessagesSquare, PenTool, Search, ShieldCheck, ShoppingCart, TrendingUp, Trophy,
} from 'lucide-react';
import type { CSSProperties } from 'react';
import { useCurrentFrame } from 'remotion';
import { C, SANS, TITLE, sceneOf } from '../theme';
import { Card, ease, Headline, headlineSize, Kicker, PhoneSlot, Rise, Sfx, TextSlot, usePress, useLayout, useSpring } from '../ui';

type Role = [LucideIcon, string];
const IT: Role[] = [[Globe, 'Développement web'], [ChartColumn, 'Analyse de données'], [Cloud, 'DevOps et cloud'], [ShieldCheck, 'Cybersécurité'], [PenTool, 'Produit et design']];
const MKT: Role[] = [[MessagesSquare, 'Community management'], [Search, 'SEO et SEA'], [TrendingUp, 'Growth'], [ShoppingCart, 'E-commerce']];

const Chip = ({ icon: Icon, label, color, delay, selected, size }: { icon: LucideIcon; label: string; color: string; delay: number; selected: number; size: number }) => {
  const p = useSpring(delay, 13);
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: size * 0.4, padding: `${size * 0.42}px ${size * 0.8}px`, borderRadius: 999,
      background: selected > 0.5 ? color : C.surface, color: selected > 0.5 ? '#fff' : C.ink, border: `3px solid ${selected > 0.5 ? color : C.line}`,
      boxShadow: `0 4px 0 ${selected > 0.5 ? 'rgba(0,0,0,.18)' : C.line}`, fontFamily: SANS, fontWeight: 700, fontSize: size,
      opacity: Math.min(1, p * 1.5), transform: `scale(${(0.6 + 0.4 * p) * (1 + 0.06 * Math.sin(Math.PI * Math.min(1, selected)))})`,
    }}>
      {selected > 0.5 ? <Check size={size * 1.1} strokeWidth={3} /> : <Icon size={size * 1.1} strokeWidth={2.25} color={color} />}
      {label}
    </div>
  );
};

/** 3. Choose your domain and your job. */
export const Roles = () => {
  const frame = useCurrentFrame();
  const { vertical } = useLayout();
  const seg = sceneOf('roles').segments[0];
  const pick = seg.localFrom + seg.durationInFrames - 6;
  const press = usePress(pick);
  const selected = ease(frame, pick, pick + 6);
  const size = vertical ? 32 : 28;
  const group = (title: string, Icon: LucideIcon, color: string, soft: string, edge: string, roles: Role[], start: number, sel?: number) => (
    <Rise delay={start - 4}>
      <Card bg={soft} edge={edge} style={{ padding: vertical ? '34px 36px 38px' : '28px 32px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontFamily: TITLE, fontWeight: 900, fontSize: size * 1.45, color }}>
          <span style={{ display: 'grid', placeItems: 'center', width: size * 2.1, height: size * 2.1, borderRadius: 14, background: color, color: '#fff' }}><Icon size={size * 1.2} strokeWidth={2.5} /></span>
          {title}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 24 }}>
          {roles.map(([icon, label], i) => (
            <Chip key={label} icon={icon} label={label} color={color} size={size} delay={start + i * 4} selected={i === sel ? selected : 0} />
          ))}
        </div>
      </Card>
    </Rise>
  );
  const groups = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 30, transform: `translateY(${press * 4}px)` }}>
      {group('Informatique', Laptop, C.ocean, C.surface, C.line, IT, 12, 2)}
      {group('Marketing digital', Megaphone, C.coral, C.coralSoft, '#f6c7ba', MKT, 30)}
    </div>
  );
  const style: CSSProperties = vertical
    ? { position: 'absolute', left: 90, right: 90, top: 560 }
    : { position: 'absolute', left: 1000, right: 110, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' };
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <TextSlot>
        <div><Kicker size={vertical ? 34 : 30}>Informatique ou marketing</Kicker></div>
        <Headline text={'Choisis ton\n*métier.*'} size={headlineSize(vertical) * 1.15} delay={4} />
      </TextSlot>
      <div style={style}>
        {groups}
      </div>
      {[12, 16, 20, 24, 28, 30, 34, 38, 42].map((d, i) => <Sfx key={d} at={d} name="pop" volume={0.12 + (i % 2) * 0.04} />)}
      <Sfx at={pick} name="tap" volume={0.5} />
    </div>
  );
};

const NodeBtn = ({ state, icon: Icon, color, press, delay, x }: { state: 'done' | 'active' | 'locked'; icon: LucideIcon; color: string; press: string; delay: number; x: number }) => {
  const frame = useCurrentFrame();
  const p = useSpring(delay, 12);
  const glow = state === 'active' ? 0.5 + 0.5 * Math.sin(frame / 7) : 0;
  const bg = state === 'locked' ? '#d7e6f3' : state === 'done' ? C.gold : color;
  const edge = state === 'locked' ? '#b6c8d8' : state === 'done' ? C.goldPress : press;
  return (
    <div style={{ position: 'relative', alignSelf: 'center', transform: `translateX(${x}px) scale(${p})`, width: 74, height: 74 }}>
      {state === 'active' && <div style={{ position: 'absolute', inset: -14 - glow * 6, borderRadius: 999, background: color, opacity: 0.14 }} />}
      <div style={{ position: 'absolute', inset: 0, borderRadius: 999, background: bg, boxShadow: `0 7px 0 ${edge}`, display: 'grid', placeItems: 'center', color: state === 'locked' ? '#4f6a85' : '#fff' }}>
        {state === 'locked' ? <Lock size={30} strokeWidth={2.5} /> : state === 'done' ? <Check size={34} strokeWidth={3.5} /> : <Icon size={32} strokeWidth={2.5} />}
      </div>
    </div>
  );
};

const PathScreen = ({ title, unit, unitTitle, situation, color, press, done, base }: {
  title: string; unit: string; unitTitle: string; situation: string; color: string; press: string; done: number; base: number;
}) => {
  const xs = [0, 60, 96, 60, 0, -60];
  const icons: LucideIcon[] = [BookOpen, MessagesSquare, BookOpen, MessagesSquare, BriefcaseBusiness, Trophy];
  return (
    <div style={{ position: 'absolute', inset: 0, paddingTop: 52, fontFamily: SANS }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px 14px', background: C.surface, borderBottom: `4px solid ${C.line}` }}>
        <ChevronLeft size={26} color={C.ink2} />
        <span style={{ display: 'grid', placeItems: 'center', width: 40, height: 40, borderRadius: 12, background: color === C.coral ? C.coralSoft : C.mist, color }}><BriefcaseBusiness size={22} /></span>
        <span style={{ flex: 1, fontFamily: TITLE, fontWeight: 900, fontSize: 18, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
        <span style={{ padding: '6px 10px', borderRadius: 999, background: color === C.coral ? C.coralSoft : C.mist, color, fontWeight: 700, fontSize: 15 }}>{done}/25</span>
      </div>
      <div style={{ padding: '18px 18px 0' }}>
        <Rise delay={base}>
          <div style={{ background: color, color: '#fff', borderRadius: 16, padding: '16px 18px', boxShadow: `0 5px 0 ${press}` }}>
            <div style={{ fontWeight: 700, fontSize: 14, opacity: 0.9 }}>{unit}</div>
            <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 22, lineHeight: 1.15, marginTop: 4 }}>{unitTitle}</div>
            <div style={{ fontSize: 14.5, lineHeight: 1.4, marginTop: 8, opacity: 0.95 }}>{situation}</div>
          </div>
        </Rise>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, marginTop: 30 }}>
          {xs.map((x, i) => (
            <NodeBtn key={i} x={x} icon={icons[i]} color={color} press={press} delay={base + 6 + i * 3} state={i < done ? 'done' : i === done ? 'active' : 'locked'} />
          ))}
        </div>
      </div>
    </div>
  );
};

/** 4. A job path made of real work situations. */
export const PathScene = () => {
  const frame = useCurrentFrame();
  const { vertical } = useLayout();
  const seg = sceneOf('path').segments[0];
  const swap = seg.localFrom + Math.round(seg.durationInFrames * 0.6);
  const t = ease(frame, swap, swap + 14);
  const done = frame > 34 ? (frame > 48 ? 2 : 1) : 0;
  const chip = (label: string, color: string, delay: number) => (
    <Rise delay={delay} distance={24}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 14, padding: vertical ? '16px 26px' : '14px 24px', borderRadius: 16, background: C.surface, border: `3px solid ${color}`, boxShadow: `0 4px 0 ${color}`, color, fontFamily: TITLE, fontWeight: 900, fontSize: vertical ? 38 : 36 }}>{label}</span>
    </Rise>
  );
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <TextSlot>
        <Headline text={'Un parcours en\n*situations réelles*'} size={headlineSize(vertical)} delay={4} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
          {chip('Signaler un bug', C.ocean, seg.localFrom + Math.round(seg.durationInFrames * 0.42))}
          {chip('Présenter une campagne', C.coral, swap)}
        </div>
      </TextSlot>
      <PhoneSlot delay={2}>
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - t, transform: `translateX(${-t * 60}px)` }}>
          <PathScreen title="L’anglais de ta semaine de dev" unit="Unité 1" unitTitle="Comprendre un message d’erreur et le signaler" situation="Ton application plante : lis l’erreur, fouille les logs et signale le bug à ton équipe." color={C.ocean} press={C.oceanPress} done={done} base={8} />
        </div>
        {t > 0 && (
          <div style={{ position: 'absolute', inset: 0, opacity: t, transform: `translateX(${(1 - t) * 60}px)`, background: C.mist }}>
            <PathScreen title="L’anglais du marketing digital" unit="Unité 4" unitTitle="Publicité et campagnes" situation="Tu pilotes une campagne payante : le brief, le budget, les résultats à présenter." color={C.coral} press={C.coralPress} done={0} base={swap} />
          </div>
        )}
      </PhoneSlot>
      <Sfx at={0} name="whoosh" volume={0.3} />
      <Sfx at={35} name="pop" volume={0.3} />
      <Sfx at={49} name="pop" volume={0.3} />
      <Sfx at={swap} name="whoosh" volume={0.3} />
    </div>
  );
};
