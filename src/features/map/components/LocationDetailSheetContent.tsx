import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Linking, Alert, Platform } from 'react-native';
import { MapLocation } from '../types/map.types';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';

interface LocationDetailSheetContentProps {
  location: MapLocation;
}

export const LocationDetailSheetContent: React.FC<LocationDetailSheetContentProps> = ({ location }) => {
  const { colors } = useAppTheme();

  const handleNavigate = () => {
    const { latitude, longitude, name } = location;
    const label = encodeURIComponent(name);
    const url = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}&q=${label}`,
      android: `google.navigation:q=${latitude},${longitude}&label=${label}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
    }) ?? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

    Linking.openURL(url).catch(() => {
      Alert.alert('Hata', 'Navigasyon uygulaması açılamadı.');
    });
  };

  const handleCall = () => {
    if (location.phone) {
      Linking.openURL(`tel:${location.phone}`).catch(() => {
        Alert.alert('Hata', 'Telefon araması başlatılamadı.');
      });
    }
  };

  const typeDetails = {
    shelter: { icon: 'shield-checkmark', color: '#2E7D32', label: 'Toplanma Alanı' },
    hospital: { icon: 'medical', color: '#C62828', label: 'Hastane' },
    pharmacy: { icon: 'bandage', color: '#EF6C00', label: 'Nöbetçi Eczane' },
  }[location.type];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: typeDetails.color + '15' }]}>
          <Ionicons name={typeDetails.icon as any} size={28} color={typeDetails.color} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.typeLabel, { color: typeDetails.color }]}>{typeDetails.label}</Text>
          <Text style={[styles.name, { color: colors.onBackground }]}>{location.name}</Text>
        </View>
      </View>

      <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
        <Ionicons name="location-outline" size={20} color={colors.onSurfaceVariant} />
        <Text style={[styles.addressText, { color: colors.onSurface }]}>{location.address}</Text>
      </View>

      {location.phone && (
        <TouchableOpacity style={[styles.infoRow, { borderBottomColor: colors.border }]} onPress={handleCall}>
          <Ionicons name="call-outline" size={20} color={colors.primary} />
          <Text style={[styles.phoneText, { color: colors.primary }]}>{location.phone}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={[styles.navButton, { backgroundColor: colors.primary }]} onPress={handleNavigate}>
        <Ionicons name="navigate-outline" size={20} color={colors.onPrimary} />
        <Text style={[styles.navButtonText, { color: colors.onPrimary }]}>Yol Tarifi Al</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 32,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  addressText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  phoneText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  navButton: {
    height: 48,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  navButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
});
