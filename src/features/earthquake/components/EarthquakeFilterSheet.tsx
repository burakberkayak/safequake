import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setFilters, resetFilters } from '../../../store/slices/filterSlice';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { BottomSheet } from '../../../components/BottomSheet';
import { MagnitudeFilter, RadiusFilter, EarthquakeFilters } from '../types/earthquake.types';
import * as Location from 'expo-location';
import { useTranslation } from '../../../hooks/useTranslation';

interface EarthquakeFilterSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const EarthquakeFilterSheet: React.FC<EarthquakeFilterSheetProps> = ({ visible, onClose }) => {
  const { colors } = useAppTheme();
  const dispatch = useAppDispatch();
  const { language } = useTranslation();
  const currentFilters = useAppSelector((state) => state.filters.filters);

  const [minMagnitude, setMinMagnitudeState] = useState<MagnitudeFilter | undefined>(currentFilters.minMagnitude);
  const [radiusKm, setRadiusKmState] = useState<RadiusFilter | undefined>(currentFilters.radiusKm);
  const [locating, setLocating] = useState(false);

  const handleApply = async () => {
    let lat: number | undefined = undefined;
    let lon: number | undefined = undefined;

    if (radiusKm) {
      setLocating(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            language === 'tr' ? 'Konum İzni Gerekli' : 'Location Permission Required',
            language === 'tr' ? 'Mesafe bazlı filtreleme yapabilmek için konum izni vermeniz gerekmektedir.' : 'Please grant location permission to filter by distance.'
          );
          setLocating(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        lat = location.coords.latitude;
        lon = location.coords.longitude;
      } catch (err) {
        Alert.alert(
          language === 'tr' ? 'Hata' : 'Error',
          language === 'tr' ? 'Konum bilgisi alınamadı.' : 'Could not retrieve location.'
        );
        setLocating(false);
        return;
      }
    }

    const updatedFilters: EarthquakeFilters = {
      minMagnitude,
      radiusKm,
      originLatitude: lat,
      originLongitude: lon,
    };

    dispatch(setFilters(updatedFilters));
    setLocating(false);
    onClose();
  };

  const handleReset = () => {
    setMinMagnitudeState(undefined);
    setRadiusKmState(undefined);
    dispatch(resetFilters());
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.onBackground }]}>{language === 'tr' ? 'Depremleri Filtrele' : 'Filter Earthquakes'}</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={[styles.resetText, { color: colors.primary }]}>{language === 'tr' ? 'Sıfırla' : 'Reset'}</Text>
          </TouchableOpacity>
        </View>

        {/* Büyüklük Filtresi */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>{language === 'tr' ? 'Minimum Büyüklük' : 'Minimum Magnitude'}</Text>
          <View style={styles.optionsRow}>
            {([undefined, 2, 3, 4, 5, 6, 7] as (MagnitudeFilter | undefined)[]).map((mag) => {
              const isActive = minMagnitude === mag;
              const label = mag === undefined ? (language === 'tr' ? 'Hepsi' : 'All') : `${mag}+`;
              return (
                <TouchableOpacity
                  key={mag ?? 'all'}
                  style={[
                    styles.optionButton,
                    { 
                      borderColor: isActive ? colors.primary : colors.border,
                      backgroundColor: isActive ? colors.primary + '15' : colors.surface
                    }
                  ]}
                  onPress={() => setMinMagnitudeState(mag)}
                >
                  <Text style={[styles.optionText, { color: isActive ? colors.primary : colors.onSurface }]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Mesafe Filtresi */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>{language === 'tr' ? 'Konuma Göre Mesafe' : 'Distance by Location'}</Text>
          <View style={styles.optionsRow}>
            {([undefined, 50, 100, 250] as (RadiusFilter | undefined)[]).map((radius) => {
              const isActive = radiusKm === radius;
              const label = radius === undefined ? (language === 'tr' ? 'Tümü' : 'All') : `${radius} km`;
              return (
                <TouchableOpacity
                  key={radius ?? 'all'}
                  style={[
                    styles.optionButton,
                    { 
                      borderColor: isActive ? colors.primary : colors.border,
                      backgroundColor: isActive ? colors.primary + '15' : colors.surface
                    }
                  ]}
                  onPress={() => setRadiusKmState(radius)}
                >
                  <Text style={[styles.optionText, { color: isActive ? colors.primary : colors.onSurface }]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.applyButton, { backgroundColor: colors.primary }]}
          onPress={handleApply}
          disabled={locating}
        >
          {locating ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.onPrimary} size="small" />
              <Text style={[styles.applyButtonText, { color: colors.onPrimary }]}>{language === 'tr' ? 'Konum alınıyor...' : 'Getting location...'}</Text>
            </View>
          ) : (
            <Text style={[styles.applyButtonText, { color: colors.onPrimary }]}>{language === 'tr' ? 'Filtreleri Uygula' : 'Apply Filters'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  resetText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 70,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  applyButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
