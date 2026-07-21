import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Map, Camera, Marker as MLMarker, GeoJSONSource, Layer, type CameraRef } from '@maplibre/maplibre-react-native';
import { useRoute, RouteProp, useIsFocused, useNavigation, NavigationProp } from '@react-navigation/native';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { useAppSelector } from '../../../store/hooks';
import { useEarthquakes } from '../../earthquake/hooks/useEarthquakes';
import { Earthquake } from '../../earthquake/types/earthquake.types';
import { distanceKm } from '../../earthquake/utils/earthquakeFilters';
import { BottomSheet } from '../../../components/BottomSheet';
import { EarthquakeDetailSheetContent } from '../components/EarthquakeDetailSheetContent';
import { LocationDetailSheetContent } from '../components/LocationDetailSheetContent';
import { EarthquakeCallout } from '../components/EarthquakeCallout';
import { PulsingMarker } from '../components/PulsingMarker';
import { fetchNearbyEmergencyPlaces, NearbyCategory, NearbyPlace } from '../services/overpassService';
import { getOsrmRoute } from '../services/osrmService';
import { ErrorState, LoadingState } from '../../../components/ScreenState';
import { RootTabParamList } from '../../../navigation/types';
import { useTranslation } from '../../../hooks/useTranslation';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

type MapStyleType = 'bright' | 'liberty' | 'dark' | 'satellite';

const BRIGHT_MAP_URL = 'https://tiles.openfreemap.org/styles/bright';
const LIBERTY_MAP_URL = 'https://tiles.openfreemap.org/styles/liberty';
const DARK_MAP_URL = 'https://tiles.openfreemap.org/styles/dark';

const SATELLITE_STYLE_JSON = JSON.stringify({
  version: 8,
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
    },
  },
  layers: [
    {
      id: 'esri-satellite-layer',
      type: 'raster',
      source: 'esri-satellite',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
});

const TURKEY_CENTER: [number, number] = [35.0, 39.0];
const TURKEY_ZOOM = 5;
const USER_FOCUS_ZOOM = 14;
const EARTHQUAKE_FOCUS_ZOOM = 10;

export const MapScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const { language } = useTranslation();
  const cameraRef = useRef<CameraRef>(null);
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const route = useRoute<RouteProp<RootTabParamList, 'Map'>>();
  const isFocused = useIsFocused();

  const focusedEarthquakeId = route.params?.focusedEarthquakeId;
  const paramEarthquake = route.params?.focusedEarthquake;

  const filters = useAppSelector((state) => state.filters.filters);
  const { data: earthquakes, isLoading, isError, refetch } = useEarthquakes(filters);

  // Declarative camera state
  const [cameraCenter, setCameraCenter] = useState<[number, number]>(TURKEY_CENTER);
  const [cameraZoom, setCameraZoom] = useState<number>(TURKEY_ZOOM);

  // Map readiness & state
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapStyleType, setMapStyleType] = useState<MapStyleType>('bright');
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [selectedEarthquake, setSelectedEarthquake] = useState<Earthquake | null>(null);
  const [previewEarthquake, setPreviewEarthquake] = useState<Earthquake | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<NearbyCategory | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);
  const [isFetchingPlaces, setIsFetchingPlaces] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // OSRM Route state
  const [activeRoute, setActiveRoute] = useState<{
    destinationName: string;
    coordinates: [number, number][];
    distanceKm: number;
    durationMins: number;
  } | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  const categoryChips: { id: NearbyCategory; titleTR: string; titleEN: string; icon: string; color: string }[] = [
    { id: 'hospital', titleTR: 'Hastaneler', titleEN: 'Hospitals', icon: 'medical', color: '#E53935' },
    { id: 'pharmacy', titleTR: 'Eczaneler', titleEN: 'Pharmacies', icon: 'medkit', color: '#2E7D32' },
    { id: 'fire_station', titleTR: 'İtfaiye', titleEN: 'Fire Station', icon: 'flame', color: '#E65100' },
    { id: 'police', titleTR: 'Polis', titleEN: 'Police', icon: 'shield', color: '#1565C0' },
    { id: 'shelter', titleTR: 'Barınma / Toplanma', titleEN: 'Shelter / Assembly', icon: 'location', color: '#00838F' },
  ];

  const mapStyleUrl = mapStyleType === 'satellite' 
    ? SATELLITE_STYLE_JSON 
    : (mapStyleType === 'dark' ? DARK_MAP_URL : (mapStyleType === 'liberty' ? LIBERTY_MAP_URL : BRIGHT_MAP_URL));

  // Tab bar press listener: clear params, clear selections, and return to user location!
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress' as any, () => {
      setSelectedEarthquake(null);
      setPreviewEarthquake(null);
      setSelectedPlace(null);
      setActiveRoute(null);
      setShowStylePicker(false);

      navigation.setParams({
        focusedEarthquakeId: undefined,
        focusedEarthquake: undefined,
      });

      if (userLocation) {
        setCameraCenter([userLocation.longitude, userLocation.latitude]);
        setCameraZoom(USER_FOCUS_ZOOM);
        cameraRef.current?.flyTo({
          center: [userLocation.longitude, userLocation.latitude],
          zoom: USER_FOCUS_ZOOM,
          duration: 600,
        });
      } else {
        setCameraCenter(TURKEY_CENTER);
        setCameraZoom(TURKEY_ZOOM);
        cameraRef.current?.flyTo({
          center: TURKEY_CENTER,
          zoom: TURKEY_ZOOM,
          duration: 600,
        });
      }
    });
    return unsubscribe;
  }, [navigation, userLocation]);

  /**
   * Canlı GPS konum aboneliği (watchPositionAsync).
   * Android Studio emülatörü yürüme rotasını veya cihaz hareketini CANLI olarak dinler.
   */
  useEffect(() => {
    if (!isFocused) return undefined;

    let locationSubscription: Location.LocationSubscription | null = null;
    let isMounted = true;

    const startLocationWatch = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        // Önce hızlı son konuma bak veya anlık konumu çek (Emülatör GPS provider uyumu için High kullanılıyor)
        const initialLoc = await Location.getLastKnownPositionAsync() || await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        if (initialLoc && isMounted) {
          const coords = { latitude: initialLoc.coords.latitude, longitude: initialLoc.coords.longitude };
          setUserLocation(coords);
          setCameraCenter([coords.longitude, coords.latitude]);
          setCameraZoom(USER_FOCUS_ZOOM);
          if (!focusedEarthquakeId && !paramEarthquake && !selectedEarthquake) {
            cameraRef.current?.flyTo({
              center: [coords.longitude, coords.latitude],
              zoom: USER_FOCUS_ZOOM,
              duration: 800,
            });
          }
        }

        // Canlı GPS hareket akışını dinle (Emülatör yürüme rotası ve gerçek cihaz hareketi)
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 1500,
            distanceInterval: 1,
          },
          (newLocation) => {
            if (!isMounted) return;
            const coords = { latitude: newLocation.coords.latitude, longitude: newLocation.coords.longitude };
            setUserLocation(coords);

            // Odaklanmış herhangi bir deprem, mekan veya aktif rota yoksa canlı olarak kullanıcıyı takip et
            if (!focusedEarthquakeId && !paramEarthquake && !selectedEarthquake && !selectedPlace && !activeRoute) {
              setCameraCenter([coords.longitude, coords.latitude]);
              cameraRef.current?.flyTo({
                center: [coords.longitude, coords.latitude],
                zoom: USER_FOCUS_ZOOM,
                duration: 500,
              });
            }
          }
        );
      } catch (err) {
        // Location watch catch
      }
    };

    startLocationWatch();

    return () => {
      isMounted = false;
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [isFocused, focusedEarthquakeId, paramEarthquake, selectedEarthquake, selectedPlace, activeRoute]);

  // Process explicitly passed earthquake parameter from Home screen navigation
  useEffect(() => {
    if (!isFocused || !isMapLoaded) return undefined;

    const target = paramEarthquake || (focusedEarthquakeId && earthquakes ? earthquakes.find((e) => e.id === focusedEarthquakeId) : null);

    if (target) {
      setSelectedEarthquake(target);
      setPreviewEarthquake(null);
      setSelectedPlace(null);

      setCameraCenter([target.longitude, target.latitude]);
      setCameraZoom(EARTHQUAKE_FOCUS_ZOOM);

      const timer = setTimeout(() => {
        cameraRef.current?.flyTo({
          center: [target.longitude, target.latitude],
          zoom: EARTHQUAKE_FOCUS_ZOOM,
          duration: 800,
        });

        // Clear params after processing so bottom tab bar press won't re-trigger previous earthquake!
        navigation.setParams({
          focusedEarthquakeId: undefined,
          focusedEarthquake: undefined,
        });
      }, 200);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isFocused, isMapLoaded, paramEarthquake, focusedEarthquakeId, earthquakes, navigation]);

  const handleToggleCategory = async (cat: NearbyCategory) => {
    if (selectedCategory === cat) {
      setSelectedCategory(null);
      setNearbyPlaces([]);
      setSelectedPlace(null);
      return;
    }

    const centerLat = userLocation?.latitude ?? TURKEY_CENTER[1];
    const centerLon = userLocation?.longitude ?? TURKEY_CENTER[0];

    if (userLocation) {
      setCameraCenter([userLocation.longitude, userLocation.latitude]);
      setCameraZoom(13.5);
      cameraRef.current?.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 13.5,
        duration: 600,
      });
    }

    setSelectedCategory(cat);
    setSelectedPlace(null);
    setIsFetchingPlaces(true);

    const places = await fetchNearbyEmergencyPlaces(cat, centerLat, centerLon);
    setNearbyPlaces(places);
    setIsFetchingPlaces(false);
  };

  const handleDrawRoute = async (targetPlace: NearbyPlace) => {
    if (!userLocation) {
      Alert.alert(
        language === 'tr' ? 'Konum Alınamadı' : 'Location Not Found',
        language === 'tr' ? 'Rota çizebilmek için lütfen konum izninizin ve cihaz GPS servisinizin açık olduğundan emin olun.' : 'Please make sure location permission and GPS are turned on to draw route.'
      );
      return;
    }

    setSelectedPlace(null);
    setIsCalculatingRoute(true);

    const start = { latitude: userLocation.latitude, longitude: userLocation.longitude };
    const end = { latitude: targetPlace.latitude, longitude: targetPlace.longitude };

    const route = await getOsrmRoute(start, end);
    setIsCalculatingRoute(false);

    if (route) {
      const distKm = route.distanceMeters / 1000;
      const durationMins = Math.round(route.durationSeconds / 60);

      setActiveRoute({
        destinationName: targetPlace.name,
        coordinates: route.coordinates,
        distanceKm: distKm,
        durationMins: durationMins < 1 ? 1 : durationMins,
      });

      setCameraCenter([start.longitude, start.latitude]);
      setCameraZoom(14);
      cameraRef.current?.flyTo({
        center: [start.longitude, start.latitude],
        zoom: 14,
        duration: 700,
      });
    } else {
      Alert.alert(
        language === 'tr' ? 'Rota Oluşturulamadı' : 'Route Error',
        language === 'tr' ? 'Sürüş rotası hesaplanırken bir hata oluştu.' : 'Could not calculate driving route.'
      );
    }
  };

  /** Tek dokunuşla en yakın hastane veya toplanma alanına sürüş rotası hesaplar */
  const handleQuickEmergencyRoute = async (category: 'hospital' | 'shelter') => {
    if (!userLocation) {
      Alert.alert(
        language === 'tr' ? 'Konum Alınamadı' : 'Location Required',
        language === 'tr' ? 'En yakın rotayı hesaplamak için lütfen konum izninizin ve GPS servisinizin açık olduğundan emin olun.' : 'Location permission and GPS are required for nearest route.'
      );
      return;
    }

    setIsCalculatingRoute(true);
    setSelectedPlace(null);
    setSelectedEarthquake(null);

    const places = await fetchNearbyEmergencyPlaces(category, userLocation.latitude, userLocation.longitude);

    if (places.length === 0) {
      setIsCalculatingRoute(false);
      Alert.alert(
        language === 'tr' ? 'Mekan Bulunamadı' : 'No Places Found',
        language === 'tr' ? 'Yakınınızda kayıtlı mekan bulunamadı.' : 'No registered places found nearby.'
      );
      return;
    }

    const firstPlace = places[0];
    if (!firstPlace) {
      setIsCalculatingRoute(false);
      return;
    }

    let nearest: NearbyPlace = firstPlace;
    let minDist = distanceKm(userLocation.latitude, userLocation.longitude, firstPlace.latitude, firstPlace.longitude);

    for (let i = 1; i < places.length; i++) {
      const p = places[i];
      if (p) {
        const d = distanceKm(userLocation.latitude, userLocation.longitude, p.latitude, p.longitude);
        if (d < minDist) {
          minDist = d;
          nearest = p;
        }
      }
    }

    setNearbyPlaces(places);
    setSelectedCategory(category);
    await handleDrawRoute(nearest);
  };

  const fetchLocationOnDemand = async (): Promise<{ latitude: number; longitude: number } | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          language === 'tr' ? 'Konum İzni Gerekli' : 'Permission Required',
          language === 'tr' ? 'Haritada konumunuzu görebilmek için lütfen uygulama ayarlarından konum iznini onaylayın.' : 'Please allow location permission in app settings.'
        );
        return null;
      }

      // 1. Önce hafızadaki son konumu dene (Anında döner)
      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown) {
        const coords = { latitude: lastKnown.coords.latitude, longitude: lastKnown.coords.longitude };
        setUserLocation(coords);
        return coords;
      }

      // 2. Android Studio emülatörü GPS sağlayıcısından yüksek doğrulukla konumu iste
      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500));

      const result = await Promise.race([locationPromise, timeoutPromise]);
      if (result && 'coords' in result) {
        const coords = { latitude: result.coords.latitude, longitude: result.coords.longitude };
        setUserLocation(coords);
        return coords;
      }

      return userLocation;
    } catch (err) {
      return userLocation;
    }
  };

  const handleRecenterUser = async () => {
    const loc = await fetchLocationOnDemand();

    if (loc) {
      setCameraCenter([loc.longitude, loc.latitude]);
      setCameraZoom(USER_FOCUS_ZOOM);
      cameraRef.current?.flyTo({
        center: [loc.longitude, loc.latitude],
        zoom: USER_FOCUS_ZOOM,
        duration: 600,
      });
    } else {
      Alert.alert(
        language === 'tr' ? 'GPS Konumu Alınamadı' : 'GPS Unavailable',
        language === 'tr'
          ? 'Emülatörün/Cihazın GPS konumu okunamadı. Lütfen Android emülatör araç çubuğundaki "..." -> Location sekmesinden "Set Location" butonuna bastığınızdan ve cihaz konum servisinin açık olduğundan emin olun.'
          : 'Could not acquire GPS position. Please ensure location services are enabled.'
      );
    }
  };

  if (isLoading) {
    return <LoadingState message={language === 'tr' ? 'Harita ve deprem noktaları yükleniyor...' : 'Loading map and earthquakes...'} />;
  }

  if (isError) {
    return <ErrorState message={language === 'tr' ? 'Harita verileri alınamadı.' : 'Could not load map data.'} onRetry={refetch} />;
  }

  // Camera initial position determination (User position vs Turkey fallback)
  const cameraInitialCenter: [number, number] = userLocation ? [userLocation.longitude, userLocation.latitude] : TURKEY_CENTER;
  const cameraInitialZoom: number = userLocation ? USER_FOCUS_ZOOM : TURKEY_ZOOM;

  return (
    <View style={styles.container}>
      <Map
        style={StyleSheet.absoluteFill}
        mapStyle={mapStyleUrl}
        androidView="surface"
        onDidFinishLoadingMap={() => setIsMapLoaded(true)}
      >
        <Camera
          key={userLocation ? `${userLocation.latitude}-${userLocation.longitude}` : 'turkey-default-camera'}
          ref={cameraRef}
          initialViewState={{ center: cameraInitialCenter, zoom: cameraInitialZoom }}
        />

        {/* Live User Location Marker */}
        {userLocation && (
          <MLMarker lngLat={[userLocation.longitude, userLocation.latitude]} id="user-location-custom">
            <View style={styles.userLocationMarkerOuter}>
              <View style={styles.userLocationMarkerInner} />
            </View>
          </MLMarker>
        )}

        {/* Render OSRM Active Navigation Route Line */}
        {activeRoute && (
          <GeoJSONSource
            id="osrm-route-source"
            data={{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: activeRoute.coordinates,
              },
            }}
          >
            <Layer
              id="osrm-route-line"
              type="line"
              style={{
                lineColor: '#007AFF',
                lineWidth: 6,
                lineCap: 'round',
                lineJoin: 'round',
                lineOpacity: 0.9,
              }}
            />
          </GeoJSONSource>
        )}

        {/* Render Earthquake Pulse Markers */}
        {(earthquakes ?? []).map((earthquake) => (
          <MLMarker
            key={earthquake.id}
            id={earthquake.id}
            lngLat={[earthquake.longitude, earthquake.latitude]}
            onPress={() => {
              setSelectedPlace(null);
              setPreviewEarthquake(earthquake);
            }}
          >
            <PulsingMarker magnitude={earthquake.magnitude} />
          </MLMarker>
        ))}

        {/* Render Nearby Emergency Place Markers */}
        {nearbyPlaces.map((place) => {
          const chipConfig = categoryChips.find((c) => c.id === place.category);
          const iconName = chipConfig?.icon ?? 'location';
          const placeColor = chipConfig?.color ?? colors.primary;

          return (
            <MLMarker
              key={place.id}
              id={place.id}
              lngLat={[place.longitude, place.latitude]}
              onPress={() => {
                setSelectedEarthquake(null);
                setPreviewEarthquake(null);
                setSelectedPlace(place);
              }}
            >
              <View style={[styles.placeMarkerOuter, { backgroundColor: placeColor }]}>
                <Ionicons name={iconName as any} size={14} color="#FFFFFF" />
              </View>
            </MLMarker>
          );
        })}
      </Map>

      {/* Top Floating Category Selector Bar */}
      <View style={styles.topBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topBarScroll}>
          {/* Quick Route to Nearest Hospital */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.quickRouteBtn, { backgroundColor: '#E53935' }]}
            onPress={() => handleQuickEmergencyRoute('hospital')}
          >
            <Ionicons name="flash" size={14} color="#FFFFFF" />
            <Text style={styles.quickRouteText}>
              {language === 'tr' ? 'En Yakın Hastane Rotası' : 'Nearest Hospital Route'}
            </Text>
          </TouchableOpacity>

          {/* Quick Route to Nearest Shelter */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.quickRouteBtn, { backgroundColor: '#00838F' }]}
            onPress={() => handleQuickEmergencyRoute('shelter')}
          >
            <Ionicons name="navigate" size={14} color="#FFFFFF" />
            <Text style={styles.quickRouteText}>
              {language === 'tr' ? 'En Yakın Barınma Rotası' : 'Nearest Shelter Route'}
            </Text>
          </TouchableOpacity>

          {/* Standard Category Filter Chips */}
          {categoryChips.map((chip) => {
            const isSelected = selectedCategory === chip.id;
            return (
              <TouchableOpacity
                key={chip.id}
                activeOpacity={0.85}
                style={[
                  styles.chipButton,
                  {
                    backgroundColor: isSelected ? chip.color : colors.surface,
                    borderColor: isSelected ? chip.color : colors.border,
                  },
                ]}
                onPress={() => handleToggleCategory(chip.id)}
              >
                {isFetchingPlaces && isSelected ? (
                  <ActivityIndicator size="small" color={isSelected ? '#FFFFFF' : chip.color} />
                ) : (
                  <Ionicons name={chip.icon as any} size={14} color={isSelected ? '#FFFFFF' : chip.color} />
                )}
                <Text style={[styles.chipText, { color: isSelected ? '#FFFFFF' : colors.onSurface }]}>
                  {language === 'tr' ? chip.titleTR : chip.titleEN}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Active Navigation Route Floating Banner */}
      {activeRoute && (
        <View style={[styles.routeBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.routeBannerContent}>
            <View style={styles.routeBannerIcon}>
              <Ionicons name="car" size={20} color="#007AFF" />
            </View>
            <View style={styles.routeBannerTextGroup}>
              <Text style={[styles.routeDestTitle, { color: colors.onSurface }]} numberOfLines={1}>
                {activeRoute.destinationName}
              </Text>
              <Text style={[styles.routeStatsText, { color: colors.onSurfaceVariant }]}>
                🚗 {activeRoute.distanceKm.toFixed(1)} km · ⏱️ {activeRoute.durationMins} {language === 'tr' ? 'dk sürüş' : 'mins drive'}
              </Text>
            </View>
            <TouchableOpacity style={styles.clearRouteBtn} onPress={() => setActiveRoute(null)}>
              <Ionicons name="close-circle" size={22} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Calculating Route Indicator */}
      {isCalculatingRoute && (
        <View style={[styles.calculatingBanner, { backgroundColor: colors.surface }]}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.calculatingText, { color: colors.onSurface }]}>
            {language === 'tr' ? 'Canlı sürüş rotası çiziliyor...' : 'Calculating driving route...'}
          </Text>
        </View>
      )}

      {/* Map Style Picker Float Menu (Top Right) */}
      <View style={styles.stylePickerWrapper}>
        <TouchableOpacity
          style={[styles.floatingCircleBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowStylePicker(!showStylePicker)}
        >
          <Ionicons name="layers" size={20} color={colors.primary} />
        </TouchableOpacity>

        {showStylePicker && (
          <View style={[styles.stylePickerDropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.styleOption, mapStyleType === 'bright' && { backgroundColor: colors.primary + '15' }]}
              onPress={() => {
                setMapStyleType('bright');
                setShowStylePicker(false);
              }}
            >
              <Ionicons name="sunny" size={16} color={mapStyleType === 'bright' ? colors.primary : colors.onSurface} />
              <Text style={[styles.styleOptionText, { color: mapStyleType === 'bright' ? colors.primary : colors.onSurface }]}>
                {language === 'tr' ? 'Canlı & Renkli' : 'Vibrant Bright'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.styleOption, mapStyleType === 'liberty' && { backgroundColor: colors.primary + '15' }]}
              onPress={() => {
                setMapStyleType('liberty');
                setShowStylePicker(false);
              }}
            >
              <Ionicons name="map-outline" size={16} color={mapStyleType === 'liberty' ? colors.primary : colors.onSurface} />
              <Text style={[styles.styleOptionText, { color: mapStyleType === 'liberty' ? colors.primary : colors.onSurface }]}>
                {language === 'tr' ? 'Detaylı Vektör' : 'Detailed Vector'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.styleOption, mapStyleType === 'dark' && { backgroundColor: colors.primary + '15' }]}
              onPress={() => {
                setMapStyleType('dark');
                setShowStylePicker(false);
              }}
            >
              <Ionicons name="moon-outline" size={16} color={mapStyleType === 'dark' ? colors.primary : colors.onSurface} />
              <Text style={[styles.styleOptionText, { color: mapStyleType === 'dark' ? colors.primary : colors.onSurface }]}>
                {language === 'tr' ? 'Karanlık' : 'Dark'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.styleOption, mapStyleType === 'satellite' && { backgroundColor: colors.primary + '15' }]}
              onPress={() => {
                setMapStyleType('satellite');
                setShowStylePicker(false);
              }}
            >
              <Ionicons name="planet-outline" size={16} color={mapStyleType === 'satellite' ? colors.primary : colors.onSurface} />
              <Text style={[styles.styleOptionText, { color: mapStyleType === 'satellite' ? colors.primary : colors.onSurface }]}>
                {language === 'tr' ? 'Uydu' : 'Satellite'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Recenter User Location Button (Bottom Right) */}
      <TouchableOpacity
        style={[styles.recenterButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={handleRecenterUser}
      >
        <Ionicons name="navigate" size={20} color={colors.primary} />
      </TouchableOpacity>

      {/* Floating Pin Callout Preview */}
      {previewEarthquake && (
        <View style={styles.calloutWrapper}>
          <EarthquakeCallout
            earthquake={previewEarthquake}
            onClose={() => setPreviewEarthquake(null)}
            onPressDetails={() => {
              setSelectedEarthquake(previewEarthquake);
              setPreviewEarthquake(null);
            }}
          />
        </View>
      )}

      {/* Earthquake Detail Sheet */}
      <BottomSheet visible={!!selectedEarthquake} onClose={() => setSelectedEarthquake(null)}>
        {selectedEarthquake ? (
          <EarthquakeDetailSheetContent earthquake={selectedEarthquake} />
        ) : (
          <View />
        )}
      </BottomSheet>

      {/* Nearby Place Detail Sheet */}
      <BottomSheet visible={!!selectedPlace} onClose={() => setSelectedPlace(null)}>
        {selectedPlace ? (
          <LocationDetailSheetContent
            place={selectedPlace}
            userLocation={userLocation}
            onDrawRoute={handleDrawRoute}
          />
        ) : (
          <View />
        )}
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBarContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
  },
  topBarScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  quickRouteText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  chipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  routeBanner: {
    position: 'absolute',
    top: 96,
    left: 16,
    right: 70,
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 5,
  },
  routeBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  routeBannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeBannerTextGroup: {
    flex: 1,
    gap: 2,
  },
  routeDestTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  routeStatsText: {
    fontSize: 11,
    fontWeight: '600',
  },
  clearRouteBtn: {
    padding: 2,
  },
  calculatingBanner: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  calculatingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  stylePickerWrapper: {
    position: 'absolute',
    top: 105,
    right: 16,
    alignItems: 'flex-end',
  },
  floatingCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  stylePickerDropdown: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    padding: 6,
    gap: 4,
    minWidth: 120,
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  styleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  styleOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  calloutWrapper: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  placeMarkerOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
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
