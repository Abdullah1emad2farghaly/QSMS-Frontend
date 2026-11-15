import type { IsoDateTime, Uuid } from './api';
import type { UserRole } from './roles';

export interface LoginRequest {
  /** maxLength 40; any accepted format. */
  phone: string;
  /** maxLength 128 */
  password: string;
}

export interface RefreshTokenRequest {
  /** maxLength 200 */
  refreshToken: string;
}

export interface ChangePasswordRequest {
  /** maxLength 128 */
  currentPassword: string;
  /** maxLength 128; policy: 4–12 characters, must differ from the current password. */
  newPassword: string;
}

export interface PasswordRecoveryRequestBody {
  /** maxLength 40 */
  phone: string;
}

export interface PasswordRecoveryVerifyRequest {
  /** maxLength 40 */
  phone: string;
  /** maxLength 32 */
  otp: string;
}

export interface PasswordRecoveryResetRequest {
  /** maxLength 200 */
  resetToken: string;
  /** maxLength 128; policy: 4–12 characters. */
  newPassword: string;
}

export interface AuthUser {
  id: Uuid;
  /** The normalized phone number (the login identifier). */
  phone: string;
}

/** `data` of login and refresh answers (both `Cache-Control: no-store`). */
export interface AuthSessionData {
  tokenType: 'Bearer';
  /** Short-lived JWT. Send as `Authorization: Bearer <accessToken>`. */
  accessToken: string;
  accessTokenExpiresAt: IsoDateTime;
  /** Opaque and single-use: every refresh rotates it. */
  refreshToken: string;
  refreshTokenExpiresAt: IsoDateTime;
  user: AuthUser;
  /**
   * True while the account still has an initial password. The backend then answers every
   * protected request except change-password and the two logouts with 403 PASSWORD_CHANGE_REQUIRED.
   */
  mustChangePassword: boolean;
  roles: UserRole[];
  /**
   * The role active in THIS session (it belongs to the session, not to the account).
   * UNVERIFIED: not part of the contract that was available in the repo; the active-role task
   * names it `activeRole` (null = none chosen yet). Optional so older answers still type-check.
   */
  activeRole?: UserRole | null;
}

/** UNVERIFIED request of `POST /auth/switch-role` (shape taken from the task description). */
export interface SwitchRoleRequest {
  role: UserRole;
}

/**
 * UNVERIFIED `data` of `POST /auth/switch-role`. The task does not say what it returns: the
 * client reads `activeRole` when present, otherwise adopts the requested role on HTTP 2xx, and it
 * tolerates a full session answer (rotated tokens) without requiring one.
 */
export type SwitchRoleData = { activeRole?: UserRole | null } & Partial<AuthSessionData>;

/** `data` of `POST /auth/password-recovery/request`. */
export interface PasswordRecoveryRequestData {
  /** Minimum 1. How long the OTP stays valid. */
  expiresInSeconds: number;
}

/** `data` of `POST /auth/password-recovery/verify`. */
export interface PasswordRecoveryVerifyData {
  /** Single-use token for the reset step. */
  resetToken: string;
  resetTokenExpiresAt: IsoDateTime;
}

export interface ActiveSession {
  /** The session id (use it to revoke the session). NOT a token. */
  id: Uuid;
  /** Coarse description such as "Chrome on Android" (maxLength 100); null for sessions created before this feature. */
  deviceLabel: string | null;
  /** Login time. */
  createdAt: IsoDateTime;
  /** When the session's tokens were last issued (login or refresh). */
  lastActiveAt: IsoDateTime;
  /** Session end if not refreshed: 30 days after the last refresh. */
  expiresAt: IsoDateTime;
  /** True for the session that made this request. */
  isCurrent: boolean;
}

/** `data` of `GET /auth/sessions`. */
export interface ActiveSessionsData {
  /** The limit of active sessions per account (3, every role). */
  maxActiveSessions: number;
  /** Oldest first. */
  items: ActiveSession[];
}

/** `error.details` of 422 SESSION_LIMIT_REACHED. */
export interface SessionLimitDetails {
  maxActiveSessions: number;
}
