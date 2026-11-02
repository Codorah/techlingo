import { Copy, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { getSetting, setSetting } from '@/data/progress';
import { db } from '@/db/db';
import { domainOf } from '@/lib/domains';
import { useManifest } from '@/lib/useContent';
import { useLiveQuery } from 'dexie-react-hooks';
import { speak } from '@/lib/speech';

const FIELDS = ['title', 'years', 'skills', 'project', 'result', 'strength', 'goal'] as const;
type Pitch = Record<(typeof FIELDS)[number], string>;
const EMPTY: Pitch = { title: '', years: '', skills: '', project: '', result: '', strength: '', goal: '' };

/** "a web developer", "an SEO specialist", "a UX designer": drops an article the learner already typed. */
export function withArticle(title: string): string {
  const t = title.trim().replace(/^(a|an|the)\s+/i, '');
  const first = t.split(/\s+/)[0] ?? '';
  let an: boolean;
  if (/^[A-Z]{2,}/.test(first)) an = /^[AEFHILMNORSX]/.test(first); // acronym read letter by letter
  else if (/^(uni|use|usu|uti|eu|one|once|ux)/i.test(first)) an = false; // "a user researcher"
  else if (/^(hour|honest|honou?r|heir)/i.test(first)) an = true;
  else an = /^[aeiou]/i.test(first);
  return `${an ? 'an' : 'a'} ${t}`;
}

/** Assembles a "Tell me about yourself" answer from guided fields (no AI). */
export function buildPitch(p: Pitch, fallback: Pitch): string {
  const v = (k: keyof Pitch) => p[k].trim() || fallback[k];
  const years = Number(v('years'));
  const exp = Number.isFinite(years) && years > 0 ? ` with ${years} year${years > 1 ? 's' : ''} of experience` : '';
  return [
    `I’m ${withArticle(v('title'))}${exp}, mostly working with ${v('skills')}.`,
    `Recently, I ${v('project')}, which ${v('result')}.`,
    `I’m good at ${v('strength')}.`,
    `Now I’m looking for ${v('goal')}.`
  ].join(' ');
}

export function PitchScreen() {
  const { t } = useTranslation();
  const [pitch, setPitch] = useState<Pitch>(EMPTY);
  const [copied, setCopied] = useState<'ok' | 'failed' | null>(null);
  const profile = useLiveQuery(() => db.profile.get('me'));
  const manifest = useManifest();
  const marketing = domainOf(manifest, profile?.primaryRole) === 'marketing';
  const placeholders = t(marketing ? 'career.pitch.placeholders_marketing' : 'career.pitch.placeholders', { returnObjects: true }) as Pitch;
  const touched = useRef(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // The saved pitch arrives after the first paint: it never overwrites what the learner started typing.
  useEffect(() => { void getSetting<Pitch>('pitch', EMPTY).then((p) => { if (!touched.current) setPitch({ ...EMPTY, ...p }); }); }, []);
  useEffect(() => () => clearTimeout(copyTimer.current), []);
  const update = (k: keyof Pitch, value: string) => {
    touched.current = true;
    const next = { ...pitch, [k]: value };
    setPitch(next);
    void setSetting('pitch', next);
  };
  const flash = (state: 'ok' | 'failed') => {
    setCopied(state);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(null), state === 'ok' ? 1500 : 4000);
  };
  async function copy() {
    try {
      if (!navigator.clipboard) throw new Error('no clipboard');
      await navigator.clipboard.writeText(text);
      flash('ok');
    } catch { flash('failed'); }
  }
  const text = buildPitch(pitch, placeholders);

  return (
    <Screen title={t('career.pitch.title')} back="/career">
      <p className="text-ink-2">{t('career.pitch.intro')}</p>
      <div className="mt-5 grid gap-4">
        {FIELDS.map((k) => (
          <label key={k} className="block">
            <span className="font-bold">{t(`career.pitch.fields.${k}`)}</span>
            <input value={pitch[k]} onChange={(e) => update(k, e.target.value)} placeholder={placeholders[k]} lang="en" inputMode={k === 'years' ? 'numeric' : 'text'}
              className="mt-2 min-h-[52px] w-full rounded-2xl border-2 border-line bg-surface px-4 outline-none placeholder:text-ink-2 focus:border-[var(--accent)]" />
          </label>
        ))}
      </div>
      <h2 className="mt-7 text-lg font-extrabold">{t('career.pitch.preview')}</h2>
      <Card className="mt-3"><p className="text-lg leading-relaxed" lang="en">{text}</p></Card>
      <p className="mt-2 text-sm text-ink-2">{t('career.pitch.saved')}</p>
      <div className="mt-4 grid grid-cols-2 gap-2.5 pb-[env(safe-area-inset-bottom)]">
        <Button variant="secondary" icon={<Volume2 size={20} aria-hidden />} onClick={() => speak(text)}>{t('common.listen')}</Button>
        <Button icon={<Copy size={20} aria-hidden />} onClick={() => void copy()}>
          {copied === 'ok' ? t('career.pitch.copied') : t('career.pitch.copy')}
        </Button>
      </div>
      {copied === 'failed' && <p role="alert" className="mt-2 text-sm font-semibold text-danger">{t('career.pitch.copyFailed')}</p>}
    </Screen>
  );
}
