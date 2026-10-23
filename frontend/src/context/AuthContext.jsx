// AuthContext — administrator JWT state (SRS FR-14, FR-15, NFR-5) plus the
// business-owner session. The two roles live side by side in one provider but
// keep separate storage keys, so signing in as an owner never disturbs an
// admin session (and vice versa). Tourists still never authenticate (NFR-7).

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import * as authService from '../services/authService';
import * as ownerAuthService from '../services/ownerAuthService';

const AuthContext = createContext(null);

const TOKEN_KEY = 'daytripgo_token';
const ADMIN_KEY = 'daytripgo_admin';
const OWNER_TOKEN_KEY = 'daytripgo_owner_token';
const OWNER_KEY = 'daytripgo_owner';

// A JWT carries its own expiry ("exp", seconds → ms). A stale token must not
// count as a signed-in user, otherwise protected routes dead-end on 401s and
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

// Drop a token (and its profile blob) when it can no longer be used, so a
// page reload never shows a signed-in shell backed by a dead session.
function readStoredToken(tokenKey, profileKey) {
  const stored = localStorage.getItem(tokenKey);
  if (stored && !tokenLooksValid(stored)) {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(profileKey);
    return null;
  }
  return stored;
}

function readStoredProfile(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => readStoredToken(TOKEN_KEY, ADMIN_KEY));
  const [admin, setAdmin] = useState(() => readStoredProfile(ADMIN_KEY));

  const [ownerToken, setOwnerToken] = useState(() =>
    readStoredToken(OWNER_TOKEN_KEY, OWNER_KEY)
  );
  const [owner, setOwner] = useState(() => readStoredProfile(OWNER_KEY));

  // ── Admin ───────────────────────────────────────────────────────────────
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

  // ── Business owner ──────────────────────────────────────────────────────
  const ownerLogin = useCallback(async (credentials) => {
    const data = await ownerAuthService.login(credentials); // { token, owner }
    localStorage.setItem(OWNER_TOKEN_KEY, data.token);
    localStorage.setItem(OWNER_KEY, JSON.stringify(data.owner));
    setOwnerToken(data.token);
    setOwner(data.owner);
    return data;
  }, []);

  const ownerRegister = useCallback(async (details) => {
    const data = await ownerAuthService.register(details); // { token, owner }
    localStorage.setItem(OWNER_TOKEN_KEY, data.token);
    localStorage.setItem(OWNER_KEY, JSON.stringify(data.owner));
    setOwnerToken(data.token);
    setOwner(data.owner);
    return data;
  }, []);

  const ownerLogout = useCallback(async () => {
    try {
      if (ownerToken) await ownerAuthService.logout();
    } catch {
      // Stateless JWT — the local session is cleared regardless.
    } finally {
      localStorage.removeItem(OWNER_TOKEN_KEY);
      localStorage.removeItem(OWNER_KEY);
      setOwnerToken(null);
      setOwner(null);
    }
  }, [ownerToken]);

  // Keeps the cached profile blob in sync after a profile edit.
  const setStoredOwner = useCallback((next) => {
    setOwner(next);
    if (next) localStorage.setItem(OWNER_KEY, JSON.stringify(next));
    else localStorage.removeItem(OWNER_KEY);
  }, []);

  const value = useMemo(
    () => ({
      token,
      admin,
      login,
      logout,
      isAdmin: tokenLooksValid(token),
      owner,
      ownerToken,
      ownerLogin,
      ownerRegister,
      ownerLogout,
      setStoredOwner,
      isOwner: tokenLooksValid(ownerToken),
    }),
    [token, admin, login, logout, owner, ownerToken, ownerLogin, ownerRegister, ownerLogout, setStoredOwner]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within <AuthProvider>');
  return ctx;
}
