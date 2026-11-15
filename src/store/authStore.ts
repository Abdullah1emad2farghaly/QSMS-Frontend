import { create } from 'zustand';
import type { AuthUser, UserRole } from '@/types';
import { readStoredSession } from '@/services/auth/tokenStorage';

/** restoring = a stored session exists and is being re-validated with a refresh at startup. */
export type AuthStatus = 'restoring' | 'authenticated' | 'anonymous';
export type SessionEndReason = 'expired' | null;

interface AuthState {
  status: AuthStatus;
  /** Memory only. Never persisted. */
  accessToken: string | null;
  user: AuthUser | null;
  roles: UserRole[];
  /** Active role of THIS session as reported by the backend (null = none chosen). */
  activeRole: UserRole | null;
  mustChangePassword: boolean;
  /** Why the session ended without the user asking (shown once on the login screen). */
  endedReason: SessionEndReason;
  setSession: (session: {
    accessToken: string;
    user: AuthUser;
    roles: UserRole[];
    activeRole: UserRole | null;
    mustChangePassword: boolean;
  }) => void;
  setActiveRole: (role: UserRole | null) => void;
  setMustChangePassword: (value: boolean) => void;
  clear: (reason?: SessionEndReason) => void;
  setStatus: (status: AuthStatus) => void;
  dismissEndedReason: () => void;
}

const initial = () => {
  const stored = readStoredSession();
  return stored
    ? { status: 'restoring' as AuthStatus, user: stored.user, roles: stored.roles, activeRole: stored.activeRole ?? null, mustChangePassword: stored.mustChangePassword }
    : { status: 'anonymous' as AuthStatus, user: null, roles: [] as UserRole[], activeRole: null as UserRole | null, mustChangePassword: false };
};

/** Global authentication state. The refresh token is NOT here: it lives only in `tokenStorage`. */
export const useAuthStore = create<AuthState>()((set) => ({
  ...initial(),
  accessToken: null,
  endedReason: null,
  setSession: (session) => set({ ...session, status: 'authenticated', endedReason: null }),
  setActiveRole: (activeRole) => set({ activeRole }),
  setMustChangePassword: (mustChangePassword) => set({ mustChangePassword }),
  clear: (reason = null) =>
    set({ status: 'anonymous', accessToken: null, user: null, roles: [], activeRole: null, mustChangePassword: false, endedReason: reason }),
  setStatus: (status) => set({ status }),
  dismissEndedReason: () => set({ endedReason: null }),
}));
