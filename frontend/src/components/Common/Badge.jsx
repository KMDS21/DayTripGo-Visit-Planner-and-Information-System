// Badge — status/label chip (open/closed for FR-4, categories, distances).

const styles = {
  open: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-neutral-200 text-neutral-600',
  category: 'bg-brand-light text-brand-dark',
  distance: 'bg-sand text-[color:var(--accent-foreground)]',
  info: 'bg-blue-100 text-blue-800',
};

export default function Badge({ variant = 'info', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${styles[variant] || styles.info} ${className}`}
    >
      {children}
    </span>
  );
}
