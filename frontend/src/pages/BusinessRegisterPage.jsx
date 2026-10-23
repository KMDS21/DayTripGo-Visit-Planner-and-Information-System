// BusinessRegisterPage — /business/register (and /owner/register)
// Step 1 of 2: create the owner ACCOUNT only — the details a person signs in
// with. Step 2 is the listing form (business name, contact details, category,
// photos), which opens right after with a notice that the account is ready.

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { errorMessage } from '../services/api';
import usePageTitle from '../hooks/usePageTitle';
import Button from '../components/Common/Button';

const fieldClass =
  'w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30';

function Field({ id, label, hint, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <input id={id} className={fieldClass} {...props} />
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <p className="border-b border-border pb-1.5 text-xs font-bold uppercase tracking-[0.18em] text-brand-dark">
      {children}
    </p>
  );
}

function StepBadge() {
  return (
    <div className="mb-5 flex items-center justify-center gap-2" aria-hidden="true">
      <span className="rounded-full bg-brand px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
        1 · Account
      </span>
      <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        2 · Your listing
      </span>
    </div>
  );
}

export default function BusinessRegisterPage() {
  usePageTitle();
  const { ownerRegister, isOwner } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    confirm: '',
  });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // Redirect in an effect, never during render (React Router v7 ignores a
  // navigate() on first paint — the same guard AdminLoginPage uses).
  useEffect(() => {
    if (isOwner) navigate('/owner/dashboard', { replace: true });
  }, [isOwner, navigate]);

  if (isOwner) return null;

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const required = [
      ['full_name', 'your name'],
      ['email', 'email'],
      ['username', 'username'],
      ['password', 'password'],
    ];
    const missing = required.filter(([key]) => !String(form[key]).trim()).map(([, label]) => label);
    if (missing.length > 0) {
      setError(`Please fill in: ${missing.join(', ')}.`);
      return;
    }
    if (form.password.length < 6) {
      setError('Your password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('The two passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      await ownerRegister({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        username: form.username.trim(),
        password: form.password,
      });
      // Account done → straight into step 2, the listing form.
      navigate('/owner/businesses/new', {
        replace: true,
        state: { notice: 'Account created. Now add your listing below — it goes live once approved.' },
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl py-10 sm:py-14">
      <div className="overflow-hidden rounded-3xl border border-border bg-card/95 shadow-xl ring-1 ring-brand/10 backdrop-blur">
        <div className="p-6 sm:p-8">
          <div className="mb-5 flex flex-wrap items-center justify-center gap-3 border-b border-border pb-4">
            <Link to="/" aria-label="DayTripGO home" className="flex items-center">
              <img src="/Logo.png" alt="DayTripGO" className="h-8 w-auto" />
            </Link>
            <span className="text-xs font-bold uppercase tracking-[0.22em] text-brand-dark sm:text-sm">
              List your business
            </span>
          </div>

          <StepBadge />

          <p className="text-sm text-muted-foreground">
            Step 1 — create the account you will sign in with. Right after this you will add the
            listing itself: business name, contact details, category and photos.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <section className="space-y-4">
              <SectionTitle>Your details</SectionTitle>
              <Field
                id="full_name"
                label="Full name"
                type="text"
                autoComplete="name"
                value={form.full_name}
                onChange={set('full_name')}
                placeholder="Nimal Perera"
                hint="Shown as the listing's contact name unless you change it later."
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="you@example.com"
                />
                <Field
                  id="phone"
                  label="Phone (optional)"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="+94 77 000 0000"
                />
              </div>
            </section>

            <section className="space-y-4">
              <SectionTitle>Account</SectionTitle>
              <Field
                id="username"
                label="Username"
                type="text"
                autoComplete="username"
                value={form.username}
                onChange={set('username')}
                placeholder="At least 3 characters"
                hint="You will sign in with this."
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="password"
                  label="Password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={set('password')}
                  placeholder="••••••••"
                />
                <Field
                  id="confirm"
                  label="Confirm password"
                  type="password"
                  autoComplete="new-password"
                  value={form.confirm}
                  onChange={set('confirm')}
                  placeholder="••••••••"
                />
              </div>
            </section>

            {error && (
              <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? 'Creating your account…' : 'Create account & continue'}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Step 2 comes next — nothing is published until our team approves it.
            </p>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Already registered?{' '}
            <Link
              to="/business/login"
              className="font-semibold text-brand underline-offset-4 hover:underline"
            >
              Sign in to your business panel
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
