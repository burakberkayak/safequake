import { useEffect } from 'react';
import { useLatestEarthquake } from '../../earthquake/hooks/useEarthquakes';
import { useAppSelector } from '../../../store/hooks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { distanceKm } from '../../earthquake/utils/earthquakeFilters';
import { translations } from '../../../hooks/useTranslation';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const useNotificationWatcher = () => {
  const { data: latest } = useLatestEarthquake();
  const settings = useAppSelector((state) => state.settings);

  useEffect(() => {
    if (!latest) return;

    const checkAndNotify = async () => {
      try {
        // Read last notified ID
        const lastId = await AsyncStorage.getItem('last_notified_earthquake_id');
        
        if (lastId === latest.id) return; // Already notified for this earthquake
        
        // Save immediately to prevent race condition/spam
        await AsyncStorage.setItem('last_notified_earthquake_id', latest.id);

        // Check global notification permission toggle in settings
        if (!settings.notificationPermissionGranted) return;

        // Check magnitude threshold
        if (settings.minMagnitudeNotify !== undefined && latest.magnitude < settings.minMagnitudeNotify) {
          return;
        }

        // Check distance threshold
        if (settings.maxDistanceNotifyKm !== undefined) {
          const { status } = await Location.getForegroundPermissionsAsync();
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            const distance = distanceKm(
              loc.coords.latitude,
              loc.coords.longitude,
              latest.latitude,
              latest.longitude
            );
            if (distance > settings.maxDistanceNotifyKm) {
              return; // Outside notify range
            }
          }
        }

        const lang = settings.language || 'tr';
        const titleLabel = translations[lang].newEarthquakeAlert;
        const magLabel = translations[lang].alertMag;
        const depthLabel = translations[lang].alertDepth;
        const dateLabel = translations[lang].alertDate;

        // Trigger local notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `${titleLabel}: ${latest.location} (${latest.magnitude})`,
            body: `${magLabel}: ${latest.magnitude} | ${depthLabel}: ${latest.depthKm} km | ${dateLabel}: ${latest.occurredAt}`,
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: null, // immediate
        });

      } catch (err) {
        // Quiet fail
      }
    };

    checkAndNotify();
  }, [latest, settings]);
};
