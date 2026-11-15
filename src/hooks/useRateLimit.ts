import { useState } from 'react';
import { isApiError } from '@/services/api';
import { useCountdownTo } from './useCountdown';

/**
 * Honors HTTP 429 `Retry-After`: call `track(error)` with every failure; `secondsLeft` counts down
 * while the server asked the client to wait, so submit buttons can stay disabled.
 */
export function useRateLimit() {
  const [deadline, setDeadline] = useState<number | null>(null);
  const secondsLeft = useCountdownTo(deadline);

  return {
    secondsLeft,
    track(error: unknown) {
      if (isApiError(error) && error.status === 429) {
        setDeadline(Date.now() + (error.retryAfterSeconds ?? 60) * 1000);
      }
    },
    reset: () => setDeadline(null),
  };
}
