import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Linking, Platform } from 'react-native';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { NearbyPlace } from '../services/overpassService';
import { distanceKm } from '../../earthquake/utils/earthquakeFilters';
import { useTranslation } from '../../../hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';

interface LocationDetailSheetContentProps {
  place: NearbyPlace;
  userLocation?: { latitude: number; longitude: number } | null;
  onDrawRoute?: (place: NearbyPlace) => void;
}

export const LocationDetailSheetContent: React.FC<LocationDetailSheetContentProps> = ({
  place,
  userLocation,
  onDrawRoute,
}) => {
  const { colors } = useAppTheme();
  const { language } = useTranslation();

  const categoryConfigs: Record<
    NearbyPlace['category'],
    { titleTR: string; titleEN: string; icon: string; color: string }
  > = {
    hospital: { titleTR: 'Hastane', titleEN: 'Hospital', icon: 'medical', color: '#E53935' },
    pharmacy: { titleTR: 'Eczane', titleEN: 'Pharmacy', icon: 'medkit', color: '#2E7D32' },
    fire_station: { titleTR: 'İtfaiye', titleEN: 'Fire Station', icon: 'flame', color: '#E65100' },
    police: { titleTR: 'Polis Merkezi', titleEN: 'Police Station', icon: 'shield', color: '#1565C0' },
    shelter: { titleTR: 'Toplanma & Barınma', titleEN: 'Assembly / Shelter', icon: 'location', color: '#00838F' },
  };

  const config = categoryConfigs[place.category];

  const distance = userLocation
    ? distanceKm(userLocation.latitude, userLocation.longitude, place.latitude, place.longitude)
    : null;

  const handleGetDirections = () => {
    const scheme = Platform.OS === 'ios' ? 'maps:0,0?q=' : 'geo:0,0?q=';
    const latLng = `${place.latitude},${place.longitude}`;
    const label = encodeURIComponent(place.name);
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });

    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;

    Linking.openURL(url || googleMapsUrl).catch(() => {
      Linking.openURL(googleMapsUrl);
    });
  };

  return (
    <View style={styles.container}>
      {/* Category Header Badge */}
      <View style={styles.headerRow}>
        <View style={[styles.iconBox, { backgroundColor: config.color + '15' }]}>
          <Ionicons name={config.icon as any} size={24} color={config.color} />
        </View>
        <View style={styles.headerTextGroup}>
          <Text style={[styles.categoryTitle, { color: config.color }]}>
            {language === 'tr' ? config.titleTR : config.titleEN}
          </Text>
          {distance !== null && (
            <Text style={[styles.distanceText, { color: colors.onSurfaceVariant }]}>
              📍 {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}{' '}
              {language === 'tr' ? 'uzaklıkta' : 'away'}
            </Text>
          )}
        </View>
      </View>

      {/* Place Name */}
      <Text style={[styles.placeName, { color: colors.onSurface }]}>{place.name}</Text>

      {/* Address if present */}
      {place.address && (
        <View style={styles.addressRow}>
          <Ionicons name="map-outline" size={16} color={colors.onSurfaceVariant} />
          <Text style={[styles.addressText, { color: colors.onSurfaceVariant }]}>
            {place.address}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        {onDrawRoute && (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => onDrawRoute(place)}
          >
            <Ionicons name="git-network-outline" size={18} color="#FFFFFF" />
            <Text style={styles.buttonText}>
              {language === 'tr' ? 'Haritada Rota Çiz' : 'Draw Route'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.secondaryButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={handleGetDirections}
        >
          <Ionicons name="navigate-outline" size={18} color={colors.onSurface} />
          <Text style={[styles.secondaryButtonText, { color: colors.onSurface }]}>
            {language === 'tr' ? 'Dış Harita' : 'External Maps'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextGroup: {
    flex: 1,
    gap: 2,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  placeName: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressText: {
    fontSize: 13,
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  primaryButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
