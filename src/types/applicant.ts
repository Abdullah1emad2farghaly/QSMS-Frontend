import type { Uuid } from './api';

/** Applicant of the public organization / school forms. */
export interface ApplicantInput {
  /** maxLength 200 */
  name: string;
  /** maxLength 40; normalized by the server. */
  phone: string;
  /**
   * 4–12 characters (minLength 4, maxLength 12). Required when the caller is NOT logged in;
   * ignored when a valid access token is sent. Never returned or logged.
   */
  password?: string;
}

export interface ApplicantResult {
  userId: Uuid;
  /** True when a new account was created for the applicant. Never a password or token. */
  accountCreated: boolean;
}
