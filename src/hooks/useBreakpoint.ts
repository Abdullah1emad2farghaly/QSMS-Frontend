import { mediaMinWidth, type BreakpointName } from '@/app/config';
import { useMediaQuery } from './useMediaQuery';

/** Largest active mobile-first breakpoint, or `base` below `sm`. */
export function useBreakpoint(): BreakpointName | 'base' {
  const sm = useMediaQuery(mediaMinWidth('sm'));
  const md = useMediaQuery(mediaMinWidth('md'));
  const lg = useMediaQuery(mediaMinWidth('lg'));
  const xl = useMediaQuery(mediaMinWidth('xl'));
  const xxl = useMediaQuery(mediaMinWidth('2xl'));
  if (xxl) return '2xl';
  if (xl) return 'xl';
  if (lg) return 'lg';
  if (md) return 'md';
  if (sm) return 'sm';
  return 'base';
}
