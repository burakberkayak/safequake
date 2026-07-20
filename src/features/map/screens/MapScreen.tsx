import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Map, Camera, Marker as MLMarker, type CameraRef } from '@maplibre/maplibre-react-native';
import { useRoute, RouteProp, useIsFocused, useNavigation, NavigationProp } from '@react-navigation/native';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { useAppSelector } from '../../../store/hooks';
import { useEarthquakes } from '../../earthquake/hooks/useEarthquakes';
import { Earthquake } from '../../earthquake/types/earthquake.types';
import { getMagnitudeColor } from '../../../theme/colors';
import { BottomSheet } from '../../../components/BottomSheet';
import { EarthquakeDetailSheetContent } from '../components/EarthquakeDetailSheetContent';
import { ErrorState, LoadingState } from '../../../components/ScreenState';
import { RootTabParamList } from '../../../navigation/types';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';

const TURKEY_CENTER: [number, number] = [35.0, 39.0];
const TURKEY_ZOOM = 5;
const USER_FOCUS_ZOOM = 14;
const EARTHQUAKE_FOCUS_ZOOM = 10;

export const MapScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const cameraRef = useRef<CameraRef>(null);
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const route = useRoute<RouteProp<RootTabParamList, 'Map'>>();
  const isFocused = useIsFocused();

  const focusedEarthquakeId = route.params?.focusedEarthquakeId;
  const paramEarthquake = route.params?.focusedEarthquake;

  const filters = useAppSelector((state) => state.filters.filters);
  const { data: earthquakes, isLoading, isError, refetch } = useEarthquakes(filters);

  const [selectedEarthquake, setSelectedEarthquake] = useState<Earthquake | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Tab bar press listener: when user taps the Map tab icon from the bottom bar,
  // reset selection and clear params so the clean map view is shown.
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress' as any, () => {
      setSelectedEarthquake(null);
      navigation.setParams({
        focusedEarthquakeId: undefined,
        focusedEarthquake: undefined,
      });
    });
    return unsubscribe;
  }, [navigation]);

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

          if (!focusedEarthquakeId && !paramEarthquake) {
            cameraRef.current?.flyTo({
              center: [loc.coords.longitude, loc.coords.latitude],
              zoom: USER_FOCUS_ZOOM,
              duration: 600,
            });
          }
        }
      } catch (err) {
        // Fallback to Turkey default center
      }
    };
    fetchLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Process explicitly passed earthquake parameter from Home screen navigation
  useEffect(() => {
    if (!isFocused) return undefined;

    const target = paramEarthquake || (focusedEarthquakeId && earthquakes ? earthquakes.find((e) => e.id === focusedEarthquakeId) : null);

    if (target) {
      // 1. Show detail sheet for target earthquake
      setSelectedEarthquake(target);

      // 2. Animate camera to target earthquake
      const timer = setTimeout(() => {
        cameraRef.current?.flyTo({
          center: [target.longitude, target.latitude],
          zoom: EARTHQUAKE_FOCUS_ZOOM,
          duration: 800,
        });

        // 3. Immediately consume & clear route params so route.params is clean
        navigation.setParams({
          focusedEarthquakeId: undefined,
          focusedEarthquake: undefined,
        });
      }, 200);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isFocused, paramEarthquake, focusedEarthquakeId, earthquakes, navigation]);

  const handleRecenterUser = () => {
    if (userLocation) {
      cameraRef.current?.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: USER_FOCUS_ZOOM,
        duration: 500,
      });
    } else {
      cameraRef.current?.flyTo({
        center: TURKEY_CENTER,
        zoom: TURKEY_ZOOM,
        duration: 500,
      });
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
      <Map style={StyleSheet.absoluteFill} mapStyle={MAP_STYLE_URL} androidView="surface">
        <Camera ref={cameraRef} initialViewState={{ center: TURKEY_CENTER, zoom: TURKEY_ZOOM }} />

        {/* Render User Location Marker */}
        {userLocation && (
          <MLMarker lngLat={[userLocation.longitude, userLocation.latitude]} id="user-location">
            <View style={styles.userLocationMarkerOuter}>
              <View style={styles.userLocationMarkerInner} />
            </View>
          </MLMarker>
        )}

        {/* Render Earthquake Markers */}
        {(earthquakes ?? []).map((earthquake) => (
          <MLMarker
            key={earthquake.id}
            id={earthquake.id}
            lngLat={[earthquake.longitude, earthquake.latitude]}
            onPress={() => setSelectedEarthquake(earthquake)}
          >
            <View
              style={[
                styles.markerDot,
                { backgroundColor: getMagnitudeColor(earthquake.magnitude) },
              ]}
            />
          </MLMarker>
        ))}
      </Map>

      {/* Recenter Button */}
      <TouchableOpacity
        style={[styles.recenterButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={handleRecenterUser}
      >
        <Ionicons name="navigate" size={20} color={colors.primary} />
      </TouchableOpacity>

      {/* Earthquake Detail Sheet */}
      <BottomSheet visible={!!selectedEarthquake} onClose={() => setSelectedEarthquake(null)}>
        {selectedEarthquake ? (
          <EarthquakeDetailSheetContent earthquake={selectedEarthquake} />
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
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
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
    bottom: 30,
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
