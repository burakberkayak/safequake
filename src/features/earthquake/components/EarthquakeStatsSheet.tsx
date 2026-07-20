import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { BottomSheet } from '../../../components/BottomSheet';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { Earthquake } from '../types/earthquake.types';
import { calculateEarthquakeStats } from '../utils/earthquakeStats';
import { MagnitudeBadge } from './MagnitudeBadge';
import { Ionicons } from '@expo/vector-icons';

interface EarthquakeStatsSheetProps {
  visible: boolean;
  onClose: () => void;
  earthquakes: Earthquake[];
  timeRangeLabel?: string;
}

export const EarthquakeStatsSheet: React.FC<EarthquakeStatsSheetProps> = ({
  visible,
  onClose,
  earthquakes,
  timeRangeLabel = 'Son 100 Deprem',
}) => {
  const { colors } = useAppTheme();
  const stats = calculateEarthquakeStats(earthquakes);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Title & Period */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="analytics" size={22} color={colors.primary} />
            <Text style={[styles.title, { color: colors.onSurface }]}>Deprem İstatistikleri</Text>
          </View>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            {timeRangeLabel} içindeki {stats.totalCount} sarsıntının özeti
          </Text>
        </View>

        {/* KPI Cards Grid */}
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="pulse" size={20} color={colors.primary} />
            <Text style={[styles.kpiValue, { color: colors.onSurface }]}>{stats.totalCount}</Text>
            <Text style={[styles.kpiLabel, { color: colors.onSurfaceVariant }]}>Toplam Deprem</Text>
          </View>

          <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="flash-outline" size={20} color="#FF9800" />
            <Text style={[styles.kpiValue, { color: colors.onSurface }]}>{stats.maxMagnitude.toFixed(1)}</Text>
            <Text style={[styles.kpiLabel, { color: colors.onSurfaceVariant }]}>Maks. Büyüklük</Text>
          </View>

          <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="speedometer-outline" size={20} color="#2196F3" />
            <Text style={[styles.kpiValue, { color: colors.onSurface }]}>{stats.avgMagnitude.toFixed(1)}</Text>
            <Text style={[styles.kpiLabel, { color: colors.onSurfaceVariant }]}>Ort. Büyüklük</Text>
          </View>

          <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="layers-outline" size={20} color="#9C27B0" />
            <Text style={[styles.kpiValue, { color: colors.onSurface }]}>{stats.avgDepthKm.toFixed(1)} km</Text>
            <Text style={[styles.kpiLabel, { color: colors.onSurfaceVariant }]}>Ort. Derinlik</Text>
          </View>
        </View>

        {/* Max Magnitude Highlight */}
        {stats.maxMagnitudeEarthquake && (
          <View style={[styles.maxEqCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
            <View style={styles.maxEqHeader}>
              <Ionicons name="alert-circle" size={18} color={colors.primary} />
              <Text style={[styles.maxEqTitle, { color: colors.primary }]}>En Şiddetli Deprem</Text>
            </View>
            <View style={styles.maxEqBody}>
              <MagnitudeBadge magnitude={stats.maxMagnitudeEarthquake.magnitude} size="small" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.maxEqLocation, { color: colors.onSurface }]} numberOfLines={1}>
                  {stats.maxMagnitudeEarthquake.location}
                </Text>
                <Text style={[styles.maxEqMeta, { color: colors.onSurfaceVariant }]}>
                  Derinlik: {stats.maxMagnitudeEarthquake.depthKm.toFixed(1)} km
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Magnitude Distribution */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Büyüklük Dağılımı</Text>

          {/* Minor (< 3.0) */}
          <View style={styles.barItem}>
            <View style={styles.barLabelRow}>
              <Text style={[styles.barLabel, { color: colors.onSurface }]}>Hafif (&lt; 3.0 ML)</Text>
              <Text style={[styles.barCount, { color: colors.onSurfaceVariant }]}>
                {stats.magnitudeRanges.minor.count} ({stats.magnitudeRanges.minor.percentage}%)
              </Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { width: `${stats.magnitudeRanges.minor.percentage}%`, backgroundColor: '#4CAF50' },
                ]}
              />
            </View>
          </View>

          {/* Moderate (3.0 - 4.9) */}
          <View style={styles.barItem}>
            <View style={styles.barLabelRow}>
              <Text style={[styles.barLabel, { color: colors.onSurface }]}>Orta (3.0 - 4.9 ML)</Text>
              <Text style={[styles.barCount, { color: colors.onSurfaceVariant }]}>
                {stats.magnitudeRanges.moderate.count} ({stats.magnitudeRanges.moderate.percentage}%)
              </Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { width: `${stats.magnitudeRanges.moderate.percentage}%`, backgroundColor: '#FF9800' },
                ]}
              />
            </View>
          </View>

          {/* Major (>= 5.0) */}
          <View style={styles.barItem}>
            <View style={styles.barLabelRow}>
              <Text style={[styles.barLabel, { color: colors.onSurface }]}>Şiddetli (&ge; 5.0 ML)</Text>
              <Text style={[styles.barCount, { color: colors.onSurfaceVariant }]}>
                {stats.magnitudeRanges.major.count} ({stats.magnitudeRanges.major.percentage}%)
              </Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { width: `${stats.magnitudeRanges.major.percentage}%`, backgroundColor: '#F44336' },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Top Active Regions */}
        {stats.topRegions.length > 0 && (
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>En Hareketli Bölgeler / Şehirler</Text>
            {stats.topRegions.map((region, index) => (
              <View key={region.regionName} style={styles.regionRow}>
                <View style={styles.regionRank}>
                  <Text style={[styles.regionRankText, { color: colors.primary }]}>{index + 1}</Text>
                </View>
                <View style={styles.regionInfo}>
                  <Text style={[styles.regionName, { color: colors.onSurface }]}>{region.regionName}</Text>
                  <Text style={[styles.regionSub, { color: colors.onSurfaceVariant }]}>
                    {region.count} sarsıntı kaydedildi
                  </Text>
                </View>
                <MagnitudeBadge magnitude={region.maxMag} size="small" />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
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
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    width: '48%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  maxEqCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  maxEqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  maxEqTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  maxEqBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  maxEqLocation: {
    fontSize: 15,
    fontWeight: '700',
  },
  maxEqMeta: {
    fontSize: 12,
  },
  sectionCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  barItem: {
    gap: 6,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  barCount: {
    fontSize: 12,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E030',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  regionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  regionRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  regionRankText: {
    fontSize: 12,
    fontWeight: '700',
  },
  regionInfo: {
    flex: 1,
  },
  regionName: {
    fontSize: 14,
    fontWeight: '600',
  },
  regionSub: {
    fontSize: 12,
  },
});
