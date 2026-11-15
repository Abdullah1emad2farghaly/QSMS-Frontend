import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store';
import { LogoutButton } from './LogoutButton';

/** Signed-in user's phone (the only profile data the API returns) + sign-out. */
export function AccountActions({ className }: { className?: string }) {
  const { t } = useTranslation('auth');
  const phone = useAuthStore((s) => s.user?.phone);
  return (
    <div className={className}>
      {phone && (
        <span className="muted account-phone" title={t('account.signedInAs')}>
          <bdi dir="ltr">{phone}</bdi>
        </span>
      )}
      <LogoutButton />
    </div>
  );
}
