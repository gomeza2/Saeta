import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MapPreview } from './MapPreview';
import * as L from 'leaflet';

const leafletMocks = vi.hoisted(() => {
  const layer = {
    addTo: vi.fn().mockReturnThis(),
    bindPopup: vi.fn().mockReturnThis(),
    clearLayers: vi.fn(),
    on: vi.fn().mockReturnThis(),
    off: vi.fn(),
    redraw: vi.fn(),
    openPopup: vi.fn(),
    getElement: vi.fn(() => document.createElement('span')),
  };
  const map = {
    setView: vi.fn().mockReturnThis(),
    invalidateSize: vi.fn(),
    remove: vi.fn(),
    removeLayer: vi.fn(),
    fitBounds: vi.fn(),
    getZoom: vi.fn(() => 13),
    on: vi.fn(),
    off: vi.fn(),
  };
  return { layer, map };
});

vi.mock('leaflet', () => ({
  map: vi.fn(() => leafletMocks.map),
  control: { zoom: vi.fn(() => leafletMocks.layer) },
  latLngBounds: vi.fn(() => ({ extend: vi.fn(), isValid: () => true })),
  tileLayer: vi.fn(() => leafletMocks.layer),
  layerGroup: vi.fn(() => leafletMocks.layer),
  latLng: vi.fn((lat: number, lng: number) => ({ lat, lng })),
  polyline: vi.fn(() => leafletMocks.layer),
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

it('renders only supplied coordinates and verified shapes, escaping popup text and removing old layers', () => {
  const { rerender } = render(
    <MapPreview
      importedStops={[
        { id: 'synthetic', name: '<img src=x onerror=alert(1)>', coordinates: [-24, -65] },
        { id: 'bad', name: 'No point', coordinates: null },
      ]}
      importedShapes={[
        {
          id: 'shape',
          points: [
            [-24, -65],
            [-25, -66],
          ],
        },
      ]}
    />,
  );
  expect(L.circleMarker).toHaveBeenCalledTimes(1);
  expect(L.polyline).toHaveBeenCalledTimes(1);
  const popup = leafletMocks.layer.bindPopup.mock.calls[0]?.[0] as HTMLElement;
  expect(popup.textContent).toContain('<img src=x onerror=alert(1)>');
  expect(popup.querySelector('img')).toBeNull();
  rerender(<MapPreview importedStops={[]} importedShapes={[]} />);
  expect(leafletMocks.layer.clearLayers).toHaveBeenCalled();
  expect(leafletMocks.map.removeLayer).toHaveBeenCalled();
});

describe('imported map controls', () => {
  beforeEach(() => vi.clearAllMocks());
  it('supports stop detail selection by keyboard and layer toggles', () => {
    const { getByRole, getByLabelText } = render(
      <MapPreview
        importedStops={[{ id: 'keyboard-stop', name: 'Synthetic stop', coordinates: [-24, -65] }]}
      />,
    );
    const element = leafletMocks.layer.getElement.mock.results.at(-1)!.value as HTMLElement;
    expect(element).toHaveAttribute('tabindex', '0');
    expect(element).toHaveAttribute('role', 'button');
    fireEvent.keyDown(element, { key: 'Enter' });
    expect(getByRole('complementary', { name: 'Parada seleccionada' })).toHaveTextContent(
      'keyboard-stop',
    );
    fireEvent.click(getByRole('button', { name: 'Cerrar parada' }));
    const initialCount = vi.mocked(L.circleMarker).mock.calls.length;
    fireEvent.click(getByLabelText('Paradas'));
    expect(vi.mocked(L.circleMarker).mock.calls.length).toBe(initialCount);
    expect(getByLabelText('Paradas')).not.toBeChecked();
  });
  it('explains tile failures and retries without removing local data', () => {
    const { getByRole } = render(<MapPreview />);
    const onError = leafletMocks.layer.on.mock.calls.find(
      (call) => call[0] === 'tileerror',
    )?.[1] as () => void;
    act(() => onError());
    expect(getByRole('status')).toHaveTextContent(/No se pudieron cargar todas las teselas/);
    fireEvent.click(getByRole('button', { name: 'Reintentar cartografía' }));
    expect(leafletMocks.layer.redraw).toHaveBeenCalledOnce();
  });
});
