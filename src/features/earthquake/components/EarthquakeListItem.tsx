import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { Earthquake } from '../types/earthquake.types';
import { MagnitudeBadge } from './MagnitudeBadge';
import { formatEarthquakeDateTime } from '../utils/formatEarthquake';
import { useTranslation } from '../../../hooks/useTranslation';

interface EarthquakeListItemProps {
  earthquake: Earthquake;
  onPress?: (earthquake: Earthquake) => void;
}

/**
 * PRD §7: Liste elemanında büyüklük, şehir, saat gösterilir.
 */
export const EarthquakeListItem: React.FC<EarthquakeListItemProps> = React.memo(
  ({ earthquake, onPress }) => {
    const { colors } = useAppTheme();
    const { language } = useTranslation();
    const { date, time } = formatEarthquakeDateTime(earthquake.occurredAt, language);

    return (
      <Pressable
        onPress={() => onPress?.(earthquake)}
        style={({ pressed }) => [
          styles.row,
          { borderBottomColor: colors.border, opacity: pressed ? 0.6 : 1 },
        ]}
      >
        <MagnitudeBadge magnitude={earthquake.magnitude} />
        <View style={styles.info}>
          <Text style={[styles.province, { color: colors.onSurface }]} numberOfLines={1}>
            {earthquake.province}
          </Text>
          <Text style={[styles.location, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
            {earthquake.location}
          </Text>
        </View>
        <View style={styles.timeContainer}>
          <Text style={[styles.time, { color: colors.onSurface }]}>{time}</Text>
          <Text style={[styles.date, { color: colors.onSurfaceVariant }]}>{date}</Text>
        </View>
      </Pressable>
    );
  }
);

EarthquakeListItem.displayName = 'EarthquakeListItem';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  info: {
    flex: 1,
  },
  province: {
    fontSize: 15,
    fontWeight: '600',
  },
  location: {
    fontSize: 13,
  },
  timeContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 60,
  },
  time: {
    fontSize: 14,
    fontWeight: '600',
  },
  date: {
    fontSize: 11,
    marginTop: 2,
  },
});
