import { useTranslation } from 'react-i18next';
import { Choice } from '@/components/ui/Choice';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import type { Manifest } from '@/content/schema';

const tile = (icon: string) => (
  <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-mist text-[var(--accent)]"><DynamicIcon name={icon} /></span>
);

/** Domain cards (IT, digital marketing…); a domain without content yet shows "Soon". */
export function DomainPicker({ manifest, value, onChange }: { manifest: Manifest | null; value: string | null; onChange: (id: string) => void }) {
  const { t } = useTranslation();
  return (
    <ul className="grid gap-2.5">
      {(manifest?.domains ?? []).map((d) => {
        const disabled = d.termCount === 0;
        return (
          <li key={d.id}>
            <Choice state={value === d.id ? 'selected' : 'idle'} disabled={disabled} onClick={() => onChange(d.id)} leading={tile(d.icon)}
              trailing={disabled ? <span className="text-xs font-bold text-ink-2">{t('onboarding.role.soon')}</span> : null}>
              <span className="block">{d.name_fr}</span>
              <span className="block text-sm font-normal text-ink-2">{d.description_fr}</span>
            </Choice>
          </li>
        );
      })}
    </ul>
  );
}

/** Up to three roles of one domain: the first picked is the primary one. */
export function RolePicker({ manifest, domain, primary, secondary, onChange }: {
  manifest: Manifest | null; domain: string | null; primary: string | null; secondary: string[];
  onChange: (primary: string | null, secondary: string[]) => void;
}) {
  const { t } = useTranslation();
  const roles = (manifest?.roles ?? []).filter((r) => r.domain === domain);

  function toggle(id: string) {
    if (id === primary) return onChange(secondary[0] ?? null, secondary.slice(1));
    if (secondary.includes(id)) return onChange(primary, secondary.filter((r) => r !== id));
    if (!primary) return onChange(id, secondary);
    if (secondary.length < 2) onChange(primary, [...secondary, id]);
  }

  return (
    <ul className="grid gap-2.5">
      {roles.map((r) => {
        const isPrimary = r.id === primary;
        const isSecondary = secondary.includes(r.id);
        const disabled = r.termCount === 0;
        return (
          <li key={r.id}>
            <Choice state={isPrimary || isSecondary ? 'selected' : 'idle'} disabled={disabled} onClick={() => toggle(r.id)} leading={tile(r.icon)}
              trailing={isPrimary ? <span className="rounded-full bg-[var(--accent)] px-2.5 py-1 text-xs font-bold text-on-ocean">{t('onboarding.role.primary')}</span>
                : isSecondary ? <span className="rounded-full bg-sky/30 px-2.5 py-1 text-xs font-bold text-[var(--accent)]">{t('onboarding.role.secondary')}</span>
                : disabled ? <span className="text-xs font-bold text-ink-2">{t('onboarding.role.soon')}</span> : null}>
              <span className="block">{r.name_fr}</span>
              <span className="block text-sm font-normal text-ink-2">{r.description_fr}</span>
            </Choice>
          </li>
        );
      })}
    </ul>
  );
}
