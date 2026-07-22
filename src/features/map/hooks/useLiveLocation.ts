import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

interface UseLiveLocationOptions {
  /** Ekran o an odakta değilse (başka bir tab'daysa) GPS dinlemeyi durdurur. */
  isActive: boolean;
  /**
   * Yeni bir konum geldiğinde çağrılır (`isInitial=true` ilk tespit,
   * sonrakiler canlı takip güncellemeleri). Kamerayı otomatik kaydırıp
   * kaydırmama kararını (odaklanmış bir deprem/mekan/rota varsa
   * kaydırmama gibi) çağıran taraf (MapScreen) bu callback içinde verir —
   * bu hook sadece GPS'i bilir, kamera/ekran mantığını bilmez.
   */
  onLocationChange?: (coords: Coordinates, isInitial: boolean) => void;
}

/**
 * PRD §8: kullanıcının canlı konumunu dinler ve haritada gösterir
 * (Android emülatörde "yürüme rotası" simülasyonu dahil çalışır).
 */
export const useLiveLocation = ({ isActive, onLocationChange }: UseLiveLocationOptions) => {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);

  // Her render'da güncel callback'i ref'te tutuyoruz ki effect'i yeniden
  // başlatmadan (GPS aboneliğini bozmadan) her zaman en güncel MapScreen
  // state'ine (selectedEarthquake, activeRoute vb.) göre karar versin.
  const onLocationChangeRef = useRef(onLocationChange);
  onLocationChangeRef.current = onLocationChange;

  useEffect(() => {
    if (!isActive) return undefined;

    let subscription: Location.LocationSubscription | null = null;
    let isMounted = true;

    const start = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const initial =
          (await Location.getLastKnownPositionAsync()) ??
          (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }));

        if (initial && isMounted) {
          const coords = {
            latitude: initial.coords.latitude,
            longitude: initial.coords.longitude,
          };
          setUserLocation(coords);
          onLocationChangeRef.current?.(coords, true);
        }

        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 1500, distanceInterval: 1 },
          (location) => {
            if (!isMounted) return;
            const coords = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };
            setUserLocation(coords);
            onLocationChangeRef.current?.(coords, false);
          }
        );
      } catch {
        // Sessiz geç — izin/GPS kapalıysa harita Türkiye varsayılanında kalır.
      }
    };

    start();

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, [isActive]);

  /** "Konuma dön" butonu için tek seferlik, zaman aşımlı konum isteği. */
  const fetchLocationOnDemand = async (): Promise<Coordinates | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;

      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown) {
        const coords = { latitude: lastKnown.coords.latitude, longitude: lastKnown.coords.longitude };
        setUserLocation(coords);
        return coords;
      }

      const locationPromise = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500));
      const result = await Promise.race([locationPromise, timeoutPromise]);

      if (result && 'coords' in result) {
        const coords = { latitude: result.coords.latitude, longitude: result.coords.longitude };
        setUserLocation(coords);
        return coords;
      }
      return userLocation;
    } catch {
      return userLocation;
    }
  };

  return { userLocation, fetchLocationOnDemand };
};
