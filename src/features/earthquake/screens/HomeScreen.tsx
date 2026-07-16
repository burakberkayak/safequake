import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { useAppSelector } from '../../../store/hooks';
import { useEarthquakes, useLatestEarthquake } from '../hooks/useEarthquakes';
import { Earthquake } from '../types/earthquake.types';
import { LastEarthquakeCard } from '../components/LastEarthquakeCard';
import { EarthquakeListItem } from '../components/EarthquakeListItem';
import { EmptyState, ErrorState, SkeletonBlock } from '../../../components/ScreenState';
import { RootTabParamList } from '../../../navigation/types';
import { EarthquakeFilterSheet } from '../components/EarthquakeFilterSheet';
import { useTranslation } from '../../../hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';

/**
 * PRD §7 - Ana Sayfa
 * - Son deprem kartı
 * - Deprem listesi (Redux filtreleri ile filtrelenmiş + Pull To Refresh)
 * - SafeAreaView entegrasyonu ile çentik/status bar uyumu
 */
export const HomeScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const { t, language } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);

  // Redux store'dan filtreleri alıyoruz
  const filters = useAppSelector((state) => state.filters.filters);

  const handleSelectEarthquake = useCallback(
    (earthquake: Earthquake) => {
      navigation.navigate('Map', {
        screen: 'MapHome',
        params: { focusedEarthquakeId: earthquake.id },
      });
    },
    [navigation]
  );

  // Son depremi her zaman çekiyoruz (filtrelerden bağımsız en güncel deprem)
  const {
    data: latest,
    isLoading: isLatestLoading,
  } = useLatestEarthquake();

  // Deprem listesini seçili filtrelere göre çekiyoruz
  const {
    data: earthquakes,
    isLoading,
    isError,
    refetch,
  } = useEarthquakes(filters);

  // Pagination states
  const [visibleCount, setVisibleCount] = useState(15);

  useEffect(() => {
    setVisibleCount(15);
  }, [filters]);

  const paginatedEarthquakes = useMemo(() => {
    return earthquakes?.slice(0, visibleCount) ?? [];
  }, [earthquakes, visibleCount]);

  const handleLoadMore = useCallback(() => {
    if (!earthquakes) return;
    if (visibleCount < earthquakes.length) {
      setVisibleCount((prev) => prev + 15);
    }
  }, [earthquakes, visibleCount]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isError) {
    return <ErrorState message={language === 'tr' ? 'Deprem verileri alınamadı.' : 'Could not fetch earthquake data.'} onRetry={refetch} />;
  }

  const rangeLabels = {
    '24h': t('last24h'),
    '7d': t('last7d'),
    '30d': t('last30d'),
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <FlatList
        data={paginatedEarthquakes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EarthquakeListItem earthquake={item} onPress={handleSelectEarthquake} />
        )}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.2}
        ListFooterComponent={() => {
          if (!earthquakes || visibleCount >= earthquakes.length) return null;
          return (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          );
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            {isLatestLoading ? (
              <SkeletonBlock height={96} />
            ) : latest ? (
              <LastEarthquakeCard earthquake={latest} />
            ) : null}
            
            {/* Filtre Başlığı ve Butonu */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                {rangeLabels[filters.timeRange]}
              </Text>
              <TouchableOpacity 
                style={[styles.filterButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setFilterSheetVisible(true)}
              >
                <Ionicons name="funnel-outline" size={16} color={colors.primary} />
                <Text style={[styles.filterButtonText, { color: colors.primary }]}>{t('filter')}</Text>
              </TouchableOpacity>
            </View>

            {/* Aktif Filtre Chip'leri */}
            {(filters.minMagnitude || filters.radiusKm) && (
              <View style={styles.chipsRow}>
                {filters.minMagnitude && (
                  <View style={[styles.chip, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                    <Text style={[styles.chipText, { color: colors.primary }]}>
                      {t('magnitude')}: {filters.minMagnitude}+
                    </Text>
                  </View>
                )}
                {filters.radiusKm && (
                  <View style={[styles.chip, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                    <Text style={[styles.chipText, { color: colors.primary }]}>
                      {t('distance')}: {filters.radiusKm} km
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.skeletonList}>
              <SkeletonBlock height={64} />
              <SkeletonBlock height={64} />
              <SkeletonBlock height={64} />
            </View>
          ) : (
            <EmptyState 
              title={t('noEarthquakes')} 
              description={t('noEarthquakesDesc')} 
            />
          )
        }
        contentContainerStyle={styles.listContent}
      />

      <EarthquakeFilterSheet 
        visible={filterSheetVisible} 
        onClose={() => setFilterSheetVisible(false)} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  header: {
    gap: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: -8,
    marginBottom: 4,
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  skeletonList: {
    gap: 12,
  },
});
