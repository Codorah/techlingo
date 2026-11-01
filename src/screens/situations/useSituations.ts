import { useEffect, useState } from 'react';
import type { ShippedPath } from '@/content/schema';
import { loadCoursePath, loadPath } from '@/lib/content';
import { usePath } from '@/lib/usePath';

/** The hand-written path of the user's primary role (or the domain's fallback path). */
export function useSituations() {
  const base = usePath();
  const [path, setPath] = useState<ShippedPath | null>(null);
  const [missing, setMissing] = useState(false);
  const role = base.profile?.primaryRole;

  useEffect(() => {
    const manifest = base.content.manifest;
    if (!manifest) return;
    const loader = (role && loadCoursePath(manifest, role)) ?? (manifest.paths?.includes(base.domain) ? loadPath(base.domain) : null);
    if (!loader) { setMissing(true); return; }
    let alive = true;
    loader.then((p) => { if (alive) setPath(p); }).catch(() => { if (alive) setMissing(true); });
    return () => { alive = false; };
  }, [base.domain, role, base.content.manifest]);

  return { ...base, path, missing };
}
