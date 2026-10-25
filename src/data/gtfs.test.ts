import { describe, expect, it } from 'vitest';
import { parseCsvTable, validateGtfsFiles } from './gtfs';

const validFeed: Record<string, string> = {
  'agency.txt': [
    'agency_id,agency_name,agency_url,agency_timezone',
    'agency-1,Transit Demo,https://example.org,America/Argentina/Salta',
  ].join('\n'),
  'routes.txt': [
    'route_id,agency_id,route_short_name,route_long_name,route_type',
    'route-1,agency-1,1,Centro,3',
  ].join('\n'),
  'stops.txt': [
    'stop_id,stop_name,stop_lat,stop_lon',
    'stop-1,"Plaza, central",-24.79,-65.41',
    'stop-2,Terminal,-24.80,-65.42',
  ].join('\r\n'),
  'trips.txt': ['route_id,service_id,trip_id', 'route-1,weekday,trip-1'].join('\n'),
  'stop_times.txt': [
    'trip_id,arrival_time,departure_time,stop_id,stop_sequence',
    'trip-1,06:00:00,06:00:00,stop-1,1',
    'trip-1,06:15:00,06:15:00,stop-2,2',
  ].join('\n'),
  'calendar.txt': [
    'service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date',
    'weekday,1,1,1,1,1,0,0,20261001,20261231',
  ].join('\n'),
};

describe('parseCsvTable', () => {
  it('supports BOM, quoted commas, escaped quotes and CRLF', () => {
    const table = parseCsvTable('\uFEFFstop_id,stop_name\r\nstop-1,"Plaza, ""central"""\r\n');
    expect(table.errors).toEqual([]);
    expect(table.rows[0]?.values.stop_name).toBe('Plaza, "central"');
  });

  it('reports inconsistent column counts', () => {
    const table = parseCsvTable('stop_id,stop_name\nstop-1\n');
    expect(table.errors.some((error) => error.message.includes('se encontraron 1'))).toBe(true);
  });

  it('rejects an unclosed quoted field', () => {
    const table = parseCsvTable('stop_id,stop_name\nstop-1,"Plaza\n');
    expect(table.errors.some((error) => error.message.includes('no se cerró'))).toBe(true);
  });
});

describe('validateGtfsFiles', () => {
  it('accepts a structurally consistent fixed-stop feed', () => {
    const report = validateGtfsFiles(validFeed);
    expect(report.issues).toEqual([]);
    expect(report.errors).toBe(0);
    expect(report.summary).toEqual({ agencies: 1, routes: 1, stops: 2, trips: 1, stopTimes: 2 });
  });

  it('reports missing files, invalid coordinates and broken stop references', () => {
    const feedWithoutCalendar = { ...validFeed };
    delete feedWithoutCalendar['calendar.txt'];
    const report = validateGtfsFiles({
      ...feedWithoutCalendar,
      'stops.txt': [
        'stop_id,stop_name,stop_lat,stop_lon',
        'stop-1,Plaza,110,-65.41',
        'stop-2,Terminal,-24.80,-65.42',
      ].join('\n'),
      'stop_times.txt': [
        'trip_id,arrival_time,departure_time,stop_id,stop_sequence',
        'trip-1,06:00:00,06:00:00,stop-1,1',
        'trip-1,06:15:00,06:15:00,missing-stop,2',
      ].join('\n'),
    });
    expect(report.valid).toBe(false);
    expect(report.issues.some((issue) => issue.code === 'latitude_invalid')).toBe(true);
    expect(report.issues.some((issue) => issue.code === 'stop_reference_invalid')).toBe(true);
    expect(report.issues.some((issue) => issue.code === 'service_calendar_missing')).toBe(true);
  });

  it('detects a trip referencing a nonexistent route', () => {
    const report = validateGtfsFiles({
      ...validFeed,
      'trips.txt': ['route_id,service_id,trip_id', 'missing-route,weekday,trip-1'].join('\n'),
    });
    expect(report.issues.some((issue) => issue.code === 'route_reference_invalid')).toBe(true);
  });

  it('caps the displayed issues while keeping total error counts', () => {
    const manyStops = [
      'stop_id,stop_name,stop_lat,stop_lon',
      ...Array.from({ length: 80 }, (_, index) => `stop-${index},Stop ${index},110,-65.41`),
    ].join('\n');
    const report = validateGtfsFiles({ ...validFeed, 'stops.txt': manyStops });
    expect(report.issues.length).toBeLessThanOrEqual(50);
    expect(report.omittedIssues).toBeGreaterThan(0);
    expect(report.errors).toBeGreaterThan(report.issues.length);
  });
});

describe('GTFS conditional requirements', () => {
  it('accepts calendar_dates without calendar and a single agency with no agency_id', () => {
    const files = { ...validFeed };
    delete files['calendar.txt'];
    files['calendar_dates.txt'] = 'service_id,date,exception_type\nweekday,20261025,1';
    files['agency.txt'] =
      'agency_id,agency_name,agency_url,agency_timezone\n,Test,https://example.org,America/Argentina/Salta';
    files['routes.txt'] = 'route_id,route_long_name,route_type\nroute-1,Prueba,3';
    expect(validateGtfsFiles(files).issues).toEqual([]);
  });
  it('requires agency identifiers and route agency references for multiple agencies', () => {
    const files = {
      ...validFeed,
      'agency.txt':
        'agency_name,agency_url,agency_timezone\nA,https://example.org,UTC\nB,https://example.org,UTC',
      'routes.txt': 'route_id,route_long_name,route_type\nroute-1,Test,3',
    };
    const report = validateGtfsFiles(files);
    expect(report.issues.some((i) => i.code === 'id_missing' && i.file === 'agency.txt')).toBe(
      true,
    );
    expect(report.issues.some((i) => i.code === 'agency_reference_missing')).toBe(true);
  });
  it.each(['11', '12'])('accepts the GTFS core route type %s', (type) => {
    const report = validateGtfsFiles({
      ...validFeed,
      'routes.txt': `route_id,route_long_name,route_type\nroute-1,Test,${type}`,
    });
    expect(report.valid).toBe(true);
  });
  it('reports invalid shape points, duplicate sequences and broken shape references', () => {
    const report = validateGtfsFiles({
      ...validFeed,
      'shapes.txt':
        'shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence\ns,100,-65,1\ns,-24,-65,1',
      'trips.txt': 'route_id,service_id,trip_id,shape_id\nroute-1,weekday,trip-1,missing',
    });
    expect(report.issues.map((i) => i.code)).toEqual(
      expect.arrayContaining([
        'shape_coordinates_invalid',
        'shape_sequence_invalid',
        'shape_reference_invalid',
      ]),
    );
  });
});

describe('CSV resource limits', () => {
  it('rejects a table exceeding the row budget instead of previewing a truncated feed', () => {
    const table = parseCsvTable('stop_id,stop_name\n' + 'synthetic,Test\n'.repeat(100_001));
    expect(table.rows).toEqual([]);
    expect(table.errors[0]?.message).toMatch(/100 000 filas/);
  });
  it('caps retained parser errors while preserving their total in the report', () => {
    const source = 'stop_id,stop_name\n' + 'synthetic\n'.repeat(80);
    const table = parseCsvTable(source);
    expect(table.errors).toHaveLength(50);
    expect(table.errorCount).toBe(80);
    const report = validateGtfsFiles({ ...validFeed, 'stops.txt': source });
    expect(report.errors).toBeGreaterThanOrEqual(80);
    expect(report.issues).toHaveLength(50);
    expect(report.omittedIssues).toBe(report.errors + report.warnings - 50);
  });
});

it('preserves explicit empty CSV fields and reports invalid decimal coordinates and duplicate exceptions', () => {
  const table = parseCsvTable('a,b\n,\n"",""\n');
  expect(table.rows).toHaveLength(2);
  expect(table.rows[0]?.values).toEqual({ a: '', b: '' });
  const report = validateGtfsFiles({
    ...validFeed,
    'stops.txt': 'stop_id,stop_name,stop_lat,stop_lon\nstop-1,Test,0x10,0',
    'calendar_dates.txt': 'service_id,date,exception_type\nweekday,20261025,1\nweekday,20261025,2',
  });
  expect(report.issues.map((i) => i.code)).toEqual(
    expect.arrayContaining(['latitude_invalid', 'service_exception_duplicate']),
  );
});

it('rejects excessively wide tables and oversized fields before retaining unbounded records', () => {
  expect(
    parseCsvTable(Array.from({ length: 257 }, (_, i) => `column_${i}`).join(',')).errors[0]
      ?.message,
  ).toMatch(/256 columnas/);
  expect(parseCsvTable('header\n' + 'x'.repeat(1_000_002)).errors[0]?.message).toMatch(
    /1 000 000 de caracteres/,
  );
});

describe('sequence order and CSV source positions', () => {
  it('accepts interleaved trips and stop records whose sequence order differs from file order', () => {
    const report = validateGtfsFiles({
      ...validFeed,
      'trips.txt': 'route_id,service_id,trip_id\nroute-1,weekday,trip-1\nroute-1,weekday,trip-2',
      'stop_times.txt': [
        'trip_id,arrival_time,departure_time,stop_id,stop_sequence',
        'trip-1,06:15:00,06:15:00,stop-2,20',
        'trip-2,07:00:00,07:00:00,stop-1,0',
        'trip-1,06:00:00,06:00:00,stop-1,0',
        'trip-2,07:15:00,07:15:00,stop-2,20',
      ].join('\n'),
    });
    expect(report.issues).toEqual([]);
  });
  it('rejects duplicate sequences within a trip even when separated by other records', () => {
    const report = validateGtfsFiles({
      ...validFeed,
      'stop_times.txt': [
        'trip_id,arrival_time,departure_time,stop_id,stop_sequence',
        'trip-1,06:00:00,06:00:00,stop-1,1',
        'trip-1,06:15:00,06:15:00,stop-2,2',
        'trip-1,06:30:00,06:30:00,stop-1,1',
      ].join('\n'),
    });
    expect(report.issues).toContainEqual(
      expect.objectContaining({ code: 'stop_sequence_duplicate', file: 'stop_times.txt', row: 4 }),
    );
  });
  it.each(['\n', '\r\n', '\r'])(
    'keeps source line numbers across blank and quoted multiline records (%j)',
    (eol) => {
      const table = parseCsvTable(
        ['', 'stop_id,stop_name', '', 'stop-1,"First', 'second"', 'stop-2'].join(eol),
      );
      expect(table.rows.map((row) => row.row)).toEqual([4, 6]);
      expect(table.errors).toEqual([
        { row: 6, message: 'Se esperaban 2 columnas y se encontraron 1.' },
      ]);
    },
  );
  it('points CSV quoting and missing-column errors at their original record or header line', () => {
    const unclosed = parseCsvTable('\nstop_id,stop_name\n\nstop-1,"First\nsecond');
    expect(unclosed.errors).toContainEqual(
      expect.objectContaining({ row: 4, message: 'Hay un campo entre comillas que no se cerró.' }),
    );
    const report = validateGtfsFiles({ ...validFeed, 'routes.txt': '\n\nroute_id\nroute-1' });
    expect(report.issues).toContainEqual(
      expect.objectContaining({ code: 'columns_missing', file: 'routes.txt', row: 3 }),
    );
  });
});

it('propagates source lines into validation issues after a quoted multiline stop name', () => {
  const report = validateGtfsFiles({
    ...validFeed,
    'stops.txt':
      '\nstop_id,stop_name,stop_lat,stop_lon\n\nstop-1,"First\nsecond",-24,-65\nstop-2,Other,100,-65',
  });
  expect(report.issues).toContainEqual(
    expect.objectContaining({ code: 'latitude_invalid', file: 'stops.txt', row: 6 }),
  );
  const malformed = parseCsvTable('\nstop_id,stop_name\n\nstop-1,"First\nsecond"unexpected');
  expect(malformed.errors).toContainEqual(
    expect.objectContaining({
      row: 4,
      message: 'Hay texto inesperado después de un campo entre comillas.',
    }),
  );
  expect(parseCsvTable('\n\nid,id\n1,2').errors).toContainEqual(
    expect.objectContaining({ row: 3 }),
  );
});
