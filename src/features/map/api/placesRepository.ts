import axios from 'axios';
import { MapLocation } from '../types/map.types';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export const fetchNearbyPlaces = async (lat: number, lon: number): Promise<MapLocation[]> => {
  const locations: MapLocation[] = [];

  if (!API_KEY) {
    console.warn('Google Maps API Key is missing in environment variables.');
    return [];
  }

  try {
    // 1. Fetch hospitals nearby
    const hospitalPromise = axios.post(
      'https://places.googleapis.com/v1/places:searchNearby',
      {
        includedTypes: ['hospital'],
        maxResultCount: 8,
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lon },
            radius: 3000.0,
          },
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': API_KEY,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.internationalPhoneNumber',
        },
      }
    );

    // 2. Fetch pharmacies nearby
    const pharmacyPromise = axios.post(
      'https://places.googleapis.com/v1/places:searchNearby',
      {
        includedTypes: ['pharmacy'],
        maxResultCount: 8,
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lon },
            radius: 3000.0,
          },
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': API_KEY,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.internationalPhoneNumber',
        },
      }
    );

    // 3. Fetch shelters (assembly areas) nearby via Text Search
    const shelterPromise = axios.post(
      'https://places.googleapis.com/v1/places:searchText',
      {
        textQuery: 'afet toplanma alanı',
        locationBias: {
          circle: {
            center: { latitude: lat, longitude: lon },
            radius: 5000.0,
          },
        },
        maxResultCount: 8,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': API_KEY,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.internationalPhoneNumber',
        },
      }
    );

    const [hospitalsRes, pharmaciesRes, sheltersRes] = await Promise.allSettled([
      hospitalPromise,
      pharmacyPromise,
      shelterPromise,
    ]);

    if (hospitalsRes.status === 'fulfilled') {
      const places = hospitalsRes.value.data.places || [];
      places.forEach((p: any) => {
        locations.push({
          id: p.id,
          type: 'hospital',
          name: p.displayName?.text || 'Hastane',
          address: p.formattedAddress || '',
          latitude: p.location.latitude,
          longitude: p.location.longitude,
          phone: p.internationalPhoneNumber || undefined,
        });
      });
    }

    if (pharmaciesRes.status === 'fulfilled') {
      const places = pharmaciesRes.value.data.places || [];
      places.forEach((p: any) => {
        locations.push({
          id: p.id,
          type: 'pharmacy',
          name: p.displayName?.text || 'Eczane',
          address: p.formattedAddress || '',
          latitude: p.location.latitude,
          longitude: p.location.longitude,
          phone: p.internationalPhoneNumber || undefined,
        });
      });
    }

    if (sheltersRes.status === 'fulfilled') {
      const places = sheltersRes.value.data.places || [];
      places.forEach((p: any) => {
        locations.push({
          id: p.id,
          type: 'shelter',
          name: p.displayName?.text || 'Toplanma Alanı',
          address: p.formattedAddress || '',
          latitude: p.location.latitude,
          longitude: p.location.longitude,
          phone: p.internationalPhoneNumber || undefined,
        });
      });
    }

    return locations;
  } catch (err) {
    console.error('Error fetching from Google Places API:', err);
    throw err;
  }
};
