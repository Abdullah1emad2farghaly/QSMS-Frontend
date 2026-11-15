import type { ApplicantInput, ApplicantResult } from './applicant';
import type { IsoDateTime, Uuid } from './api';

export interface GpsReading {
  /** Degrees, -90 to 90 (range enforced by the service: INVALID_GPS_COORDINATES). */
  latitude: number;
  /** Degrees, -180 to 180 (range enforced by the service). */
  longitude: number;
  /** Reported accuracy; must be 20 meters or better (GPS_ACCURACY_EXCEEDS_LIMIT otherwise). */
  accuracyMeters: number;
}

export interface SubmitSchoolRequest {
  applicant: ApplicantInput;
  organizationId: Uuid;
  school: {
    /** maxLength 200 */
    name: string;
    governorateId: Uuid;
    /** Optional; when sent it must equal the organization's country (SCHOOL_COUNTRY_MISMATCH). */
    countryId?: Uuid | null;
    /** maxLength 200; optional free text (center or city). */
    centerName?: string | null;
    /** maxLength 200; optional free text. */
    villageName?: string | null;
    gps: GpsReading;
  };
}

export type SchoolStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'REJECTED';

export interface School {
  id: Uuid;
  /** Gap-free code such as `SC-000001`. */
  code: string;
  name: string;
  status: SchoolStatus;
  organizationId: Uuid;
  /** Always the organization's country. */
  countryId: Uuid;
  governorateId: Uuid;
  centerName: string | null;
  villageName: string | null;
  gps: GpsReading;
  /** The user who created the school or submitted the request. */
  createdBy: Uuid;
  /** The applicant of a public submission; null when an organization manager created the school. */
  applicantUserId: Uuid | null;
  applicantName: string | null;
  decidedBy: Uuid | null;
  decidedAt: IsoDateTime | null;
  rejectionReason: string | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

/** `data` of `POST /schools/submissions` (201). */
export interface SubmitSchoolData {
  school: School;
  applicant: ApplicantResult;
}
