import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GpsLocationCard } from '@/components/registration/GpsLocationCard';
import { useGeolocationCapture } from '@/hooks/useGeolocationCapture';
import type { GpsReading } from '@/types';
import i18n from '@/translation/i18n';

function Harness({ onReading }: { onReading: (r: GpsReading | null) => void }) {
  const { state, capture } = useGeolocationCapture(onReading);
  return <GpsLocationCard state={state} onCapture={capture} />;
}

const mockGeolocation = (impl: (ok: PositionCallback, err: PositionErrorCallback, opts?: PositionOptions) => void) => {
  const getCurrentPosition = vi.fn(impl);
  Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition } });
  return getCurrentPosition;
};
const position = (accuracy: number) => ({ coords: { latitude: 30.0444, longitude: 31.2357, accuracy } }) as GeolocationPosition;

beforeEach(async () => {
  await act(() => i18n.changeLanguage('en'));
});
afterEach(() => {
  Object.defineProperty(navigator, 'geolocation', { configurable: true, value: undefined });
});

describe('GPS capture', () => {
  it('never requests location on its own (explicit user action only)', () => {
    const spy = mockGeolocation(() => undefined);
    render(<Harness onReading={() => undefined} />);
    expect(spy).not.toHaveBeenCalled();
    expect(screen.getByText(/browser will ask for permission/)).toBeInTheDocument();
  });

  it('accepts a reading within 20 m, shows the actual accuracy and uses high-accuracy options', () => {
    const spy = mockGeolocation((ok) => ok(position(12)));
    const onReading = vi.fn();
    render(<Harness onReading={onReading} />);
    fireEvent.click(screen.getByRole('button', { name: 'Capture my location' }));
    expect(spy.mock.calls[0]![2]).toEqual({ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
    expect(screen.getByText('Location captured')).toBeInTheDocument();
    expect(screen.getByText('Accuracy: 12 meters')).toBeInTheDocument();
    expect(onReading).toHaveBeenLastCalledWith({ latitude: 30.0444, longitude: 31.2357, accuracyMeters: 12 });
  });

  it('rejects accuracy worse than 20 m and offers retry', () => {
    mockGeolocation((ok) => ok(position(35)));
    const onReading = vi.fn();
    render(<Harness onReading={onReading} />);
    fireEvent.click(screen.getByRole('button', { name: 'Capture my location' }));
    expect(screen.getByText('The location is not accurate enough')).toBeInTheDocument();
    expect(screen.getByText(/Accuracy: 35 meters/)).toBeInTheDocument();
    expect(onReading).toHaveBeenLastCalledWith(null);
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it.each([
    [1, /permission was denied/],
    [2, /could not be determined/],
    [3, /took too long/],
  ])('localized error for geolocation error code %i', (code, text) => {
    mockGeolocation((_ok, err) => err({ code, message: '' } as GeolocationPositionError));
    const onReading = vi.fn();
    render(<Harness onReading={onReading} />);
    fireEvent.click(screen.getByRole('button', { name: 'Capture my location' }));
    expect(screen.getByText(text)).toBeInTheDocument();
    expect(onReading).toHaveBeenLastCalledWith(null);
  });

  it('reports an unsupported browser without inventing coordinates', () => {
    const onReading = vi.fn();
    render(<Harness onReading={onReading} />);
    fireEvent.click(screen.getByRole('button', { name: 'Capture my location' }));
    expect(screen.getByText(/does not support location/)).toBeInTheDocument();
    expect(onReading).toHaveBeenLastCalledWith(null);
  });
});
