// StorageBar — server storage status bar for the 500 MB image quota.
// Green below 70%, amber 70–90%, red above 90%.

export function formatBytes(bytes) {
  if (!bytes) return '0 MB';
  const mb = bytes / (1024 * 1024);
  return mb >= 100 ? `${mb.toFixed(0)} MB` : `${mb.toFixed(1)} MB`;
}

export default function StorageBar({ storage }) {
  if (!storage) return null;
  const pct = Math.min(100, storage.percent || 0);
  const tone = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-brand';
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-semibold">Server storage</span>
        <span className="text-muted-foreground">
          {formatBytes(storage.used_bytes)} / 500 MB ({storage.percent ?? 0}%)
        </span>
      </div>
      <div
        className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Server storage used"
      >
        <div className={`h-full rounded-full transition-[width] duration-500 ${tone}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {storage.full
          ? 'Storage full (500 MB limit) — remove an image before uploading.'
          : `${formatBytes(storage.free_bytes)} free of the 500 MB limit`}
      </p>
    </div>
  );
}
