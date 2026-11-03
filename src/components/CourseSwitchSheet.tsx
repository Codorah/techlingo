import { Check, Plus, X } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Manifest } from '@/content/schema';
import { coursesByDomain } from '@/lib/activeCourse';
import { useCourse } from '@/lib/useCourse';
import { DynamicIcon } from './ui/DynamicIcon';

/**
 * Like the language picker of a language app: the courses followed in parallel come first,
 * one tap enters one; the others can be added below. Nothing here touches the profile.
 */
export function CourseSwitchSheet({ manifest, ownDomain, current, mine, ownRole, onPick, onAdd, onRemove, onClose }: {
  manifest: Manifest; ownDomain: string; current: string; mine: string[]; ownRole: string | null | undefined;
  onPick: (role: string) => void; onAdd: (role: string) => void; onRemove: (role: string) => void; onClose: () => void;
}) {
  const { t } = useTranslation();
  const groups = coursesByDomain(manifest, ownDomain)
    .map((g) => ({ ...g, roles: g.roles.filter((r) => !mine.includes(r.id)) }))
    .filter((g) => g.roles.length > 0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={t('course.switch.title')}>
      <button type="button" aria-label={t('common.close')} onClick={onClose} className="absolute inset-0 bg-black/40" tabIndex={-1} />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-h-[88dvh] max-w-[640px] animate-[sheet_.24s_var(--ease-out-quart)] overflow-y-auto rounded-t-3xl bg-surface p-5 pb-[calc(env(safe-area-inset-bottom)+20px)] shadow-xl">
        <div className="mx-auto h-1 w-10 rounded-full bg-line" aria-hidden />
        <div className="mt-2 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-black">{t('course.switch.title')}</h2>
            <p className="mt-1 text-sm text-ink-2">{t('course.switch.text')}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t('common.close')} className="-mr-2 grid h-11 w-11 flex-none place-items-center rounded-xl text-ink-2 active:bg-mist"><X size={20} aria-hidden /></button>
        </div>

        <h3 className="mt-5 text-xs font-extrabold uppercase tracking-wider text-ink-2">{t('course.switch.mine')}</h3>
        <ul className="mt-2 grid gap-2">
          {mine.map((r) => (
            <li key={r}><MyCourse role={r} current={r === current} removable={r !== ownRole && mine.length > 1} onPick={() => onPick(r)} onRemove={() => onRemove(r)} /></li>
          ))}
        </ul>

        {groups.length > 0 && <h3 className="mt-6 text-xs font-extrabold uppercase tracking-wider text-ink-2">{t('course.switch.add')}</h3>}
        {groups.map(({ domain, roles }) => (
          <section key={domain.id} className="mt-2">
            <p className="text-sm font-bold text-ink-2">{domain.name_fr}</p>
            <ul className="mt-1.5 grid gap-2">
              {roles.map((r) => (
                <li key={r.id}>
                  <button type="button" onClick={() => onAdd(r.id)} className="flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 border-dashed border-line p-3 text-left active:translate-y-0.5">
                    <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-mist text-[var(--accent)]"><DynamicIcon name={r.icon} size={20} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-extrabold leading-snug">{r.name_fr}</span>
                      <span className="block text-sm text-ink-2">{r.description_fr}</span>
                    </span>
                    <Plus size={20} className="flex-none text-[var(--accent)]" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function MyCourse({ role, current, removable, onPick, onRemove }: { role: string; current: boolean; removable: boolean; onPick: () => void; onRemove: () => void }) {
  const { t } = useTranslation();
  const { meta, stats, domain, manifest } = useCourse(role);
  if (!meta) return <div className="skeleton h-16" />;
  const pct = stats ? Math.round(stats.ratio * 100) : 0;
  const domainName = manifest?.domains.find((d) => d.id === domain)?.name_fr;
  return (
    <div className={`flex items-center gap-1 rounded-2xl border-2 ${current ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-line bg-surface'}`}>
      <button type="button" onClick={onPick} aria-current={current || undefined} className="flex min-h-16 min-w-0 flex-1 items-center gap-3 p-3 text-left active:translate-y-0.5">
        <span className="relative grid h-12 w-12 flex-none place-items-center">
          <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden>
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-line)" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${pct * 0.974} 100`} />
          </svg>
          <DynamicIcon name={meta.icon} size={20} className="text-[var(--accent)]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-extrabold leading-snug">{meta.name_fr}</span>
          <span className="block truncate text-sm text-ink-2">{domainName} · {pct} %</span>
        </span>
        {current && <Check size={20} className="flex-none text-[var(--accent)]" aria-hidden />}
      </button>
      {removable && (
        <button type="button" onClick={onRemove} aria-label={t('course.switch.remove', { name: meta.name_fr })} className="mr-1 grid h-11 w-11 flex-none place-items-center rounded-xl text-ink-2 active:bg-mist"><X size={18} aria-hidden /></button>
      )}
    </div>
  );
}
