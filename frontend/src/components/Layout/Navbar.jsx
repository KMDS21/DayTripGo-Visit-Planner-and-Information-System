// Navbar — primary navigation (Home, Visit Plan with count badge, Admin).

import { NavLink } from 'react-router-dom';
import { useVisitPlan } from '../../hooks/useVisitPlan';
import { useAuth } from '../../hooks/useAuth';

const linkClass = ({ isActive }) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
    isActive ? 'bg-brand-light text-brand-dark' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  }`;

export default function Navbar() {
  const { count } = useVisitPlan();
  const { isAdmin } = useAuth();

  return (
    <nav className="flex flex-wrap items-center gap-1">
      <NavLink to="/" end className={linkClass}>
        Explore
      </NavLink>
      <NavLink to="/visit-plan" className={linkClass}>
        My Day Plan
        {count > 0 && (
          <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">
            {count}
          </span>
        )}
      </NavLink>
      <NavLink to={isAdmin ? '/admin/dashboard' : '/admin/login'} className={linkClass}>
        {isAdmin ? 'Dashboard' : 'Admin'}
      </NavLink>
    </nav>
  );
}
