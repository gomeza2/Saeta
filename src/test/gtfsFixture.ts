// Synthetic identifiers only; this fixture is not SAETA transport information.
export const previewFiles = {
  'routes.txt':
    'route_id,route_short_name,route_long_name,route_type\nr1,TEST-A,Prueba norte,3\nr2,TEST-B,Prueba sur,3',
  'stops.txt':
    'stop_id,stop_name,stop_lat,stop_lon\ns1,Parada ficticia A,-24,-65\ns2,Parada ficticia B,95,-65\ns3,Sin relación,,',
  'trips.txt': 'route_id,service_id,trip_id,shape_id\nr1,svc,t1,shape1',
  'stop_times.txt': 'trip_id,stop_id,stop_sequence\nt1,s2,2\nt1,s1,1',
  'shapes.txt':
    'shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence\nshape1,-24,-65,2\nshape1,-25,-66,1',
};
