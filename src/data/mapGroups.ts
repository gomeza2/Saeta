import type { ImportedStop } from './gtfsPreview';

/** Visual groups only; group anchors are existing imported stops, never vehicle positions. */
export function groupMapStops(stops: ImportedStop[], zoom: number): ImportedStop[][] {
  const valid = stops.filter((s) => s.coordinates).slice(0, 2000);
  if (valid.length <= 200) return valid.map((s) => [s]);
  const scale = 256 * 2 ** zoom;
  const groups = new Map<string, ImportedStop[]>();
  for (const stop of valid) {
    const [lat, lon] = stop.coordinates!;
    const sin = Math.sin((Math.max(-85.05112878, Math.min(85.05112878, lat)) * Math.PI) / 180);
    const x = ((lon + 180) / 360) * scale;
    const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale;
    const key = `${Math.floor(x / 48)}:${Math.floor(y / 48)}`;
    const members = groups.get(key) ?? [];
    members.push(stop);
    groups.set(key, members);
  }
  return [...groups.values()];
}
