// BusinessLoginPage — /business/login
// Owners sign in here and land in their own panel (/owner/dashboard).
// Separate from the admin login: two roles, two screens.

import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { errorMessage } from '../services/api';
import usePageTitle from '../hooks/usePageTitle';
import Button from '../components/Common/Button';

export default function BusinessLoginPage() {
  usePageTitle();
  const { ownerLogin, isOwner } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOwner) navigate('/owner/dashboard', { replace: true });
  }, [isOwner, navigate]);

  if (isOwner) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await ownerLogin({ username, password });
      navigate(location.state?.from || '/owner/dashboard', { replace: true });
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
          <div className="mb-5 flex flex-wrap items-center justify-center gap-3 border-b border-border pb-4">
            <Link to="/" aria-label="DayTripGO home" className="flex items-center">
              <img src="/Logo.png" alt="DayTripGO" className="h-8 w-auto" />
            </Link>
            <span className="text-xs font-bold uppercase tracking-[0.22em] text-brand-dark sm:text-sm">
              Business Panel
            </span>
          </div>

          <p className="text-sm text-muted-foreground">
            Sign in to manage your listings, edit your profile and update your business details.
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
                placeholder="your-username"
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

          <p className="mt-5 text-center text-sm text-muted-foreground">
            New here?{' '}
            <Link
              to="/business/register"
              className="font-semibold text-brand underline-offset-4 hover:underline"
            >
              List your business
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
