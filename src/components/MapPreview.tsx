import { useEffect, useId, useRef, useState } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapPreview.css';
import type { ImportedStop, ImportedShape } from '../data/gtfsPreview';
import { groupMapStops } from '../data/mapGroups';
import { appConfig } from '../config/env';
import { StateNotice } from './StateNotice';

type LocationStatus = 'idle' | 'requesting' | 'located' | 'error';

const saltaCenter: L.LatLngExpression = [-24.7821, -65.4232];

function locationErrorMessage(error: GeolocationPositionError): string {
  if (error.code === error.PERMISSION_DENIED) {
    return 'No se concedió permiso para la ubicación. Podés seguir usando el mapa sin compartirla.';
  }
  if (error.code === error.POSITION_UNAVAILABLE) {
    return 'El dispositivo no pudo determinar una ubicación. Comprobá la configuración de ubicación e intentá de nuevo.';
  }
  return 'La solicitud de ubicación tardó demasiado. Podés volver a intentarlo cuando tengas mejor señal.';
}

const emptyStops: ImportedStop[] = [];
const emptyShapes: ImportedShape[] = [];

export function MapPreview({
  importedStops = emptyStops,
  importedShapes = emptyShapes,
}: {
  importedStops?: ImportedStop[];
  importedShapes?: ImportedShape[];
}) {
  const titleId = useId();
  const hasImport = importedStops !== emptyStops || importedShapes !== emptyShapes;
  const [showStops, setShowStops] = useState(true);
  const [showShapes, setShowShapes] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const selectedStop = importedStops.find((s) => s.id === selectedId);
  const [tileStatus, setTileStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const locationLayerRef = useRef<L.LayerGroup | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [locationMessage, setLocationMessage] = useState('');

  useEffect(() => {
    const element = mapElementRef.current;
    if (!element) return undefined;

    const map = L.map(element, { zoomControl: false, scrollWheelZoom: false }).setView(
      saltaCenter,
      13,
    );
    L.control.zoom({ zoomInTitle: 'Acercar', zoomOutTitle: 'Alejar' }).addTo(map);
    const locationLayer = L.layerGroup().addTo(map);

    const tiles = L.tileLayer(appConfig.mapTileUrl, {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>',
    });
    let tileFailed = false;
    tiles.on('loading', () => {
      tileFailed = false;
      setTileStatus('loading');
    });
    tiles.on('tileerror', () => {
      tileFailed = true;
      setTileStatus('error');
    });
    tiles.on('load', () => setTileStatus(tileFailed ? 'error' : 'ready'));
    tiles.addTo(map);
    tileLayerRef.current = tiles;

    mapRef.current = map;
    locationLayerRef.current = locationLayer;

    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => map.invalidateSize());
    resizeObserver?.observe(element);

    return () => {
      resizeObserver?.disconnect();
      tiles.off();
      tileLayerRef.current = null;
      map.remove();
      mapRef.current = null;
      locationLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const layer = L.layerGroup().addTo(map);
    const stopLayer = L.layerGroup().addTo(layer);
    const bounds = L.latLngBounds([]);
    const stops = showStops ? importedStops.filter((s) => s.coordinates).slice(0, 2000) : [];
    for (const stop of stops) bounds.extend(stop.coordinates!);
    let remainingPoints = 100_000;
    if (showShapes)
      for (const shape of importedShapes) {
        if (shape.points.length > remainingPoints) continue;
        remainingPoints -= shape.points.length;
        L.polyline(shape.points, { color: '#275f91', weight: 3 }).addTo(layer);
        for (const point of shape.points) bounds.extend(point);
      }
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24], maxZoom: 16, animate: false });
    function drawStops() {
      stopLayer.clearLayers();
      for (const members of groupMapStops(stops, map!.getZoom())) {
        const stop = members[0]!;
        const grouped = members.length > 1;
        const label = document.createElement('span');
        label.textContent = grouped
          ? `${members.length} paradas importadas agrupadas. Acercá o usá los filtros para separarlas.`
          : `${stop.name || 'Sin nombre'} · ${stop.id} · Importación local`;
        const marker = L.circleMarker(stop.coordinates!, {
          radius: grouped ? 12 : 6,
          color: '#27543d',
          fillOpacity: 0.8,
        })
          .bindPopup(label)
          .addTo(stopLayer);
        function select() {
          if (grouped)
            map!.setView(stop.coordinates!, Math.min(map!.getZoom() + 2, 19), { animate: false });
          else {
            setSelectedId(stop.id);
            marker.openPopup();
          }
        }
        marker.on('click', select);
        const element = marker.getElement();
        if (element) {
          element.setAttribute('tabindex', '0');
          element.setAttribute('role', 'button');
          element.setAttribute('aria-label', label.textContent);
          element.addEventListener('keydown', (event) => {
            if (event instanceof KeyboardEvent && (event.key === 'Enter' || event.key === ' ')) {
              event.preventDefault();
              select();
            }
          });
        }
      }
    }
    drawStops();
    map.on('zoomend', drawStops);
    return () => {
      map.off('zoomend', drawStops);
      layer.clearLayers();
      map.removeLayer(layer);
    };
  }, [importedStops, importedShapes, showStops, showShapes]);

  function handleLocate() {
    const map = mapRef.current;
    const locationLayer = locationLayerRef.current;
    if (!map || !locationLayer) return;

    if (!navigator.geolocation) {
      setLocationStatus('error');
      setLocationMessage(
        'Este navegador no ofrece geolocalización. Podés seguir explorando el mapa sin ella.',
      );
      return;
    }

    setLocationStatus('requesting');
    setLocationMessage('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (mapRef.current !== map) return;
        const { latitude, longitude, accuracy } = position.coords;
        const point = L.latLng(latitude, longitude);
        locationLayer.clearLayers();
        map.setView(point, 16);

        L.circle(point, {
          radius: accuracy,
          color: '#4678a8',
          weight: 1,
          fillColor: '#77a8d6',
          fillOpacity: 0.16,
        }).addTo(locationLayer);

        L.circleMarker(point, {
          radius: 7,
          color: '#ffffff',
          weight: 3,
          fillColor: '#275f91',
          fillOpacity: 1,
        })
          .bindPopup('Tu ubicación actual, según el dispositivo')
          .addTo(locationLayer);

        setLocationStatus('located');
        setLocationMessage(
          'Ubicación mostrada en este dispositivo. SAETA MAPS no la guarda ni la envía a un servicio de transporte.',
        );
      },
      (error) => {
        if (mapRef.current !== map) return;
        setLocationStatus('error');
        setLocationMessage(locationErrorMessage(error));
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 12_000 },
    );
  }

  return (
    <section className="map-preview" aria-labelledby={titleId}>
      <div className="map-preview-heading">
        <div>
          <p className="section-kicker">CARTOGRAFÍA INTERACTIVA</p>
          <h2 id={titleId}>{hasImport ? 'Mapa del conjunto local' : 'Mapa de Salta'}</h2>
        </div>
        <span className="phase-tag">{hasImport ? 'Importación local' : 'Mapa base'}</span>
      </div>

      <div className="map-toolbar">
        <p>Explorá calles y acercá la vista. Las líneas de colectivos aún no están conectadas.</p>
        <button
          className="secondary-button location-button"
          type="button"
          onClick={handleLocate}
          disabled={locationStatus === 'requesting'}
        >
          {locationStatus === 'requesting' ? 'Buscando ubicación…' : 'Usar mi ubicación'}
        </button>
      </div>

      {hasImport && (
        <fieldset className="map-layer-controls">
          <legend>Capas del conjunto importado</legend>
          <label>
            <input
              type="checkbox"
              checked={showStops}
              onChange={(e) => setShowStops(e.target.checked)}
            />{' '}
            Paradas
          </label>
          <label>
            <input
              type="checkbox"
              checked={showShapes}
              onChange={(e) => setShowShapes(e.target.checked)}
            />{' '}
            Geometrías verificadas
          </label>
        </fieldset>
      )}
      {tileStatus === 'loading' && (
        <p role="status" className="map-provider-note">
          Cargando cartografía del proveedor…
        </p>
      )}
      {tileStatus === 'error' && (
        <div className="map-tile-error" role="status">
          <p>
            No se pudieron cargar todas las teselas. Las capas locales pueden seguir consultándose.
          </p>
          <button
            type="button"
            className="secondary-button"
            onClick={() => tileLayerRef.current?.redraw()}
          >
            Reintentar cartografía
          </button>
        </div>
      )}
      <div
        className="leaflet-map-canvas"
        ref={mapElementRef}
        role="application"
        aria-label={
          hasImport
            ? 'Mapa interactivo del conjunto importado'
            : 'Mapa interactivo de calles de Salta'
        }
      />

      {hasImport && (
        <p className="map-provider-note">
          Solo datos importados por vos. Con más de 200 paradas, se agrupan visualmente según el
          zoom; los grupos no son ubicaciones de vehículos. Usá los filtros para consultar paradas
          coincidentes.
        </p>
      )}
      {selectedStop && (
        <aside className="map-stop-detail" aria-label="Parada seleccionada">
          <strong>{selectedStop.name || selectedStop.id}</strong>
          <p>
            ID: {selectedStop.id} ·{' '}
            {selectedStop.coordinates?.join(', ') || 'Sin coordenadas válidas'} · Importación local
          </p>
          <button type="button" className="secondary-button" onClick={() => setSelectedId('')}>
            Cerrar parada
          </button>
        </aside>
      )}
      {locationStatus === 'requesting' && (
        <StateNotice kind="loading" title="Esperando permiso y ubicación">
          El navegador puede pedirte permiso. No hace falta compartir tu ubicación para usar el
          mapa.
        </StateNotice>
      )}
      {locationStatus === 'error' && (
        <StateNotice kind="error" title="No pudimos obtener tu ubicación">
          {locationMessage}
        </StateNotice>
      )}
      {locationStatus === 'located' && (
        <p className="location-success" role="status">
          {locationMessage}
        </p>
      )}

      <p className="map-disclaimer">
        <span className="availability-dot" aria-hidden="true" />
        Mapa base de OpenStreetMap. No es un mapa de SAETA ni representa ubicaciones reales de
        colectivos.
      </p>
      <p className="map-provider-note">
        Las solicitudes del mapa cargan las teselas visibles desde el proveedor cartográfico. La
        ubicación personal solo se solicita cuando tocás el botón.
      </p>
    </section>
  );
}
