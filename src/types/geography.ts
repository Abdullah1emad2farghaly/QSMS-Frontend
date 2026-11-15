import type { Uuid } from './api';

/** One selectable option of the public geography lookups. */
export interface GeographyOption {
  /** The id to submit in the registration request. */
  id: Uuid;
  /** Display name exactly as stored (Arabic); the same value for `ar` and `en`. */
  name: string;
}

/**
 * Query of `GET /geography/governorates`: EXACTLY ONE of `countryId` / `organizationId`
 * must be sent (the contract makes them mutually exclusive).
 */
export type GovernoratesQuery =
  | { countryId: Uuid; organizationId?: never }
  | { organizationId: Uuid; countryId?: never };
