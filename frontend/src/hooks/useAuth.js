// useAuth — consumes AuthContext, exposes login / logout / isAdmin (plan §14.3 Step 15).

import { useAuthContext } from '../context/AuthContext';

export function useAuth() {
  return useAuthContext();
}
