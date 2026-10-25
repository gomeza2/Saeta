import { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapPreview.css';
import type { ImportedStop, ImportedShape } from '../data/gtfsPreview';
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
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const locationLayerRef = useRef<L.LayerGroup | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [locationMessage, setLocationMessage] = useState('');

  useEffect(() => {
    const element = mapElementRef.current;
    if (!element) return undefined;

    const map = L.map(element, { zoomControl: true, scrollWheelZoom: true }).setView(
      saltaCenter,
      13,
    );
    const locationLayer = L.layerGroup().addTo(map);

    L.tileLayer(appConfig.mapTileUrl, {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>',
    }).addTo(map);

    mapRef.current = map;
    locationLayerRef.current = locationLayer;

    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => map.invalidateSize());
    resizeObserver?.observe(element);

    return () => {
      resizeObserver?.disconnect();
      map.remove();
      mapRef.current = null;
      locationLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const layer = L.layerGroup().addTo(map);
    const bounds = L.latLngBounds([]);
    for (const stop of importedStops.slice(0, 2000)) {
      if (!stop.coordinates) continue;
      const label = document.createElement('span');
      label.textContent = `${stop.name || 'Sin nombre'} · ${stop.id} · Importación local`;
      L.circleMarker(stop.coordinates, { radius: 5, color: '#27543d', fillOpacity: 0.8 })
        .bindPopup(label)
        .addTo(layer);
      bounds.extend(stop.coordinates);
    }
    let remainingPoints = 100_000;
    for (const shape of importedShapes) {
      if (shape.points.length > remainingPoints) continue;
      remainingPoints -= shape.points.length;
      L.polyline(shape.points, { color: '#275f91', weight: 3 }).addTo(layer);
      for (const point of shape.points) bounds.extend(point);
    }
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24], maxZoom: 16, animate: false });
    return () => {
      layer.clearLayers();
      map.removeLayer(layer);
    };
  }, [importedStops, importedShapes]);

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
        setLocationStatus('error');
        setLocationMessage(locationErrorMessage(error));
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 12_000 },
    );
  }

  return (
    <section className="map-preview" aria-labelledby="map-preview-title">
      <div className="map-preview-heading">
        <div>
          <p className="section-kicker">CARTOGRAFÍA INTERACTIVA</p>
          <h2 id="map-preview-title">Mapa de Salta</h2>
        </div>
        <span className="phase-tag">
          {importedStops.length || importedShapes.length ? 'Importación local' : 'Mapa base'}
        </span>
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

      <div
        className="leaflet-map-canvas"
        ref={mapElementRef}
        role="application"
        aria-label="Mapa interactivo de calles de Salta"
      />

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
