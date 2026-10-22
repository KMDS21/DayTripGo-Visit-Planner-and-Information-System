// StatCard — small dashboard counter card (optionally links somewhere).

import { Link } from 'react-router-dom';

export default function StatCard({ label, value, hint, to }) {
  const body = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value ?? '–'}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </>
  );
  const className = 'rounded-2xl border border-border bg-card p-4 shadow-sm';
  return to ? (
    <Link to={to} className={`${className} block transition-colors hover:bg-muted/40`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
