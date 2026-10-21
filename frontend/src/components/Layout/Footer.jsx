// Footer — branded gradient footer echoing the page heroes (rounded top,
// decorative circles, four columns on desktop). Sits outside the padded main
// so it spans edge to edge on every public page.

import { Link } from 'react-router-dom';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/explore', label: 'Explore places' },
  { to: '/visit-plan', label: 'My Day Plan' },
  { to: '/contact', label: 'Contact us' },
];

const categories = ['Religious', 'Nature', 'Heritage', 'Cultural'];

export default function Footer() {
  return (
    <footer className="relative mt-16 overflow-hidden rounded-t-[2.5rem] bg-gradient-to-br from-brand-dark via-brand to-teal-500 text-white">
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-white/10" />

      <div className="relative grid gap-10 px-6 py-14 sm:px-10 lg:grid-cols-4 lg:px-14">
        {/* Brand — company logo on a light chip so it stays readable on the gradient */}
        <div>
          <img src="/Logo.png" alt="DayTripGO" className="h-10 w-auto rounded-xl bg-white px-3 py-2" />
          <p className="mt-3 text-sm leading-relaxed text-white/80">
            One perfect day around Wadduwa, with verified places of interest within 25 km,
            opening times and practical tips, plus a simple one-day
            plan builder.
          </p>
        </div>

        {/* Quick links */}
        <nav aria-label="Footer">
          <h3 className="text-sm font-bold uppercase tracking-wide text-white/60">Quick links</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {links.map((l) => (
              <li key={l.to}>
                <Link to={l.to} end={l.end} className="text-white/85 underline-offset-4 transition-colors hover:text-white hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Categories */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-white/60">Categories</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-white/85">
            {categories.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-white/60">Get in touch</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-white/85">
            <li>No. 12, Galle Road, Wadduwa</li>
            <li>Kalutara District, Sri Lanka</li>
            <li>
              <a href="mailto:hello@daytripgo.lk" className="underline-offset-4 transition-colors hover:text-white hover:underline">
                hello@daytripgo.lk
              </a>
            </li>
            <li>+94 11 234 5678</li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative border-t border-white/15 px-6 py-5 text-center text-xs text-white/70 sm:px-10 lg:flex lg:items-center lg:justify-between lg:px-14 lg:text-left">
        <p>© 2026 DayTripGO · Wadduwa, Sri Lanka</p>
        <p>
          Visit planning only, with no booking or payment services. Plan your day with
          DayTripGO.
        </p>
      </div>
    </footer>
  );
}
