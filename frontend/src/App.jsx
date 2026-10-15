// App — router and app shell (plan §14.3 Step 18).

import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import ProtectedRoute from './components/Common/ProtectedRoute';
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

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-svh flex-col">
        <Header />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/places/:id" element={<PlaceDetailPage />} />
            <Route path="/visit-plan" element={<VisitPlanPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
