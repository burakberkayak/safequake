import { useState, useCallback } from 'react';
import { fetchNearbyEmergencyPlaces, NearbyCategory, NearbyPlace } from '../services/overpassService';

/**
 * PRD §11-12: Kategoriye göre (hastane/eczane/itfaiye/polis/toplanma alanı)
 * yakındaki gerçek OSM verisini getirir ve seçili kategorileri/sonuçları
 * yönetir. Çoklu kategori seçimini destekler.
 */
export const useNearbyPlaces = () => {
  const [selectedCategories, setSelectedCategories] = useState<NearbyCategory[]>(['hospital', 'shelter']);
  const [fetchingCategories, setFetchingCategories] = useState<NearbyCategory[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [isFetchingPlaces, setIsFetchingPlaces] = useState(false);

  /** Belirtilen koordinat çevresinde aktif kategorilerin tamamını sorgular. */
  const fetchPlacesForActiveCategories = useCallback(async (categories: NearbyCategory[], lat: number, lon: number) => {
    if (categories.length === 0) {
      setNearbyPlaces([]);
      return;
    }

    setIsFetchingPlaces(true);
    try {
      const promises = categories.map((cat) => fetchNearbyEmergencyPlaces(cat, lat, lon));
      const results = await Promise.all(promises);
      const allPlaces = results.flat();
      const uniquePlaces = allPlaces.filter(
        (place, index, self) => self.findIndex((p) => p.id === place.id) === index
      );
      setNearbyPlaces(uniquePlaces);
    } catch (err) {
      console.error('Failed to fetch nearby emergency places:', err);
    } finally {
      setIsFetchingPlaces(false);
    }
  }, []);

  /** Kategori çubuğundan filtreyi açıp kapatmak için kullanılır. */
  const toggleCategory = useCallback(async (cat: NearbyCategory, lat: number, lon: number) => {
    let updatedCats: NearbyCategory[];
    const isAlreadySelected = selectedCategories.includes(cat);
    
    if (isAlreadySelected) {
      updatedCats = selectedCategories.filter((c) => c !== cat);
      setSelectedCategories(updatedCats);
      setNearbyPlaces(prev => prev.filter((p) => p.category !== cat));
    } else {
      updatedCats = [...selectedCategories, cat];
      setSelectedCategories(updatedCats);

      setFetchingCategories(prev => [...prev, cat]);
      setIsFetchingPlaces(true);
      try {
        const newPlaces = await fetchNearbyEmergencyPlaces(cat, lat, lon);
        setNearbyPlaces(prev => {
          const combined = [...prev, ...newPlaces];
          return combined.filter(
            (place, index, self) => self.findIndex((p) => p.id === place.id) === index
          );
        });
      } catch (err) {
        console.error(`Failed to fetch places for category ${cat}:`, err);
      } finally {
        setIsFetchingPlaces(false);
        setFetchingCategories(prev => prev.filter(c => c !== cat));
      }
    }
  }, [selectedCategories]);

  /** "En yakın X'e rota" kısayolu için: kategoriyi seçili yapıp verisini getirir. */
  const fetchCategory = useCallback(async (cat: NearbyCategory, lat: number, lon: number): Promise<NearbyPlace[]> => {
    setIsFetchingPlaces(true);
    try {
      const newPlaces = await fetchNearbyEmergencyPlaces(cat, lat, lon);
      setNearbyPlaces(prev => {
        const combined = [...prev.filter(p => p.category !== cat), ...newPlaces];
        return combined.filter(
          (place, index, self) => self.findIndex((p) => p.id === place.id) === index
        );
      });
      setSelectedCategories(prev => {
        if (!prev.includes(cat)) {
          return [...prev, cat];
        }
        return prev;
      });
      return newPlaces;
    } catch (err) {
      console.error(`Failed to fetch places for quick routing:`, err);
      return [];
    } finally {
      setIsFetchingPlaces(false);
    }
  }, []);

  const clearPlaces = useCallback(() => {
    setSelectedCategories([]);
    setNearbyPlaces([]);
  }, []);

  return {
    selectedCategories,
    fetchingCategories,
    nearbyPlaces,
    isFetchingPlaces,
    toggleCategory,
    fetchCategory,
    clearPlaces,
    fetchPlacesForActiveCategories,
  };
};
