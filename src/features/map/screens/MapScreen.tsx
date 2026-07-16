import React, { useEffect, useRef, useState, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { useEarthquakes } from '../../earthquake/hooks/useEarthquakes';
import { Earthquake } from '../../earthquake/types/earthquake.types';
import { getMagnitudeColor } from '../../../theme/colors';
import { BottomSheet } from '../../../components/BottomSheet';
import { EarthquakeDetailSheetContent } from '../components/EarthquakeDetailSheetContent';
import { LocationDetailSheetContent } from '../components/LocationDetailSheetContent';
import { ErrorState, LoadingState } from '../../../components/ScreenState';
import { MapTabParamList } from '../../../navigation/types';
import { generateMapLocations, MapLocation } from '../utils/mockMapLocations';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

const TURKEY_REGION: Region = {
  latitude: 39.0,
  longitude: 35.0,
  latitudeDelta: 8,
  longitudeDelta: 8,
};

const FOCUSED_DELTA = 1.5;

export const MapScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const route = useRoute<RouteProp<MapTabParamList, 'MapHome'>>();
  const focusedEarthquakeId = route.params?.focusedEarthquakeId;

  // Selected item detail sheet states
  const [selectedEarthquake, setSelectedEarthquake] = useState<Earthquake | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);

  // Active layers (multi-select toggles)
  const [showEarthquakes, setShowEarthquakes] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [showHospitals, setShowHospitals] = useState(true);
  const [showPharmacies, setShowPharmacies] = useState(true);

  // User location states
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Get user location on mount
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setUserLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });

          // Focus on user location if not focusing on a specific earthquake
          if (!focusedEarthquakeId && mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }, 600);
          }
        }
      } catch (err) {
        // Quiet fail, fallback to Turkey default
      }
    };
    fetchLocation();
  }, [focusedEarthquakeId]);

  // Generate nearby shelters, hospitals, pharmacies
  const mapLocations = useMemo(() => {
    const lat = userLocation?.latitude ?? 41.0082; // Default to Istanbul
    const lon = userLocation?.longitude ?? 28.9784;
    return generateMapLocations(lat, lon);
  }, [userLocation]);

  // Earthquakes query
  const { data: earthquakes, isLoading, isError, refetch } = useEarthquakes({
    timeRange: '7d',
  });

  const focusedEarthquake = useMemo(
    () => earthquakes?.find((eq) => eq.id === focusedEarthquakeId) ?? null,
    [earthquakes, focusedEarthquakeId]
  );

  const focusedLocation = route.params?.focusedLocation;

  useEffect(() => {
    if (focusedLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: focusedLocation.latitude,
          longitude: focusedLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        500
      );
      setSelectedLocation({
        id: 'focused_temp',
        type: 'shelter',
        name: focusedLocation.name,
        address: 'Yakınınızın Bildirdiği Son Konum',
        latitude: focusedLocation.latitude,
        longitude: focusedLocation.longitude,
      });
      setSelectedEarthquake(null);
    } else if (focusedEarthquake && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: focusedEarthquake.latitude,
          longitude: focusedEarthquake.longitude,
          latitudeDelta: FOCUSED_DELTA,
          longitudeDelta: FOCUSED_DELTA,
        },
        400
      );
      setSelectedEarthquake(focusedEarthquake);
      setSelectedLocation(null);
    }
  }, [focusedEarthquake, focusedLocation]);

  const handleRecenterUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      }, 500);
    }
  };

  if (isLoading) {
    return <LoadingState message="Harita ve deprem noktaları yükleniyor..." />;
  }

  if (isError) {
    return <ErrorState message="Harita verileri alınamadı." onRetry={refetch} />;
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={TURKEY_REGION}
      >
        {/* Render User Location custom marker to bypass buggy showsUserLocation in Fabric New Arch */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Konumunuz"
            zIndex={999}
          >
            <View style={styles.userLocationMarkerOuter}>
              <View style={styles.userLocationMarkerInner} />
            </View>
          </Marker>
        )}
        {/* Render Earthquakes */}
        {showEarthquakes &&
          (earthquakes ?? []).map((earthquake) => (
            <Marker
              key={earthquake.id}
              coordinate={{ latitude: earthquake.latitude, longitude: earthquake.longitude }}
              onPress={() => {
                setSelectedEarthquake(earthquake);
                setSelectedLocation(null);
              }}
            >
              <View
                style={[
                  styles.markerDot,
                  { backgroundColor: getMagnitudeColor(earthquake.magnitude) },
                ]}
              />
            </Marker>
          ))}

        {/* Render Shelters, Hospitals, Pharmacies */}
        {mapLocations.map((loc) => {
          if (loc.type === 'shelter' && !showShelters) return null;
          if ((loc.type === 'hospital_state' || loc.type === 'hospital_private') && !showHospitals) return null;
          if (loc.type === 'pharmacy' && !showPharmacies) return null;

          // Custom styling depending on location type
          const details = {
            shelter: { icon: 'shield-checkmark', color: '#2E7D32' },
            hospital_state: { icon: 'medical', color: '#C62828' },
            hospital_private: { icon: 'medical', color: '#0288D1' },
            pharmacy: { icon: 'bandage', color: '#EF6C00' },
          }[loc.type];

          return (
            <Marker
              key={loc.id}
              coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
              onPress={() => {
                setSelectedLocation(loc);
                setSelectedEarthquake(null);
              }}
            >
              <View style={[styles.customMarkerCircle, { backgroundColor: details.color }]}>
                <Ionicons name={details.icon as any} size={14} color="#FFFFFF" />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Floating Layer Controls */}
      <View style={[styles.floatingControlsContainer, { top: Math.max(insets.top, 12) }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.controlsScroll}>
          <TouchableOpacity 
            style={[styles.layerChip, showEarthquakes && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setShowEarthquakes(!showEarthquakes)}
          >
            <Ionicons name="pulse" size={14} color={showEarthquakes ? '#FFFFFF' : colors.primary} />
            <Text style={[styles.layerChipText, { color: showEarthquakes ? '#FFFFFF' : colors.onSurface }]}>Depremler</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.layerChip, showShelters && { backgroundColor: '#2E7D32', borderColor: '#2E7D32' }]}
            onPress={() => setShowShelters(!showShelters)}
          >
            <Ionicons name="shield-checkmark-outline" size={14} color={showShelters ? '#FFFFFF' : '#2E7D32'} />
            <Text style={[styles.layerChipText, { color: showShelters ? '#FFFFFF' : colors.onSurface }]}>Toplanma</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.layerChip, showHospitals && { backgroundColor: '#C62828', borderColor: '#C62828' }]}
            onPress={() => setShowHospitals(!showHospitals)}
          >
            <Ionicons name="medical-outline" size={14} color={showHospitals ? '#FFFFFF' : '#C62828'} />
            <Text style={[styles.layerChipText, { color: showHospitals ? '#FFFFFF' : colors.onSurface }]}>Hastaneler</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.layerChip, showPharmacies && { backgroundColor: '#EF6C00', borderColor: '#EF6C00' }]}
            onPress={() => setShowPharmacies(!showPharmacies)}
          >
            <Ionicons name="bandage-outline" size={14} color={showPharmacies ? '#FFFFFF' : '#EF6C00'} />
            <Text style={[styles.layerChipText, { color: showPharmacies ? '#FFFFFF' : colors.onSurface }]}>Eczaneler</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Floating Recenter Button */}
      {userLocation && (
        <TouchableOpacity 
          style={[styles.recenterButton, { backgroundColor: colors.surface, borderColor: colors.border }]} 
          onPress={handleRecenterUser}
        >
          <Ionicons name="navigate" size={20} color={colors.primary} />
        </TouchableOpacity>
      )}

      {/* Earthquake Details Bottom Sheet */}
      <BottomSheet visible={!!selectedEarthquake} onClose={() => setSelectedEarthquake(null)}>
        {selectedEarthquake ? (
          <EarthquakeDetailSheetContent earthquake={selectedEarthquake} />
        ) : (
          <View />
        )}
      </BottomSheet>

      {/* Assembly Area/Hospital/Pharmacy Details Bottom Sheet */}
      <BottomSheet visible={!!selectedLocation} onClose={() => setSelectedLocation(null)}>
        {selectedLocation ? (
          <LocationDetailSheetContent location={selectedLocation} />
        ) : (
          <View />
        )}
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  markerDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  customMarkerCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  floatingControlsContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  controlsScroll: {
    paddingHorizontal: 16,
    gap: 8,
    height: 40,
    alignItems: 'center',
  },
  layerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  layerChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  userLocationMarkerOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF33',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userLocationMarkerInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#007AFF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  recenterButton: {
    position: 'absolute',
    bottom: 90,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
});
