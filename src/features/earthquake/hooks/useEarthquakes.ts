import { useQuery } from '@tanstack/react-query';
import { getEarthquakeRepository } from '../api/earthquakeRepositoryFactory';
import { EarthquakeFilters } from '../types/earthquake.types';

const EARTHQUAKES_QUERY_KEY = 'earthquakes';

/**
 * API Rate Limit (Maks 40 istek/dk) uyumluluğu için:
 * - refetchInterval: 60_000 (1 dakikada bir otomatik güncelleme)
 * - staleTime: 60_000 (60 saniye önbellek tazeliği)
 * - refetchOnWindowFocus: false (Gereksiz odak içi isteklerini engeller)
 */
export const useEarthquakes = (filters: EarthquakeFilters = {}) => {
  return useQuery({
    queryKey: [EARTHQUAKES_QUERY_KEY, filters],
    queryFn: () => getEarthquakeRepository().getEarthquakes(filters),
    refetchInterval: 60_000,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
};

/**
 * Son depremi çekmek için ekstra HTTP isteği atmak yerine 
 * useEarthquakes önbellek verisinden ilk elemanı alarak API istek sayısını %50 azaltır.
 */
export const useLatestEarthquake = () => {
  const { data, isLoading, isError, refetch } = useEarthquakes({});
  const latest = data && data.length > 0 ? data[0] : null;

  return {
    data: latest,
    isLoading,
    isError,
    refetch,
  };
};
