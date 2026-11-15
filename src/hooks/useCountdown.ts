import { useEffect, useState } from 'react';

/**
 * Seconds left until `deadline` (epoch ms); 0 when null or past. The value is derived during
 * render (correct on the very first render after the deadline is set); a 1-second tick re-renders.
 */
export function useCountdownTo(deadline: number | null): number {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!deadline) return;
    const timer = window.setInterval(() => {
      setTick((t) => t + 1);
      if (Date.now() >= deadline) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [deadline]);
  return deadline ? Math.max(0, Math.ceil((deadline - Date.now()) / 1000)) : 0;
}
