import axios from "axios";

export interface RouteResult {
  coordinates: [number, number][]; // [[longitude, latitude], ...]
  distanceMeters: number;
  durationSeconds: number;
}

/**
 * Open Source Routing Machine (OSRM) sunucularından %100 GERÇEK canlı araç sürüş rotası çeker.
 * Kesinlikle hiçbir uydurma / yapay rota üretmez.
 */
export const getOsrmRoute = async (
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number },
): Promise<RouteResult | null> => {
  const endpoints = [
    `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`,
    `https://routing.openstreetmap.de/routed-car/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`,
  ];

  for (const url of endpoints) {
    try {
      const response = await axios.get(url, { timeout: 6000 });
      const route = response.data?.routes?.[0];

      if (
        route &&
        route.geometry?.coordinates &&
        route.geometry.coordinates.length > 0
      ) {
        return {
          coordinates: route.geometry.coordinates,
          distanceMeters: route.distance,
          durationSeconds: route.duration,
        };
      }
    } catch (err) {
      // Bir sonraki resmi OSRM sunucusunu dene
    }
  }

  // OSRM sunucuları kapalıysa veya veri alınamadıysa null dön (Asla uydurma veri yok)
  return null;
};
