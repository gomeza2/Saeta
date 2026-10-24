export type GtfsSeverity = 'error' | 'warning';

export interface GtfsIssue {
  code: string;
  severity: GtfsSeverity;
  file: string;
  row?: number;
  message: string;
}

export interface GtfsTable {
  headers: string[];
  rows: Array<{ row: number; values: Record<string, string> }>;
  errors: Array<{ row?: number; message: string }>;
}

export interface GtfsValidationReport {
  valid: boolean;
  errors: number;
  warnings: number;
  issues: GtfsIssue[];
  omittedIssues: number;
  summary: {
    agencies: number;
    routes: number;
    stops: number;
    trips: number;
    stopTimes: number;
  };
}

const MAX_VISIBLE_ISSUES = 50;
const REQUIRED_FILES = ['agency.txt', 'routes.txt', 'stops.txt', 'trips.txt', 'stop_times.txt'];

function normalizeName(name: string): string {
  return name.split(/[\\/]/).pop()?.trim().toLowerCase() ?? '';
}

/** Parse a CSV table, including UTF-8 BOM, escaped quotes, quoted commas and CRLF. */
export function parseCsvTable(content: string): GtfsTable {
  const source = content.replace(/^\uFEFF/, '');
  const records: string[][] = [];
  const errors: Array<{ row?: number; message: string }> = [];
  let record: string[] = [];
  let cell = '';
  let inQuotes = false;
  let afterQuote = false;
  let recordHasContent = false;

  const finishCell = () => {
    record.push(cell);
    cell = '';
    afterQuote = false;
  };
  const finishRecord = () => {
    finishCell();
    if (record.some((value) => value.trim() !== '')) records.push(record);
    record = [];
    recordHasContent = false;
  };

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (inQuotes) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          inQuotes = false;
          afterQuote = true;
        }
      } else {
        cell += character;
      }
      continue;
    }

    if (afterQuote && character !== ',' && character !== '\n' && character !== '\r' && character !== ' ' && character !== '\t') {
      errors.push({ row: records.length + 2, message: 'Hay texto inesperado después de un campo entre comillas.' });
      afterQuote = false;
    }
    if (character === '"' && cell.trim() === '' && !afterQuote) {
      cell = '';
      inQuotes = true;
      recordHasContent = true;
    } else if (character === ',' ) {
      finishCell();
      recordHasContent = true;
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && source[index + 1] === '\n') index += 1;
      finishRecord();
    } else {
      cell += character;
      if (character.trim() !== '') recordHasContent = true;
    }
  }

  if (inQuotes) {
    errors.push({ row: records.length + 2, message: 'Hay un campo entre comillas que no se cerró.' });
  }
  if (recordHasContent || record.length > 0 || cell.length > 0) finishRecord();
  if (records.length === 0) {
    return { headers: [], rows: [], errors: [{ message: 'El archivo está vacío o no contiene registros.' }, ...errors] };
  }

  const headers = records[0].map((header) => header.trim());
  const duplicateHeaders = headers.filter((header, index) => header !== '' && headers.indexOf(header) !== index);
  if (headers.some((header) => header === '')) errors.push({ row: 1, message: 'La cabecera contiene una columna sin nombre.' });
  if (duplicateHeaders.length > 0) errors.push({ row: 1, message: 'La cabecera contiene nombres de columna repetidos.' });

  const rows = records.slice(1).map((values, index) => {
    if (values.length !== headers.length) {
      errors.push({
        row: index + 2,
        message: `Se esperaban ${headers.length} columnas y se encontraron ${values.length}.`,
      });
    }
    const mapped: Record<string, string> = {};
    headers.forEach((header, column) => {
      if (header) mapped[header] = (values[column] ?? '').trim();
    });
    return { row: index + 2, values: mapped };
  });
  return { headers, rows, errors };
}

function hasColumns(table: GtfsTable, required: string[]): boolean {
  return required.every((column) => table.headers.includes(column));
}

function value(row: Record<string, string>, key: string): string {
  return (row[key] ?? '').trim();
}

function addIssue(
  issues: GtfsIssue[],
  code: string,
  severity: GtfsSeverity,
  file: string,
  message: string,
  row?: number,
): void {
  issues.push({ code, severity, file, message, ...(row === undefined ? {} : { row }) });
}

function checkUniqueIds(
  table: GtfsTable,
  file: string,
  key: string,
  issues: GtfsIssue[],
): Set<string> {
  const ids = new Set<string>();
  table.rows.forEach(({ row, values }) => {
    const id = value(values, key);
    if (!id) {
      addIssue(issues, 'id_missing', 'error', file, `Falta el identificador ${key}.`, row);
    } else if (ids.has(id)) {
      addIssue(issues, 'id_duplicate', 'error', file, `El identificador "${id}" está repetido.`, row);
    } else {
      ids.add(id);
    }
  });
  return ids;
}

function checkReference(
  issues: GtfsIssue[],
  code: string,
  file: string,
  row: number,
  label: string,
  id: string,
  knownIds: Set<string>,
): void {
  if (id && !knownIds.has(id)) {
    addIssue(issues, code, 'error', file, `${label} "${id}" no existe en el archivo relacionado.`, row);
  }
}

function parseDate(date: string): number | null {
  if (!/^\d{8}$/.test(date)) return null;
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(4, 6));
  const day = Number(date.slice(6, 8));
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return null;
  return Number(date);
}

function readGtfsTable(
  files: Map<string, string>,
  file: string,
  issues: GtfsIssue[],
  requiredColumns: string[],
  requiredFile = true,
): GtfsTable | null {
  const content = files.get(file);
  if (content === undefined) {
    if (requiredFile) addIssue(issues, 'file_missing', 'error', file, 'Falta este archivo requerido.');
    return null;
  }
  const table = parseCsvTable(content);
  table.errors.forEach((error) => {
    addIssue(issues, 'csv_invalid', 'error', file, error.message, error.row);
  });
  if (table.headers.length > 0 && !hasColumns(table, requiredColumns)) {
    const missing = requiredColumns.filter((column) => !table.headers.includes(column));
    addIssue(issues, 'columns_missing', 'error', file, `Faltan columnas requeridas: ${missing.join(', ')}.`, 1);
  }
  return table;
}

export function validateGtfsFiles(input: Record<string, string>): GtfsValidationReport {
  const issues: GtfsIssue[] = [];
  const files = new Map<string, string>();
  Object.entries(input).forEach(([name, contents]) => {
    const normalized = normalizeName(name);
    if (files.has(normalized)) addIssue(issues, 'file_duplicate', 'error', normalized, 'Se seleccionó más de un archivo con el mismo nombre.');
    else files.set(normalized, contents);
  });

  REQUIRED_FILES.forEach((file) => {
    if (!files.has(file)) addIssue(issues, 'file_missing', 'error', file, 'Falta este archivo requerido.');
  });
  if (!files.has('calendar.txt') && !files.has('calendar_dates.txt')) {
    addIssue(issues, 'service_calendar_missing', 'error', 'calendar.txt', 'Se requiere calendar.txt o calendar_dates.txt para identificar los servicios.');
  }

  const agency = readGtfsTable(files, 'agency.txt', issues, ['agency_name', 'agency_url', 'agency_timezone']);
  const routes = readGtfsTable(files, 'routes.txt', issues, ['route_id', 'route_type']);
  const stops = readGtfsTable(files, 'stops.txt', issues, ['stop_id', 'stop_name']);
  const trips = readGtfsTable(files, 'trips.txt', issues, ['route_id', 'service_id', 'trip_id']);
  const stopTimes = readGtfsTable(files, 'stop_times.txt', issues, ['trip_id', 'stop_id', 'stop_sequence']);
  const calendar = readGtfsTable(files, 'calendar.txt', issues, ['service_id', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'start_date', 'end_date'], false);
  const calendarDates = readGtfsTable(files, 'calendar_dates.txt', issues, ['service_id', 'date', 'exception_type'], false);

  const agencyIds = agency && agency.headers.includes('agency_id') ? checkUniqueIds(agency, 'agency.txt', 'agency_id', issues) : new Set<string>();
  if (agency && agency.rows.length === 0) addIssue(issues, 'agency_empty', 'error', 'agency.txt', 'No hay agencias para revisar.');
  const routeIds = routes ? checkUniqueIds(routes, 'routes.txt', 'route_id', issues) : new Set<string>();
  const stopIds = stops ? checkUniqueIds(stops, 'stops.txt', 'stop_id', issues) : new Set<string>();
  const tripIds = trips ? checkUniqueIds(trips, 'trips.txt', 'trip_id', issues) : new Set<string>();
  const serviceIds = new Set<string>();

  if (routes) {
    routes.rows.forEach(({ row, values }) => {
      if (!value(values, 'route_short_name') && !value(values, 'route_long_name')) {
        addIssue(issues, 'route_name_missing', 'error', 'routes.txt', 'Cada línea necesita route_short_name o route_long_name.', row);
      }
      const routeTypeText = value(values, 'route_type');
      const routeTypeNumber = Number(routeTypeText);
      const routeTypeIsSupported =
        /^\\d+$/.test(routeTypeText) &&
        Number.isSafeInteger(routeTypeNumber) &&
        ((routeTypeNumber >= 0 && routeTypeNumber <= 7) ||
          (routeTypeNumber >= 100 && routeTypeNumber <= 1700));
      if (!routeTypeIsSupported) {
        addIssue(
          issues,
          'route_type_invalid',
          'error',
          'routes.txt',
          'route_type debe ser un tipo GTFS válido: 0–7 o un tipo extendido entre 100 y 1700.',
          row,
        );
      }
      if (routes.headers.includes('agency_id') && value(values, 'agency_id')) {
        checkReference(issues, 'agency_reference_invalid', 'routes.txt', row, 'La agencia', value(values, 'agency_id'), agencyIds);
      } else if (routes.headers.includes('agency_id') && agencyIds.size > 1) {
        addIssue(issues, 'agency_reference_missing', 'error', 'routes.txt', 'agency_id es necesario cuando hay más de una agencia.', row);
      }
    });
  }

  if (stops) {
    stops.rows.forEach(({ row, values }) => {
      const lat = value(values, 'stop_lat');
      const lon = value(values, 'stop_lon');
      if ((lat === '') !== (lon === '')) {
        addIssue(issues, 'coordinates_incomplete', 'error', 'stops.txt', 'stop_lat y stop_lon deben informarse juntos.', row);
      } else if (lat !== '' && lon !== '') {
        const latitude = Number(lat);
        const longitude = Number(lon);
        if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
          addIssue(issues, 'latitude_invalid', 'error', 'stops.txt', 'stop_lat no es una latitud válida.', row);
        }
        if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
          addIssue(issues, 'longitude_invalid', 'error', 'stops.txt', 'stop_lon no es una longitud válida.', row);
        }
      }
    });
  }

  if (calendar) {
    checkUniqueIds(calendar, 'calendar.txt', 'service_id', issues).forEach((id) => serviceIds.add(id));
    calendar.rows.forEach(({ row, values }) => {
      const start = parseDate(value(values, 'start_date'));
      const end = parseDate(value(values, 'end_date'));
      if (start === null || end === null) {
        addIssue(issues, 'calendar_date_invalid', 'error', 'calendar.txt', 'Las fechas deben existir y usar AAAAMMDD.', row);
      } else if (end < start) {
        addIssue(issues, 'calendar_range_invalid', 'error', 'calendar.txt', 'end_date no puede ser anterior a start_date.', row);
      }
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach((day) => {
        if (!['0', '1'].includes(value(values, day))) addIssue(issues, 'calendar_day_invalid', 'error', 'calendar.txt', `${day} debe ser 0 o 1.`, row);
      });
    });
  }

  if (calendarDates) {
    calendarDates.rows.forEach(({ row, values }) => {
      const service = value(values, 'service_id');
      const date = value(values, 'date');
      const exception = value(values, 'exception_type');
      if (service) serviceIds.add(service);
      if (parseDate(date) === null) addIssue(issues, 'calendar_exception_date_invalid', 'error', 'calendar_dates.txt', 'date debe ser una fecha válida AAAAMMDD.', row);
      if (!['1', '2'].includes(exception)) addIssue(issues, 'calendar_exception_invalid', 'error', 'calendar_dates.txt', 'exception_type debe ser 1 o 2.', row);
    });
  }

  if (trips) {
    trips.rows.forEach(({ row, values }) => {
      checkReference(issues, 'route_reference_invalid', 'trips.txt', row, 'La ruta', value(values, 'route_id'), routeIds);
      checkReference(issues, 'service_reference_invalid', 'trips.txt', row, 'El servicio', value(values, 'service_id'), serviceIds);
    });
  }

  const tripSequence = new Map<string, number>();
  if (stopTimes) {
    stopTimes.rows.forEach(({ row, values }) => {
      const tripId = value(values, 'trip_id');
      const stopId = value(values, 'stop_id');
      const sequenceText = value(values, 'stop_sequence');
      const sequence = Number(sequenceText);
      checkReference(issues, 'trip_reference_invalid', 'stop_times.txt', row, 'El viaje', tripId, tripIds);
      checkReference(issues, 'stop_reference_invalid', 'stop_times.txt', row, 'La parada', stopId, stopIds);
      if (!/^\d+$/.test(sequenceText) || !Number.isSafeInteger(sequence) || sequence < 0) {
        addIssue(issues, 'stop_sequence_invalid', 'error', 'stop_times.txt', 'stop_sequence debe ser un entero no negativo.', row);
      } else if (tripId) {
        const previous = tripSequence.get(tripId);
        if (previous !== undefined && sequence <= previous) {
          addIssue(issues, 'stop_sequence_order', 'error', 'stop_times.txt', `Las secuencias del viaje "${tripId}" deben aumentar.`, row);
        }
        tripSequence.set(tripId, sequence);
      }
      const timePattern = /^\d{1,3}:[0-5]\d:[0-5]\d$/;
      for (const column of ['arrival_time', 'departure_time']) {
        const time = value(values, column);
        if (stopTimes.headers.includes(column) && time && !timePattern.test(time)) {
          addIssue(issues, 'stop_time_invalid', 'error', 'stop_times.txt', `${column} debe tener formato H:MM:SS (se permiten horas posteriores a medianoche).`, row);
        }
      }
    });
  }

  if (routes && routes.rows.length === 0) addIssue(issues, 'routes_empty', 'error', 'routes.txt', 'No hay líneas para revisar.');
  if (stops && stops.rows.length === 0) addIssue(issues, 'stops_empty', 'warning', 'stops.txt', 'El archivo no contiene paradas.');
  if (trips && trips.rows.length === 0) addIssue(issues, 'trips_empty', 'error', 'trips.txt', 'No hay viajes para revisar.');

  const errors = issues.filter((issue) => issue.severity === 'error').length;
  const warnings = issues.filter((issue) => issue.severity === 'warning').length;
  return {
    valid: errors === 0,
    errors,
    warnings,
    issues: issues.slice(0, MAX_VISIBLE_ISSUES),
    omittedIssues: Math.max(0, issues.length - MAX_VISIBLE_ISSUES),
    summary: {
      agencies: agency?.rows.length ?? 0,
      routes: routes?.rows.length ?? 0,
      stops: stops?.rows.length ?? 0,
      trips: trips?.rows.length ?? 0,
      stopTimes: stopTimes?.rows.length ?? 0,
    },
  };
}
