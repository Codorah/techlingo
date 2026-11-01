import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { usePathProgress } from '@/data/path';
import { db } from '@/db/db';
import { buildThemes } from '@/learning/path';
import { domainOf, generalRoleOf, profileRoles } from './domains';
import { useContent, useManifest } from './useContent';

/** Everything the path screens need: profile, content, the user's themes and progress. */
export function usePath() {
  const profile = useLiveQuery(() => db.profile.get('me'));
  const roles = profileRoles(profile);
  const manifest = useManifest();
  // The domain's shared basics ("general" role) also feed the path.
  const general = manifest && profile?.primaryRole ? generalRoleOf(manifest, profile.primaryRole) : null;
  const packs = general && !roles.includes(general) ? [...roles, general] : roles;
  const content = useContent(packs);
  const key = packs.join(',');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const themes = useMemo(() => buildThemes(content.terms, roles, general ?? undefined), [content.terms, key]);
  const progress = usePathProgress();
  const domain = domainOf(content.manifest, profile?.primaryRole);
  return { profile, roles, content, themes, progress, domain };
}
