import { Earthquake } from '../types/earthquake.types';

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
