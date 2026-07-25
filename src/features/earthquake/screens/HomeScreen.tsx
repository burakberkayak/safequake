import { Ionicons } from "@expo/vector-icons";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  EmptyState,
  ErrorState,
  SkeletonBlock,
} from "../../../components/ScreenState";
import { useTranslation } from "../../../hooks/useTranslation";
import { RootTabParamList } from "../../../navigation/types";
import { useAppSelector } from "../../../store/hooks";
import { useAppTheme } from "../../../theme/ThemeProvider";
import { EmergencyStatusModal } from "../../emergency/components/EmergencyStatusModal";
import { AlertZoneBanner } from "../../notifications/components/AlertZoneBanner";
import { AlertZoneSheet } from "../../notifications/components/AlertZoneSheet";
import { EarthquakeFilterSheet } from "../components/EarthquakeFilterSheet";
import { EarthquakeListItem } from "../components/EarthquakeListItem";
import { EarthquakeStatsBanner } from "../components/EarthquakeStatsBanner";
import { EarthquakeStatsSheet } from "../components/EarthquakeStatsSheet";
import { LastEarthquakeCard } from "../components/LastEarthquakeCard";
import { useEarthquakes, useLatestEarthquake } from "../hooks/useEarthquakes";
import { Earthquake } from "../types/earthquake.types";

/**
 * PRD §7 - Ana Sayfa
 * - Son deprem kartı
 * - Güvendeyim / Acil Mesaj (SMS & WhatsApp)
 * - Kişisel Deprem Alarmı & Bölgesi
 * - Bölgesel deprem hareketliliği & İstatistikler
 * - Deprem listesi
 */
export const HomeScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const { t, language } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [statsSheetVisible, setStatsSheetVisible] = useState(false);
  const [alertZoneSheetVisible, setAlertZoneSheetVisible] = useState(false);
  const [emergencyModalVisible, setEmergencyModalVisible] = useState(false);

  // Redux store'dan filtreleri alıyoruz
  const filters = useAppSelector((state) => state.filters.filters);

  const handleSelectEarthquake = useCallback(
    (earthquake: Earthquake) => {
      navigation.navigate("Map", {
        focusedEarthquakeId: earthquake.id,
        focusedEarthquake: earthquake,
      });
    },
    [navigation],
  );

  // Son depremi her zaman çekiyoruz (filtrelerden bağımsız en güncel deprem)
  const { data: latest, isLoading: isLatestLoading } = useLatestEarthquake();

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
    return (
      <ErrorState
        message={
          language === "tr"
            ? "Deprem verileri alınamadı."
            : "Could not fetch earthquake data."
        }
        onRetry={refetch}
      />
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <FlatList
        data={paginatedEarthquakes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EarthquakeListItem
            earthquake={item}
            onPress={handleSelectEarthquake}
          />
        )}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.2}
        ListFooterComponent={() => {
          if (!earthquakes || visibleCount >= earthquakes.length) return null;
          return (
            <View style={{ paddingVertical: 16, alignItems: "center" }}>
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
              <LastEarthquakeCard
                earthquake={latest}
                onPress={() => handleSelectEarthquake(latest)}
              />
            ) : null}

            {/* Kişisel Deprem Alarmı & Bölgesi Kartı */}
            <AlertZoneBanner
              onOpenAlertSheet={() => setAlertZoneSheetVisible(true)}
            />

            {/* Bölgesel Deprem Hareketliliği ve İstatistik Özeti */}
            {earthquakes && earthquakes.length > 0 && (
              <EarthquakeStatsBanner
                earthquakes={earthquakes}
                onOpenStats={() => setStatsSheetVisible(true)}
              />
            )}

            {/* Filtre Başlığı ve Butonları */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                {language === "tr"
                  ? `Son Depremler (${earthquakes?.length ?? 0})`
                  : `Recent Earthquakes (${earthquakes?.length ?? 0})`}
              </Text>

              <View style={styles.headerActionRow}>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setStatsSheetVisible(true)}
                >
                  <Ionicons
                    name="stats-chart-outline"
                    size={15}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.filterButtonText, { color: colors.primary }]}
                  >
                    {language === "tr" ? "Analiz" : "Analytics"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setFilterSheetVisible(true)}
                >
                  <Ionicons
                    name="funnel-outline"
                    size={15}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.filterButtonText, { color: colors.primary }]}
                  >
                    {t("filter")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Aktif Filtre Chip'leri */}
            {(filters.minMagnitude || filters.radiusKm) && (
              <View style={styles.chipsRow}>
                {filters.minMagnitude && (
                  <View
                    style={[
                      styles.chip,
                      {
                        backgroundColor: colors.primary + "15",
                        borderColor: colors.primary + "30",
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: colors.primary }]}>
                      {t("magnitude")}: {filters.minMagnitude}+
                    </Text>
                  </View>
                )}
                {filters.radiusKm && (
                  <View
                    style={[
                      styles.chip,
                      {
                        backgroundColor: colors.primary + "15",
                        borderColor: colors.primary + "30",
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: colors.primary }]}>
                      {t("distance")}: {filters.radiusKm} km
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              title={
                language === "tr" ? "Deprem Bulunamadı" : "No Earthquakes Found"
              }
              description={
                language === "tr"
                  ? "Seçtiğiniz kriterlere uygun deprem kaydı bulunamadı."
                  : "No earthquakes match your filter criteria."
              }
            />
          ) : (
            <View style={styles.skeletonContainer}>
              <SkeletonBlock height={80} />
              <SkeletonBlock height={80} />
              <SkeletonBlock height={80} />
            </View>
          )
        }
      />

      {/* Deprem Filtre Sheet'i */}
      <EarthquakeFilterSheet
        visible={filterSheetVisible}
        onClose={() => setFilterSheetVisible(false)}
      />

      {/* Deprem İstatistik Sheet'i */}
      <EarthquakeStatsSheet
        visible={statsSheetVisible}
        onClose={() => setStatsSheetVisible(false)}
        earthquakes={earthquakes ?? []}
      />

      {/* Deprem Alarm Bölgesi Sheet'i */}
      <AlertZoneSheet
        visible={alertZoneSheetVisible}
        onClose={() => setAlertZoneSheetVisible(false)}
      />

      {/* Tek Tıkla SMS & WhatsApp Güvendeyim Paneli */}
      <EmergencyStatusModal
        visible={emergencyModalVisible}
        onClose={() => setEmergencyModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  safetyBroadCastBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  safetyBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  safetyIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  safetyTextGroup: {
    flex: 1,
    gap: 2,
  },
  safetyBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  safetyBannerSubText: {
    fontSize: 11,
    fontWeight: "500",
  },
  quickBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  quickBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  headerActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  chipsRow: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  skeletonContainer: {
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 12,
  },
});
