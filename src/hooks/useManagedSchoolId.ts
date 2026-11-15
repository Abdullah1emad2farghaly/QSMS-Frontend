import { useAuthStore } from '@/store/authStore';

/** `data.schoolId` exactly as the login / refresh / switch-role answers delivered it. `null` → the Parents module sends no requests. */
export function useManagedSchoolId(): string | null {
  return useAuthStore((s) => s.schoolId);
}
