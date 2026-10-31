import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { DomainPicker, RolePicker } from '@/components/RolePicker';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { saveProfile } from '@/data/progress';
import { db } from '@/db/db';
import { domainOf } from '@/lib/domains';
import { useManifest } from '@/lib/useContent';

/** Profile › domain and roles. Progress is kept: words learned stay in the review queue. */
export function RolesScreen() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const profile = useLiveQuery(() => db.profile.get('me'));
  const manifest = useManifest();
  const [domain, setDomain] = useState<string | null>(null);
  const [primary, setPrimary] = useState<string | null>(null);
  const [secondary, setSecondary] = useState<string[]>([]);

  useEffect(() => {
    if (!profile || !manifest || domain) return;
    setDomain(domainOf(manifest, profile.primaryRole));
    setPrimary(profile.primaryRole);
    setSecondary(profile.secondaryRoles);
  }, [profile, manifest, domain]);

  async function save() {
    await saveProfile({ primaryRole: primary, secondaryRoles: secondary });
    navigate('/profile');
  }

  return (
    <Screen title={t('roles.title')} back="/profile">
      <h2 className="text-lg font-extrabold">{t('roles.domain')}</h2>
      <div className="mt-3">
        <DomainPicker manifest={manifest} value={domain}
          onChange={(d) => { if (d !== domain) { setPrimary(null); setSecondary([]); } setDomain(d); }} />
      </div>
      <h2 className="mt-7 text-lg font-extrabold">{t('roles.roles')}</h2>
      <p className="text-sm text-ink-2">{t('onboarding.role.text')}</p>
      <div className="mt-3 flex-1">
        <RolePicker manifest={manifest} domain={domain} primary={primary} secondary={secondary}
          onChange={(p, s) => { setPrimary(p); setSecondary(s); }} />
      </div>
      <p className="mt-5 text-center text-sm text-ink-2">{t('roles.keep')}</p>
      <div className="sticky bottom-0 bg-mist pb-[env(safe-area-inset-bottom)] pt-3">
        <Button disabled={!primary} onClick={() => void save()}>{t('roles.save')}</Button>
      </div>
    </Screen>
  );
}
