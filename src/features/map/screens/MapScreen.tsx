import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Platform, StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';

// Safely require WebView for native platforms to avoid Web build evaluation crashes
let WebView: any = null;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}
import { useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { useEarthquakes } from '../../earthquake/hooks/useEarthquakes';
import { Earthquake } from '../../earthquake/types/earthquake.types';
import { getLeafletMapTemplate } from '../../earthquake/utils/mapTemplate';
import { BottomSheet } from '../../../components/BottomSheet';
import { EarthquakeDetailSheetContent } from '../components/EarthquakeDetailSheetContent';
import { LocationDetailSheetContent } from '../components/LocationDetailSheetContent';
import { ErrorState, LoadingState } from '../../../components/ScreenState';
import { MapTabParamList } from '../../../navigation/types';
import { MapLocation } from '../types/map.types';
import { fetchNearbyPlaces } from '../api/placesRepository';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

export const MapScreen: React.FC = () => {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<any>(null);
  const route = useRoute<RouteProp<MapTabParamList, 'MapHome'>>();
  const focusedEarthquakeId = route.params?.focusedEarthquakeId;
  const focusedEarthquakeParam = route.params?.focusedEarthquake;

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
  const [isMapReady, setIsMapReady] = useState(false);

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
        }
      } catch (err) {
        // Quiet fail, fallback to Turkey default
      }
    };
    fetchLocation();
  }, []);

  const [mapLocations, setMapLocations] = useState<MapLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  useEffect(() => {
    if (!userLocation) return;
    let active = true;
    
    // Rate Limiting: Debounce Places API calls by 1500ms to avoid API spam on fast location updates
    const delayDebounceFn = setTimeout(async () => {
      setLoadingLocations(true);
      try {
        const places = await fetchNearbyPlaces(userLocation.latitude, userLocation.longitude);
        if (active) {
          setMapLocations(places);
        }
      } catch (err) {
        console.error('Error fetching places:', err);
      } finally {
        if (active) {
          setLoadingLocations(false);
        }
      }
    }, 1500);

    return () => {
      active = false;
      clearTimeout(delayDebounceFn);
    };
  }, [userLocation]);

  // Earthquakes query
  const { data: earthquakes, isLoading, isError, refetch } = useEarthquakes({
    timeRange: '7d',
  });

  const focusedEarthquake = useMemo(
    () => focusedEarthquakeParam || earthquakes?.find((eq) => eq.id === focusedEarthquakeId) || null,
    [earthquakes, focusedEarthquakeId, focusedEarthquakeParam]
  );

  const focusedLocation = route.params?.focusedLocation;

  // Sync route param focused objects to detail sheet states
  useEffect(() => {
    if (focusedLocation) {
      setSelectedLocation({
        id: 'focused_temp',
        type: 'shelter',
        name: focusedLocation.name,
        address: 'Yakınınızın Bildirdiği Son Konum',
        latitude: focusedLocation.latitude,
        longitude: focusedLocation.longitude,
      });
      setSelectedEarthquake(null);
    } else if (focusedEarthquake) {
      setSelectedEarthquake(focusedEarthquake);
      setSelectedLocation(null);
    }
  }, [focusedEarthquake, focusedLocation]);

  // Generate map HTML content
  const mapHtml = useMemo(() => getLeafletMapTemplate(isDark ? 'dark' : 'light'), [isDark]);

  // Send data to WebView when map is ready or when data changes
  useEffect(() => {
    if (webViewRef.current && isMapReady) {
      let mergedEarthquakes = [...(earthquakes ?? [])];
      if (focusedEarthquake && !mergedEarthquakes.some(eq => eq.id === focusedEarthquake.id)) {
        mergedEarthquakes.push(focusedEarthquake);
      }

      const messageData = JSON.stringify({
        type: 'UPDATE_DATA',
        payload: {
          earthquakes: mergedEarthquakes,
          locations: mapLocations ?? [],
          userLocation: userLocation,
          focusedEarthquakeId: focusedEarthquakeId,
          focusedLocation: focusedLocation,
          toggles: {
            showEarthquakes,
            showShelters,
            showHospitals,
            showPharmacies
          }
        }
      });

      if (Platform.OS === 'web') {
        const iframe = webViewRef.current as any;
        iframe?.contentWindow?.postMessage(messageData, '*');
      } else {
        webViewRef.current.postMessage(messageData);
      }
    }
  }, [
    isMapReady,
    earthquakes,
    focusedEarthquake,
    mapLocations,
    userLocation,
    focusedEarthquakeId,
    focusedLocation,
    showEarthquakes,
    showShelters,
    showHospitals,
    showPharmacies
  ]);

  const handleRecenterUser = () => {
    if (userLocation && webViewRef.current) {
      const messageData = JSON.stringify({ type: 'RECENTER_USER' });
      if (Platform.OS === 'web') {
        (webViewRef.current as any).contentWindow?.postMessage(messageData, '*');
      } else {
        webViewRef.current.postMessage(messageData);
      }
    }
  };

  // Web event listener for postMessages from inside the iframe
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleWebMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[Web Map Event]', data.type, data.payload ? JSON.stringify(data.payload).substring(0, 100) : '');
        if (data.type === 'SELECT_EARTHQUAKE') {
          setSelectedEarthquake(data.payload);
          setSelectedLocation(null);
        } else if (data.type === 'SELECT_LOCATION') {
          setSelectedLocation(data.payload);
          setSelectedEarthquake(null);
        } else if (data.type === 'CONSOLE_ERROR') {
          console.error('[Web Map JS Error]', data.payload);
        }
      } catch (e) {
        // Ignored
      }
    };
    window.addEventListener('message', handleWebMessage);
    return () => window.removeEventListener('message', handleWebMessage);
  }, []);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('[Native Map Event]', data.type, data.payload ? JSON.stringify(data.payload).substring(0, 100) : '');
      if (data.type === 'SELECT_EARTHQUAKE') {
        setSelectedEarthquake(data.payload);
        setSelectedLocation(null);
      } else if (data.type === 'SELECT_LOCATION') {
        setSelectedLocation(data.payload);
        setSelectedEarthquake(null);
      } else if (data.type === 'MAP_READY') {
        console.log('[Native Map] isMapReady = true');
        setIsMapReady(true);
      } else if (data.type === 'CONSOLE_ERROR') {
        console.error('[Native Map JS Error]', data.payload);
      }
    } catch (err) {
      console.error('Error handling message from WebView:', err);
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
      {Platform.OS === 'web' ? (
        <iframe
          ref={webViewRef as any}
          srcDoc={mapHtml}
          style={{
            border: 'none',
            width: '100%',
            height: '100%',
            position: 'absolute',
          }}
          onLoad={() => {
            setIsMapReady(true);
          }}
        />
      ) : (
        <WebView
          ref={webViewRef}
          style={StyleSheet.absoluteFill}
          originWhitelist={['*']}
          source={{ html: mapHtml }}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      )}

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
  floatingControlsContainer: {
    position: 'absolute',
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
