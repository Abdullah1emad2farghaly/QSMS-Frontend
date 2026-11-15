import type { AuthUser, UserRole } from '@/types';
import { STORAGE_KEYS } from '@/app/config';

/**
 * Persisted part of the session. Strategy (see README "Authentication architecture"):
 *  - the ACCESS token lives in memory only (never written anywhere);
 *  - the REFRESH token + the non-sensitive session metadata live in localStorage so a reload or a
 *    new tab can restore the session. localStorage is readable by any script on the page (XSS) —
 *    it is NOT equivalent to an HttpOnly cookie; the backend returns tokens in JSON, so that is
 *    the practical option. Nothing else (passwords, OTPs, reset tokens) is ever persisted.
 */
export interface StoredSession {
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: AuthUser;
  roles: UserRole[];
  mustChangePassword: boolean;
  /**
   * Mirror of THIS session's active role, used only when a refresh answer omits the field (so a reload
   * does not lose it). Any value the backend sends wins; it is never a user-level setting.
   */
  activeRole?: UserRole | null;
  /** Mirror of the `schoolId` the backend last reported for this session (same rule as `activeRole`). */
  schoolId?: string | null;
}

const isStoredSession = (value: unknown): value is StoredSession => {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  const user = v.user as Record<string, unknown> | undefined;
  return (
    typeof v.refreshToken === 'string' &&
    typeof v.refreshTokenExpiresAt === 'string' &&
    typeof user?.id === 'string' &&
    typeof user?.phone === 'string' &&
    Array.isArray(v.roles) &&
    typeof v.mustChangePassword === 'boolean'
  );
};

export function readStoredSession(): StoredSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.session);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredSession(parsed)) return null;
    if (Date.parse(parsed.refreshTokenExpiresAt) <= Date.now()) {
      clearStoredSession();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredSession(session: StoredSession): void {
  try {
    window.localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
  } catch {
    // Storage unavailable (private mode / quota): the session simply will not survive a reload.
  }
}

export function clearStoredSession(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEYS.session);
  } catch {
    /* ignore */
  }
}
