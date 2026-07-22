import { MapLocation, MapLocationType } from '../types/map.types';
/**
 * Tamamen ücretsiz, API anahtarı gerektirmeyen konum verisi: OpenStreetMap
 * Overpass API. Google Places'in yerini alıyor.
 *
 * Kaynak veri OpenStreetMap katkıcıları tarafından giriliyor; bu yüzden
 * kapsama alanı bölgeye göre değişebilir (büyük şehirlerde genelde iyi,
 * küçük yerleşimlerde eksik olabilir) — bu, ücretli bir API'de bile
 * (ör. Google) toplanma alanları için zaten geçerliydi.
 *
 * Overpass, halka açık paylaşılan bir servis olduğu için nazik kullanım
 * (fair use) kuralına tabidir: agresif/sık istek atmayın. `useNearbyPlaces`
 * hook'u bu yüzden sonuçları önbelleğe alır ve konum değişimlerini debounce
 * eder (bkz. MapScreen.tsx).
 *
 * Kendi sunucunda barındırmak istersen: https://overpass-api.de yerine
 * kendi Overpass instance'ını veya https://overpass.kumi.systems gibi
 * alternatif public sunucuları kullanabilirsin.
 */
const OVERPASS_URL = process.env.EXPO_PUBLIC_OVERPASS_URL ?? 'https://overpass-api.de/api/interpreter';

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

const buildOverpassQuery = (lat: number, lon: number, radiusMeters: number): string => `
[out:json][timeout:25];
(
  node["amenity"="hospital"](around:${radiusMeters},${lat},${lon});
  way["amenity"="hospital"](around:${radiusMeters},${lat},${lon});
  node["amenity"="pharmacy"](around:${radiusMeters},${lat},${lon});
  way["amenity"="pharmacy"](around:${radiusMeters},${lat},${lon});
  node["emergency"="assembly_point"](around:${radiusMeters},${lat},${lon});
  way["emergency"="assembly_point"](around:${radiusMeters},${lat},${lon});
);
out center tags;
`;

const typeFromTags = (tags: Record<string, string> = {}): MapLocationType | null => {
  if (tags.emergency === 'assembly_point') return 'shelter';
  if (tags.amenity === 'hospital') return 'hospital';
  if (tags.amenity === 'pharmacy') return 'pharmacy';
  return null;
};

const defaultNameFor = (type: MapLocationType): string => {
  switch (type) {
    case 'hospital':
      return 'Hastane';
    case 'pharmacy':
      return 'Eczane';
    case 'shelter':
      return 'Toplanma Alanı';
    default:
      return 'Konum';
  }
};

const elementToLocation = (el: OverpassElement): MapLocation | null => {
  const type = typeFromTags(el.tags);
  if (!type) return null;

  const latitude = el.lat ?? el.center?.lat;
  const longitude = el.lon ?? el.center?.lon;
  if (latitude == null || longitude == null) return null;

  const tags = el.tags ?? {};
  const address = [tags['addr:street'], tags['addr:housenumber'], tags['addr:district'] ?? tags['addr:city']]
    .filter(Boolean)
    .join(' ');

  return {
    id: `${el.type}/${el.id}`,
    type,
    name: tags.name ?? defaultNameFor(type),
    address,
    latitude,
    longitude,
    phone: tags.phone ?? tags['contact:phone'],
  };
};

export const fetchNearbyPlaces = async (
  lat: number,
  lon: number,
  radiusMeters = 5000
): Promise<MapLocation[]> => {
  const query = buildOverpassQuery(lat, lon, radiusMeters);

  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: query,
  });

  if (!response.ok) {
    throw new Error(`Overpass API hatası: ${response.status}`);
  }

  const data = await response.json();
  const elements: OverpassElement[] = data.elements ?? [];

  return elements
    .map(elementToLocation)
    .filter((loc): loc is MapLocation => loc !== null);
};
