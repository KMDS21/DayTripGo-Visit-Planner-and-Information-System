// AdminContentPage — /admin/pages/:page
// Separate editor per public page (Home / Explore / My Day Plan / Contact us).
// Each field is saved to `page_content` and shown on the public page with a
// built-in fallback, so nothing breaks when a field is left empty.

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPageContent, savePageContent } from '../services/contentService';
import { errorMessage } from '../services/api';
import usePageTitle from '../hooks/usePageTitle';
import Button from '../components/Common/Button';
import Loader from '../components/Common/Loader';

// Editable fields per page — "Heroes + key texts" scope agreed for this pass.
const PAGE_CONFIG = {
  home: {
    title: 'Home page',
    intro: 'Hero banner and the two intro sections of the home page.',
    fields: [
      { key: 'hero_title', label: 'Hero title', type: 'text', hint: 'Shown over the green gradient at the top.' },
      { key: 'hero_subtitle', label: 'Hero subtitle', type: 'textarea' },
      { key: 'why_title', label: '"Why DayTripGO" heading', type: 'text' },
      { key: 'why_body', label: '"Why DayTripGO" text', type: 'textarea' },
      { key: 'how_title', label: '"How DayTripGO works" heading', type: 'text' },
      { key: 'how_body', label: '"How DayTripGO works" text', type: 'textarea' },
    ],
  },
  explore: {
    title: 'Explore page',
    intro: 'The banner visitors see above the place grid.',
    fields: [
      { key: 'hero_title', label: 'Hero title', type: 'text' },
      { key: 'hero_subtitle', label: 'Hero subtitle', type: 'textarea' },
    ],
  },
  plan: {
    title: 'My Day Plan page',
    intro: 'The banner at the top of the visit-plan screen.',
    fields: [
      { key: 'hero_title', label: 'Hero title', type: 'text' },
      { key: 'hero_subtitle', label: 'Hero subtitle', type: 'textarea' },
    ],
  },
  contact: {
    title: 'Contact us page',
    intro: 'Banner text and the company details card on the right.',
    fields: [
      { key: 'hero_title', label: 'Hero title', type: 'text' },
      { key: 'hero_subtitle', label: 'Hero subtitle', type: 'textarea' },
      { key: 'address', label: 'Address', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'hours', label: 'Opening hours', type: 'text' },
    ],
  },
};

const inputClass =
  'w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 sm:text-sm';

export default function AdminContentPage() {
  usePageTitle();
  const { page } = useParams();
  const config = PAGE_CONFIG[page];

  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!config) {
      setLoading(false);
      return () => {};
    }
    setLoading(true);
    setError(null);
    getPageContent(page)
      .then((data) => {
        if (alive) setValues(data || {});
      })
      .catch((err) => {
        if (alive) setError(errorMessage(err));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [page, config]);

  if (!config) {
    return (
      <div className="py-16 text-center">
        <p className="text-2xl font-bold">Unknown page</p>
        <p className="mt-2 text-sm text-muted-foreground">No editor exists for "{page}".</p>
      </div>
    );
  }

  const handleChange = (key) => (e) => {
    setValues((prev) => ({ ...prev, [key]: e.target.value }));
    setSaved(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const sections = {};
      for (const field of config.fields) {
        sections[field.key] = typeof values[field.key] === 'string' ? values[field.key] : '';
      }
      const data = await savePageContent(page, sections);
      setValues(data);
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 py-10">
      <header>
        <h1 className="text-3xl font-bold sm:text-4xl">{config.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{config.intro}</p>
      </header>

      {loading && <Loader label="Loading content…" />}

      {!loading && (
        <form onSubmit={handleSave} className="max-w-2xl space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          {config.fields.map((field) => (
            <div key={field.key}>
              <label className="mb-1.5 block text-sm font-semibold" htmlFor={`c-${field.key}`}>
                {field.label}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  id={`c-${field.key}`}
                  rows={3}
                  className={inputClass}
                  value={values[field.key] || ''}
                  onChange={handleChange(field.key)}
                />
              ) : (
                <input
                  id={`c-${field.key}`}
                  className={inputClass}
                  value={values[field.key] || ''}
                  onChange={handleChange(field.key)}
                />
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {field.hint || 'Leave empty to keep the built-in wording.'}
              </p>
            </div>
          ))}

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
              {error}
            </p>
          )}
          {saved && (
            <p role="status" className="rounded-xl bg-emerald-100 px-3.5 py-2.5 text-sm font-medium text-emerald-800">
              Saved. The public page updates immediately.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
