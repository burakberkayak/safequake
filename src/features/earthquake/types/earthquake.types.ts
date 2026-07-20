/**
 * PRD §7-9: Ana Sayfa ve Filtreleme için deprem domain modeli.
 * Bu tip; AFAD, Kandilli gibi farklı kaynaklardan gelen veriyi
 * tek bir normalize edilmiş şekle indirger (Adapter/Repository pattern).
 */
export interface Earthquake {
  id: string;
  magnitude: number;
  depthKm: number;
  location: string; // ör. "Bodrum, Muğla"
  province: string;
  latitude: number;
  longitude: number;
  occurredAt: string; // ISO 8601
  source: EarthquakeSource;
}

export type EarthquakeSource = 'AFAD' | 'KANDILLI';

export type MagnitudeFilter = 2 | 3 | 4 | 5 | 6 | 7;
export type RadiusFilter = 50 | 100 | 250; // km

export interface EarthquakeFilters {
  minMagnitude?: MagnitudeFilter;
  radiusKm?: RadiusFilter;
  originLatitude?: number;
  originLongitude?: number;
}

export const defaultEarthquakeFilters: EarthquakeFilters = {};
