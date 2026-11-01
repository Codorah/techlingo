import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CareerPack, Manifest, ShippedPath } from '@/content/schema';
import { usePathProgress } from '@/data/path';
import { buildCourse, type Course, courseProgress } from '@/learning/course';
import { loadCareer, loadCoursePath, loadManifest } from './content';
import { domainOf, generalRoleOf } from './domains';
import { useManifest } from './useContent';

/** Builds the i18n labels once per language. */
export function useCourseLabels() {
  const { t } = useTranslation();
  return useMemo(() => ({
    guide: t('course.node.guide'),
    recallTitle: (n: number) => t('course.recall.title', { n }),
    recallSubtitle: t('course.recall.subtitle'),
    recallNode: (k: number) => t('course.recall.node', { n: k }),
    interviewTitle: t('course.interview.title'),
    interviewSubtitle: t('course.interview.subtitle')
  }), [t]);
}

const careerCache: { value: CareerPack | null } = { value: null };

/** The course of a role (any role, not only the learner's), with its progress. */
export function useCourse(role: string | undefined) {
  const manifest = useManifest();
  const labels = useCourseLabels();
  const progress = usePathProgress();
  const [path, setPath] = useState<ShippedPath | null>(null);
  const [career, setCareer] = useState<CareerPack | null>(careerCache.value);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!manifest || !role) return;
    let alive = true;
    setPath(null); setMissing(false);
    const p = loadCoursePath(manifest, role);
    if (!p) { setMissing(true); return; }
    p.then((x) => { if (alive) setPath(x); }).catch(() => { if (alive) setMissing(true); });
    if (!careerCache.value) void loadCareer().then((c) => { careerCache.value = c; if (alive) setCareer(c); }).catch(() => {});
    return () => { alive = false; };
  }, [manifest, role]);

  const course = useMemo<Course | null>(() => (path && role ? buildCourse(role, path, career?.questions ?? [], labels) : null), [path, role, career, labels]);
  const meta = manifest?.roles.find((r) => r.id === role);
  const domain = domainOf(manifest, role);
  return { manifest, meta, domain, path, course, career, progress, missing: missing || (!!manifest && !meta), stats: course ? courseProgress(course, progress) : null };
}

/** The roles that have a course, in the order Home shows them. */
export function courseRoles(manifest: Manifest, primary: string | null | undefined, secondary: string[]) {
  const has = (r: string) => manifest.rolePaths?.includes(r) || manifest.domains.some((d) => d.generalRole === r && manifest.paths.includes(d.id));
  const domain = domainOf(manifest, primary);
  const general = generalRoleOf(manifest, primary);
  const mine = [primary, ...secondary, general].filter((r, i, a): r is string => !!r && a.indexOf(r) === i && has(r));
  const discover = manifest.roles.filter((r) => r.domain === domain && !mine.includes(r.id) && has(r.id)).map((r) => r.id);
  const otherDomain = manifest.roles.filter((r) => r.domain !== domain && has(r.id)).map((r) => r.id);
  return { mine, discover, otherDomain };
}

export { loadManifest };
