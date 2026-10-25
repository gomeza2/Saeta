import { previewFiles } from './gtfsFixture';
// Synthetic schedules only; not SAETA timetables.
export const scheduleFiles: Record<string, string> = {
  ...previewFiles,
  'agency.txt':
    'agency_name,agency_url,agency_timezone\nSynthetic,https://example.org,America/Argentina/Salta',
  'calendar_dates.txt': 'service_id,date,exception_type\nsvc,20261025,1',
  'stop_times.txt':
    'trip_id,stop_id,stop_sequence,arrival_time,departure_time\nt1,s1,1,25:00:00,25:00:00\nt1,s2,2,25:20:00,25:20:00',
};
