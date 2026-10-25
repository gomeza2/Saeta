import { parseCsvTable, type GtfsTable } from './gtfs';

export interface ImportedStop {
  id: string;
  name: string;
  coordinates: [number, number] | null;
}
export interface ImportedRoute {
  id: string;
  shortName: string;
  longName: string;
  type: string;
  stopIds: string[];
  shapeIds: string[];
}
export interface ImportedShape {
  id: string;
  points: [number, number][];
}
export interface GtfsPreviewData {
  routes: ImportedRoute[];
  stops: ImportedStop[];
  shapes: ImportedShape[];
}

/** Excludes malformed CSV tables and ambiguous identifiers from the preview. */
function uniqueRows(table: GtfsTable | undefined, key: string) {
  if (!table || table.errors.length) return [];
  const counts = new Map<string, number>();
  for (const { values } of table.rows) {
    const id = values[key] ?? '';
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return table.rows.filter(({ values }) => values[key] && counts.get(values[key]) === 1);
}

export function coordinates(lat = '', lon = ''): [number, number] | null {
  const decimal = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;
  if (!decimal.test(lat) || !decimal.test(lon)) return null;
  const point: [number, number] = [Number(lat), Number(lon)];
  return Math.abs(point[0]) <= 90 && Math.abs(point[1]) <= 180 ? point : null;
}

/** Local inspection only: no persistence, network calls or inferred route geometry. */
export function parseGtfsTables(files: Record<string, string>): Map<string, GtfsTable> {
  return new Map(
    Object.entries(files).map(([name, text]) => [name.toLowerCase(), parseCsvTable(text)]),
  );
}

export function buildGtfsPreview(
  files: Record<string, string>,
  tables = parseGtfsTables(files),
): GtfsPreviewData {
  const stops: ImportedStop[] = uniqueRows(tables.get('stops.txt'), 'stop_id').map(
    ({ values: v }) => ({
      id: v.stop_id!,
      name: v.stop_name ?? '',
      coordinates: coordinates(v.stop_lat, v.stop_lon),
    }),
  );
  const routes: ImportedRoute[] = uniqueRows(tables.get('routes.txt'), 'route_id').map(
    ({ values: v }) => ({
      id: v.route_id!,
      shortName: v.route_short_name ?? '',
      longName: v.route_long_name ?? '',
      type: v.route_type ?? '',
      stopIds: [],
      shapeIds: [],
    }),
  );
  const routeById = new Map(routes.map((route) => [route.id, route]));
  const stopIds = new Set(stops.map((stop) => stop.id));
  const shapes: ImportedShape[] = [];
  const shapeTable = tables.get('shapes.txt');
  const groups = new Map<string, Array<{ sequence: number; point: [number, number] | null }>>();
  if (shapeTable && !shapeTable.errors.length) {
    for (const { values: v } of shapeTable.rows) {
      if (!v.shape_id) continue;
      const rows = groups.get(v.shape_id) ?? [];
      rows.push({
        sequence: /^\d+$/.test(v.shape_pt_sequence ?? '') ? Number(v.shape_pt_sequence) : NaN,
        point: coordinates(v.shape_pt_lat, v.shape_pt_lon),
      });
      groups.set(v.shape_id, rows);
    }
  }
  for (const [id, rows] of groups) {
    if (
      rows.length < 2 ||
      rows.some((r) => !r.point || !Number.isSafeInteger(r.sequence)) ||
      new Set(rows.map((r) => r.sequence)).size !== rows.length
    )
      continue;
    rows.sort((a, b) => a.sequence - b.sequence);
    shapes.push({ id, points: rows.map((r) => r.point!) });
  }
  const shapeIds = new Set(shapes.map((shape) => shape.id));
  const trips = uniqueRows(tables.get('trips.txt'), 'trip_id');
  const times = new Map<string, Array<{ stop: string; sequence: number }>>();
  const timeTable = tables.get('stop_times.txt');
  if (timeTable && !timeTable.errors.length) {
    for (const { values: v } of timeTable.rows) {
      const rows = times.get(v.trip_id ?? '') ?? [];
      rows.push({
        stop: v.stop_id ?? '',
        sequence: /^\d+$/.test(v.stop_sequence ?? '') ? Number(v.stop_sequence) : NaN,
      });
      times.set(v.trip_id ?? '', rows);
    }
  }
  for (const { values: v } of trips) {
    const route = routeById.get(v.route_id ?? '');
    if (!route) continue;
    const rows = times.get(v.trip_id ?? '') ?? [];
    if (
      rows.length &&
      rows.every((r) => stopIds.has(r.stop) && Number.isSafeInteger(r.sequence)) &&
      new Set(rows.map((r) => r.sequence)).size === rows.length
    ) {
      rows.sort((a, b) => a.sequence - b.sequence);
      for (const row of rows) if (!route.stopIds.includes(row.stop)) route.stopIds.push(row.stop);
    }
    if (shapeIds.has(v.shape_id ?? '') && !route.shapeIds.includes(v.shape_id!))
      route.shapeIds.push(v.shape_id!);
  }
  const referencedShapes = new Set(routes.flatMap((route) => route.shapeIds));
  return { routes, stops, shapes: shapes.filter((shape) => referencedShapes.has(shape.id)) };
}
