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
    const days = filters.timeRange === '24h' ? 1 : (filters.timeRange === '7d' ? 7 : 30);
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    // YYYY-MM-DD HH:mm:ss formatında tarih oluşturucu
    const formatDate = (date: Date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const hh = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      const ss = String(date.getSeconds()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
    };

    const dateStarts = formatDate(cutoffDate);
    const dateEnds = formatDate(now);

    // İstek gövdesini (payload) oluşturuyoruz
    const payload: any = {
      match: {
        date_starts: dateStarts,
        date_ends: dateEnds
      },
      sort: 'date_-1',
      limit: 100
    };

    // Sunucu tarafında büyüklük filtresi ekleme
    if (filters.minMagnitude !== undefined) {
      payload.match.mag = Number(filters.minMagnitude);
    }

    // Sunucu tarafında konum/yarıçap filtresi ekleme
    if (filters.radiusKm && filters.originLatitude && filters.originLongitude) {
      payload.geoNear = {
        lon: Number(filters.originLongitude),
        lat: Number(filters.originLatitude),
        radiusMeter: Number(filters.radiusKm) * 1000
      };
    }

    try {
      // Sunucu tarafında filtrelenmiş veriyi çekiyoruz
      const response = await this.http.post('/deprem/data/search', payload);

      const rawList = response.data?.result ?? [];
      let earthquakes = this.mapResponseToEarthquakes(rawList);

      // Güvenlik önlemi olarak yerel filtreleri de koruyoruz
      if (filters.minMagnitude !== undefined) {
        earthquakes = earthquakes.filter((eq) => eq.magnitude >= filters.minMagnitude!);
      }

      if (filters.radiusKm && filters.originLatitude && filters.originLongitude) {
        earthquakes = filterByRadius(
          earthquakes,
          filters.originLatitude,
          filters.originLongitude,
          filters.radiusKm
        );
      }

      // Zaman dilimi filtresi (24s, 7g, 30g)
      return filterByTimeRange(earthquakes, filters.timeRange, now);
    } catch (error) {
      console.error('Earthquake search API error:', error);
      return [];
    }
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
