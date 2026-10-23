// Badge — status/label chip (categories, info).

const styles = {
  category: 'bg-brand-light text-brand-dark',
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
