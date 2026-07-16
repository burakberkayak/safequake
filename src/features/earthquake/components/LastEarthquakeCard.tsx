import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { Earthquake } from '../types/earthquake.types';
import { MagnitudeBadge } from './MagnitudeBadge';
import { formatEarthquakeDateTime } from '../utils/formatEarthquake';

import { useTranslation } from '../../../hooks/useTranslation';

interface LastEarthquakeCardProps {
  earthquake: Earthquake;
}

/**
 * PRD §7: Ana Sayfa - Son deprem (büyüklük, tarih, saat, derinlik, şehir)
 */
export const LastEarthquakeCard: React.FC<LastEarthquakeCardProps> = ({ earthquake }) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const { date, time } = formatEarthquakeDateTime(earthquake.occurredAt);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <MagnitudeBadge magnitude={earthquake.magnitude} size="large" />
      <View style={styles.info}>
        <Text style={[styles.location, { color: colors.onSurface }]} numberOfLines={1}>
          {earthquake.location}
        </Text>
        <Text style={[styles.meta, { color: colors.onSurfaceVariant }]}>
          {date} · {time}
        </Text>
        <Text style={[styles.meta, { color: colors.onSurfaceVariant }]}>
          {t('depth')}: {earthquake.depthKm.toFixed(1)} km
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  location: {
    fontSize: 18,
    fontWeight: '700',
  },
  meta: {
    fontSize: 13,
  },
});
