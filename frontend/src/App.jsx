// App — router and app shell (plan §14.3 Step 18).
// Public routes render inside the public Header/Footer shell (previous design);
// the admin dashboard gets an isolated layout with a light sidebar instead.

import { BrowserRouter, Link, Navigate, NavLink, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import ProtectedRoute from './components/Common/ProtectedRoute';
import { useAuth } from './hooks/useAuth';
import { useVisitPlan } from './hooks/useVisitPlan';
import HomePage from './pages/HomePage';
import PlaceDetailPage from './pages/PlaceDetailPage';
import VisitPlanPage from './pages/VisitPlanPage';
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
      <main className="mx-auto w-full max-w-6xl flex-1 px-4">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

const sideLinkClass = ({ isActive }) =>
  `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
    isActive ? 'bg-brand-light text-brand-dark' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  }`;

// ── Admin shell — light sidebar, no public Header/Footer ───────────────────
function AdminLayout({ children }) {
  const { count } = useVisitPlan();
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="flex min-h-svh bg-background">
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col justify-between border-r border-border bg-card px-4 py-5 lg:flex">
        <div className="space-y-6">
          <Link to="/" className="flex items-center gap-2.5 px-1">
            <img src="/favicon.svg" alt="" className="h-9 w-9" />
            <span className="font-heading text-xl font-bold tracking-tight">
              DayTrip<span className="text-brand">GO</span>
            </span>
          </Link>
          <nav className="space-y-1">
            <NavLink to="/admin/dashboard" end className={sideLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/" end className={sideLinkClass}>
              Explore
            </NavLink>
            <NavLink to="/visit-plan" className={sideLinkClass}>
              My Day Plan
              {count > 0 && (
                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">
                  {count}
                </span>
              )}
            </NavLink>
          </nav>
        </div>
        <div className="space-y-3 border-t border-border pt-4">
          <p className="truncate px-1 text-xs text-muted-foreground">
            Signed in as <span className="font-semibold text-foreground">{admin?.username}</span>
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-xl border border-border px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Log out
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
          <Route path="/places/:id" element={<PlaceDetailPage />} />
          <Route path="/visit-plan" element={<VisitPlanPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
          <Route path="*" element={<NotFoundPage />} />
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
