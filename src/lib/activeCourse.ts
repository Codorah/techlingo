// The course shown on Home is a choice of its own: it never changes the learner's profile
// (primary role, domain, accent, wheel), so exploring another job leaves the app as it was.
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { setSetting } from '@/data/progress';
import type { Manifest } from '@/content/schema';
import type { PathProgress } from '@/learning/path';

const KEY = 'activeCourse';
const MY_KEY = 'myCourses';

/** The role whose course was picked with the switcher, or null (= the learner's own job). */
export function useActiveCourse(): string | null | undefined {
  const row = useLiveQuery(() => db.settings.get(KEY).then((r) => (r?.value as string | null | undefined) ?? null), [], undefined);
  return row;
}

export const setActiveCourse = (role: string | null) => setSetting(KEY, role);

/** Every role that has a course, grouped by domain (the learner's own domain first). */
export function coursesByDomain(manifest: Manifest, ownDomain: string) {
  const has = (r: string) => manifest.rolePaths?.includes(r) || manifest.domains.some((d) => d.generalRole === r && manifest.paths.includes(d.id));
  const domains = [...manifest.domains].sort((a, b) => Number(b.id === ownDomain) - Number(a.id === ownDomain));
  return domains
    .map((d) => ({ domain: d, roles: manifest.roles.filter((r) => r.domain === d.id && has(r.id) && r.id !== d.generalRole) }))
    .filter((g) => g.roles.length > 0);
}

/** Roles with at least one finished step (node ids start with the role id, or `rap:`/`itw:` + role). */
export function startedRoles(progress: PathProgress, roles: string[]): Set<string> {
  const keys = Object.keys(progress);
  return new Set(roles.filter((r) => keys.some((k) => k.includes(`${r}-`) || k.startsWith(`rap:${r}:`) || k.startsWith(`itw:${r}:`))));
}

/** The courses the learner follows in parallel (null = never customised: own job and its secondaries). */
export function useMyCourses(): string[] | null | undefined {
  return useLiveQuery(() => db.settings.get(MY_KEY).then((r) => (r?.value as string[] | undefined) ?? null), [], undefined);
}

export const saveMyCourses = (roles: string[]) => setSetting(MY_KEY, [...new Set(roles)]);
