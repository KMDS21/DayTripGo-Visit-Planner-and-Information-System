// Navbar — primary navigation (Home, Explore → the places list, My Day Plan).
// Selected item shows green text only (no filled pill), per developer instruction.

import { NavLink, useLocation } from 'react-router-dom';
import { useVisitPlan } from '../../hooks/useVisitPlan';

const base = 'rounded-full px-4 py-2 text-sm font-semibold transition-colors';
const active = 'text-brand-dark';
const inactive = 'text-muted-foreground hover:bg-muted hover:text-foreground';

export default function Navbar() {
  const { count } = useVisitPlan();
  const { pathname, hash } = useLocation();

  // Home is active on "/" with no anchor; Explore is active on "/#places".
  const homeActive = pathname === '/' && !hash;
  const exploreActive = pathname === '/' && hash === '#places';

  return (
    <nav className="flex flex-wrap items-center gap-1">
      <NavLink to="/" className={`${base} ${homeActive ? active : inactive}`}>
        Home
      </NavLink>
      <NavLink to="/#places" className={`${base} ${exploreActive ? active : inactive}`}>
        Explore
      </NavLink>
      <NavLink
        to="/visit-plan"
        className={({ isActive }) => `${base} ${isActive ? active : inactive}`}
      >
        My Day Plan
        {count > 0 && (
          <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">
            {count}
          </span>
        )}
      </NavLink>
    </nav>
  );
}
