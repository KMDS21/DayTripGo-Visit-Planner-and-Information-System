// AuthContext — administrator JWT state (SRS FR-14, FR-15, NFR-5).
// Token + admin object persist in localStorage; tourists never authenticate (NFR-7).

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

const TOKEN_KEY = 'daytripgo_token';
const ADMIN_KEY = 'daytripgo_admin';

// A JWT carries its own expiry ("exp", seconds → ms). A stale token must not
// count as a signed-in admin, otherwise protected routes dead-end on 401s and
// the login screen can never be reached (SRS FR-14/FR-15).
function tokenLooksValid(value) {
  if (!value) return false;
  try {
    const payload = JSON.parse(atob(value.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (typeof payload.exp !== 'number') return true; // no exp claim → accept
    return payload.exp * 1000 > Date.now();
  } catch {
    return false; // malformed token → treat as signed out
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored && !tokenLooksValid(stored)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(ADMIN_KEY);
      return null;
    }
    return stored;
  });
  const [admin, setAdmin] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(ADMIN_KEY));
    } catch {
      return null;
    }
  });

  const login = useCallback(async (credentials) => {
    const data = await authService.login(credentials); // { token, admin }
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(ADMIN_KEY, JSON.stringify(data.admin));
    setToken(data.token);
    setAdmin(data.admin);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) await authService.logout();
    } catch {
      // Stateless JWT — ignore server errors; the token is discarded either way.
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(ADMIN_KEY);
      setToken(null);
      setAdmin(null);
    }
  }, [token]);

  const value = useMemo(
    () => ({ token, admin, login, logout, isAdmin: tokenLooksValid(token) }),
    [token, admin, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within <AuthProvider>');
  return ctx;
}
