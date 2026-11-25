export const AVATARS = [
  { id: 'sky', bg: '#65BDF5' }, { id: 'ocean', bg: '#2B6CB0' }, { id: 'mint', bg: '#2E9E66' },
  { id: 'sun', bg: '#D99A0B' }, { id: 'lilac', bg: '#7C6CE0' }, { id: 'coral', bg: '#E0665A' }
] as const;

/** Illustrated avatars: files in public/illustrations/avatars/avatar-<id>.png. */
export const IMAGE_AVATARS = [
  'tech-1', 'tech-2', 'tech-3', 'tech-4', 'tech-5',
  'marketing-1', 'marketing-2', 'marketing-3', 'marketing-4', 'marketing-5',
  'air-events-1', 'air-events-2', 'air-events-3', 'air-events-4', 'air-events-5'
] as const;

const isImage = (id: string) => (IMAGE_AVATARS as readonly string[]).includes(id);

export function Avatar({ id, name, size = 48 }: { id: string; name: string; size?: number }) {
  if (isImage(id)) {
    return <img aria-hidden alt="" src={`/illustrations/avatars/avatar-${id}.png`} width={size} height={size} loading="lazy" decoding="async"
      className="flex-none rounded-full bg-sky object-cover" style={{ width: size, height: size }} />;
  }
  const bg = AVATARS.find((a) => a.id === id)?.bg ?? AVATARS[0].bg;
  const letter = (name.trim()[0] ?? '?').toUpperCase();
  return (
    <span aria-hidden className="grid flex-none place-items-center rounded-full font-title font-black text-white"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.42 }}>
      {letter}
    </span>
  );
}
