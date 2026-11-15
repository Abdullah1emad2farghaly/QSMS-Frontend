import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/app/routes/paths';
import { Button } from '@/components/ui/Button';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useLogout } from '@/hooks/useSessions';

/** "Sign out" with a confirmation dialog. Signs out THIS device only. */
export function LogoutButton({ variant = 'secondary', block = false }: { variant?: 'secondary' | 'ghost'; block?: boolean }) {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const logout = useLogout();

  const confirm = () =>
    logout.mutate(undefined, {
      onSuccess: () => {
        setOpen(false);
        navigate(ROUTES.login, { replace: true });
      },
    });

  return (
    <>
      <Button variant={variant} block={block} onClick={() => setOpen(true)}>
        {t('logout.button')}
      </Button>
      <ConfirmationDialog
        open={open}
        title={t('logout.confirmTitle')}
        description={t('logout.confirmBody')}
        confirmLabel={t('logout.confirm')}
        loading={logout.isPending}
        onConfirm={confirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
