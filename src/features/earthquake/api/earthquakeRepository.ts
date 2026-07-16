import { Earthquake, EarthquakeFilters } from '../types/earthquake.types';

/**
 * Repository Pattern: Ekranlar/hook'lar bu soyutlamaya bağımlı olur,
 * somut veri kaynağına (AFAD/Kandilli vb.) değil.
 * Bu, Dependency Inversion Principle (SOLID - D) uygular ve
 * veri kaynağını test/geliştirme sırasında kolayca değiştirmeyi sağlar.
 */
export interface EarthquakeRepository {
  getEarthquakes(filters: EarthquakeFilters): Promise<Earthquake[]>;
  getLatestEarthquake(): Promise<Earthquake | null>;
}
