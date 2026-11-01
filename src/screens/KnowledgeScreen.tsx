import { useLiveQuery } from 'dexie-react-hooks';
import { Briefcase, CircleCheck, CircleDashed, CircleDot } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { Screen } from '@/components/ui/Screen';
import { db } from '@/db/db';
import { lessonNodeId } from '@/learning/situations';
import { useSituations } from '@/screens/situations/useSituations';

type SkillState = 'mastered' | 'started' | 'new';
const STATE_ICON = { mastered: CircleCheck, started: CircleDot, new: CircleDashed } as const;
const STATE_LOOK: Record<SkillState, string> = {
  mastered: 'bg-sun text-sun-ink',
  started: 'bg-[var(--accent-soft)] text-[var(--accent)]',
  new: 'bg-mist text-ink-2'
};

/** "My Knowledge Map": what the learner can actually do, situation by situation and theme by theme. */
export function KnowledgeScreen() {
  const { t } = useTranslation();
  const { path, themes, progress, content } = useSituations();
  const words = useLiveQuery(async () => {
    const rows = await db.userTerms.toArray();
    return new Map(rows.filter((u) => u.card).map((u) => [u.termId, u.state]));
  }, [], new Map<string, string>());

  const situations = (path?.units ?? []).map((unit) => {
    const done = unit.lessons.filter((l) => progress[lessonNodeId(l.id)]).length;
    const state: SkillState = done === unit.lessons.length ? 'mastered' : done > 0 ? 'started' : 'new';
    return { unit, done, state };
  });
  const masteredSituations = situations.filter((s) => s.state === 'mastered').length;
  const learned = words.size;
  const mastered = [...words.values()].filter((s) => s === 'mastered').length;

  return (
    <Screen title={t('knowledge.title')} back="/practice">
      <p className="text-ink-2">{t('knowledge.intro')}</p>
      <div className="mt-4 grid grid-cols-3 gap-2.5 text-center">
        {[
          { value: `${masteredSituations}/${situations.length}`, label: t('knowledge.stats.situations') },
          { value: learned, label: t('knowledge.stats.learned') },
          { value: mastered, label: t('knowledge.stats.mastered') }
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border-2 border-line bg-surface px-2 py-3">
            <p className="font-title text-2xl font-black text-[var(--accent)]">{s.value}</p>
            <p className="text-xs font-bold text-ink-2">{s.label}</p>
          </div>
        ))}
      </div>

      {situations.length > 0 && (
        <>
          <h2 className="mt-7 flex items-center gap-2 text-lg font-extrabold"><Briefcase size={20} className="text-[var(--accent)]" aria-hidden />{t('knowledge.situations')}</h2>
          <ul className="mt-3 grid gap-2.5">
            {situations.map(({ unit, done, state }) => {
              const Icon = STATE_ICON[state];
              return (
                <li key={unit.id}>
                  <Link href="/situations" className="flex items-center gap-3 rounded-2xl border-2 border-line bg-surface p-3.5 shadow-[0_3px_0_var(--color-line)] active:translate-y-0.5 active:shadow-none">
                    <span className={`grid h-11 w-11 flex-none place-items-center rounded-xl ${STATE_LOOK[state]}`}><Icon size={22} aria-hidden /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold leading-snug">{unit.title_fr}</span>
                      <span className="block text-sm text-ink-2">{t(`knowledge.state.${state}`)} · {t('knowledge.lessons', { done, total: unit.lessons.length })}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <h2 className="mt-7 text-lg font-extrabold">{t('knowledge.themes')}</h2>
      <p className="text-sm text-ink-2">{t('knowledge.legend')}</p>
      <ul className="mt-3 grid gap-2.5">
        {themes.map((theme) => {
          const cat = content.categories.get(theme.category);
          const total = theme.termIds.length;
          const m = theme.termIds.filter((id) => words.get(id) === 'mastered').length;
          const s = theme.termIds.filter((id) => words.has(id) && words.get(id) !== 'mastered').length;
          return (
            <li key={theme.category}>
              <Link href={`/path/${theme.category}`} className="block rounded-2xl border-2 border-line bg-surface p-3.5 shadow-[0_3px_0_var(--color-line)] active:translate-y-0.5 active:shadow-none">
                <span className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]"><DynamicIcon name={cat?.icon ?? 'Sparkles'} size={18} /></span>
                  <span className="flex-1 truncate font-bold">{cat?.name_fr ?? theme.category}</span>
                  <span className="text-sm font-black text-ink-2">{Math.round(((m + s * 0.5) / total) * 100)} %</span>
                </span>
                <span className="mt-2.5 flex h-2.5 overflow-hidden rounded-full bg-line" aria-hidden>
                  <span className="h-full bg-gold" style={{ width: `${(m / total) * 100}%` }} />
                  <span className="h-full bg-[var(--accent)]" style={{ width: `${(s / total) * 100}%` }} />
                </span>
                <span className="mt-1.5 block text-xs text-ink-2">{t('knowledge.breakdown', { mastered: m, started: s, left: total - m - s })}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Screen>
  );
}
