// ContactPage — /contact: two-column layout — a form to collect the visitor's
// details on the left, company details on the right.
// The form posts to POST /api/messages; responses appear in the admin panel
// under Contact responses.

import { useState } from 'react';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';
import usePageContent from '../hooks/usePageContent';
import { submitMessage } from '../services/messageService';
import { errorMessage } from '../services/api';
import Button from '../components/Common/Button';

// Company details shown on the right — values come from the admin-edited
// content (usePageContent) and fall back to these built-in defaults.
const DETAILS_META = [
  {
    key: 'address',
    label: 'Address',
    value: 'No. 12, Galle Road, Wadduwa',
    hint: 'Kalutara District, Western Province, Sri Lanka',
    icon: MapPin,
  },
  {
    key: 'email',
    label: 'Email',
    value: 'hello@daytripgo.lk',
    hint: 'General enquiries and place suggestions',
    icon: Mail,
  },
  {
    key: 'phone',
    label: 'Phone',
    value: '+94 11 234 5678',
    hint: 'Monday to Friday, 9:00 – 17:00',
    icon: Phone,
  },
  {
    key: 'hours',
    label: 'Opening hours',
    value: 'Mon – Sat · 9:00 – 18:00',
    hint: 'Closed on Sundays and public holidays',
    icon: Clock,
  },
];

const COUNTRIES = [
  'Sri Lanka',
  'India',
  'United Kingdom',
  'Germany',
  'France',
  'Netherlands',
  'Italy',
  'Spain',
  'United States',
  'Canada',
  'Australia',
  'Japan',
  'China',
  'Singapore',
  'Malaysia',
  'Other',
];

// text-base on small screens prevents iOS Safari's focus auto-zoom (it only
// zooms inputs under 16px); sm+ keeps the compact look on desktop.
const inputClass =
  'w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 sm:text-sm';

export default function ContactPage() {
  usePageTitle();

  const { get } = usePageContent('contact', {
    hero_title: 'Contact us',
    hero_subtitle:
      'Questions about a place, a correction to an opening time, or a spot we should feature? DayTripGO is run from Wadduwa and we are happy to hear from visitors.',
    address: 'No. 12, Galle Road, Wadduwa',
    email: 'hello@daytripgo.lk',
    phone: '+94 11 234 5678',
    hours: 'Mon – Sat · 9:00 – 18:00',
  });
  const details = DETAILS_META.map((d) => ({ ...d, value: get(d.key) }));

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    country: 'Sri Lanka',
    city: '',
    subject: 'General enquiry',
    message: '',
  });
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in your name, email and message.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setSending(true);
    setError(null);
    try {
      await submitMessage(form); // stored in contact_messages → admin "Contact responses"
      setSent(true);
      setForm({ name: '', email: '', phone: '', country: 'Sri Lanka', city: '', subject: 'General enquiry', message: '' });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-10 pb-8">
      {/* Hero — page cover image under the same green wash as the Explore hero */}
      <section className="relative overflow-hidden rounded-b-[2.5rem] bg-slate-900 px-4 py-12 text-white sm:px-6 sm:py-16">
        <img
          src={get('hero_cover') || '/Contact%20us%20page%20page%20cover.webp'}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/45 to-slate-900/75"
        />
        <div className="relative mx-auto max-w-3xl text-center [text-shadow:0_1px_16px_rgba(0,0,0,0.45)]">
          <h1 className="font-heading text-3xl font-bold sm:text-4xl lg:text-5xl">{get('hero_title')}</h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/85 sm:text-lg">
            {get('hero_subtitle')}
          </p>
        </div>
      </section>

      {/* Left: user form — Right: company details */}
      <section className="grid gap-5 lg:grid-cols-2">
        {/* Left side — get user details */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="font-heading text-2xl font-bold">Send us a message</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Tell us who you are and how we can help. We reply by email within two working days.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className="mb-1.5 block text-sm font-semibold">
                  Full name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={update('name')}
                  className={inputClass}
                  placeholder="Jane Perera"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="mb-1.5 block text-sm font-semibold">
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={update('email')}
                  className={inputClass}
                  placeholder="jane@example.com"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-phone" className="mb-1.5 block text-sm font-semibold">
                  Phone <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={update('phone')}
                  className={inputClass}
                  placeholder="+94 77 123 4567"
                />
              </div>
              <div>
                <label htmlFor="contact-subject" className="mb-1.5 block text-sm font-semibold">
                  Subject
                </label>
                <select
                  id="contact-subject"
                  value={form.subject}
                  onChange={update('subject')}
                  className={inputClass}
                >
                  <option>General enquiry</option>
                  <option>Suggest a place</option>
                  <option>Correction to a listing</option>
                  <option>Something else</option>
                </select>
              </div>
            </div>

            {/* Country details — where the message comes from */}
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-brand">
                Country details
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-country" className="mb-1.5 block text-sm font-semibold">
                    Country
                  </label>
                  <select
                    id="contact-country"
                    value={form.country}
                    onChange={update('country')}
                    className={inputClass}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="contact-city" className="mb-1.5 block text-sm font-semibold">
                    City <span className="font-normal text-muted-foreground">(optional)</span>
                  </label>
                  <input
                    id="contact-city"
                    type="text"
                    autoComplete="address-level2"
                    value={form.city}
                    onChange={update('city')}
                    className={inputClass}
                    placeholder="Colombo"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="contact-message" className="mb-1.5 block text-sm font-semibold">
                Message
              </label>
              <textarea
                id="contact-message"
                rows={5}
                value={form.message}
                onChange={update('message')}
                className={`${inputClass} resize-y`}
                placeholder="How can we help?"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
                {error}
              </p>
            )}
            {sent && (
              <p role="status" className="rounded-xl bg-emerald-100 px-3.5 py-2.5 text-sm font-medium text-emerald-800">
                Thanks. Your message has been noted, and we will get back to you by email.
              </p>
            )}

            <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={sending}>
              {sending ? 'Sending…' : 'Send message'}
            </Button>
          </form>
        </div>

        {/* Right side — company details */}
        <div className="space-y-5">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            {/* Logo + brand — company logo */}
            <div className="flex items-center gap-3">
              <img src="/Logo.png" alt="DayTripGO" className="h-12 w-auto shrink-0" />
              <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                Company details
              </p>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              A visitor information service for the Wadduwa area of Sri Lanka, offering
              verified places, practical details and simple one-day plans for independent travellers.
            </p>

            <dl className="mt-6 space-y-4">
              {details.map((d) => {
                const Icon = d.icon;
                return (
                  <div key={d.label} className="flex items-center gap-3 rounded-2xl bg-muted/40 p-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white">
                      <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <dt className="text-xs font-bold uppercase tracking-wide text-brand">{d.label}</dt>
                      <dd className="mt-0.5 font-heading text-lg font-bold leading-snug">{d.value}</dd>
                      <dd className="text-sm text-muted-foreground">{d.hint}</dd>
                    </div>
                  </div>
                );
              })}
            </dl>
          </div>
        </div>
      </section>

      {/* Who we are + scope note (previous section, kept below) */}
      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-heading text-xl font-bold">About DayTripGO</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            DayTripGO is a visitor information service for the Wadduwa area of Sri Lanka. We
            keep a verified list of places of interest within 25 km of Wadduwa, including beaches,
            temples, heritage houses and gardens, with opening times and practical
            tips, and we help you assemble them into a simple one-day plan.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Run by a small local team based in Wadduwa, with plans to cover more towns along
            the coast as the list of verified places grows.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/40 p-6">
          <h2 className="font-heading text-xl font-bold">Good to know</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li>• DayTripGO is planning-only, and we do not take bookings or payments.</li>
            <li>• Suggest a place by email and our team will verify it before listing.</li>
            <li>• Found wrong hours or details? Tell us the place name and we will fix it.</li>
          </ul>
          <p className="mt-4 text-sm font-semibold text-foreground">
            Ready to build a day? Head to{' '}
            <a href="/explore" className="text-brand underline underline-offset-4">
              Explore places
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
