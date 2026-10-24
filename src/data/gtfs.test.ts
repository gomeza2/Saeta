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
    expect(report.valid).toBe(true);
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
