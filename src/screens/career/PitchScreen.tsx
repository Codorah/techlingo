import { Copy, Volume2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { getSetting, setSetting } from '@/data/progress';
import { speak } from '@/lib/speech';

const FIELDS = ['title', 'years', 'skills', 'project', 'result', 'strength', 'goal'] as const;
type Pitch = Record<(typeof FIELDS)[number], string>;
const EMPTY: Pitch = { title: '', years: '', skills: '', project: '', result: '', strength: '', goal: '' };

/** Assembles a "Tell me about yourself" answer from guided fields (no AI). */
export function buildPitch(p: Pitch, fallback: Pitch): string {
  const v = (k: keyof Pitch) => p[k].trim() || fallback[k];
  const years = Number(v('years'));
  const exp = Number.isFinite(years) && years > 0 ? ` with ${years} year${years > 1 ? 's' : ''} of experience` : '';
  return [
    `I’m a ${v('title')}${exp}, mostly working with ${v('skills')}.`,
    `Recently, I ${v('project')}, which ${v('result')}.`,
    `I’m good at ${v('strength')}.`,
    `Now I’m looking for ${v('goal')}.`
  ].join(' ');
}

export function PitchScreen() {
  const { t } = useTranslation();
  const [pitch, setPitch] = useState<Pitch>(EMPTY);
  const [copied, setCopied] = useState(false);
  const placeholders = t('career.pitch.placeholders', { returnObjects: true }) as Pitch;

  useEffect(() => { void getSetting<Pitch>('pitch', EMPTY).then((p) => setPitch({ ...EMPTY, ...p })); }, []);
  const update = (k: keyof Pitch, value: string) => {
    const next = { ...pitch, [k]: value };
    setPitch(next);
    void setSetting('pitch', next);
  };
  const text = buildPitch(pitch, placeholders);

  return (
    <Screen title={t('career.pitch.title')} back="/career">
      <p className="text-ink-2">{t('career.pitch.intro')}</p>
      <div className="mt-5 grid gap-4">
        {FIELDS.map((k) => (
          <label key={k} className="block">
            <span className="font-bold">{t(`career.pitch.fields.${k}`)}</span>
            <input value={pitch[k]} onChange={(e) => update(k, e.target.value)} placeholder={placeholders[k]} lang="en" inputMode={k === 'years' ? 'numeric' : 'text'}
              className="mt-2 min-h-[52px] w-full rounded-2xl border-2 border-line bg-surface px-4 outline-none placeholder:text-ink-2 focus:border-ocean" />
          </label>
        ))}
      </div>
      <h2 className="mt-7 text-lg font-extrabold">{t('career.pitch.preview')}</h2>
      <Card className="mt-3"><p className="text-lg leading-relaxed" lang="en">{text}</p></Card>
      <p className="mt-2 text-sm text-ink-2">{t('career.pitch.saved')}</p>
      <div className="mt-4 grid grid-cols-2 gap-2.5 pb-[env(safe-area-inset-bottom)]">
        <Button variant="secondary" icon={<Volume2 size={20} aria-hidden />} onClick={() => speak(text)}>{t('common.listen')}</Button>
        <Button icon={<Copy size={20} aria-hidden />} onClick={() => void navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })}>
          {copied ? t('career.pitch.copied') : t('career.pitch.copy')}
        </Button>
      </div>
    </Screen>
  );
}
