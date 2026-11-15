import { useCallback, useEffect, useRef, useState } from 'react';

/** Step index + focus management for multi-step forms: the new step's heading receives focus. */
export function useWizard(total: number) {
  const [index, setIndex] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    headingRef.current?.focus();
    headingRef.current?.scrollIntoView?.({ block: 'start' });
  }, [index]);

  return {
    index,
    headingRef,
    next: useCallback(() => setIndex((i) => Math.min(i + 1, total - 1)), [total]),
    back: useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []),
    goTo: setIndex,
  };
}
