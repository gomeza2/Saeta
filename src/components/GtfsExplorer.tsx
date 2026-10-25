import { useMemo, useState } from 'react';
import type { GtfsPreviewData } from '../data/gtfsPreview';
import { MapPreview } from './MapPreview';

const PAGE_SIZE = 50;
export function GtfsExplorer({ data }: { data: GtfsPreviewData }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [selectedStop, setSelectedStop] = useState('');
  const [showMap, setShowMap] = useState(false);
  const index = useMemo(
    () => ({
      routes: new Map(data.routes.map((r) => [r.id, r])),
      stops: new Map(data.stops.map((s) => [s.id, s])),
    }),
    [data],
  );
  const results = useMemo(() => {
    const text = query.trim().toLocaleLowerCase();
    return [
      ...data.routes
        .filter((r) =>
          [r.id, r.shortName, r.longName].some((s) => s.toLocaleLowerCase().includes(text)),
        )
        .map((r) => ({
          kind: 'route' as const,
          id: r.id,
          name: r.shortName || r.longName || r.id,
        })),
      ...data.stops
        .filter((s) => [s.id, s.name].some((v) => v.toLocaleLowerCase().includes(text)))
        .map((s) => ({ kind: 'stop' as const, id: s.id, name: s.name || s.id })),
    ];
  }, [data, query]);
  const route = index.routes.get(selectedRoute);
  const stop = index.stops.get(selectedStop);
  const relatedStops = useMemo(
    () => (route ? route.stopIds.flatMap((id) => index.stops.get(id) ?? []) : data.stops),
    [data, route, index],
  );
  const mapStops = useMemo(() => (stop ? [stop] : relatedStops), [stop, relatedStops]);
  const shapes = useMemo(
    () => data.shapes.filter((s) => !stop && (!route || route.shapeIds.includes(s.id))),
    [data, stop, route],
  );
  return (
    <section className="gtfs-preview" aria-labelledby="explorer-title">
      <h3 id="explorer-title">Explorar el conjunto local</h3>
      <p className="gtfs-local-notice">
        Búsqueda en archivos importados en esta sesión. No consulta una fuente remota ni acredita
        datos oficiales.
      </p>
      <label htmlFor="local-search">Línea o parada del conjunto importado</label>
      <input
        id="local-search"
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setPage(0);
        }}
        placeholder="Nombre o identificador"
      />
      <p role="status">
        {results.length} coincidencias en {data.routes.length} líneas y {data.stops.length} paradas.
      </p>
      {results.length === 0 && (
        <p>
          No hay coincidencias. Probá otro nombre o identificador; si faltan archivos, revisá el
          informe en Datos.
        </p>
      )}
      <ul className="gtfs-results" aria-label="Resultados del conjunto local">
        {results.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((result) => (
          <li key={`${result.kind}:${result.id}`}>
            <button
              type="button"
              onClick={() => {
                setSelectedRoute(result.kind === 'route' ? result.id : '');
                setSelectedStop(result.kind === 'stop' ? result.id : '');
              }}
              aria-pressed={
                result.kind === 'route' ? result.id === selectedRoute : result.id === selectedStop
              }
            >
              <strong>{result.name}</strong>
              <span>
                {result.kind === 'route' ? 'Línea' : 'Parada'} · ID: {result.id}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {results.length > PAGE_SIZE && (
        <div className="gtfs-pagination">
          <button type="button" disabled={!page} onClick={() => setPage(page - 1)}>
            Anterior
          </button>
          <span>
            Página {page + 1} de {Math.ceil(results.length / PAGE_SIZE)}
          </span>
          <button
            type="button"
            disabled={(page + 1) * PAGE_SIZE >= results.length}
            onClick={() => setPage(page + 1)}
          >
            Siguiente
          </button>
        </div>
      )}
      {(route || stop) && (
        <section className="gtfs-local-notice" aria-labelledby="local-detail-title">
          <h4 id="local-detail-title">
            Detalle {route ? 'de línea' : 'de parada'}:{' '}
            {route ? route.shortName || route.id : stop?.name || stop?.id}
          </h4>
          {route && (
            <>
              <p>
                {route.longName} · ID: {route.id} · Tipo GTFS: {route.type || 'sin informar'}
              </p>
              <p>
                {relatedStops.length} paradas relacionadas por identificadores de viajes y horarios,
                sin asumir un orden único.
              </p>
              {!relatedStops.length && (
                <p>
                  No hay relaciones comprobables. Se requieren trips.txt y stop_times.txt con
                  referencias válidas.
                </p>
              )}
              <ul className="gtfs-results" aria-label="Paradas de la línea seleccionada">
                {relatedStops.slice(0, PAGE_SIZE).map((s) => (
                  <li key={s.id}>
                    <button type="button" onClick={() => setSelectedStop(s.id)}>
                      {s.name || s.id} · {s.id}
                    </button>
                  </li>
                ))}
              </ul>
              {relatedStops.length > PAGE_SIZE && (
                <p>
                  Se muestran las primeras 50 paradas; usá la búsqueda por identificador para abrir
                  las demás.
                </p>
              )}
            </>
          )}
          {stop && (
            <p>
              ID: {stop.id} ·{' '}
              {stop.coordinates
                ? stop.coordinates.join(', ')
                : 'Sin coordenadas válidas para el mapa'}
            </p>
          )}
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              setSelectedRoute('');
              setSelectedStop('');
            }}
          >
            Cerrar detalle
          </button>
        </section>
      )}
      <button
        className="primary-button"
        type="button"
        aria-expanded={showMap}
        onClick={() => setShowMap(!showMap)}
      >
        {showMap ? 'Ocultar mapa local' : 'Mostrar selección en el mapa local'}
      </button>
      {showMap && (
        <>
          <p>
            Vista del conjunto local: máximo 2000 paradas y 100 000 puntos de geometría por vista.
            Sin horarios de llegada ni vehículos en vivo.
          </p>
          {!mapStops.some((s) => s.coordinates) && (
            <p>No hay coordenadas válidas en esta selección.</p>
          )}
          {!shapes.length && (
            <p>
              Sin trazado verificado para esta selección. No se unen paradas para aparentar
              recorridos.
            </p>
          )}
          <MapPreview importedStops={mapStops} importedShapes={shapes} />
        </>
      )}
    </section>
  );
}
