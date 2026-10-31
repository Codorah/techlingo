export const AVATARS = [
  { id: 'sky', bg: '#65BDF5' }, { id: 'ocean', bg: '#2B6CB0' }, { id: 'mint', bg: '#2E9E66' },
  { id: 'sun', bg: '#D99A0B' }, { id: 'lilac', bg: '#7C6CE0' }, { id: 'coral', bg: '#E0665A' }
] as const;

export function Avatar({ id, name, size = 48 }: { id: string; name: string; size?: number }) {
  const bg = AVATARS.find((a) => a.id === id)?.bg ?? AVATARS[0].bg;
  const letter = (name.trim()[0] ?? '?').toUpperCase();
  return (
    <span aria-hidden className="grid flex-none place-items-center rounded-full font-title font-black text-white"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.42 }}>
      {letter}
    </span>
  );
}
