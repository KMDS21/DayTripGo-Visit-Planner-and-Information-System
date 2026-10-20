// AdminLoginPage — /admin/login (SRS FR-14: valid username/password required
// before any place-management function).

import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { errorMessage } from '../services/api';
import usePageTitle from '../hooks/usePageTitle';
import Button from '../components/Common/Button';

export default function AdminLoginPage() {
  usePageTitle();
  const { login, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // Redirect in an effect, never during render: React Router v7 silently
  // ignores navigate() on first paint, which used to leave this page blank.
  useEffect(() => {
    if (isAdmin) navigate('/admin/dashboard', { replace: true });
  }, [isAdmin, navigate]);

  if (isAdmin) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await login({ username, password });
      navigate(location.state?.from || '/admin/dashboard', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-14">
      <div className="overflow-hidden rounded-3xl border border-border bg-card/95 shadow-xl ring-1 ring-brand/10 backdrop-blur">
        <div className="p-6 sm:p-8">
          {/* Brand row — same card surface as the form, no separate colour strip */}
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-border pb-4">
            <Link
              to="/"
              aria-label="DayTripGO home"
              className="flex items-center rounded-xl border border-border bg-background px-3 py-1.5 shadow-sm"
            >
              <img src="/Logo.png" alt="DayTripGO" className="h-8 w-auto" />
            </Link>
            <span className="text-xs font-bold uppercase tracking-[0.22em] text-brand-dark sm:text-sm">
              Admin Panel
            </span>
          </div>

          <p className="text-sm text-muted-foreground">
            Restricted area. Place management requires an authorised account.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-semibold">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                placeholder="admin"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-semibold">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
