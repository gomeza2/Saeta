import { useMemo, useState, type FormEvent } from 'react';
import type { GtfsPreviewData } from '../data/gtfsPreview';
import { findDirectJourneys } from '../data/gtfsSchedule';

export function GtfsPlanner({ data }: { data: GtfsPreviewData }) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [result, setResult] = useState<ReturnType<typeof findDirectJourneys> | null>(null);
  const stopIds = useMemo(() => new Set(data.stops.map((s) => s.id)), [data]);
  const routes = useMemo(
    () => new Map(data.routes.map((r) => [r.id, r.shortName || r.longName || r.id])),
    [data],
  );
  const missing =
    data.schedule?.unavailable ||
    (!data.schedule ? 'Faltan horarios procesados del conjunto.' : '');
  function submit(event: FormEvent) {
    event.preventDefault();
    if (data.schedule)
      setResult(findDirectJourneys(data.schedule, origin, destination, date, stopIds));
  }
  return (
    <section className="gtfs-preview" aria-labelledby="local-planner-title">
      <h3 id="local-planner-title">Consultar viajes directos del conjunto local</h3>
      <p className="gtfs-local-notice">
        Horarios publicados en tus archivos, sin estimaciones ni información en vivo. Fecha de
        servicio del feed
        {data.schedule?.timezone ? ` · Zona horaria: ${data.schedule.timezone}` : ''}.
      </p>
      {missing ? (
        <p role="status">{missing}</p>
      ) : (
        <form className="planner-form" onSubmit={submit} onChange={() => setResult(null)}>
          {(['origin', 'destination'] as const).map((field) => {
            const value = field === 'origin' ? origin : destination;
            const options = data.stops
              .filter((s) =>
                [s.id, s.name].some((text) =>
                  text.toLocaleLowerCase().includes(value.toLocaleLowerCase()),
                ),
              )
              .slice(0, 50);
            return (
              <div className="form-field" key={field}>
                <label htmlFor={`local-${field}`}>
                  {field === 'origin' ? 'Origen (ID de parada)' : 'Destino (ID de parada)'}
                </label>
                <input
                  id={`local-${field}`}
                  list={`${field}-options`}
                  value={value}
                  onChange={(e) =>
                    (field === 'origin' ? setOrigin : setDestination)(e.target.value)
                  }
                  required
                  autoComplete="off"
                  aria-describedby="stop-selection-help"
                />
                <datalist id={`${field}-options`}>
                  {options.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name || s.id}
                    </option>
                  ))}
                </datalist>
              </div>
            );
          })}
          <p className="field-hint" id="stop-selection-help">
            Elegí una sugerencia o escribí un ID existente. Se sugieren hasta 50 paradas según lo
            escrito.
          </p>
          <div className="form-field">
            <label htmlFor="service-date">Fecha de servicio</label>
            <input
              id="service-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <button className="primary-button" type="submit">
            Consultar horarios publicados
          </button>
        </form>
      )}
      <p>
        Las horas posteriores a 24:00 pertenecen al día de servicio elegido. No se comprueba la
        vigencia ni disponibilidad real del servicio; no se calculan caminatas, esperas ni
        transbordos. Se excluyen viajes por frecuencias y horarios incompletos.
      </p>
      {!!data.schedule?.excludedTrips && (
        <p>
          {data.schedule.excludedTrips} viajes excluidos por datos insuficientes o no admitidos.
        </p>
      )}
      {result && (
        <section aria-label="Resultado de horarios" aria-live="polite">
          <p role="status">{result.message}</p>
          <ol className="gtfs-results">
            {result.journeys.slice(0, 20).map((journey) => (
              <li key={journey.tripId}>
                <strong>
                  {routes.get(journey.routeId)} · Viaje {journey.tripId}
                </strong>
                <span>
                  Salida publicada: {journey.departure} · Llegada publicada: {journey.arrival}
                </span>
                <span>
                  Origen: {journey.stops[0]} · Destino: {journey.stops.at(-1)} ·{' '}
                  {journey.stops.length} paradas en el tramo
                </span>
              </li>
            ))}
          </ol>
          {result.journeys.length > 20 && (
            <p>Se muestran los primeros 20 viajes ordenados por salida.</p>
          )}
        </section>
      )}
    </section>
  );
}
