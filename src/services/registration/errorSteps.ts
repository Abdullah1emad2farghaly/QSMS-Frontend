/**
 * Which wizard step a documented backend error belongs to, so the user lands on the step that
 * needs correcting. Indexes are per page (see each page's step list).
 */
const APPLICANT = [
  'INVALID_APPLICANT_NAME',
  'INVALID_PHONE_NUMBER',
  'INVALID_PASSWORD',
  'USER_PHONE_ALREADY_EXISTS',
  'SCHOOL_APPLICANT_IDENTITY_MISMATCH',
  'SCHOOL_MANAGER_NOT_ELIGIBLE',
];
const fromList = (codes: string[], step: number): Record<string, number> =>
  Object.fromEntries(codes.map((code) => [code, step]));

/** Organization registration: 0 applicant · 1 organization · 2 review */
export const ORGANIZATION_ERROR_STEP: Record<string, number> = {
  ...fromList(APPLICANT, 0),
  ...fromList(
    [
      'INVALID_ORGANIZATION_NAME',
      'ORGANIZATION_NAME_ALREADY_EXISTS',
      'ORGANIZATION_COUNTRY_INVALID',
      'INVALID_PARENT_ADDRESS',
      'ORGANIZATION_ADDRESS_COUNTRY_MISMATCH',
      'INVALID_GEOGRAPHY_HIERARCHY',
      'GEOGRAPHY_NODE_INACTIVE',
      'GEOGRAPHY_NODE_NOT_FOUND',
    ],
    1,
  ),
};

/** School submission: 0 applicant · 1 organization · 2 school details · 3 location · 4 review */
export const SCHOOL_ERROR_STEP: Record<string, number> = {
  ...fromList(APPLICANT, 0),
  ...fromList(['ORGANIZATION_NOT_FOUND', 'SCHOOL_ORGANIZATION_INACTIVE'], 1),
  ...fromList(
    [
      'INVALID_SCHOOL_NAME',
      'SCHOOL_NAME_ALREADY_EXISTS',
      'SCHOOL_COUNTRY_MISMATCH',
      'PARENT_ADDRESS_COUNTRY_MISMATCH',
      'INVALID_GEOGRAPHY_HIERARCHY',
      'GEOGRAPHY_NODE_INACTIVE',
      'GEOGRAPHY_NODE_NOT_FOUND',
    ],
    2,
  ),
  ...fromList(['INVALID_GPS_COORDINATES', 'GPS_ACCURACY_EXCEEDS_LIMIT'], 3),
};

/** Step for a server field path (`applicant.phone`, `school.gps.latitude`, …), or undefined. */
export function stepForField(field: string, prefixes: [string, number][]): number | undefined {
  return prefixes.find(([prefix]) => field === prefix || field.startsWith(`${prefix}.`))?.[1];
}
