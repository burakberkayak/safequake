import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Alert, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import { Map, Camera, Marker as MLMarker, GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import { useRoute, RouteProp, useIsFocused, useNavigation, NavigationProp } from '@react-navigation/native';
import { useAppSelector } from '../../../store/hooks';
import { useEarthquakes } from '../../earthquake/hooks/useEarthquakes';
import { Earthquake } from '../../earthquake/types/earthquake.types';
import { BottomSheet } from '../../../components/BottomSheet';
import { EarthquakeDetailSheetContent } from '../components/EarthquakeDetailSheetContent';
import { LocationDetailSheetContent } from '../components/LocationDetailSheetContent';
import { EarthquakeCallout } from '../components/EarthquakeCallout';
import { PulsingMarker } from '../components/PulsingMarker';
import { MapStylePicker } from '../components/MapStylePicker';
import { CategoryChipBar } from '../components/CategoryChipBar';
import { RouteStatusOverlay } from '../components/RouteStatusOverlay';
import { useMapCamera } from '../hooks/useMapCamera';
import { useLiveLocation } from '../hooks/useLiveLocation';
import { useNearbyPlaces } from '../hooks/useNearbyPlaces';
import { useMapRoute } from '../hooks/useMapRoute';
import { getMapStyleUrl, MapStyleType } from '../constants/mapStyles';
import { NearbyPlace } from '../services/overpassService';
import { ErrorState, LoadingState } from '../../../components/ScreenState';
import { RootTabParamList } from '../../../navigation/types';
import { useTranslation } from '../../../hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { distanceKm } from '../../earthquake/utils/earthquakeFilters';

const TURKEY_CENTER: [number, number] = [35.0, 39.0];
const TURKEY_ZOOM = 5;
const USER_FOCUS_ZOOM = 14;
const EARTHQUAKE_FOCUS_ZOOM = 10;

/**
 * PRD §8: Harita ekranı.
 *
 * Bu ekranın kendisi artık sadece "kompozisyon" katmanı — kamera, canlı
 * konum, yakındaki yerler ve OSRM rota mantığının hepsi ayrı hook'lara
 * (`useMapCamera`, `useLiveLocation`, `useNearbyPlaces`, `useMapRoute`)
 * taşındı; stil seçici / kategori çubuğu / rota banner'ı da ayrı
 * bileşenlere (`MapStylePicker`, `CategoryChipBar`, `RouteStatusOverlay`)
 * bölündü. Önceden 938 satırlık tek dosyaydı.
 */
export const MapScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const { language } = useTranslation();
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const route = useRoute<RouteProp<RootTabParamList, 'Map'>>();
  const isFocused = useIsFocused();

  const focusedEarthquakeId = route.params?.focusedEarthquakeId;
  const paramEarthquake = route.params?.focusedEarthquake;

  const filters = useAppSelector((state) => state.filters.filters);
  const { data: earthquakes, isLoading, isError, refetch } = useEarthquakes(filters);

  const { cameraRef, flyTo } = useMapCamera();

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapStyleType, setMapStyleType] = useState<MapStyleType>('bright');
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [selectedEarthquake, setSelectedEarthquake] = useState<Earthquake | null>(null);
  const [previewEarthquake, setPreviewEarthquake] = useState<Earthquake | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);

  const {
    selectedCategories,
    fetchingCategories,
    nearbyPlaces,
    isFetchingPlaces,
    toggleCategory,
    fetchCategory,
    clearPlaces,
    fetchPlacesForActiveCategories,
  } = useNearbyPlaces();

  const { activeRoute, isCalculatingRoute, drawRoute, findNearest, clearRoute, updateRouteProgress } = useMapRoute({ language });

  const [lastSearchCoords, setLastSearchCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ latitude: number; longitude: number } | null>(null);

  // Odaklanmış herhangi bir deprem/mekan/rota yoksa kamera kullanıcıyı
  // canlı olarak takip eder (yürürken haritanın onu izlemesi gibi).
  const hasActiveFocus = !!(focusedEarthquakeId || paramEarthquake || selectedEarthquake || selectedPlace || activeRoute);

  const { userLocation, fetchLocationOnDemand } = useLiveLocation({
    isActive: isFocused,
    onLocationChange: (coords, isInitial) => {
      // Yol çizgilerini arkadan silmek/rota dışı kalmayı kontrol etmek için konumu bildir
      updateRouteProgress(coords);

      // Sadece ilk konum alındığında ve aktif bir odaklanma yoksa kamerayı taşı.
      // Canlı GPS güncellemeleri (yürüyüş vb.) sırasında haritayı kullanıcının serbestçe
      // inceleyebilmesi için kamerayı zorla taşımıyoruz.
      if (isInitial && !hasActiveFocus) {
        flyTo([coords.longitude, coords.latitude], USER_FOCUS_ZOOM, {
          duration: 800,
        });
      }
    },
  });

  const mapStyleUrl = getMapStyleUrl(mapStyleType);

  // Tab bar'a tekrar basılınca: seçimleri temizle ve kullanıcı konumuna dön.
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress' as any, () => {
      setSelectedEarthquake(null);
      setPreviewEarthquake(null);
      setSelectedPlace(null);
      clearRoute();
      clearPlaces();
      setShowStylePicker(false);
      setLastSearchCoords(null);
      setMapCenter(null);

      navigation.setParams({ focusedEarthquakeId: undefined, focusedEarthquake: undefined });

      if (userLocation) {
        flyTo([userLocation.longitude, userLocation.latitude], USER_FOCUS_ZOOM);
      } else {
        flyTo(TURKEY_CENTER, TURKEY_ZOOM);
      }
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, userLocation]);

  // Ana Sayfa'dan belirli bir depreme odaklanma isteği geldiyse işle.
  useEffect(() => {
    if (!isFocused || !isMapLoaded) return undefined;

    const target = paramEarthquake || (focusedEarthquakeId && earthquakes ? earthquakes.find((e) => e.id === focusedEarthquakeId) : null);

    if (target) {
      setSelectedEarthquake(target);
      setPreviewEarthquake(null);
      setSelectedPlace(null);

      const timer = setTimeout(() => {
        flyTo([target.longitude, target.latitude], EARTHQUAKE_FOCUS_ZOOM, { duration: 800 });
        // Parametreleri temizle ki tab bar'a tekrar basınca eski deprem geri gelmesin.
        navigation.setParams({ focusedEarthquakeId: undefined, focusedEarthquake: undefined });
      }, 200);

      return () => clearTimeout(timer);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused, isMapLoaded, paramEarthquake, focusedEarthquakeId, earthquakes]);

  // Cihaz konumu ve harita yüklendiğinde varsayılan kategorileri yükle.
  useEffect(() => {
    if (userLocation && !lastSearchCoords && isMapLoaded) {
      const lat = userLocation.latitude;
      const lon = userLocation.longitude;
      setLastSearchCoords({ latitude: lat, longitude: lon });
      fetchPlacesForActiveCategories(selectedCategories, lat, lon);
    }
  }, [userLocation, isMapLoaded, selectedCategories, lastSearchCoords, fetchPlacesForActiveCategories]);

  const handleToggleCategory = async (cat: NearbyPlace['category']) => {
    const searchLat = lastSearchCoords?.latitude ?? userLocation?.latitude ?? TURKEY_CENTER[1];
    const searchLon = lastSearchCoords?.longitude ?? userLocation?.longitude ?? TURKEY_CENTER[0];

    setSelectedPlace(null);
    await toggleCategory(cat, searchLat, searchLon);
  };

  const handleSearchThisArea = async () => {
    if (!mapCenter) return;
    const lat = mapCenter.latitude;
    const lon = mapCenter.longitude;
    setLastSearchCoords({ latitude: lat, longitude: lon });
    await fetchPlacesForActiveCategories(selectedCategories, lat, lon);
  };

  const handleDrawRoute = async (targetPlace: NearbyPlace) => {
    setSelectedPlace(null);
    const success = await drawRoute(userLocation, targetPlace);
    if (success && userLocation) {
      flyTo([userLocation.longitude, userLocation.latitude], 14, { duration: 700 });
    }
  };

  /** Tek dokunuşla en yakın hastane veya toplanma alanına sürüş rotası hesaplar. */
  const handleQuickEmergencyRoute = async (category: 'hospital' | 'shelter') => {
    if (!userLocation) {
      Alert.alert(
        language === 'tr' ? 'Konum Alınamadı' : 'Location Required',
        language === 'tr'
          ? 'En yakın rotayı hesaplamak için lütfen konum izninizin ve GPS servisinizin açık olduğundan emin olun.'
          : 'Location permission and GPS are required for nearest route.'
      );
      return;
    }

    setSelectedPlace(null);
    setSelectedEarthquake(null);

    const places = await fetchCategory(category, userLocation.latitude, userLocation.longitude);
    const nearest = findNearest(userLocation, places);

    if (!nearest) {
      Alert.alert(
        language === 'tr' ? 'Mekan Bulunamadı' : 'No Places Found',
        language === 'tr' ? 'Yakınınızda kayıtlı mekan bulunamadı.' : 'No registered places found nearby.'
      );
      return;
    }

    await handleDrawRoute(nearest);
  };

  const handleRecenterUser = async () => {
    const loc = await fetchLocationOnDemand();

    if (loc) {
      flyTo([loc.longitude, loc.latitude], USER_FOCUS_ZOOM);
    } else {
      Alert.alert(
        language === 'tr' ? 'GPS Konumu Alınamadı' : 'GPS Unavailable',
        language === 'tr'
          ? 'Emülatörün/Cihazın GPS konumu okunamadı. Lütfen Android emülatör araç çubuğundaki "..." -> Location sekmesinden "Set Location" butonuna bastığınızdan ve cihaz konum servisinin açık olduğundan emin olun.'
          : 'Could not acquire GPS position. Please ensure location services are enabled.'
      );
    }
  };

  /** Haritada herhangi bir boş yere veya nesneye dokunulduğunda koordinatı yakalar ve Pin bırakır. */
  const handleMapPress = async (event: any) => {
    let lat: number | undefined;
    let lon: number | undefined;

    // 1. nativeEvent koordinatları (boş harita tıklamaları için)
    const nativeEvent = event?.nativeEvent;
    if (nativeEvent) {
      if (Array.isArray(nativeEvent.lngLat)) {
        lon = nativeEvent.lngLat[0];
        lat = nativeEvent.lngLat[1];
      } else if (Array.isArray(nativeEvent.coordinate)) {
        lon = nativeEvent.coordinate[0];
        lat = nativeEvent.coordinate[1];
      } else if (nativeEvent.coordinate && typeof nativeEvent.coordinate === 'object') {
        lat = nativeEvent.coordinate.latitude;
        lon = nativeEvent.coordinate.longitude;
      }
    }

    // 2. Fallback (üzerine tıklanabilir katmanlar/semboller için)
    if (lat === undefined || lon === undefined) {
      if (Array.isArray(event?.geometry?.coordinates)) {
        lon = event.geometry.coordinates[0];
        lat = event.geometry.coordinates[1];
      } else if (Array.isArray(event?.coordinates)) {
        lon = event.coordinates[0];
        lat = event.coordinates[1];
      } else if (event?.coordinates && typeof event.coordinates === 'object') {
        lat = event.coordinates.latitude;
        lon = event.coordinates.longitude;
      } else if (typeof event?.latitude === 'number' && typeof event?.longitude === 'number') {
        lat = event.latitude;
        lon = event.longitude;
      }
    }

    if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
      return;
    }

    const vectorName = event?.properties?.name || event?.properties?.['name:tr'] || event?.properties?.title;

    setSelectedEarthquake(null);
    setPreviewEarthquake(null);

    const tempPlace: NearbyPlace = {
      id: `custom-place-${Date.now()}`,
      category: 'shelter',
      name: vectorName || (language === 'tr' ? 'Seçilen Nokta' : 'Selected Location'),
      latitude: lat,
      longitude: lon,
    };

    setSelectedPlace(tempPlace);
    flyTo([lon, lat], 15, { duration: 500 });

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
        {
          headers: {
            'User-Agent': 'SafeQuakeApp/1.0 (https://safequake.app)',
            'Accept-Language': language === 'tr' ? 'tr,en' : 'en,tr',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const realName = data.name || data.display_name?.split(',')?.[0]?.trim() || vectorName || (language === 'tr' ? 'Seçilen Nokta' : 'Selected Point');
        const fullAddress = data.display_name?.split(',')?.slice(1, 4)?.join(',')?.trim() || undefined;

        setSelectedPlace({
          id: `custom-place-${Date.now()}`,
          category: 'shelter',
          name: realName,
          latitude: lat,
          longitude: lon,
          address: fullAddress,
        });
      }
    } catch (err) {
      // Fallback
    }
  };

  if (isLoading) {
    return <LoadingState message={language === 'tr' ? 'Harita ve deprem noktaları yükleniyor...' : 'Loading map and earthquakes...'} />;
  }

  if (isError) {
    return <ErrorState message={language === 'tr' ? 'Harita verileri alınamadı.' : 'Could not load map data.'} onRetry={refetch} />;
  }

  const cameraInitialCenter: [number, number] = userLocation ? [userLocation.longitude, userLocation.latitude] : TURKEY_CENTER;
  const cameraInitialZoom: number = userLocation ? USER_FOCUS_ZOOM : TURKEY_ZOOM;

  const showSearchThisArea = !!(
    mapCenter &&
    lastSearchCoords &&
    distanceKm(mapCenter.latitude, mapCenter.longitude, lastSearchCoords.latitude, lastSearchCoords.longitude) > 1.5
  );

  return (
    <View style={styles.container}>
      <Map
        style={StyleSheet.absoluteFill}
        mapStyle={mapStyleUrl}
        androidView="surface"
        onDidFinishLoadingMap={() => setIsMapLoaded(true)}
        onPress={handleMapPress}
        onRegionDidChange={(feature: any) => {
          const coords = feature?.geometry?.coordinates || feature?.nativeEvent?.geometry?.coordinates;
          if (coords) {
            const [lon, lat] = coords;
            setMapCenter({ latitude: lat, longitude: lon });
          }
        }}
      >
        <Camera
          key="safequake-map-camera"
          ref={cameraRef}
          initialViewState={{ center: cameraInitialCenter, zoom: cameraInitialZoom }}
        />

        {userLocation && (
          <MLMarker lngLat={[userLocation.longitude, userLocation.latitude]} id="user-location-custom">
            <View style={styles.userLocationMarkerOuter}>
              <View style={styles.userLocationMarkerInner} />
            </View>
          </MLMarker>
        )}

        {activeRoute && (
          <GeoJSONSource
            id="osrm-route-source"
            data={{
              type: 'Feature',
              properties: {},
              geometry: { type: 'LineString', coordinates: activeRoute.coordinates },
            }}
          >
            <Layer
              id="osrm-route-line"
              type="line"
              paint={{
                'line-color': '#007AFF',
                'line-width': 6,
                'line-opacity': 0.9,
              }}
              layout={{
                'line-cap': 'round',
                'line-join': 'round',
              }}
            />
          </GeoJSONSource>
        )}

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

        {nearbyPlaces.map((place) => {
          const chipConfig = { hospital: { icon: 'medical', color: '#E53935' }, pharmacy: { icon: 'medkit', color: '#2E7D32' }, fire_station: { icon: 'flame', color: '#E65100' }, police: { icon: 'shield', color: '#1565C0' }, shelter: { icon: 'location', color: '#00838F' } }[place.category];

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
              <View style={[styles.placeMarkerOuter, { backgroundColor: chipConfig.color }]}>
                <Ionicons name={chipConfig.icon as any} size={14} color="#FFFFFF" />
              </View>
            </MLMarker>
          );
        })}

        {/* Seçilen Özel Nokta Pin İşaretçisi */}
        {selectedPlace && (
          <MLMarker
            id="selected-place-pin"
            lngLat={[selectedPlace.longitude, selectedPlace.latitude]}
          >
            <View style={[styles.placeMarkerOuter, { backgroundColor: colors.primary }]}>
              <Ionicons name="pin" size={14} color="#FFFFFF" />
            </View>
          </MLMarker>
        )}

        {/* Aktif Rota Varış Noktası İşaretçisi */}
        {activeRoute && activeRoute.coordinates.length > 0 && (
          <MLMarker
            id="active-route-destination"
            lngLat={activeRoute.coordinates[activeRoute.coordinates.length - 1] as [number, number]}
          >
            <View style={[styles.placeMarkerOuter, { backgroundColor: '#007AFF' }]}>
              <Ionicons name="flag" size={14} color="#FFFFFF" />
            </View>
          </MLMarker>
        )}
      </Map>

      {/* Floating Search This Area Button */}
      {showSearchThisArea && (
        <View style={styles.searchAreaContainer}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.searchAreaBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.primary,
              },
            ]}
            onPress={handleSearchThisArea}
          >
            {isFetchingPlaces ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="refresh" size={14} color={colors.primary} />
            )}
            <Text style={[styles.searchAreaText, { color: colors.primary }]}>
              {language === 'tr' ? 'Bu Bölgede Ara' : 'Search This Area'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <CategoryChipBar
        language={language}
        selectedCategories={selectedCategories}
        fetchingCategories={fetchingCategories}
        onToggleCategory={handleToggleCategory}
        onQuickRoute={handleQuickEmergencyRoute}
      />

      <RouteStatusOverlay
        activeRoute={activeRoute}
        isCalculatingRoute={isCalculatingRoute}
        language={language}
        onClearRoute={clearRoute}
      />

      <MapStylePicker
        value={mapStyleType}
        onChange={(style) => {
          setMapStyleType(style);
          setShowStylePicker(false);
        }}
        language={language}
        isOpen={showStylePicker}
        onToggleOpen={() => setShowStylePicker((v) => !v)}
      />

      <TouchableOpacity
        style={[styles.recenterButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={handleRecenterUser}
      >
        <Ionicons name="navigate" size={20} color={colors.primary} />
      </TouchableOpacity>

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

      <BottomSheet visible={!!selectedEarthquake} onClose={() => setSelectedEarthquake(null)}>
        {selectedEarthquake ? <EarthquakeDetailSheetContent earthquake={selectedEarthquake} /> : <View />}
      </BottomSheet>

      <BottomSheet visible={!!selectedPlace} onClose={() => setSelectedPlace(null)}>
        {selectedPlace ? (
          <LocationDetailSheetContent place={selectedPlace} userLocation={userLocation} onDrawRoute={handleDrawRoute} />
        ) : (
          <View />
        )}
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  calloutWrapper: { position: 'absolute', bottom: 90, left: 16, right: 16, alignItems: 'center' },
  placeMarkerOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00',
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
  userLocationMarkerInner: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#007AFF', borderWidth: 2, borderColor: '#FFFFFF' },
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
  searchAreaContainer: {
    position: 'absolute',
    top: 105,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  searchAreaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  searchAreaText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
