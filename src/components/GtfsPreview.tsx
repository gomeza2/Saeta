import { useMemo, useState } from 'react';
import type { GtfsPreviewData } from '../data/gtfsPreview';
import { MapPreview } from './MapPreview';

const PAGE_SIZE = 50;
export function GtfsPreview({ data }: { data: GtfsPreviewData }) {
  const [routeQuery, setRouteQuery] = useState('');
  const [stopQuery, setStopQuery] = useState('');
  const [routeId, setRouteId] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [routePage, setRoutePage] = useState(0);
  const [stopPage, setStopPage] = useState(0);
  const route = data.routes.find((r) => r.id === routeId);
  const routes = useMemo(() => {
    const query = routeQuery.trim().toLocaleLowerCase();
    return data.routes.filter((r) =>
      [r.id, r.shortName, r.longName].some((v) => v.toLocaleLowerCase().includes(query)),
    );
  }, [data, routeQuery]);
  const stops = useMemo(() => {
    const query = stopQuery.trim().toLocaleLowerCase();
    const related = route ? new Set(route.stopIds) : null;
    return data.stops.filter(
      (s) =>
        (!related || related.has(s.id)) &&
        [s.id, s.name].some((v) => v.toLocaleLowerCase().includes(query)),
    );
  }, [data, route, stopQuery]);
  const shapes = useMemo(
    () => data.shapes.filter((s) => !route || route.shapeIds.includes(s.id)),
    [data, route],
  );
  const mapStops = useMemo(() => stops.filter((s) => s.coordinates), [stops]);
  return (
    <section className="gtfs-preview" aria-labelledby="preview-title">
      <h3 id="preview-title">Vista previa del conjunto importado</h3>
      <p className="gtfs-local-notice">
        Datos importados por vos en esta sesión. No son una fuente oficial conectada ni información
        en vivo.
      </p>
      <div className="gtfs-preview-grid">
        <section aria-labelledby="routes-title">
          <h4 id="routes-title">Líneas importadas</h4>
          <label htmlFor="filter-routes">Filtrar líneas por nombre o identificador</label>
          <input
            id="filter-routes"
            type="search"
            value={routeQuery}
            onChange={(e) => {
              setRouteQuery(e.target.value);
              setRoutePage(0);
            }}
          />
          <p role="status">
            {routes.length} de {data.routes.length} líneas
          </p>
          {routes.length === 0 && (
            <p>No hay líneas que coincidan o falta routes.txt con identificadores únicos.</p>
          )}
          <ul className="gtfs-results" aria-label="Líneas importadas">
            {routes.slice(routePage * PAGE_SIZE, (routePage + 1) * PAGE_SIZE).map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  aria-pressed={routeId === r.id}
                  onClick={() => {
                    setRouteId(routeId === r.id ? '' : r.id);
                    setStopPage(0);
                  }}
                >
                  <strong>{r.shortName || r.longName || r.id}</strong>
                  <span>
                    {r.longName} · ID: {r.id} · Tipo: {r.type || 'sin informar'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <Pagination
            page={routePage}
            count={routes.length}
            onChange={setRoutePage}
            label="líneas"
          />
        </section>
        <section aria-labelledby="stops-title">
          <h4 id="stops-title">
            {route
              ? `Paradas relacionadas con ${route.shortName || route.id}`
              : 'Paradas importadas'}
          </h4>
          {route && (
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setRouteId('');
                setStopPage(0);
              }}
            >
              Ver todas las paradas
            </button>
          )}
          <label htmlFor="filter-stops">Filtrar paradas por nombre o identificador</label>
          <input
            id="filter-stops"
            type="search"
            value={stopQuery}
            onChange={(e) => {
              setStopQuery(e.target.value);
              setStopPage(0);
            }}
          />
          <p role="status">
            {stops.length} de {data.stops.length} paradas
          </p>
          {stops.length === 0 && (
            <p>
              No hay paradas que coincidan. Las relaciones requieren trips.txt y stop_times.txt con
              referencias y secuencias no ambiguas.
            </p>
          )}
          <ul className="gtfs-results" aria-label="Paradas importadas">
            {stops.slice(stopPage * PAGE_SIZE, (stopPage + 1) * PAGE_SIZE).map((s) => (
              <li key={s.id}>
                <strong>{s.name || 'Sin nombre'}</strong>
                <span>
                  ID: {s.id} ·{' '}
                  {s.coordinates ? s.coordinates.join(', ') : 'Sin coordenadas válidas'}
                </span>
              </li>
            ))}
          </ul>
          <Pagination page={stopPage} count={stops.length} onChange={setStopPage} label="paradas" />
        </section>
      </div>
      <p>
        Las relaciones se obtienen de los identificadores de viajes y horarios; no representan un
        orden único de recorrido.
      </p>
      <button
        className="primary-button"
        type="button"
        onClick={() => setShowMap(!showMap)}
        aria-expanded={showMap}
      >
        {showMap ? 'Ocultar vista geográfica' : 'Mostrar vista geográfica'}
      </button>
      {showMap && (
        <>
          <p>
            {mapStops.length} paradas con coordenadas válidas en el filtro actual. Se representan
            hasta 2000; acotá por línea o nombre para revisar conjuntos grandes.
          </p>
          <p>
            Las geometrías se representan completas hasta un máximo de 100 000 puntos por vista; las
            que exceden el presupuesto no se dibujan.
          </p>
          {mapStops.length === 0 && (
            <p role="status">
              No se pueden representar paradas: faltan coordenadas válidas o el filtro no tiene
              resultados.
            </p>
          )}
          {shapes.length === 0 && (
            <p>
              El trazado del recorrido no está disponible: se requiere shapes.txt válido y vinculado
              mediante trips.shape_id. No se unen paradas con líneas rectas.
            </p>
          )}
          <MapPreview importedStops={mapStops} importedShapes={shapes} />
        </>
      )}
    </section>
  );
}
function Pagination({
  page,
  count,
  onChange,
  label,
}: {
  page: number;
  count: number;
  onChange: (page: number) => void;
  label: string;
}) {
  if (count <= PAGE_SIZE) return null;
  return (
    <div className="gtfs-pagination" aria-label={`Páginas de ${label}`}>
      <button type="button" disabled={page === 0} onClick={() => onChange(page - 1)}>
        Anterior
      </button>
      <span>
        Página {page + 1} de {Math.ceil(count / PAGE_SIZE)}
      </span>
      <button
        type="button"
        disabled={(page + 1) * PAGE_SIZE >= count}
        onClick={() => onChange(page + 1)}
      >
        Siguiente
      </button>
    </div>
  );
}
