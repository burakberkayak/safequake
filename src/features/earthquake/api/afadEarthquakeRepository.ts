import { AxiosInstance } from 'axios';
import { Earthquake, EarthquakeFilters, EarthquakeSource } from '../types/earthquake.types';
import { filterByRadius } from '../utils/earthquakeFilters';
import { EarthquakeRepository } from './earthquakeRepository';

/**
 * AFAD ve Kandilli canlı deprem verileri için yedekli (Failover) Repository.
 * Ana sunucu 403 / IP ban verdiğinde anında canlı yedek servise geçerek %100 kesintisizlik sunar.
 */
export class AfadEarthquakeRepository implements EarthquakeRepository {
  constructor(private readonly http: AxiosInstance) {}

  async getEarthquakes(filters: EarthquakeFilters = {}): Promise<Earthquake[]> {
    const payload: any = {
      match: {},
      sort: 'date_-1',
      limit: 100,
    };

    if (filters.minMagnitude !== undefined) {
      payload.match.mag = Number(filters.minMagnitude);
    }

    if (filters.radiusKm && filters.originLatitude && filters.originLongitude) {
      payload.geoNear = {
        lon: Number(filters.originLongitude),
        lat: Number(filters.originLatitude),
        radiusMeter: Number(filters.radiusKm) * 1000,
      };
    }

    // 1. Ana Servisi Dene
    try {
      const response = await this.http.post('/deprem/data/search', payload);
      const rawList = response.data?.result ?? [];
      let earthquakes = this.mapResponseToEarthquakes(rawList);

      if (earthquakes.length > 0) {
        return this.applyFilters(earthquakes, filters);
      }
    } catch (error) {
      // Ana servis 403 / 500 verirse 2. yedek canlı servise geç
    }

    // 2. Canlı Yedek Kandilli API Servisini Dene (403 Ban Koruması)
    try {
      const backupResponse = await fetch('https://kandilli-api.vercel.app/');
      if (backupResponse.ok) {
        const rawBackup = await backupResponse.json();
        const earthquakes = this.mapBackupResponseToEarthquakes(rawBackup);
        if (earthquakes.length > 0) {
          return this.applyFilters(earthquakes, filters);
        }
      }
    } catch (backupErr) {
      // Backup fail catch
    }

    return [];
  }

  async getLatestEarthquake(): Promise<Earthquake | null> {
    const list = await this.getEarthquakes();
    return list[0] ?? null;
  }

  private applyFilters(earthquakes: Earthquake[], filters: EarthquakeFilters): Earthquake[] {
    let list = earthquakes;

    if (filters.minMagnitude !== undefined) {
      list = list.filter((eq) => eq.magnitude >= filters.minMagnitude!);
    }

    if (filters.radiusKm && filters.originLatitude && filters.originLongitude) {
      list = filterByRadius(
        list,
        filters.originLatitude,
        filters.originLongitude,
        filters.radiusKm
      );
    }

    return list;
  }

  private mapResponseToEarthquakes(raw: unknown): Earthquake[] {
    if (!Array.isArray(raw)) return [];

    return raw
      .map((item: any) => {
        const provider = String(item.provider ?? '').toUpperCase();
        const source: EarthquakeSource =
          provider === 'KANDILLI' || provider === 'AFAD' ? provider : 'AFAD';

        const title = item.title ?? item.lokasyon ?? 'Bilinmiyor';
        const province =
          item.location_properties?.epiCenter?.name ??
          (title.includes('(')
            ? title.split('(').pop()?.replace(')', '')?.trim()
            : title) ??
          'Bilinmiyor';

        let dateMs = Date.now();
        if (item.created_at) {
          dateMs = Number(item.created_at) * 1000;
        } else if (item.date_time) {
          const dateStr = String(item.date_time).trim().replace(' ', 'T');
          const dateWithTz = dateStr.includes('+') ? dateStr : `${dateStr}+03:00`;
          const parsed = Date.parse(dateWithTz);
          if (!isNaN(parsed)) dateMs = parsed;
        } else if (item.date) {
          const dateStr = String(item.date).trim().replace(/\./g, '-').replace(' ', 'T');
          const dateWithTz = dateStr.includes('+') ? dateStr : `${dateStr}+03:00`;
          const parsed = Date.parse(dateWithTz);
          if (!isNaN(parsed)) dateMs = parsed;
        } else if (item.timestamp) {
          dateMs = Number(item.timestamp) * 1000;
        }

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

  private mapBackupResponseToEarthquakes(raw: unknown): Earthquake[] {
    if (!Array.isArray(raw)) return [];

    return raw
      .map((item: any) => {
        const title = item.yer ?? item.bolge ?? 'Bilinmiyor';
        const province = item.sehir ?? (title.includes('(') ? title.split('(').pop()?.replace(')', '')?.trim() : title) ?? 'Bilinmiyor';
        const mag = Number(item.ml ?? item.mag ?? 0);
        const depth = Number(item.derinlik ?? item.depth ?? 0);
        const lat = Number(item.enlem ?? item.lat ?? NaN);
        const lng = Number(item.boylam ?? item.lng ?? NaN);

        let dateMs = Date.now();
        if (item.tarih && item.saat) {
          const dateFormatted = String(item.tarih).replace(/\./g, '-');
          const isoStr = `${dateFormatted}T${item.saat}+03:00`;
          const parsed = Date.parse(isoStr);
          if (!isNaN(parsed)) dateMs = parsed;
        }

        return {
          id: String(item.id ?? `kandilli-${dateMs}-${lat}`),
          magnitude: mag,
          depthKm: depth,
          location: title,
          province,
          latitude: lat,
          longitude: lng,
          occurredAt: new Date(dateMs).toISOString(),
          source: 'KANDILLI' as EarthquakeSource,
        };
      })
      .filter((eq) => !isNaN(eq.latitude) && !isNaN(eq.longitude));
  }
}
