import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { getOsrmRoute } from '../services/osrmService';
import { NearbyPlace } from '../services/overpassService';
import { distanceKm } from '../../earthquake/utils/earthquakeFilters';

export interface ActiveRoute {
  destinationName: string;
  coordinates: [number, number][];
  distanceKm: number;
  durationMins: number;
}

interface UseMapRouteOptions {
  language: 'tr' | 'en';
}

/**
 * PRD ek özellik: OSRM üzerinden gerçek sürüş rotası çizme ve "en yakın
 * hastane/toplanma alanına tek dokunuşla rota" mantığı.
 */
export const useMapRoute = ({ language }: UseMapRouteOptions) => {
  const [activeRoute, setActiveRoute] = useState<ActiveRoute | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [destinationPlace, setDestinationPlace] = useState<NearbyPlace | null>(null);

  const drawRoute = useCallback(
    async (
      userLocation: { latitude: number; longitude: number } | null,
      targetPlace: NearbyPlace
    ): Promise<boolean> => {
      if (!userLocation) {
        Alert.alert(
          language === 'tr' ? 'Konum Alınamadı' : 'Location Not Found',
          language === 'tr'
            ? 'Rota çizebilmek için lütfen konum izninizin ve cihaz GPS servisinizin açık olduğundan emin olun.'
            : 'Please make sure location permission and GPS are turned on to draw route.'
        );
        return false;
      }

      setIsCalculatingRoute(true);
      const route = await getOsrmRoute(userLocation, targetPlace);
      setIsCalculatingRoute(false);

      if (!route) {
        Alert.alert(
          language === 'tr' ? 'Rota Oluşturulamadı' : 'Route Error',
          language === 'tr' ? 'Sürüş rotası hesaplanırken bir hata oluştu.' : 'Could not calculate driving route.'
        );
        return false;
      }

      const durationMins = Math.round(route.durationSeconds / 60);
      setActiveRoute({
        destinationName: targetPlace.name,
        coordinates: route.coordinates,
        distanceKm: route.distanceMeters / 1000,
        durationMins: durationMins < 1 ? 1 : durationMins,
      });
      setDestinationPlace(targetPlace);
      return true;
    },
    [language]
  );

  /** Bir liste içinden kullanıcıya en yakın olanı bulur. */
  const findNearest = useCallback(
    (
      userLocation: { latitude: number; longitude: number },
      places: NearbyPlace[]
    ): NearbyPlace | null => {
      if (places.length === 0) return null;
      return places.reduce((nearest, place) => {
        const d = distanceKm(userLocation.latitude, userLocation.longitude, place.latitude, place.longitude);
        const nearestD = distanceKm(
          userLocation.latitude,
          userLocation.longitude,
          nearest.latitude,
          nearest.longitude
        );
        return d < nearestD ? place : nearest;
      }, places[0]!);
    },
    []
  );

  /** Kullanıcı hareket ettikçe rotayı dinamik günceller ve arkada kalan çizgiyi siler. */
  const updateRouteProgress = useCallback(
    async (
      userLocation: { latitude: number; longitude: number } | null
    ) => {
      if (!activeRoute || !userLocation || !destinationPlace) return;

      const coords = activeRoute.coordinates;
      if (coords.length === 0) return;

      // 1. Kullanıcı konumuna en yakın olan rota koordinatının indeksini bul
      let minDistance = Infinity;
      let closestIdx = -1;

      for (let i = 0; i < coords.length; i++) {
        const [lon, lat] = coords[i]!;
        const dist = distanceKm(userLocation.latitude, userLocation.longitude, lat, lon);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = i;
        }
      }

      if (closestIdx !== -1) {
        // Eğer en yakın rota noktasına olan mesafe 150 metreden (0.15 km) fazlaysa: Rota dışı (Off-route)!
        // OSRM üzerinden arka planda rotayı sessizce yeniden hesapla.
        if (minDistance > 0.15) {
          try {
            const route = await getOsrmRoute(userLocation, destinationPlace);
            if (route) {
              const durationMins = Math.round(route.durationSeconds / 60);
              setActiveRoute({
                destinationName: destinationPlace.name,
                coordinates: route.coordinates,
                distanceKm: route.distanceMeters / 1000,
                durationMins: durationMins < 1 ? 1 : durationMins,
              });
            }
          } catch (err) {
            console.error('Failed to auto-recalculate route:', err);
          }
        } else {
          // Rota üzerindeyse (On-route): Arkadaki çizgileri silmek için koordinatları dilimle
          const slicedCoords = [...coords.slice(closestIdx)];
          
          // Eğer 2'den az koordinat kalmışsa hedefe varılmıştır, rotayı temizle
          if (slicedCoords.length < 2) {
            clearRoute();
            return;
          }
          
          // İlk koordinatı kullanıcının anlık konumu yap ki mavi daireye mükemmel bağlansın
          slicedCoords[0] = [userLocation.longitude, userLocation.latitude];

          // Kalan mesafeyi hesapla
          let remainingDistMeters = 0;
          for (let i = 0; i < slicedCoords.length - 1; i++) {
            const p1 = slicedCoords[i]!;
            const p2 = slicedCoords[i + 1]!;
            remainingDistMeters += distanceKm(p1[1], p1[0], p2[1], p2[0]) * 1000;
          }

          setActiveRoute(prev => {
            if (!prev) return null;
            return {
              ...prev,
              coordinates: slicedCoords as [number, number][],
              distanceKm: remainingDistMeters / 1000,
              durationMins: Math.max(1, Math.round((remainingDistMeters / 1000) * 1.5)), // sürüş hızı tahminî 1.5 dk / km
            };
          });
        }
      }
    },
    [activeRoute, destinationPlace]
  );

  const clearRoute = useCallback(() => {
    setActiveRoute(null);
    setDestinationPlace(null);
  }, []);

  return { activeRoute, isCalculatingRoute, drawRoute, findNearest, clearRoute, updateRouteProgress };
};
