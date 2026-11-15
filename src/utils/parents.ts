import type { ParentAddress } from '@/types';

/** Address parts that exist, in order: governorate → center/city → village. */
export const addressParts = (address: Pick<ParentAddress, 'governorateName' | 'centerName' | 'villageName'>): string[] =>
  [address.governorateName, address.centerName, address.villageName].filter((part): part is string => Boolean(part && part.trim()));

/** Same parts in the request format "Governorate / Center or City / Village" (used to prefill the edit form). */
export const addressToRequestString = (address: ParentAddress): string => addressParts(address).join(' / ');

/** First letter of the name for the monogram (works for Arabic and Latin). */
export const monogram = (name: string): string => Array.from(name.trim())[0] ?? '·';
