// Header — DayTripGO brand bar with navigation.

import { Link, NavLink } from 'react-router-dom';
import Navbar from './Navbar';

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="flex w-full items-center justify-between gap-4 px-4 py-3 sm:px-6 md:grid md:grid-cols-[1fr_auto_1fr] md:gap-4 lg:px-10">
        <Link to="/" className="flex items-center gap-2.5 md:justify-self-start">
          <img src="/favicon.svg" alt="" className="h-9 w-9" />
          <span className="font-heading text-xl font-bold tracking-tight">
            DayTrip<span className="text-brand">GO</span>
          </span>
        </Link>
        {/* Centred at md+ (1fr / auto / 1fr columns); stays in the row on mobile. */}
        <div className="md:col-start-2 md:justify-self-center">
          <Navbar />
        </div>
        {/* Green plan CTA, right corner of the bar → My Day Plan */}
        <div className="ml-auto md:col-start-3 md:ml-0 md:justify-self-end">
          <NavLink
            to="/visit-plan"
            className={({ isActive }) =>
              `block rounded-2xl bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark ${
                isActive ? 'ring-2 ring-brand-dark ring-offset-2 ring-offset-background' : ''
              }`
            }
          >
            Let&apos;s plan your tour
          </NavLink>
        </div>
      </div>
    </header>
  );
}
