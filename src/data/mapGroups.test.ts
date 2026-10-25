import { describe, expect, it } from 'vitest';
import { groupMapStops } from './mapGroups';
import type { ImportedStop } from './gtfsPreview';

describe('map visual grouping', () => {
  const stops: ImportedStop[] = Array.from({ length: 300 }, (_, i) => ({
    id: `synthetic-${i}`,
    name: 'Synthetic',
    coordinates: [-24 + i * 0.00001, -65],
  }));
  it('groups dense imports at low zoom and separates them when zooming in', () => {
    const groups = groupMapStops(stops, 10);
    expect(groups.length).toBeLessThan(stops.length);
    expect(groups.flat()).toHaveLength(stops.length);
    expect(groupMapStops(stops, 19).length).toBeGreaterThan(groups.length);
  });
  it('keeps small sets individual, excludes missing coordinates and caps visible stops', () => {
    expect(groupMapStops(stops.slice(0, 2), 10)).toHaveLength(2);
    expect(groupMapStops([{ id: 'missing', name: '', coordinates: null }], 10)).toEqual([]);
    expect(
      groupMapStops(
        Array.from({ length: 3000 }, (_, i) => ({ ...stops[0]!, id: String(i) })),
        10,
      ).flat(),
    ).toHaveLength(2000);
  });
});
