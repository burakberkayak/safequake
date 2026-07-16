import { AxiosInstance } from 'axios';
import { EarthquakeRepository } from './earthquakeRepository';
import { Earthquake, EarthquakeFilters, EarthquakeSource } from '../types/earthquake.types';
import { filterByRadius, filterByTimeRange } from '../utils/earthquakeFilters';

/**
 * AFAD ve Kandilli verilerini birleştiren Orhan Aydoğdu Deprem API'si için repository implementasyonu.
 * Normalde AFAD genel kullanıma açık kararlı bir endpoint sunmadığı için bu API,
 * hem gerçek zamanlı Kandilli hem de AFAD verilerine programatik erişim sağlar.
 */
export class AfadEarthquakeRepository implements EarthquakeRepository {
  constructor(private readonly http: AxiosInstance) {}

  async getEarthquakes(filters: EarthquakeFilters): Promise<Earthquake[]> {
    // Construct query parameters
    const days = filters.timeRange === '24h' ? 1 : (filters.timeRange === '7d' ? 7 : 30);
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    // Format YYYY-MM-DD
    const yyyy = cutoffDate.getFullYear();
    const mm = String(cutoffDate.getMonth() + 1).padStart(2, '0');
    const dd = String(cutoffDate.getDate()).padStart(2, '0');
    const queryDate = `${yyyy}-${mm}-${dd}`;

    // Orhan Aydoğdu API'sinin tüm kaynaklardan son depremleri getiren endpoint'ini çağırıyoruz
    const response = await this.http.get('/deprem', {
      params: {
        date: queryDate,
        limit: 100
      }
    });
    const rawList = response.data?.result;
    
    let earthquakes = this.mapResponseToEarthquakes(rawList);

    // Minimum büyüklük filtresi (API'den dönen veriyi yerel olarak filtreliyoruz)
    if (filters.minMagnitude) {
      earthquakes = earthquakes.filter((eq) => eq.magnitude >= filters.minMagnitude!);
    }

    // Mesafe/Yarıçap filtresi (konum bazlı arama yapılıyorsa yerel olarak filtreliyoruz)
    if (filters.radiusKm && filters.originLatitude && filters.originLongitude) {
      earthquakes = filterByRadius(
        earthquakes,
        filters.originLatitude,
        filters.originLongitude,
        filters.radiusKm
      );
    }

    // Zaman dilimi filtresi (24s, 7g, 30g)
    return filterByTimeRange(earthquakes, filters.timeRange);
  }

  async getLatestEarthquake(): Promise<Earthquake | null> {
    const list = await this.getEarthquakes({ timeRange: '24h' });
    return list[0] ?? null;
  }

  private mapResponseToEarthquakes(raw: unknown): Earthquake[] {
    if (!Array.isArray(raw)) return [];

    return raw
      .map((item: any) => {
        const provider = String(item.provider ?? '').toUpperCase();
        const source: EarthquakeSource = (provider === 'KANDILLI' || provider === 'AFAD') ? provider : 'AFAD';

        const title = item.title ?? item.lokasyon ?? 'Bilinmiyor';
        const province = item.location_properties?.epiCenter?.name ?? 
          (title.includes('(') ? title.split('(').pop()?.replace(')', '')?.trim() : title) ?? 
          'Bilinmiyor';

        const dateMs = item.timestamp 
          ? item.timestamp * 1000 
          : (item.created_at ? item.created_at * 1000 : Date.now());

        return {
          id: String(item.earthquake_id ?? item.id ?? Math.random().toString()),
          magnitude: Number(item.mag ?? 0),
          depthKm: Number(item.depth ?? 0),
          location: title,
          province,
          latitude: Number(item.geojson?.coordinates?.[1] ?? item.lat ?? NaN),
          longitude: Number(item.geojson?.coordinates?.[0] ?? item.lng ?? NaN),
          occurredAt: new Date(dateMs).toISOString(),
          source,
        };
      })
      .filter((eq) => !isNaN(eq.latitude) && !isNaN(eq.longitude));
  }
}
