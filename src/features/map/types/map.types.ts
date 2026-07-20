export type MapLocationType = 'shelter' | 'hospital' | 'pharmacy';

export interface MapLocation {
  id: string;
  type: MapLocationType;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
}
