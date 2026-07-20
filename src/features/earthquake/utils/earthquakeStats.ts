import { Earthquake } from '../types/earthquake.types';

export interface EarthquakeStats {
  totalCount: number;
  maxMagnitude: number;
  maxMagnitudeEarthquake: Earthquake | null;
  avgMagnitude: number;
  avgDepthKm: number;
  magnitudeRanges: {
    minor: { count: number; percentage: number }; // < 3.0
    moderate: { count: number; percentage: number }; // 3.0 - 4.9
    major: { count: number; percentage: number }; // >= 5.0
  };
  depthRanges: {
    shallow: { count: number; percentage: number }; // < 10 km
    deep: { count: number; percentage: number }; // >= 10 km
  };
  topRegions: Array<{ regionName: string; count: number; maxMag: number }>;
}

/**
 * Normalizes a region string to a canonical lookup key.
 * Example: "KUTAHYA" -> "kutahya", "Kütahya" -> "kutahya"
 */
const normalizeKey = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/i/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/[^a-z0-9]/g, '');
};

/**
 * Converts ALL CAPS or raw text to proper Turkish Title Case.
 * Example: "KUTAHYA" -> "Kütahya", "EGE DENIZI" -> "Ege Denizi"
 */
const formatTurkishTitle = (str: string): string => {
  if (!str) return '';
  
  // Common Turkish city corrections dictionary for ALL CAPS ASCII inputs
  const knownCities: Record<string, string> = {
    kutahya: 'Kütahya',
    kahramanmaras: 'Kahramanmaraş',
    malatya: 'Malatya',
    mugla: 'Muğla',
    izmir: 'İzmir',
    istanbul: 'İstanbul',
    ankara: 'Ankara',
    balikesir: 'Balıkesir',
    canakkale: 'Çanakkale',
    elazig: 'Elazığ',
    adyaman: 'Adıyaman',
    adiyaman: 'Adıyaman',
    sanliurfa: 'Şanlıurfa',
    diyarbakir: 'Diyarbakır',
    hakkari: 'Hakkari',
    gaziantep: 'Gaziantep',
    hatay: 'Hatay',
    adana: 'Adana',
    osmaniye: 'Osmaniye',
    bingol: 'Bingöl',
    van: 'Van',
    erzurum: 'Erzurum',
    egedenizi: 'Ege Denizi',
    akdeniz: 'Akdeniz',
    karadeniz: 'Karadeniz',
    marmara: 'Marmara Denizi',
  };

  const key = normalizeKey(str);
  if (knownCities[key]) {
    return knownCities[key];
  }

  // Fallback Turkish title case converter
  return str
    .split(' ')
    .map((word) => {
      if (!word) return '';
      const lower = word
        .replace(/I/g, 'ı')
        .replace(/İ/g, 'i')
        .toLowerCase();

      const upperFirst = lower.charAt(0)
        .replace(/i/g, 'İ')
        .replace(/ı/g, 'I')
        .toUpperCase();

      return upperFirst + lower.slice(1);
    })
    .join(' ');
};

/**
 * Extracts the primary city/region name from a location string.
 * Example: "SIMAV (KUTAHYA)" -> "Kütahya"
 * Example: "Kütahya Merkeze" -> "Kütahya"
 */
const extractRegionName = (location: string): string => {
  // Strip tags like [ILKESEL], [REVISED]
  const cleanLoc = location.replace(/\[.*?\]/g, '').trim();

  // Try extracting inside parentheses: e.g. "SIMAV (KUTAHYA)" -> "KUTAHYA"
  const parentheticalMatch = cleanLoc.match(/\(([^)]+)\)/);
  if (parentheticalMatch && parentheticalMatch[1]) {
    return parentheticalMatch[1].trim();
  }

  // Try dash separated: e.g. "KUTAHYA-SIMAV" -> "KUTAHYA"
  const dashParts = cleanLoc.split('-');
  if (dashParts.length > 1 && dashParts[0]) {
    return dashParts[0].trim();
  }

  return cleanLoc;
};

export const calculateEarthquakeStats = (earthquakes: Earthquake[]): EarthquakeStats => {
  if (!earthquakes || earthquakes.length === 0) {
    return {
      totalCount: 0,
      maxMagnitude: 0,
      maxMagnitudeEarthquake: null,
      avgMagnitude: 0,
      avgDepthKm: 0,
      magnitudeRanges: {
        minor: { count: 0, percentage: 0 },
        moderate: { count: 0, percentage: 0 },
        major: { count: 0, percentage: 0 },
      },
      depthRanges: {
        shallow: { count: 0, percentage: 0 },
        deep: { count: 0, percentage: 0 },
      },
      topRegions: [],
    };
  }

  const totalCount = earthquakes.length;
  let maxMag = -1;
  let maxEq: Earthquake | null = null;
  let sumMag = 0;
  let sumDepth = 0;

  let minorCount = 0;
  let moderateCount = 0;
  let majorCount = 0;

  let shallowCount = 0;
  let deepCount = 0;

  // Key -> { displayName, count, maxMag }
  const regionMap = new Map<string, { displayName: string; count: number; maxMag: number }>();

  for (const eq of earthquakes) {
    sumMag += eq.magnitude;
    sumDepth += eq.depthKm;

    if (eq.magnitude > maxMag) {
      maxMag = eq.magnitude;
      maxEq = eq;
    }

    if (eq.magnitude < 3.0) {
      minorCount++;
    } else if (eq.magnitude < 5.0) {
      moderateCount++;
    } else {
      majorCount++;
    }

    if (eq.depthKm < 10) {
      shallowCount++;
    } else {
      deepCount++;
    }

    const rawRegion = extractRegionName(eq.location);
    const key = normalizeKey(rawRegion);
    const formattedTitle = formatTurkishTitle(rawRegion);

    const existing = regionMap.get(key);
    if (existing) {
      existing.count++;
      if (eq.magnitude > existing.maxMag) {
        existing.maxMag = eq.magnitude;
      }
      // Prefer proper accented Turkish characters if existing is plain uppercase
      if (formattedTitle !== rawRegion && existing.displayName === rawRegion) {
        existing.displayName = formattedTitle;
      }
    } else {
      regionMap.set(key, {
        displayName: formattedTitle,
        count: 1,
        maxMag: eq.magnitude,
      });
    }
  }

  const topRegions = Array.from(regionMap.values())
    .map((data) => ({
      regionName: data.displayName,
      count: data.count,
      maxMag: data.maxMag,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalCount,
    maxMagnitude: maxMag > 0 ? maxMag : 0,
    maxMagnitudeEarthquake: maxEq,
    avgMagnitude: Number((sumMag / totalCount).toFixed(1)),
    avgDepthKm: Number((sumDepth / totalCount).toFixed(1)),
    magnitudeRanges: {
      minor: {
        count: minorCount,
        percentage: Math.round((minorCount / totalCount) * 100),
      },
      moderate: {
        count: moderateCount,
        percentage: Math.round((moderateCount / totalCount) * 100),
      },
      major: {
        count: majorCount,
        percentage: Math.round((majorCount / totalCount) * 100),
      },
    },
    depthRanges: {
      shallow: {
        count: shallowCount,
        percentage: Math.round((shallowCount / totalCount) * 100),
      },
      deep: {
        count: deepCount,
        percentage: Math.round((deepCount / totalCount) * 100),
      },
    },
    topRegions,
  };
};
