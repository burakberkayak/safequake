import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { Earthquake } from '../types/earthquake.types';
import { calculateEarthquakeStats } from '../utils/earthquakeStats';
import { Ionicons } from '@expo/vector-icons';

interface EarthquakeStatsBannerProps {
  earthquakes: Earthquake[];
  onOpenStats: () => void;
  timeRangeLabel?: string;
}

export const EarthquakeStatsBanner: React.FC<EarthquakeStatsBannerProps> = ({
  earthquakes,
  onOpenStats,
  timeRangeLabel = 'Son 100 Deprem',
}) => {
  const { colors } = useAppTheme();
  const stats = calculateEarthquakeStats(earthquakes);

  if (stats.totalCount === 0) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onOpenStats}
      style={[styles.banner, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="stats-chart" size={16} color={colors.primary} />
          </View>
          <Text style={[styles.bannerTitle, { color: colors.onSurface }]}>Son 100 Deprem İstatistikleri</Text>
        </View>
        <View style={styles.moreRow}>
          <Text style={[styles.moreText, { color: colors.primary }]}>Analiz</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.onSurface }]}>{stats.totalCount}</Text>
          <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>{timeRangeLabel}</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.onSurface }]}>{stats.maxMagnitude.toFixed(1)}</Text>
          <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Maks. Büyüklük</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.onSurface }]} numberOfLines={1}>
            {stats.topRegions[0]?.regionName ?? '-'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>En Çok Sarsılan</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  banner: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  moreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  moreText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
  },
  divider: {
    width: 1,
    height: 24,
  },
});
