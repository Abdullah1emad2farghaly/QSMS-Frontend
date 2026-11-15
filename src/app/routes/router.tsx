import { createBrowserRouter } from 'react-router-dom';
import { PublicLayout } from '@/app/layouts/PublicLayout';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
import { RouteError } from '@/components/feedback/RouteError';
import { notFoundRoute, protectedRoutes, publicRoutes } from './routes';

export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    hydrateFallbackElement: <LoadingScreen />,
    children: [
      // Public pages share the public layout; guarded groups bring their own app shell.
      { element: <PublicLayout />, children: [...publicRoutes, notFoundRoute] },
      ...protectedRoutes,
    ],
  },
]);
