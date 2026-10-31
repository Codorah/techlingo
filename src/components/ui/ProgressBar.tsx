export function ProgressBar({ value, label, className = '' }: { value: number; label?: string; className?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={label}
      className={`h-3 overflow-hidden rounded-full bg-line ${className}`}>
      <div className="h-full rounded-full bg-mint-strong transition-[width] duration-500 ease-[var(--ease-out-quart)]" style={{ width: `${pct}%` }} />
    </div>
  );
}
