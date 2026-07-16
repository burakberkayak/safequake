import { Earthquake, TimeRangeFilter } from '../types/earthquake.types';

const RANGE_TO_MS: Record<TimeRangeFilter, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

export const filterByTimeRange = (
  earthquakes: Earthquake[],
  range: TimeRangeFilter,
  now: Date = new Date()
): Earthquake[] => {
  const cutoff = now.getTime() - RANGE_TO_MS[range];
  return earthquakes.filter((eq) => new Date(eq.occurredAt).getTime() >= cutoff);
};

/** Haversine formülü ile iki koordinat arası km cinsinden mesafe */
export const distanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const filterByRadius = (
  earthquakes: Earthquake[],
  originLat: number,
  originLon: number,
  radiusKm: number
): Earthquake[] =>
  earthquakes.filter(
    (eq) => distanceKm(originLat, originLon, eq.latitude, eq.longitude) <= radiusKm
  );
