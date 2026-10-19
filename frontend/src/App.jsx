// App — router and app shell (plan §14.3 Step 18).
// Public routes render inside the public Header/Footer shell (previous design);
// the admin dashboard gets an isolated layout with a collapsible light sidebar.

import { useState } from 'react';
import { BrowserRouter, Link, Navigate, NavLink, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import ProtectedRoute from './components/Common/ProtectedRoute';
import { useAuth } from './hooks/useAuth';
import { useVisitPlan } from './hooks/useVisitPlan';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import PlaceDetailPage from './pages/PlaceDetailPage';
import VisitPlanPage from './pages/VisitPlanPage';
import ContactPage from './pages/ContactPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

function NotFoundPage() {
  return (
    <div className="py-24 text-center">
      <p className="font-heading text-6xl font-bold text-brand">404</p>
      <p className="mt-2 text-muted-foreground">That page does not exist.</p>
      <Link to="/" className="mt-4 inline-block font-semibold text-brand underline-offset-4 hover:underline">
        ← Back to Explore
      </Link>
    </div>
  );
}

// ── Public shell — Header + Footer (previous design) ───────────────────────
function PublicLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="w-full flex-1 px-4 sm:px-6 lg:px-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

// ── Sidebar icons (18px stroke, inherit currentColor) ──────────────────────
const ICON = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  className: 'h-[18px] w-[18px] shrink-0',
};

function DashboardIcon() {
  return (
    <svg {...ICON}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function ExploreIcon() {
  return (
    <svg {...ICON}>
      <circle cx="12" cy="12" r="9" />
      <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
    </svg>
  );
}

function PlanIcon() {
  return (
    <svg {...ICON}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg {...ICON}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

function ChevronIcon({ collapsed }) {
  return (
    <svg {...ICON} className="h-4 w-4 shrink-0">
      {collapsed ? <path d="M9 18l6-6-6-6" /> : <path d="M15 18l-6-6 6-6" />}
    </svg>
  );
}

// ── Admin auth shell — login/redirect screens only: no public Header/Footer ─
function AdminAuthLayout() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-10">
      <Link to="/" className="mb-6 flex items-center gap-2.5">
        <img src="/favicon.svg" alt="" className="h-9 w-9 shrink-0" />
        <span className="whitespace-nowrap font-heading text-xl font-bold tracking-tight">
          DayTrip<span className="text-brand">GO</span>
        </span>
      </Link>
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
}

// ── Admin shell — collapsible light sidebar, no public Header/Footer ───────
function AdminLayout({ children }) {
  const { count } = useVisitPlan();
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const sideLinkClass = ({ isActive }) =>
    `flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
      collapsed ? 'justify-center' : ''
    } ${isActive ? 'bg-brand-light text-brand-dark' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`;

  return (
    <div className="flex min-h-svh bg-background">
      <aside
        id="admin-sidebar"
        className={`sticky top-0 hidden h-svh shrink-0 flex-col justify-between border-r border-border bg-card py-5 transition-[width,padding] duration-300 lg:flex ${
          collapsed ? 'w-[76px] px-3' : 'w-60 px-4'
        }`}
      >
        <div className="space-y-6">
          {/* Logo + collapse toggle */}
          <div className={`flex items-center px-1 ${collapsed ? 'flex-col gap-2.5' : 'justify-between gap-2'}`}>
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/favicon.svg" alt="" className="h-9 w-9 shrink-0" />
              {!collapsed && (
                <span className="whitespace-nowrap font-heading text-xl font-bold tracking-tight">
                  DayTrip<span className="text-brand">GO</span>
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!collapsed}
              aria-controls="admin-sidebar"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="shrink-0 rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronIcon collapsed={collapsed} />
            </button>
          </div>

          <nav className="space-y-1">
            <NavLink to="/admin/dashboard" end className={sideLinkClass}>
              <DashboardIcon />
              {!collapsed && 'Dashboard'}
            </NavLink>
            <NavLink to="/" end className={sideLinkClass}>
              <ExploreIcon />
              {!collapsed && 'Explore'}
            </NavLink>
            <NavLink to="/visit-plan" className={sideLinkClass}>
              <PlanIcon />
              {!collapsed && 'My Day Plan'}
              {!collapsed && count > 0 && (
                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">
                  {count}
                </span>
              )}
            </NavLink>
          </nav>
        </div>

        <div className="space-y-3 border-t border-border pt-4">
          {!collapsed && (
            <p className="truncate px-1 text-xs text-muted-foreground">
              Signed in as <span className="font-semibold text-foreground">{admin?.username}</span>
            </p>
          )}
          <button
            type="button"
            onClick={handleLogout}
            title="Log out"
            className={`flex w-full items-center gap-2.5 rounded-xl border border-border py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${
              collapsed ? 'justify-center px-3' : 'px-3'
            }`}
          >
            <LogoutIcon />
            {!collapsed && 'Log out'}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-6xl flex-1 px-4">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/places/:id" element={<PlaceDetailPage />} />
          <Route path="/visit-plan" element={<VisitPlanPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        {/* Admin auth screens — isolated: no public navigation or footer */}
        <Route element={<AdminAuthLayout />}>
          <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
        </Route>
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminDashboardPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
