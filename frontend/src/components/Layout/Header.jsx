// Header — DayTripGO brand bar with navigation.
// Below md the inline Navbar is replaced by the MobileMenu drawer so the bar
// stays on a single row; the corner CTA shortens on the smallest screens.
//
// The corner button is the business-owner entry point ("List your business").
// My Day Plan is no longer the corner CTA — it stays a centre Navbar item
// and a drawer link, with its own count badge.

import { Link, NavLink } from 'react-router-dom';
import Navbar from './Navbar';
import MobileMenu from './MobileMenu';
import { useAuth } from '../../hooks/useAuth';

export default function Header() {
  const { isOwner } = useAuth();

  const to = isOwner ? '/owner/dashboard' : '/business/register';
  const label = isOwner ? 'My business panel' : 'List your business';
  const shortLabel = isOwner ? 'My panel' : 'List business';

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      {/* Full-width bar (no max-width cap) so on large screens the logo sits in the
          left corner and the CTA in the right corner; the 1fr/ auto / 1fr grid
          keeps the nav links centred between them. */}
      <div className="flex w-full items-center justify-between gap-4 px-4 py-3 sm:px-6 md:grid md:grid-cols-[1fr_auto_1fr] md:gap-4 lg:px-10">
        <Link to="/" className="flex items-center md:justify-self-start">
          <img src="/Logo.png" alt="DayTripGO" className="h-9 w-auto" />
        </Link>
        {/* Centred at md+ (1fr / auto / 1fr columns); hidden on mobile in favour of the drawer. */}
        <div className="hidden md:col-start-2 md:justify-self-center md:block">
          <Navbar />
        </div>
        {/* Green registration CTA, right corner of the bar. Short label under sm. */}
        <div className="ml-auto flex items-center gap-2 md:col-start-3 md:ml-0 md:justify-self-end">
          <NavLink
            to={to}
            className={({ isActive }) =>
              `inline-flex items-center gap-1.5 rounded-2xl bg-brand px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark sm:px-4 ${
                isActive ? 'ring-2 ring-brand-dark ring-offset-2 ring-offset-background' : ''
              }`
            }
          >
            <span className="sm:hidden">{shortLabel}</span>
            <span className="hidden sm:inline">{label}</span>
          </NavLink>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
