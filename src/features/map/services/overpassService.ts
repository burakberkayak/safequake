import { distanceKm } from "../../earthquake/utils/earthquakeFilters";

export type NearbyCategory =
  | "hospital"
  | "pharmacy"
  | "fire_station"
  | "police"
  | "shelter";

export interface NearbyPlace {
  id: string;
  category: NearbyCategory;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
}

interface CacheEntry {
  centerLat: number;
  centerLon: number;
  fetchedAt: number;
  places: NearbyPlace[];
}

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.osm.ch/api/interpreter",
];

const cache = new Map<NearbyCategory, CacheEntry>();
const MAX_CACHE_DISTANCE_KM = 5;
const MAX_CACHE_AGE_MS = 5 * 60 * 1000;

/**
 * %100 GERÇEK OpenStreetMap (Overpass API) veritabanından acil durum mekanlarını çeker.
 * HTTP 406 hatalarını engellemek için geçerli User-Agent ve yedek sunucu sorgusu kullanır.
 */
export const fetchNearbyEmergencyPlaces = async (
  category: NearbyCategory,
  lat: number,
  lon: number,
): Promise<NearbyPlace[]> => {
  const now = Date.now();
  const cached = cache.get(category);

  // 1. Önbellek kontrolü (5 km mesafe / 5 dakika süre)
  if (cached) {
    const dist = distanceKm(lat, lon, cached.centerLat, cached.centerLon);
    const age = now - cached.fetchedAt;

    if (dist < MAX_CACHE_DISTANCE_KM && age < MAX_CACHE_AGE_MS) {
      return cached.places;
    }
  }

  const amenityMap: Record<NearbyCategory, string> = {
    hospital: "hospital",
    pharmacy: "pharmacy",
    fire_station: "fire_station",
    police: "police",
    shelter: "shelter",
  };

  const amenityVal = amenityMap[category];
  const query =
    category === "shelter"
      ? `[out:json][timeout:15];(node["amenity"="shelter"](around:10000,${lat},${lon});way["amenity"="shelter"](around:10000,${lat},${lon});node["emergency"="assembly_point"](around:10000,${lat},${lon});way["emergency"="assembly_point"](around:10000,${lat},${lon}););out center;`
      : `[out:json][timeout:15];(node["amenity"="${amenityVal}"](around:10000,${lat},${lon});way["amenity"="${amenityVal}"](around:10000,${lat},${lon});relation["amenity"="${amenityVal}"](around:10000,${lat},${lon}););out center;`;

  // 2. Canlı OpenStreetMap sunucularından %100 gerçek veriyi çek
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "SafeQuakeApp/1.0 (https://safequake.app)",
          Accept: "application/json",
        },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (!response.ok) continue;

      const data = await response.json();
      const elements = data?.elements ?? [];

      const categoryNames: Record<NearbyCategory, string> = {
        hospital: "Hastane",
        pharmacy: "Eczane",
        fire_station: "İtfaiye",
        police: "Polis Merkezi",
        shelter: "Toplanma & Barınma Alanı",
      };

      const places: NearbyPlace[] = elements
        .map((el: any) => {
          const placeLat = el.lat ?? el.center?.lat;
          const placeLon = el.lon ?? el.center?.lon;
          if (!placeLat || !placeLon) return null;

          const rawName =
            el.tags?.name ?? el.tags?.["name:tr"] ?? el.tags?.operator;
          const name = rawName ? rawName.trim() : categoryNames[category];
          const street = el.tags?.["addr:street"] ?? "";
          const city = el.tags?.["addr:city"] ?? el.tags?.["addr:suburb"] ?? "";
          const address =
            [street, city].filter(Boolean).join(", ") || undefined;

          return {
            id: `${category}-${el.id}`,
            category,
            name,
            latitude: Number(placeLat),
            longitude: Number(placeLon),
            address,
          };
        })
        .filter((p: any): p is NearbyPlace => p !== null);

      // Gerçek veriyi önbelleğe kaydet
      cache.set(category, {
        centerLat: lat,
        centerLon: lon,
        fetchedAt: now,
        places,
      });
      return places;
    } catch (err) {
      // Bir sonraki resmi OpenStreetMap sunucusunu dene
    }
  }

  return [];
};
