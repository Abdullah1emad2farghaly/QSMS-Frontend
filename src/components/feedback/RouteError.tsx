import { useEffect } from 'react';
import { useRouteError } from 'react-router-dom';
import { logger } from '@/utils/logger';
import { ErrorFallback } from './ErrorFallback';

export function RouteError() {
  const error = useRouteError();
  useEffect(() => logger.error('Route error', error), [error]);
  return <ErrorFallback />;
}
