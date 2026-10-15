// Loader — shared loading indicator (plan §14.3 Step 16).

export default function Loader({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
      <span className="inline-block h-8 w-8 animate-spin rounded-full border-[3px] border-brand/25 border-t-brand" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
