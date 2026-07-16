import { useQuery } from '@tanstack/react-query';
import { getEarthquakeRepository } from '../api/earthquakeRepositoryFactory';
import { EarthquakeFilters } from '../types/earthquake.types';

const EARTHQUAKES_QUERY_KEY = 'earthquakes';

/**
 * PRD §7: "Liste sürekli güncellenmeli" -> refetchInterval.
 * PRD §7: "Pull To Refresh olmalı" -> refetch fonksiyonu ekranda kullanılır.
 */
export const useEarthquakes = (filters: EarthquakeFilters) => {
  return useQuery({
    queryKey: [EARTHQUAKES_QUERY_KEY, filters],
    queryFn: () => getEarthquakeRepository().getEarthquakes(filters),
    refetchInterval: 60_000, // 1 dakikada bir otomatik güncelle
    staleTime: 30_000,
  });
};

export const useLatestEarthquake = () => {
  return useQuery({
    queryKey: [EARTHQUAKES_QUERY_KEY, 'latest'],
    queryFn: () => getEarthquakeRepository().getLatestEarthquake(),
    refetchInterval: 60_000,
  });
};
