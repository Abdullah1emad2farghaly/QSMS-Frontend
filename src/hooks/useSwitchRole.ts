import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ROLE_ROUTES } from '@/app/routes/paths';
import { switchRole } from '@/services/auth/authActions';
import type { LandingRole } from '@/types';

/**
 * Activates a role for the current session and then opens that role's landing page.
 * `switchRole` skips the request when the role is already active.
 */
export function useSwitchRole() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (role: LandingRole) => switchRole(role),
    onSuccess: (confirmed) => navigate(ROLE_ROUTES[confirmed]),
  });
}
