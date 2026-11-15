import type { IsoDateTime, PaginationQuery, SortQuery, Uuid } from './api';

/**
 * RESPONSE shape of a parent's address (an object). The create/update REQUEST sends the address as a
 * plain string instead — see `RegisterParentRequest.address` / `UpdateParentAddressRequest.address`.
 */
export interface ParentAddress {
  governorateId: Uuid;
  governorateName: string;
  /** Center or city; null when the address stops at the governorate. */
  centerName: string | null;
  villageName: string | null;
  /** When this address became the current one. */
  since: IsoDateTime;
}

/** A parent record. `id` is the Parent record id (NOT `userId`); it is the id every parents/students route takes. */
export interface Parent {
  id: Uuid;
  userId: Uuid;
  organizationId: Uuid;
  name: string;
  /** Normalized by the server, e.g. `+201001234567`. */
  phone: string;
  address: ParentAddress;
  schoolIds: Uuid[];
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

/** The Parent-to-School relationship. `isActive: false` + `unlinkedAt` once it was ended. */
export interface ParentSchoolLink {
  id: Uuid;
  parentId: Uuid;
  schoolId: Uuid;
  linkedAt: IsoDateTime;
  linkedBy: Uuid;
  unlinkedAt: IsoDateTime | null;
  unlinkedBy: Uuid | null;
  isActive: boolean;
}

/** Query of `GET /parents/schools/{schoolId}`. Only `createdAt` can be sorted (`-createdAt` = newest first). */
export type ParentsListQuery = PaginationQuery & SortQuery;

/**
 * REQUEST of `POST /parents`. `address` is a STRING: `Governorate / Center or City / Village`.
 * (The API also accepts `addressFields`; this frontend intentionally never sends it.)
 */
export interface RegisterParentRequest {
  schoolId: Uuid;
  /** maxLength 200; exactly three name parts. */
  name: string;
  /** maxLength 40. */
  phone: string;
  /** maxLength 600. */
  address: string;
}

/** `data` of `POST /parents` (201). Never contains a password. */
export interface RegisterParentData {
  parent: Parent;
  link: ParentSchoolLink;
  /** True when a new login account was created for this phone. */
  accountCreated: boolean;
}

/** REQUEST of `PATCH /parents/{id}`: the address as a STRING (never together with `addressFields`). */
export interface UpdateParentAddressRequest {
  /** maxLength 600. */
  address: string;
}
