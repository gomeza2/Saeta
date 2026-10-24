import { fireEvent, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MapPreview } from './MapPreview';

const leafletMocks = vi.hoisted(() => {
  const layer = {
    addTo: vi.fn().mockReturnThis(),
    bindPopup: vi.fn().mockReturnThis(),
    clearLayers: vi.fn(),
  };
  const map = {
    setView: vi.fn().mockReturnThis(),
    invalidateSize: vi.fn(),
    remove: vi.fn(),
  };
  return { layer, map };
});

vi.mock('leaflet', () => ({
  map: vi.fn(() => leafletMocks.map),
  tileLayer: vi.fn(() => leafletMocks.layer),
  layerGroup: vi.fn(() => leafletMocks.layer),
  latLng: vi.fn((lat: number, lng: number) => ({ lat, lng })),
  circle: vi.fn(() => leafletMocks.layer),
  circleMarker: vi.fn(() => leafletMocks.layer),
}));

describe('MapPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    leafletMocks.map.setView.mockReturnThis();
    leafletMocks.layer.addTo.mockReturnThis();
    leafletMocks.layer.bindPopup.mockReturnThis();
  });

  it('renders an interactive map container and clearly states the transport-data limit', () => {
    const { getByRole, getByText } = render(<MapPreview />);
    expect(
      getByRole('application', { name: 'Mapa interactivo de calles de Salta' }),
    ).toBeInTheDocument();
    expect(getByRole('button', { name: 'Usar mi ubicación' })).toBeInTheDocument();
    expect(
      getByText(/no es un mapa de SAETA ni representa ubicaciones reales de colectivos/i),
    ).toBeInTheDocument();
  });

  it('requests device location only after the user presses the location button', async () => {
    const getCurrentPosition = vi.fn(() => undefined);
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition },
    });

    const { getByRole } = render(<MapPreview />);
    expect(getCurrentPosition).not.toHaveBeenCalled();
    fireEvent.click(getByRole('button', { name: 'Usar mi ubicación' }));
    await waitFor(() => expect(getCurrentPosition).toHaveBeenCalledOnce());
    expect(getByRole('status')).toHaveTextContent(/el navegador puede pedirte permiso/i);
  });

  it('explains denied permission without blocking the map', async () => {
    const getCurrentPosition = vi.fn((_success: PositionCallback, error: PositionErrorCallback) => {
      error({
        code: 1,
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError);
    });
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition },
    });

    const { getByRole } = render(<MapPreview />);
    fireEvent.click(getByRole('button', { name: 'Usar mi ubicación' }));
    await waitFor(() => expect(getByRole('alert')).toHaveTextContent(/no se concedió permiso/i));
    expect(
      getByRole('application', { name: 'Mapa interactivo de calles de Salta' }),
    ).toBeInTheDocument();
  });
});
