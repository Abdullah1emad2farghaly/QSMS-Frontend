import { useCallback, useEffect, useRef, useState } from 'react';
import { GPS_MAX_ACCURACY_METERS, GPS_TIMEOUT_MS } from '@/app/config';
import type { GpsReading } from '@/types';

export type GpsState =
  | { status: 'idle' }
  | { status: 'requesting' }
  | { status: 'success'; reading: GpsReading }
  | { status: 'inaccurate'; reading: GpsReading }
  | { status: 'denied' }
  | { status: 'unavailable' }
  | { status: 'timeout' }
  | { status: 'unsupported' };

/**
 * Browser Geolocation, requested ONLY when `capture()` is called (an explicit user action).
 * A reading worse than `GPS_MAX_ACCURACY_METERS` is rejected. No fake or manual coordinates.
 */
export function useGeolocationCapture(onReading?: (reading: GpsReading | null) => void) {
  const [state, setState] = useState<GpsState>({ status: 'idle' });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const capture = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState({ status: 'unsupported' });
      onReadingRef.current?.(null);
      return;
    }
    setState({ status: 'requesting' });
    onReadingRef.current?.(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!mounted.current) return;
        const reading: GpsReading = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
        };
        if (reading.accuracyMeters > GPS_MAX_ACCURACY_METERS) {
          setState({ status: 'inaccurate', reading });
          onReadingRef.current?.(null);
        } else {
          setState({ status: 'success', reading });
          onReadingRef.current?.(reading);
        }
      },
      (error) => {
        if (!mounted.current) return;
        onReadingRef.current?.(null);
        if (error.code === 1) setState({ status: 'denied' });
        else if (error.code === 3) setState({ status: 'timeout' });
        else setState({ status: 'unavailable' });
      },
      { enableHighAccuracy: true, timeout: GPS_TIMEOUT_MS, maximumAge: 0 },
    );
  }, []);

  return { state, capture };
}
