// OwnerProfilePage — /owner/profile (protected)
// The owner's account details, editable in place, plus a separate password
// change form. Saving refreshes the cached profile in AuthContext so the
// panel header shows the new name immediately.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword, getProfile, updateProfile } from '../services/ownerAuthService';
import { useAuth } from '../hooks/useAuth';
import { errorMessage } from '../services/api';
import usePageTitle from '../hooks/usePageTitle';
import Button from '../components/Common/Button';
import Loader from '../components/Common/Loader';

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

export default function OwnerProfilePage() {
  usePageTitle();
  const { owner, setStoredOwner, ownerLogout } = useAuth();
  const navigate = useNavigate();

  const [details, setDetails] = useState({
    full_name: '',
    email: '',
    phone: '',
    bio: '',
  });
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detailsMsg, setDetailsMsg] = useState(null);
  const [detailsErr, setDetailsErr] = useState(null);

  const [pw, setPw] = useState({ current_password: '', new_password: '', confirm: '' });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);
  const [pwErr, setPwErr] = useState(null);

  useEffect(() => {
    let alive = true;
    getProfile()
      .then((row) => {
        if (!alive) return;
        setDetails({
          full_name: row.full_name || '',
          email: row.email || '',
          phone: row.phone || '',
          bio: row.bio || '',
        });
        setUsername(row.username || '');
      })
      .catch((err) => alive && setDetailsErr(errorMessage(err)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const setDetail = (key) => (e) => setDetails((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setDetailsErr(null);
    setDetailsMsg(null);
    if (!details.full_name.trim() || !details.email.trim()) {
      setDetailsErr('Name and email are required.');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateProfile({
        full_name: details.full_name.trim(),
        email: details.email.trim(),
        phone: details.phone.trim(),
        bio: details.bio,
      });
      setStoredOwner(updated);
      setDetailsMsg('Profile saved.');
    } catch (err) {
      setDetailsErr(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const setPwField = (key) => (e) => setPw((prev) => ({ ...prev, [key]: e.target.value }));

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwErr(null);
    setPwMsg(null);
    if (!pw.current_password || !pw.new_password) {
      setPwErr('Enter your current password and a new one.');
      return;
    }
    if (pw.new_password.length < 6) {
      setPwErr('Your new password must be at least 6 characters.');
      return;
    }
    if (pw.new_password !== pw.confirm) {
      setPwErr('The two new passwords do not match.');
      return;
    }
    setPwBusy(true);
    try {
      await changePassword({
        current_password: pw.current_password,
        new_password: pw.new_password,
      });
      setPw({ current_password: '', new_password: '', confirm: '' });
      setPwMsg('Password changed. Use it the next time you sign in.');
    } catch (err) {
      setPwErr(errorMessage(err));
    } finally {
      setPwBusy(false);
    }
  };

  const handleLogout = async () => {
    await ownerLogout();
    navigate('/business/login');
  };

  if (loading) return <Loader label="Loading your profile…" />;

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">My profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as{' '}
            <span className="font-semibold text-foreground">{username || owner?.username}</span>.
          </p>
        </div>
        <Button variant="danger-soft" onClick={handleLogout}>
          Log out
        </Button>
      </header>

      <form
        onSubmit={handleSaveDetails}
        className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6"
      >
        <h2 className="border-b border-border pb-1.5 text-xs font-bold uppercase tracking-[0.18em] text-brand-dark">
          Account details
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="full_name"
            label="Full name"
            type="text"
            autoComplete="name"
            value={details.full_name}
            onChange={setDetail('full_name')}
          />
          <Field
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            value={details.email}
            onChange={setDetail('email')}
          />
          <Field
            id="phone"
            label="Phone"
            type="tel"
            autoComplete="tel"
            value={details.phone}
            onChange={setDetail('phone')}
          />
          <Field
            id="username-display"
            label="Username"
            type="text"
            value={username}
            readOnly
            hint="Your sign-in name cannot be changed."
            className={`${fieldClass} cursor-not-allowed bg-muted/50`}
          />
        </div>

        <div>
          <label htmlFor="bio" className="mb-1.5 block text-sm font-semibold">
            About you
          </label>
          <textarea
            id="bio"
            rows={3}
            value={details.bio}
            onChange={setDetail('bio')}
            placeholder="A line about you or your business (optional)."
            className={`${fieldClass} resize-y`}
          />
        </div>

        {detailsErr && (
          <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            {detailsErr}
          </p>
        )}
        {detailsMsg && (
          <p className="rounded-xl bg-brand-light px-3.5 py-2.5 text-sm font-medium text-brand-dark">
            {detailsMsg}
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </Button>
        </div>
      </form>

      <form
        onSubmit={handleChangePassword}
        className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6"
      >
        <h2 className="border-b border-border pb-1.5 text-xs font-bold uppercase tracking-[0.18em] text-brand-dark">
          Change password
        </h2>

        <Field
          id="current_password"
          label="Current password"
          type="password"
          autoComplete="current-password"
          value={pw.current_password}
          onChange={setPwField('current_password')}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="new_password"
            label="New password"
            type="password"
            autoComplete="new-password"
            value={pw.new_password}
            onChange={setPwField('new_password')}
            hint="At least 6 characters."
          />
          <Field
            id="confirm_password"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={pw.confirm}
            onChange={setPwField('confirm')}
          />
        </div>

        {pwErr && (
          <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            {pwErr}
          </p>
        )}
        {pwMsg && (
          <p className="rounded-xl bg-brand-light px-3.5 py-2.5 text-sm font-medium text-brand-dark">
            {pwMsg}
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" variant="outline" disabled={pwBusy}>
            {pwBusy ? 'Updating…' : 'Change password'}
          </Button>
        </div>
      </form>
    </div>
  );
}
