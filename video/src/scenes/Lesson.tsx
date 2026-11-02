import { Check, Hash, Languages, Mic, Volume2, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useCurrentFrame } from 'remotion';
import { C, SANS, TITLE, sceneOf } from '../theme';
import { Btn, Card, ease, Headline, headlineSize, Kicker, PhoneSlot, Rise, Sfx, TapRing, TextSlot, usePress, useLayout, useSpring } from '../ui';

/** Lesson chrome: close button + progress bar, like the app. */
const LessonTop = ({ progress, color = C.mintStrong }: { progress: number; color?: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '14px 22px 0' }}>
    <X size={26} color={C.ink2} strokeWidth={2.5} />
    <div style={{ flex: 1, height: 14, borderRadius: 99, background: C.line, overflow: 'hidden' }}>
      <div style={{ width: `${progress * 100}%`, height: '100%', borderRadius: 99, background: color }} />
    </div>
  </div>
);

const ScreenTitle = ({ kicker, title, sub, color = C.ocean }: { kicker: string; title: string; sub?: string; color?: string }) => (
  <div style={{ padding: '22px 22px 0', fontFamily: SANS }}>
    <div style={{ color, fontWeight: 700, fontSize: 15 }}>{kicker}</div>
    <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 28, color: C.ink, marginTop: 2 }}>{title}</div>
    {sub && <div style={{ fontSize: 14.5, color: C.ink2, marginTop: 4, lineHeight: 1.4 }}>{sub}</div>}
  </div>
);

const Lesson = ({ children, headline, kicker, kickerColor }: { children: ReactNode; headline: string; kicker: string; kickerColor?: string }) => {
  const { vertical } = useLayout();
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <TextSlot>
        <div><Kicker size={vertical ? 34 : 30} color={kickerColor}>{kicker}</Kicker></div>
        <Headline text={headline} size={headlineSize(vertical)} delay={4} accent={kickerColor ?? C.ocean} />
      </TextSlot>
      {children}
    </div>
  );
};

/** 5. New word with audio. */
export const Word = () => {
  const frame = useCurrentFrame();
  const sc = sceneOf('word');
  const en = sc.segments[1];
  const speaking = frame >= en.localFrom && frame < en.localFrom + en.durationInFrames;
  const press = usePress(en.localFrom - 2);
  return (
    <Lesson kicker="Leçon · Les mots" headline={'Chaque mot,\navec *l’audio*'}>
      <PhoneSlot delay={2}>
        <LessonTop progress={ease(frame, 10, 40, [0.1, 0.3])} />
        <ScreenTitle kicker="Nouveau mot" title="Écoute et retiens" />
        <div style={{ padding: '18px 22px 0' }}>
          <Rise delay={10}>
            <Card style={{ padding: '26px 22px', textAlign: 'center' }}>
              <div style={{ position: 'relative', margin: '0 auto', width: 84, height: 84 }}>
                {speaking && [0, 1].map((k) => {
                  const r = ((frame - en.localFrom + k * 9) % 18) / 18;
                  return <div key={k} style={{ position: 'absolute', inset: -r * 26, borderRadius: 99, border: `3px solid ${C.ocean}`, opacity: 0.5 * (1 - r) }} />;
                })}
                <div style={{ position: 'absolute', inset: 0, borderRadius: 99, background: C.ocean, boxShadow: `0 ${5 * (1 - press)}px 0 ${C.oceanPress}`, transform: `translateY(${5 * press}px)`, display: 'grid', placeItems: 'center', color: '#fff' }}>
                  <Volume2 size={38} strokeWidth={2.5} />
                </div>
              </div>
              <div lang="en" style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 40, color: C.ink, marginTop: 20 }}>stack trace</div>
              <div style={{ fontFamily: SANS, fontSize: 15, color: C.ink2, marginTop: 2 }}>nom · B2</div>
              <div style={{ display: 'inline-block', marginTop: 14, padding: '8px 14px', borderRadius: 12, background: C.mist, color: C.ocean, fontFamily: SANS, fontWeight: 700, fontSize: 17 }}>trace d’appels</div>
            </Card>
          </Rise>
          <Rise delay={22}>
            <Card style={{ marginTop: 18, padding: '16px 18px', fontFamily: SANS }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Au travail</div>
              <div lang="en" style={{ fontSize: 17, color: C.ink, marginTop: 6, lineHeight: 1.45 }}>The <b>stack trace</b> points to line 42 of the payment file.</div>
              <div style={{ fontSize: 15, color: C.ink2, marginTop: 6, lineHeight: 1.4 }}>La trace d’appels pointe vers la ligne 42 du fichier de paiement.</div>
            </Card>
          </Rise>
          <Rise delay={30}>
            <Card bg={C.sun} edge="#f3dc9a" style={{ marginTop: 18, padding: '14px 18px', fontFamily: SANS, fontSize: 15, color: C.sunInk, lineHeight: 1.4 }}>
              Indispensable pour déboguer : on la colle dans les rapports de bug.
            </Card>
          </Rise>
        </div>
      </PhoneSlot>
      <Sfx at={en.localFrom - 2} name="tap" volume={0.35} />
    </Lesson>
  );
};

const MESSAGES: { who: string; color: string; text: string }[] = [
  { who: 'Aïcha', color: C.goldPress, text: 'Hi Tomasz, the app crashes when I open the profile page.' },
  { who: 'Tomasz', color: C.coral, text: 'Can you share the full stack trace? The top lines tell us where the exception is thrown.' },
  { who: 'Aïcha', color: C.goldPress, text: 'Sure, here it is. It points to UserCard.tsx, line 42.' },
];

/** 6. Real team conversation. */
export const Dialogue = () => {
  const frame = useCurrentFrame();
  const starts = [8, 30, 56];
  return (
    <Lesson kicker="Leçon · En situation" headline={'Un vrai échange\n*d’équipe*'}>
      <PhoneSlot delay={0}>
        <LessonTop progress={ease(frame, 0, 30, [0.3, 0.5])} />
        <ScreenTitle kicker="En situation" title="Lis l’échange" sub="Touche le haut-parleur pour écouter." />
        <div style={{ padding: '16px 18px 0' }}>
          <Card style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: `2px solid ${C.line}`, fontFamily: SANS, fontWeight: 700, fontSize: 16, color: C.ink2 }}>
              <Hash size={20} color={C.ocean} strokeWidth={2.5} /> Slack · #equipe
            </div>
            <div style={{ padding: '6px 16px 14px' }}>
              {MESSAGES.map((m, i) => (
                <Rise key={i} delay={starts[i]} distance={26}>
                  <div style={{ display: 'flex', gap: 12, paddingTop: 14 }}>
                    <div style={{ flex: 'none', width: 38, height: 38, borderRadius: 10, background: m.color, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: TITLE, fontWeight: 900, fontSize: 18 }}>{m.who[0]}</div>
                    <div style={{ fontFamily: SANS }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>{m.who}</div>
                      <div lang="en" style={{ fontSize: 16.5, lineHeight: 1.45, color: C.ink }}>{highlight(m.text)}</div>
                      <div style={{ display: 'flex', gap: 18, marginTop: 6, color: C.ocean }}><Volume2 size={20} /><Languages size={20} /></div>
                    </div>
                  </div>
                </Rise>
              ))}
            </div>
          </Card>
        </div>
      </PhoneSlot>
      {starts.map((s) => <Sfx key={s} at={s} name="pop" volume={0.28} />)}
    </Lesson>
  );
};

const highlight = (text: string) => {
  const parts = text.split('stack trace');
  return parts.length === 1 ? text : <>{parts[0]}<b style={{ background: C.sun, borderRadius: 4, padding: '0 3px' }}>stack trace</b>{parts[1]}</>;
};

/** 7. Quick quiz: the right answer turns green. */
export const Quiz = () => {
  const frame = useCurrentFrame();
  const pick = 56;
  const press = usePress(pick);
  const ok = ease(frame, pick + 2, pick + 10);
  const banner = useSpring(pick + 6, 16);
  const choices = ['Une liste de tâches à faire', 'La suite d’appels qui mène à l’erreur', 'Une pile de serveurs'];
  return (
    <Lesson kicker="Leçon · Quiz" headline={'Un quiz rapide,\n*c’est acquis*'} kickerColor={C.mintInk}>
      <PhoneSlot delay={0}>
        <LessonTop progress={ease(frame, pick, pick + 16, [0.5, 0.7])} />
        <ScreenTitle kicker="Choisis la bonne réponse" title="Que veut dire « stack trace » ?" />
        <div style={{ padding: '22px 22px 0', display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
          {choices.map((c, i) => {
            const right = i === 1;
            const g = right ? ok : 0;
            return (
              <Rise key={c} delay={8 + i * 5} distance={24}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12, minHeight: 64, padding: '12px 16px', borderRadius: 16, fontFamily: SANS, fontWeight: 700, fontSize: 17,
                  background: g > 0.5 ? C.mint : C.surface, color: g > 0.5 ? C.mintInk : C.ink,
                  border: `2px solid ${g > 0.5 ? C.mintStrong : C.line}`, boxShadow: `0 ${4 * (1 - (right ? press : 0))}px 0 ${g > 0.5 ? C.mintStrong : C.line}`,
                  transform: `translateY(${(right ? press : 0) * 4}px) scale(${1 + 0.04 * Math.sin(Math.PI * g)})`,
                }}>
                  <span style={{ flex: 'none', display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: 8, border: `2px solid ${g > 0.5 ? C.mintStrong : C.line}`, background: g > 0.5 ? C.mintStrong : 'transparent', color: '#fff', fontSize: 14 }}>
                    {g > 0.5 ? <Check size={20} strokeWidth={3.5} /> : <span style={{ color: C.ink2 }}>{i + 1}</span>}
                  </span>
                  {c}
                </div>
              </Rise>
            );
          })}
          <TapRing at={pick} x={250} y={22 + 64 + 14 + 32} color={C.mintStrong} />
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '20px 22px 34px', background: C.mint, transform: `translateY(${(1 - banner) * 100}%)` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: TITLE, fontWeight: 900, fontSize: 24, color: C.mintInk }}>
            <span style={{ display: 'grid', placeItems: 'center', width: 36, height: 36, borderRadius: 99, background: C.mintStrong, color: '#fff' }}><Check size={22} strokeWidth={3.5} /></span>
            Bien joué !
          </div>
          <div style={{ fontFamily: SANS, fontSize: 15, color: C.mintInk, marginTop: 6 }}>On la colle dans le rapport de bug.</div>
          <Btn bg={C.mintStrong} press={C.mintInk} style={{ marginTop: 16 }}>Continuer</Btn>
        </div>
      </PhoneSlot>
      <Sfx at={pick} name="tap" volume={0.4} />
      <Sfx at={pick + 3} name="correct" volume={0.5} />
    </Lesson>
  );
};

/** 8. Speaking: say it out loud, the waveform follows the voice. */
export const Speak = () => {
  const frame = useCurrentFrame();
  const sc = sceneOf('speak');
  const en = sc.segments[1];
  const tapAt = en.localFrom - 8;
  const press = usePress(tapAt);
  const live = frame >= en.localFrom - 2 && frame < en.localFrom + en.durationInFrames + 2;
  const doneAt = en.localFrom + en.durationInFrames + 4;
  const done = useSpring(doneAt, 14);
  const words = 'Can you share the full stack trace?'.split(' ');
  const spoken = Math.floor(ease(frame, en.localFrom, en.localFrom + en.durationInFrames, [0, words.length]));
  return (
    <Lesson kicker="À l’oral" headline={'Dis-le\n*à voix haute*'} kickerColor={C.violet}>
      <PhoneSlot delay={0}>
        <LessonTop progress={ease(frame, 0, 20, [0.7, 0.85])} color={C.violet} />
        <ScreenTitle kicker="À toi de parler" title="Dis-le à voix haute" sub="Écoute, puis dis la phrase à voix haute en anglais." color={C.violet} />
        <div style={{ padding: '20px 22px 0' }}>
          <Rise delay={6}>
            <Card bg={C.violetSoft} edge="#d8cffd" style={{ padding: '20px 20px', textAlign: 'center' }}>
              <div lang="en" style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 25, lineHeight: 1.3, color: C.ink }}>
                {words.map((w, i) => <span key={i} style={{ color: i < spoken ? C.violet : C.ink }}>{w} </span>)}
              </div>
              <div style={{ fontFamily: SANS, fontSize: 15, color: C.ink2, marginTop: 8 }}>Tu peux partager la trace d’appels complète ?</div>
            </Card>
          </Rise>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, height: 90, marginTop: 24 }}>
            {Array.from({ length: 28 }).map((_, i) => {
              const n = Math.abs(Math.sin(frame * 0.55 + i * 1.7) * Math.sin(frame * 0.23 + i * 0.6)) * (0.4 + 0.6 * Math.sin((i / 27) * Math.PI));
              const h = live ? 10 + n * 76 : 8;
              return <span key={i} style={{ width: 6, height: h, borderRadius: 99, background: C.violet, opacity: live ? 0.95 : 0.3 }} />;
            })}
          </div>
          <div style={{ position: 'relative', margin: '18px auto 0', width: 108, height: 108 }}>
            {live && [0, 1].map((k) => {
              const r = ((frame + k * 10) % 20) / 20;
              return <div key={k} style={{ position: 'absolute', inset: -r * 30, borderRadius: 99, background: C.violet, opacity: 0.18 * (1 - r) }} />;
            })}
            <div style={{ position: 'absolute', inset: 0, borderRadius: 99, background: done > 0.5 ? C.mintStrong : C.violet, boxShadow: `0 ${6 * (1 - press)}px 0 ${done > 0.5 ? C.mintInk : C.violetPress}`, transform: `translateY(${6 * press}px) scale(${1 + 0.08 * Math.sin(Math.PI * Math.min(1, done))})`, display: 'grid', placeItems: 'center', color: '#fff' }}>
              {done > 0.5 ? <Check size={52} strokeWidth={3} /> : <Mic size={48} strokeWidth={2.5} />}
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 20, fontFamily: TITLE, fontWeight: 900, fontSize: 20, color: done > 0.5 ? C.mintInk : C.violet, opacity: frame > tapAt ? 1 : 0 }}>
            {done > 0.5 ? 'Bien dit !' : 'Je t’écoute…'}
          </div>
        </div>
      </PhoneSlot>
      <Sfx at={tapAt} name="rise" volume={0.4} />
      <Sfx at={doneAt} name="correct" volume={0.45} />
    </Lesson>
  );
};
