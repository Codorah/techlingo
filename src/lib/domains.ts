// The domain (IT, digital marketing…) is derived from the primary role, so it needs no
// storage of its own and existing profiles keep working unchanged.
import type { Manifest } from '@/content/schema';
import type { Profile } from '@/db/db';

export const DEFAULT_DOMAIN = 'tech';
const DEFAULT_GENERAL_ROLE = 'general-tech';

export const profileRoles = (profile: Profile | null | undefined): string[] =>
  profile?.primaryRole ? [profile.primaryRole, ...profile.secondaryRoles] : [];

export function domainOf(manifest: Manifest | null, roleId: string | null | undefined): string {
  return manifest?.roles.find((r) => r.id === roleId)?.domain ?? DEFAULT_DOMAIN;
}

export function generalRoleOf(manifest: Manifest | null, roleId: string | null | undefined): string {
  const domain = domainOf(manifest, roleId);
  return manifest?.domains?.find((d) => d.id === domain)?.generalRole ?? DEFAULT_GENERAL_ROLE;
}
