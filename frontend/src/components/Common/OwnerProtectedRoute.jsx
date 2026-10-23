// OwnerProtectedRoute — business-owner-only routes.
// Mirrors ProtectedRoute: an unsigned-in visitor is sent to the owner login
// (never to the admin login — the two panels are separate areas).

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function OwnerProtectedRoute({ children }) {
  const { isOwner } = useAuth();
  const location = useLocation();

  if (!isOwner) {
    return <Navigate to="/owner/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}
