// App — router and app shell (plan §14.3 Step 18).
// Public routes render inside the public Header/Footer shell (previous design);
// the admin dashboard gets an isolated layout with a collapsible light sidebar.

import { useEffect, useState } from 'react';
import { BrowserRouter, Link, Navigate, NavLink, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import ProtectedRoute from './components/Common/ProtectedRoute';
import { useAuth } from './hooks/useAuth';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import PlaceDetailPage from './pages/PlaceDetailPage';
import VisitPlanPage from './pages/VisitPlanPage';
import ContactPage from './pages/ContactPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminPlacesPage from './pages/AdminPlacesPage';
import AdminContentPage from './pages/AdminContentPage';
import AdminMessagesPage from './pages/AdminMessagesPage';

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

function PageIcon() {
  return (
    <svg {...ICON}>
      <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg {...ICON}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7.5l9 6 9-6" />
    </svg>
  );
}

function PlacesIcon() {
  return (
    <svg {...ICON}>
      <path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

// ── Admin auth shell — login/redirect screens only: no public Header/Footer ─
function AdminAuthLayout() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background px-4 py-10">
      {/* Brand green-teal gradient wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,#ffffff_0%,var(--color-brand-light)_48%,#e2faf3_100%)]"
      />
      {/* Soft brand glows for depth */}
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand/25 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-brand/20 blur-3xl" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(255,255,255,0.9)_0%,transparent_70%)]"
      />

      <div className="relative z-10 w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
}

// ── Admin shell — collapsible light sidebar, no public Header/Footer ───────
// Below lg the sidebar is hidden, so a mobile top bar with its own drawer
// provides the same navigation + logout on phones and tablets.
function AdminMobileBar() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate('/admin/login');
  };

  const drawerLinkClass = ({ isActive }) =>
    `flex items-center gap-2.5 rounded-xl px-4 py-3.5 text-base font-semibold transition-colors ${
      isActive ? 'bg-brand-light text-brand-dark' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`;

  return (
    <div className="lg:hidden">
      <div className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <Link to="/" className="flex min-w-0 items-center">
          <img src="/Logo.png" alt="DayTripGO" className="h-8 w-auto shrink-0" />
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open admin menu"
            aria-expanded={open}
            aria-controls="admin-mobile-menu"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-foreground transition-colors hover:bg-muted"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden="true" />
      )}
      <div
        id="admin-mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Admin menu"
        className={`fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col overflow-hidden border-l border-border bg-background p-5 shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex shrink-0 items-center justify-between">
          <img src="/Logo.png" alt="DayTripGO" className="h-8 w-auto" />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="mt-4 shrink-0 truncate px-1 text-xs text-muted-foreground">
          Signed in as <span className="font-semibold text-foreground">{admin?.username}</span>
        </p>

        {/* min-h-0 lets this flex child shrink and scroll on short screens */}
        <nav className="mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto" aria-label="Admin mobile">
          <NavLink to="/admin/dashboard" end onClick={() => setOpen(false)} className={drawerLinkClass}>
            <DashboardIcon />
            Dashboard
          </NavLink>
          <NavLink to="/admin/places" onClick={() => setOpen(false)} className={drawerLinkClass}>
            <PlacesIcon />
            Attractive Places
          </NavLink>

          <p className="px-4 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Edit pages
          </p>
          <NavLink to="/admin/pages/home" onClick={() => setOpen(false)} className={drawerLinkClass}>
            <PageIcon />
            Home page
          </NavLink>
          <NavLink to="/admin/pages/explore" onClick={() => setOpen(false)} className={drawerLinkClass}>
            <ExploreIcon />
            Explore page
          </NavLink>
          <NavLink to="/admin/pages/plan" onClick={() => setOpen(false)} className={drawerLinkClass}>
            <PlanIcon />
            My Day Plan page
          </NavLink>
          <NavLink to="/admin/pages/contact" onClick={() => setOpen(false)} className={drawerLinkClass}>
            <PageIcon />
            Contact us page
          </NavLink>

          <p className="px-4 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Responses
          </p>
          <NavLink to="/admin/messages" onClick={() => setOpen(false)} className={drawerLinkClass}>
            <MessageIcon />
            Contact responses
          </NavLink>
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 flex shrink-0 items-center justify-center gap-2.5 rounded-xl border border-border py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
          Log out
        </button>
      </div>
    </div>
  );
}

function AdminLayout({ children }) {
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
    // Stacks on mobile so the AdminMobileBar sits above the content; a row
    // from lg up where the sidebar takes over.
    <div className="flex min-h-svh flex-col bg-background lg:flex-row">
      <AdminMobileBar />
      <aside
        id="admin-sidebar"
        className={`sticky top-0 hidden h-svh shrink-0 flex-col justify-between border-r border-border bg-card py-5 transition-[width,padding] duration-300 lg:flex ${
          collapsed ? 'w-[76px] px-3' : 'w-60 px-4'
        }`}
      >
        <div className="space-y-6">
          {/* Logo + collapse toggle — full logo expanded, pin mark when collapsed */}
          <div className={`flex items-center px-1 ${collapsed ? 'flex-col gap-2.5' : 'justify-between gap-2'}`}>
            <Link to="/" className="flex items-center justify-center gap-2.5">
              {collapsed ? (
                <img src="/Logo%20pin.png" alt="DayTripGO" className="h-8 w-auto" />
              ) : (
                <img src="/Logo.png" alt="DayTripGO" className="h-9 w-auto" />
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
            <NavLink to="/admin/places" className={sideLinkClass}>
              <PlacesIcon />
              {!collapsed && 'Attractive Places'}
            </NavLink>
          </nav>

          {/* Edit content — one entry per public page */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Edit pages
              </p>
            )}
            <NavLink to="/admin/pages/home" className={sideLinkClass}>
              <PageIcon />
              {!collapsed && 'Home page'}
            </NavLink>
            <NavLink to="/admin/pages/explore" className={sideLinkClass}>
              <ExploreIcon />
              {!collapsed && 'Explore page'}
            </NavLink>
            <NavLink to="/admin/pages/plan" className={sideLinkClass}>
              <PlanIcon />
              {!collapsed && 'My Day Plan page'}
            </NavLink>
            <NavLink to="/admin/pages/contact" className={sideLinkClass}>
              <PageIcon />
              {!collapsed && 'Contact us page'}
            </NavLink>
          </div>

          {/* Responses — Contact us inbox */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Responses
              </p>
            )}
            <NavLink to="/admin/messages" className={sideLinkClass}>
              <MessageIcon />
              {!collapsed && 'Contact responses'}
            </NavLink>
          </div>
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
        {/* Place management — Add / Edit / Delete + image upload */}
        <Route
          path="/admin/places"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminPlacesPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        {/* Per-page content editors (Home / Explore / My Day Plan / Contact) */}
        <Route
          path="/admin/pages/:page"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminContentPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        {/* Contact us responses */}
        <Route
          path="/admin/messages"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminMessagesPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
