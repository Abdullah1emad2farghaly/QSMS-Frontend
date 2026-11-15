import { QueryClientProvider } from '@tanstack/react-query';
import { Suspense, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
import { usePreferencesSync } from '@/hooks/usePreferencesSync';
import { queryClient } from '@/services/query';
import i18n from '@/translation/i18n';

function PreferencesSync() {
  usePreferencesSync();
  return null;
}

/** Provider order (outer → inner): ErrorBoundary → i18n → TanStack Query → Suspense. Zustand needs no provider. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <I18nextProvider i18n={i18n}>
        <PreferencesSync />
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<LoadingScreen />}>{children}</Suspense>
        </QueryClientProvider>
      </I18nextProvider>
    </ErrorBoundary>
  );
}
