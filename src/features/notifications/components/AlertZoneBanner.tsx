import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { useAppSelector } from '../../../store/hooks';
import { useTranslation } from '../../../hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';

interface AlertZoneBannerProps {
  onOpenAlertSheet: () => void;
}

export const AlertZoneBanner: React.FC<AlertZoneBannerProps> = ({ onOpenAlertSheet }) => {
  const { colors } = useAppTheme();
  const { language } = useTranslation();
  const settings = useAppSelector((state) => state.settings);

  const isEnabled = settings.notificationPermissionGranted;
  const distLabel = settings.maxDistanceNotifyKm ? `${settings.maxDistanceNotifyKm} km` : (language === 'tr' ? 'Tüm Türkiye' : 'All Turkey');
  const magLabel = settings.minMagnitudeNotify ? `${settings.minMagnitudeNotify}+ ML` : (language === 'tr' ? 'Tüm Depremler' : 'All Earthquakes');

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onOpenAlertSheet}
      style={[
        styles.banner,
        {
          backgroundColor: isEnabled ? colors.primary + '10' : colors.surface,
          borderColor: isEnabled ? colors.primary + '40' : colors.border,
        },
      ]}
    >
      <View style={styles.leftRow}>
        <View
          style={[
            styles.iconBox,
            { backgroundColor: isEnabled ? colors.primary : colors.onSurfaceVariant + '30' },
          ]}
        >
          <Ionicons
            name={isEnabled ? 'notifications' : 'notifications-off-outline'}
            size={18}
            color={isEnabled ? '#FFFFFF' : colors.onSurfaceVariant}
          />
        </View>
        <View style={styles.textGroup}>
          <Text style={[styles.title, { color: colors.onSurface }]}>
            {language === 'tr' ? 'Kişisel Deprem Alarmım' : 'My Personal Alert Zone'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            {isEnabled
              ? `📍 ${distLabel} | ⚡ ${magLabel}`
              : (language === 'tr' ? 'Alarm kapalı · Kurmak için dokunun' : 'Alert disabled · Tap to configure')}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.primary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
});
