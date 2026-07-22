import { useRef, useCallback } from 'react';
import type { CameraRef } from '@maplibre/maplibre-react-native';

interface FlyToOptions {
  duration?: number;
}

/**
 * Harita kamerasını (merkez/zoom) programatik olarak kontrol eden hook.
 *
 * NOT: `cameraRef`'in kendisi dışarı veriliyor çünkü MapLibre'nin `Camera`
 * bileşeni JSX'te `<Camera ref={cameraRef} />` olarak render edilmek
 * zorunda — bu yüzden ref MapScreen'de kalıyor, bu hook sadece "nereye
 * git" mantığını (flyTo) merkezîleştiriyor.
 */
export const useMapCamera = () => {
  const cameraRef = useRef<CameraRef>(null);

  const flyTo = useCallback(
    (center: [number, number], zoom: number, options?: FlyToOptions) => {
      cameraRef.current?.flyTo({
        center,
        zoom,
        duration: options?.duration ?? 600,
      });
    },
    []
  );

  return { cameraRef, flyTo };
};
