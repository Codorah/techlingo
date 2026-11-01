import { useEffect, useState } from 'react';
import type { ShippedPath } from '@/content/schema';
import { loadPath } from '@/lib/content';
import { usePath } from '@/lib/usePath';

/** The hand-written path of the user's domain, or null while loading / when none exists. */
export function useSituations() {
  const base = usePath();
  const [path, setPath] = useState<ShippedPath | null>(null);
  const [missing, setMissing] = useState(false);
  const available = base.content.manifest?.paths?.includes(base.domain) ?? false;

  useEffect(() => {
    if (!base.content.manifest) return;
    if (!available) { setMissing(true); return; }
    let alive = true;
    loadPath(base.domain).then((p) => { if (alive) setPath(p); }).catch(() => { if (alive) setMissing(true); });
    return () => { alive = false; };
  }, [base.domain, available, base.content.manifest]);

  return { ...base, path, missing };
}
