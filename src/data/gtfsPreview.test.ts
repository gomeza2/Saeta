import { describe, expect, it } from 'vitest';
import { buildGtfsPreview, coordinates } from './gtfsPreview';

import { previewFiles } from '../test/gtfsFixture';

describe('local GTFS preview', () => {
  it('retains imported labels and relates stops only through trips and stop times', () => {
    const data = buildGtfsPreview(previewFiles);
    expect(data.routes[0]).toMatchObject({
      id: 'r1',
      shortName: 'TEST-A',
      stopIds: ['s1', 's2'],
      shapeIds: ['shape1'],
    });
    expect(data.routes[1]?.stopIds).toEqual([]);
    expect(data.stops[1]?.coordinates).toBeNull();
    expect(data.shapes[0]?.points).toEqual([
      [-25, -66],
      [-24, -65],
    ]);
  });
  it('never fabricates geometry when shapes or trip links are missing', () => {
    expect(buildGtfsPreview({ ...previewFiles, 'shapes.txt': '' }).shapes).toEqual([]);
    expect(
      buildGtfsPreview({ ...previewFiles, 'trips.txt': 'route_id,trip_id\nr1,t1' }).shapes,
    ).toEqual([]);
  });
  it.each([
    'shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence\nshape1,100,-65,1\nshape1,-24,-65,2',
    'shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence\nshape1,-24,-65,1\nshape1,-25,-66,1',
    'shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence\nshape1,-24,-65,x\nshape1,-25,-66,2',
  ])('excludes the entire geometry if any point or sequence is invalid', (text) => {
    expect(buildGtfsPreview({ ...previewFiles, 'shapes.txt': text }).shapes).toEqual([]);
  });
  it('excludes ambiguous identifiers and broken trip relations', () => {
    expect(
      buildGtfsPreview({
        ...previewFiles,
        'trips.txt': 'route_id,trip_id\nr1,t1\nr2,t1',
      }).routes.every((r) => r.stopIds.length === 0),
    ).toBe(true);
    expect(
      buildGtfsPreview({
        ...previewFiles,
        'stop_times.txt': 'trip_id,stop_id,stop_sequence\nt1,unknown,1',
      }).routes[0]?.stopIds,
    ).toEqual([]);
    expect(
      buildGtfsPreview({ ...previewFiles, 'stops.txt': 'stop_id,stop_name\ns1,A\ns1,B' }).stops,
    ).toEqual([]);
  });
  it('does not interpret blank, hexadecimal, infinite or out-of-range coordinates as map points', () => {
    for (const [lat, lon] of [
      ['', '0'],
      ['0x10', '0'],
      ['Infinity', '0'],
      ['0', '181'],
    ]) {
      expect(coordinates(lat, lon)).toBeNull();
    }
    expect(coordinates('0', '0')).toEqual([0, 0]);
  });
});
