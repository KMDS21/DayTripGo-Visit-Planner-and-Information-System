// Header — DayTripGO brand bar with navigation.
// Below md the inline Navbar is replaced by the MobileMenu drawer so the bar
// stays on a single row; the CTA shortens to "My plan" on the smallest screens.

import { Link, NavLink } from 'react-router-dom';
import Navbar from './Navbar';
import MobileMenu from './MobileMenu';
import { useVisitPlan } from '../../hooks/useVisitPlan';

export default function Header() {
  const { count } = useVisitPlan();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 md:grid md:grid-cols-[1fr_auto_1fr] md:gap-4 lg:px-8">
        <Link to="/" className="flex items-center md:justify-self-start">
          <img src="/Logo.png" alt="DayTripGO" className="h-9 w-auto" />
        </Link>
        {/* Centred at md+ (1fr / auto / 1fr columns); hidden on mobile in favour of the drawer. */}
        <div className="hidden md:col-start-2 md:justify-self-center md:block">
          <Navbar />
        </div>
        {/* Green plan CTA, right corner of the bar → My Day Plan. Short label under sm. */}
        <div className="ml-auto flex items-center gap-2 md:col-start-3 md:ml-0 md:justify-self-end">
          <NavLink
            to="/visit-plan"
            className={({ isActive }) =>
              `inline-flex items-center gap-1.5 rounded-2xl bg-brand px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark sm:px-4 ${
                isActive ? 'ring-2 ring-brand-dark ring-offset-2 ring-offset-background' : ''
              }`
            }
          >
            <span className="sm:hidden">My plan</span>
            <span className="hidden sm:inline">Let&apos;s plan your tour</span>
            {count > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/25 px-1.5 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </NavLink>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
