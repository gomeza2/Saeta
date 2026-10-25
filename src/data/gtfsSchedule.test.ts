import { describe, expect, it } from 'vitest';
import { buildGtfsPreview } from './gtfsPreview';
import { findDirectJourneys, serviceDate } from './gtfsSchedule';
import { scheduleFiles } from '../test/gtfsScheduleFixture';

function find(files = scheduleFiles, origin = 's1', destination = 's2', date = '2026-10-25') {
  const data = buildGtfsPreview(files);
  return findDirectJourneys(
    data.schedule!,
    origin,
    destination,
    date,
    new Set(data.stops.map((s) => s.id)),
  );
}
describe('published direct schedules', () => {
  it('uses exception-only service dates and preserves hours beyond midnight', () => {
    expect(find().journeys).toEqual([
      {
        tripId: 't1',
        routeId: 'r1',
        departure: '25:00:00',
        arrival: '25:20:00',
        stops: ['s1', 's2'],
      },
    ]);
    expect(find(scheduleFiles, 's1', 's2', '2026-10-26').journeys).toEqual([]);
  });
  it('uses weekly calendars and honors removal exceptions', () => {
    const files = {
      ...scheduleFiles,
      'calendar.txt':
        'service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date\nsvc,1,1,1,1,1,1,1,20261001,20261031',
      'calendar_dates.txt': 'service_id,date,exception_type\nsvc,20261025,2',
    };
    expect(find(files).journeys).toEqual([]);
    expect(find(files, 's1', 's2', '2026-10-26').journeys).toHaveLength(1);
  });
  it('does not invent connections for reversed, same or unknown stops', () => {
    expect(find(scheduleFiles, 's2', 's1').journeys).toEqual([]);
    expect(find(scheduleFiles, 's1', 'unknown').message).toMatch(/paradas existentes/);
    expect(find(scheduleFiles, 's1', 's1').message).toMatch(/diferentes/);
    expect(find(scheduleFiles, 's1', 's3').journeys).toEqual([]);
  });
  it.each([
    't1,s1,1,25:90:00,25:90:00\nt1,s2,2,26:00:00,26:00:00',
    't1,s1,1,25:00:00,25:00:00\nt1,s2,2,24:00:00,24:00:00',
    't1,s1,1,,25:00:00\nt1,s2,2,26:00:00,26:00:00',
    't1,s1,1,25:00:00,25:00:00\nt1,s2,1,26:00:00,26:00:00',
  ])(
    'excludes trips with invalid/incomplete/nonmonotonic times or ambiguous sequences',
    (lines) => {
      expect(
        find({
          ...scheduleFiles,
          'stop_times.txt': `trip_id,stop_id,stop_sequence,arrival_time,departure_time\n${lines}`,
        }).journeys,
      ).toEqual([]);
    },
  );
  it('excludes frequencies and pickup/dropoff restrictions', () => {
    expect(
      find({
        ...scheduleFiles,
        'frequencies.txt': 'trip_id,start_time,end_time,headway_secs\nt1,06:00:00,09:00:00,600',
      }).journeys,
    ).toEqual([]);
    expect(
      find({
        ...scheduleFiles,
        'stop_times.txt':
          'trip_id,stop_id,stop_sequence,arrival_time,departure_time,pickup_type\nt1,s1,1,06:00:00,06:00:00,1\nt1,s2,2,06:20:00,06:20:00,0',
      }).journeys,
    ).toEqual([]);
  });
  it('explains absent calendars, invalid timezone and nonexistent services', () => {
    const noCalendar = { ...scheduleFiles };
    delete noCalendar['calendar_dates.txt'];
    expect(find(noCalendar).message).toMatch(/calendarios válidos/);
    expect(
      find({ ...scheduleFiles, 'agency.txt': 'agency_timezone\nUnknown/Invalid' }).message,
    ).toMatch(/zona horaria/);
    expect(
      find({ ...scheduleFiles, 'trips.txt': 'trip_id,route_id,service_id\nt1,r1,missing' })
        .journeys,
    ).toEqual([]);
  });
  it('rejects impossible dates and conflicting exceptions', () => {
    expect(serviceDate('2026-02-30')).toBeNull();
    expect(serviceDate('2026---10-25')).toBeNull();
    expect(find(scheduleFiles, 's1', 's2', 'invalid').message).toMatch(/fecha de servicio válida/);
    expect(
      find({
        ...scheduleFiles,
        'calendar_dates.txt': 'service_id,date,exception_type\nsvc,20261025,1\nsvc,20261025,2',
      }).message,
    ).toMatch(/repetidas inválidas/);
  });
});
