import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { BottomSheet } from '../../../components/BottomSheet';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  setNotificationPermission,
  setMinMagnitudeNotify,
  setMaxDistanceNotifyKm,
  setLocationPermission,
} from '../../../store/slices/settingsSlice';
import { useTranslation } from '../../../hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';

interface AlertZoneSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const AlertZoneSheet: React.FC<AlertZoneSheetProps> = ({ visible, onClose }) => {
  const { colors } = useAppTheme();
  const dispatch = useAppDispatch();
  const { language } = useTranslation();
  const settings = useAppSelector((state) => state.settings);

  const [testingAlarm, setTestingAlarm] = useState(false);

  const toggleNotifications = async () => {
    if (settings.notificationPermissionGranted) {
      dispatch(setNotificationPermission(false));
    } else {
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === 'granted';
      dispatch(setNotificationPermission(granted));
      if (!granted) {
        Alert.alert(
          language === 'tr' ? 'Bildirim İzni Reddedildi' : 'Notification Permission Denied',
          language === 'tr'
            ? 'Deprem alarmları alabilmek için telefon ayarlarından bildirimlere izin vermeniz gerekmektedir.'
            : 'Please allow notifications in phone settings to receive earthquake alerts.'
        );
      }
    }
  };

  const toggleLocation = async () => {
    if (settings.locationPermissionGranted) {
      dispatch(setLocationPermission(false));
    } else {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      dispatch(setLocationPermission(granted));
      if (!granted) {
        Alert.alert(
          language === 'tr' ? 'Konum İzni Reddedildi' : 'Location Permission Denied',
          language === 'tr'
            ? 'Mesafe tabanlı deprem uyarıları için konum izni gereklidir.'
            : 'Location permission is required for distance-based earthquake alerts.'
        );
      }
    }
  };

  const handleTestAlarm = async () => {
    setTestingAlarm(true);
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: language === 'tr' ? '🚨 TEST ALARMI: Deprem Uyarısı' : '🚨 TEST ALERT: Earthquake Warning',
          body: language === 'tr'
            ? 'Bu bir test uyarısıdır! Ayarladığınız deprem alarmı sistemi sorunsuz çalışıyor.'
            : 'This is a test notification! Your earthquake alert system is working properly.',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });

      Alert.alert(
        language === 'tr' ? '✅ Alarm Testi Başarılı' : '✅ Alert Test Successful',
        language === 'tr'
          ? 'Test bildirimi cihazınıza gönderildi. Bildirim panelinizi kontrol edebilirsiniz.'
          : 'Test notification sent. Please check your notification panel.'
      );
    } catch (err) {
      Alert.alert(
        language === 'tr' ? 'Test Başarısız' : 'Test Failed',
        language === 'tr' ? 'Lütfen bildirim izinlerinin açık olduğundan emin olun.' : 'Please make sure notifications are enabled.'
      );
    } finally {
      setTestingAlarm(false);
    }
  };

  const distanceOptions = [
    { value: undefined, label: language === 'tr' ? 'Tüm Türkiye' : 'All Turkey' },
    { value: 25, label: '25 km' },
    { value: 50, label: '50 km' },
    { value: 100, label: '100 km' },
    { value: 250, label: '250 km' },
  ];

  const magnitudeOptions = [
    { value: undefined, label: language === 'tr' ? 'Tüm Depremler' : 'All' },
    { value: 3, label: '3.0+' },
    { value: 4, label: '4.0+' },
    { value: 5, label: '5.0+' },
    { value: 6, label: '6.0+' },
    { value: 7, label: '7.0+' },
  ];

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="notifications-circle" size={24} color={colors.primary} />
            <Text style={[styles.title, { color: colors.onSurface }]}>
              {language === 'tr' ? 'Kişisel Deprem Alarmı' : 'Personal Earthquake Alert'}
            </Text>
          </View>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            {language === 'tr'
              ? 'Bulunduğunuz konuma yakınlık ve büyüklük eşiğinize göre anında sesli uyarı alın.'
              : 'Receive instant voice/push alerts based on your location and magnitude threshold.'}
          </Text>
        </View>

        {/* Master Switch */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.switchRow}>
            <View style={styles.switchTextGroup}>
              <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
                {language === 'tr' ? 'Deprem Bildirimleri' : 'Earthquake Alerts'}
              </Text>
              <Text style={[styles.cardSub, { color: colors.onSurfaceVariant }]}>
                {settings.notificationPermissionGranted
                  ? (language === 'tr' ? 'Alarm sistemi aktif' : 'Alert system enabled')
                  : (language === 'tr' ? 'Alarm sistemi kapalı' : 'Alert system disabled')}
              </Text>
            </View>
            <Switch
              value={settings.notificationPermissionGranted}
              onValueChange={toggleNotifications}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
        </View>

        {/* Location Switch */}
        {settings.notificationPermissionGranted && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.switchRow}>
              <View style={styles.switchTextGroup}>
                <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
                  {language === 'tr' ? 'Konum Bazlı Yarıçap Filtresi' : 'Location-Based Radius Filter'}
                </Text>
                <Text style={[styles.cardSub, { color: colors.onSurfaceVariant }]}>
                  {settings.locationPermissionGranted
                    ? (language === 'tr' ? 'Anlık GPS konumunuza göre filtreleniyor' : 'Filtered by live GPS location')
                    : (language === 'tr' ? 'Mesafe uyarısı için konum izni gerekli' : 'Location required for distance alerts')}
                </Text>
              </View>
              <Switch
                value={settings.locationPermissionGranted}
                onValueChange={toggleLocation}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          </View>
        )}

        {/* Distance Selector */}
        {settings.notificationPermissionGranted && settings.locationPermissionGranted && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.labelRow}>
              <Ionicons name="navigate-outline" size={18} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
                {language === 'tr' ? 'Mesafe Yarıçapı' : 'Alert Distance Radius'}
              </Text>
            </View>
            <View style={styles.chipGrid}>
              {distanceOptions.map((opt) => {
                const isActive = settings.maxDistanceNotifyKm === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value ?? 'all'}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isActive ? colors.primary : colors.background,
                        borderColor: isActive ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => dispatch(setMaxDistanceNotifyKm(opt.value))}
                  >
                    <Text style={[styles.chipText, { color: isActive ? '#FFFFFF' : colors.onSurface }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Magnitude Selector */}
        {settings.notificationPermissionGranted && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.labelRow}>
              <Ionicons name="flash-outline" size={18} color="#FF9800" />
              <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
                {language === 'tr' ? 'Minimum Büyüklük Eşiği' : 'Minimum Magnitude Threshold'}
              </Text>
            </View>
            <View style={styles.chipGrid}>
              {magnitudeOptions.map((opt) => {
                const isActive = settings.minMagnitudeNotify === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value ?? 'all'}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isActive ? colors.primary : colors.background,
                        borderColor: isActive ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => dispatch(setMinMagnitudeNotify(opt.value))}
                  >
                    <Text style={[styles.chipText, { color: isActive ? '#FFFFFF' : colors.onSurface }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Test Alarm Button */}
        {settings.notificationPermissionGranted && (
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: colors.primary }]}
            onPress={handleTestAlarm}
            disabled={testingAlarm}
          >
            <Ionicons name="volume-high" size={18} color="#FFFFFF" />
            <Text style={styles.testButtonText}>
              {language === 'tr' ? 'Alarmı Test Et' : 'Test Alert Sound'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 14,
    paddingBottom: 32,
  },
  header: {
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  switchTextGroup: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardSub: {
    fontSize: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    minWidth: '28%',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  testButton: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
