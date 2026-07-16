import { createHttpClient } from '../../../api/httpClient';
import { EarthquakeRepository } from './earthquakeRepository';
import { AfadEarthquakeRepository } from './afadEarthquakeRepository';

/**
 * Dependency Injection kompozisyon noktası.
 * Ekranlar/hook'lar somut sınıfları değil bu factory'nin döndürdüğü
 * arayüzü (EarthquakeRepository) kullanır.
 */
let cachedRepository: EarthquakeRepository | null = null;

export const getEarthquakeRepository = (): EarthquakeRepository => {
  if (cachedRepository) return cachedRepository;

  const http = createHttpClient(process.env.EXPO_PUBLIC_AFAD_BASE_URL ?? '');
  cachedRepository = new AfadEarthquakeRepository(http);

  return cachedRepository;
};

/** Test'lerde mock/sahte repository enjekte etmek için */
export const setEarthquakeRepositoryForTesting = (repo: EarthquakeRepository): void => {
  cachedRepository = repo;
};
