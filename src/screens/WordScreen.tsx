import { useLiveQuery } from 'dexie-react-hooks';
import { Bookmark, GraduationCap, Lightbulb, Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { toggleFavorite } from '@/data/progress';
import { db } from '@/db/db';
import { speak } from '@/lib/speech';
import { useContent } from '@/lib/useContent';

export function WordScreen() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { id } = useParams<{ id: string }>();
  const profile = useLiveQuery(() => db.profile.get('me'));
  const roles = profile?.primaryRole ? [profile.primaryRole, ...profile.secondaryRoles] : [];
  const content = useContent(roles);
  const progress = useLiveQuery(() => db.userTerms.get(id), [id]);
  const term = content.byId.get(id);

  if (!term) return <Screen back="/dictionary"><p className="text-ink-2">{t('common.loading')}</p></Screen>;
  const fav = !!progress?.favorite;

  return (
    <Screen back="/dictionary">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[2rem] font-black leading-tight">{term.term_en}</h1>
          <p className="text-lg text-ink-2">{term.translation_fr}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-surface px-3 py-1 text-sm font-bold text-ocean shadow-[inset_0_0_0_2px_var(--color-line)]">{term.level}</span>
            {term.status !== 'validated' && <span className="rounded-full bg-sun px-3 py-1 text-sm font-bold text-sun-ink">{t('common.draft')}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void toggleFavorite(term.id)} aria-pressed={fav} aria-label="Favori"
            className={`grid h-12 w-12 place-items-center rounded-2xl border-2 ${fav ? 'border-ocean bg-ocean text-white' : 'border-line bg-surface text-ink-2'}`}>
            <Bookmark size={22} fill={fav ? 'currentColor' : 'none'} aria-hidden />
          </button>
          <button type="button" onClick={() => speak(term.term_en)} aria-label={t('common.listen')}
            className="grid h-12 w-12 place-items-center rounded-2xl bg-ocean text-white shadow-[0_4px_0_var(--color-ocean-press)] active:translate-y-1 active:shadow-none"><Volume2 size={22} aria-hidden /></button>
        </div>
      </div>

      <section className="mt-6"><h2 className="text-sm font-bold text-ink-2">{t('lesson.definition')}</h2><p className="mt-1 text-lg leading-relaxed" lang="en">{term.definition_en}</p></section>
      <section className="mt-4"><h2 className="text-sm font-bold text-ink-2">{t('lesson.explanation')}</h2><p className="mt-1 leading-relaxed text-ink-2">{term.explanation_fr}</p></section>
      <Card className="mt-5 bg-sun/60"><p className="flex items-center gap-2 font-extrabold text-sun-ink"><Lightbulb size={20} aria-hidden />{t('lesson.why')}</p><p className="mt-1 font-semibold">{term.why_it_matters_fr}</p></Card>

      <h2 className="mt-6 text-lg font-extrabold">{t('lesson.steps.examples')}</h2>
      <ul className="mt-3 grid gap-2.5">
        {term.sentences.map((s) => (
          <li key={s.id}><Card className="p-4">
            <p className="font-semibold leading-relaxed" lang="en">{s.text_en}</p><p className="mt-1 text-sm text-ink-2">{s.text_fr}</p>
            <button type="button" className="mt-1 inline-flex min-h-11 items-center gap-2 font-bold text-ocean" onClick={() => speak(s.text_en)}><Volume2 size={18} aria-hidden />{t('common.listen')}</button>
          </Card></li>
        ))}
      </ul>

      <div className="sticky bottom-0 mt-auto bg-mist pb-[env(safe-area-inset-bottom)] pt-4">
        <Button icon={<GraduationCap size={20} aria-hidden />} onClick={() => navigate(`/lesson/${term.id}`)}>{t('dictionary.study')}</Button>
      </div>
    </Screen>
  );
}
