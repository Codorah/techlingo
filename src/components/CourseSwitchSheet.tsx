import { Check, X } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Manifest } from '@/content/schema';
import { usePathProgress } from '@/data/path';
import { coursesByDomain, startedRoles } from '@/lib/activeCourse';
import { DynamicIcon } from './ui/DynamicIcon';

/** Bottom sheet to pick which course Home shows. Picking one never touches the profile. */
export function CourseSwitchSheet({ manifest, ownDomain, current, ownRole, onPick, onClose }: {
  manifest: Manifest; ownDomain: string; current: string; ownRole: string | null | undefined;
  onPick: (role: string) => void; onClose: () => void;
}) {
  const { t } = useTranslation();
  const progress = usePathProgress();
  const groups = coursesByDomain(manifest, ownDomain);
  const started = startedRoles(progress, groups.flatMap((g) => g.roles.map((r) => r.id)));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={t('course.switch.title')}>
      <button type="button" aria-label={t('common.close')} onClick={onClose} className="absolute inset-0 bg-black/40" tabIndex={-1} />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-h-[85dvh] max-w-[640px] animate-[sheet_.24s_var(--ease-out-quart)] overflow-y-auto rounded-t-3xl bg-surface p-5 pb-[calc(env(safe-area-inset-bottom)+20px)] shadow-xl">
        <div className="mx-auto h-1 w-10 rounded-full bg-line" aria-hidden />
        <div className="mt-2 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-black">{t('course.switch.title')}</h2>
            <p className="mt-1 text-sm text-ink-2">{t('course.switch.text')}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t('common.close')} className="-mr-2 grid h-11 w-11 flex-none place-items-center rounded-xl text-ink-2 active:bg-mist"><X size={20} aria-hidden /></button>
        </div>
        {groups.map(({ domain, roles }) => (
          <section key={domain.id} className="mt-5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-ink-2">{domain.name_fr}</h3>
            <ul className="mt-2 grid gap-2">
              {roles.map((r) => {
                const isCurrent = r.id === current;
                return (
                  <li key={r.id}>
                    <button type="button" onClick={() => onPick(r.id)} aria-current={isCurrent || undefined}
                      className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 p-3 text-left active:translate-y-0.5 ${isCurrent ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-line bg-surface'}`}>
                      <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-mist text-[var(--accent)]"><DynamicIcon name={r.icon} size={20} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-extrabold leading-snug">{r.name_fr}</span>
                        <span className="block text-sm text-ink-2">
                          {isCurrent ? t('course.switch.current') : r.id === ownRole ? t('course.switch.mine') : started.has(r.id) ? t('course.switch.started') : r.description_fr}
                        </span>
                      </span>
                      {isCurrent && <Check size={20} className="flex-none text-[var(--accent)]" aria-hidden />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
