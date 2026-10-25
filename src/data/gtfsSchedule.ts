import type { GtfsTable } from './gtfs';

interface Service {
  start: string;
  end: string;
  days: string[];
}
interface ScheduledStop {
  id: string;
  arrival: number;
  departure: number;
  arrivalText: string;
  departureText: string;
  pickup: boolean;
  dropoff: boolean;
}
interface ScheduledTrip {
  id: string;
  routeId: string;
  serviceId: string;
  stops: ScheduledStop[];
}
export interface ImportedSchedule {
  timezone: string;
  services: Map<string, Service>;
  exceptions: Map<string, Map<string, string>>;
  trips: ScheduledTrip[];
  excludedTrips: number;
  unavailable: string;
}
export interface DirectJourney {
  tripId: string;
  routeId: string;
  departure: string;
  arrival: string;
  stops: string[];
}

export function serviceDate(text: string): string | null {
  if (!/^(?:\d{8}|\d{4}-\d{2}-\d{2})$/.test(text)) return null;
  const compact = text.replaceAll('-', '');
  if (!/^\d{8}$/.test(compact)) return null;
  const parsed = new Date(
    `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6)}T00:00:00Z`,
  );
  return Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10).replaceAll('-', '') === compact
    ? compact
    : null;
}
function seconds(text = ''): number | null {
  if (!/^\d{1,3}:[0-5]\d:[0-5]\d$/.test(text)) return null;
  const parts = text.split(':').map(Number);
  return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!;
}
function rows(tables: Map<string, GtfsTable>, name: string, headers: string[]) {
  const table = tables.get(name);
  return table && !table.errors.length && headers.every((h) => table.headers.includes(h))
    ? table.rows
    : null;
}

/** Conservative fixed-stop, fixed-time subset: no frequency templates or interpolation. */
export function buildGtfsSchedule(
  tables: Map<string, GtfsTable>,
  routeIds: Set<string>,
  stopIds: Set<string>,
): ImportedSchedule {
  const schedule: ImportedSchedule = {
    timezone: '',
    services: new Map(),
    exceptions: new Map(),
    trips: [],
    excludedTrips: 0,
    unavailable: '',
  };
  const agencies = rows(tables, 'agency.txt', ['agency_timezone']);
  const timezones = new Set(agencies?.map(({ values }) => values.agency_timezone));
  const timezone = agencies?.[0]?.values.agency_timezone ?? '';
  try {
    new Intl.DateTimeFormat('es', { timeZone: timezone }).format();
  } catch {
    schedule.unavailable = 'Falta una zona horaria de agencia válida.';
    return schedule;
  }
  if (timezones.size !== 1) {
    schedule.unavailable =
      'Se requiere una única zona horaria de agencia para esta consulta limitada.';
    return schedule;
  }
  schedule.timezone = timezone;
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const calendars = rows(tables, 'calendar.txt', ['service_id', 'start_date', 'end_date', ...days]);
  const exceptions = rows(tables, 'calendar_dates.txt', ['service_id', 'date', 'exception_type']);
  if (
    (!calendars && !exceptions) ||
    (tables.has('calendar.txt') && !calendars) ||
    (tables.has('calendar_dates.txt') && !exceptions)
  ) {
    schedule.unavailable = 'Faltan calendarios válidos para determinar la fecha de servicio.';
    return schedule;
  }
  for (const { values: v } of calendars ?? []) {
    const start = serviceDate(v.start_date ?? '');
    const end = serviceDate(v.end_date ?? '');
    if (
      !v.service_id ||
      !start ||
      !end ||
      start > end ||
      days.some((d) => !['0', '1'].includes(v[d] ?? '')) ||
      schedule.services.has(v.service_id)
    ) {
      schedule.unavailable = 'El calendario contiene fechas, días o identificadores ambiguos.';
      return schedule;
    }
    schedule.services.set(v.service_id, { start, end, days: days.map((d) => v[d]!) });
  }
  for (const { values: v } of exceptions ?? []) {
    const date = serviceDate(v.date ?? '');
    const byDate = schedule.exceptions.get(v.service_id ?? '') ?? new Map<string, string>();
    if (
      !v.service_id ||
      !date ||
      !['1', '2'].includes(v.exception_type ?? '') ||
      byDate.has(date)
    ) {
      schedule.unavailable =
        'Las excepciones de calendario contienen fechas, servicios o entradas repetidas inválidas.';
      return schedule;
    }
    byDate.set(date, v.exception_type!);
    schedule.exceptions.set(v.service_id, byDate);
  }
  const trips = rows(tables, 'trips.txt', ['trip_id', 'route_id', 'service_id']);
  const times = rows(tables, 'stop_times.txt', [
    'trip_id',
    'stop_id',
    'stop_sequence',
    'arrival_time',
    'departure_time',
  ]);
  if (!trips || !times) {
    schedule.unavailable =
      'Se requieren trips.txt y stop_times.txt con horas de llegada y salida explícitas.';
    return schedule;
  }
  const tripCounts = new Map<string, number>();
  for (const { values: v } of trips)
    tripCounts.set(v.trip_id ?? '', (tripCounts.get(v.trip_id ?? '') ?? 0) + 1);
  const grouped = new Map<string, Array<Record<string, string>>>();
  for (const { values: v } of times) {
    const group = grouped.get(v.trip_id ?? '') ?? [];
    group.push(v);
    grouped.set(v.trip_id ?? '', group);
  }
  const frequencies = tables.get('frequencies.txt');
  if (frequencies && (frequencies.errors.length || !frequencies.headers.includes('trip_id'))) {
    schedule.unavailable = 'No se puede identificar qué viajes dependen de frecuencias.';
    return schedule;
  }
  const frequencyTrips = new Set(frequencies?.rows.map(({ values }) => values.trip_id));
  for (const { values: v } of trips) {
    const times = grouped.get(v.trip_id ?? '') ?? [];
    let invalid =
      !v.trip_id ||
      tripCounts.get(v.trip_id) !== 1 ||
      !routeIds.has(v.route_id ?? '') ||
      (!schedule.services.has(v.service_id ?? '') &&
        !schedule.exceptions.has(v.service_id ?? '')) ||
      frequencyTrips.has(v.trip_id) ||
      times.length < 2;
    const seen = new Set<number>();
    const sorted = times
      .map((s) => {
        const seq = /^\d+$/.test(s.stop_sequence ?? '') ? Number(s.stop_sequence) : NaN;
        if (!Number.isSafeInteger(seq) || seen.has(seq) || !stopIds.has(s.stop_id ?? ''))
          invalid = true;
        seen.add(seq);
        return { values: s, seq };
      })
      .sort((a, b) => a.seq - b.seq);
    const stops: ScheduledStop[] = [];
    let previousDeparture = -1;
    for (const { values: s } of sorted) {
      const arrival = seconds(s.arrival_time);
      const departure = seconds(s.departure_time);
      if (
        arrival === null ||
        departure === null ||
        departure < arrival ||
        arrival < previousDeparture
      ) {
        invalid = true;
        break;
      }
      previousDeparture = departure;
      stops.push({
        id: s.stop_id!,
        arrival,
        departure,
        arrivalText: s.arrival_time!,
        departureText: s.departure_time!,
        pickup: !s.pickup_type || s.pickup_type === '0',
        dropoff: !s.drop_off_type || s.drop_off_type === '0',
      });
    }
    if (invalid) {
      schedule.excludedTrips += 1;
      continue;
    }
    schedule.trips.push({ id: v.trip_id!, routeId: v.route_id!, serviceId: v.service_id!, stops });
  }
  if (!schedule.trips.length)
    schedule.unavailable =
      'No hay viajes directos utilizables con referencias, secuencias y horarios completos. Se excluyen horarios inválidos y viajes definidos por frecuencias.';
  return schedule;
}

function active(schedule: ImportedSchedule, service: string, date: string) {
  const exception = schedule.exceptions.get(service)?.get(date);
  if (exception) return exception === '1';
  const calendar = schedule.services.get(service);
  const day = new Date(
    `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6)}T00:00:00Z`,
  ).getUTCDay();
  return (
    !!calendar &&
    date >= calendar.start &&
    date <= calendar.end &&
    calendar.days[(day + 6) % 7] === '1'
  );
}
export function findDirectJourneys(
  schedule: ImportedSchedule,
  origin: string,
  destination: string,
  dateText: string,
  stopIds: Set<string>,
): { journeys: DirectJourney[]; message: string } {
  if (!stopIds.has(origin) || !stopIds.has(destination))
    return {
      journeys: [],
      message: 'Elegí origen y destino entre las paradas existentes del conjunto.',
    };
  if (origin === destination)
    return { journeys: [], message: 'Origen y destino deben ser diferentes.' };
  const date = serviceDate(dateText);
  if (!date) return { journeys: [], message: 'Elegí una fecha de servicio válida.' };
  if (schedule.unavailable) return { journeys: [], message: schedule.unavailable };
  const found: DirectJourney[] = [];
  for (const trip of schedule.trips) {
    if (!active(schedule, trip.serviceId, date)) continue;
    const from = trip.stops.findIndex((s) => s.id === origin && s.pickup);
    if (from < 0) continue;
    const to = trip.stops.findIndex((s, i) => i > from && s.id === destination && s.dropoff);
    if (to < 0) continue;
    found.push({
      tripId: trip.id,
      routeId: trip.routeId,
      departure: trip.stops[from]!.departureText,
      arrival: trip.stops[to]!.arrivalText,
      stops: trip.stops.slice(from, to + 1).map((s) => s.id),
    });
  }
  found.sort((a, b) => seconds(a.departure)! - seconds(b.departure)!);
  return {
    journeys: found,
    message: found.length
      ? `${found.length} viajes directos publicados para la fecha de servicio.`
      : 'No hay viajes directos utilizables para esas paradas y fecha. No se calcularon transbordos ni conexiones.',
  };
}
