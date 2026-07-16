export interface MapLocation {
  id: string;
  type: 'shelter' | 'hospital' | 'pharmacy';
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
}
