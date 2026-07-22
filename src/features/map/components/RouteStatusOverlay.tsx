import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { ActiveRoute } from '../hooks/useMapRoute';

interface RouteStatusOverlayProps {
  activeRoute: ActiveRoute | null;
  isCalculatingRoute: boolean;
  language: 'tr' | 'en';
  onClearRoute: () => void;
}

/** OSRM rota sonucu banner'ı ve rota hesaplanırken gösterilen yükleniyor göstergesi. */
export const RouteStatusOverlay: React.FC<RouteStatusOverlayProps> = ({
  activeRoute,
  isCalculatingRoute,
  language,
  onClearRoute,
}) => {
  const { colors } = useAppTheme();

  return (
    <>
      {activeRoute && (
        <View style={[styles.routeBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.routeBannerContent}>
            <View style={styles.routeBannerIcon}>
              <Ionicons name="car" size={20} color="#007AFF" />
            </View>
            <View style={styles.routeBannerTextGroup}>
              <Text style={[styles.routeDestTitle, { color: colors.onSurface }]} numberOfLines={1}>
                {activeRoute.destinationName}
              </Text>
              <Text style={[styles.routeStatsText, { color: colors.onSurfaceVariant }]}>
                🚗 {activeRoute.distanceKm.toFixed(1)} km · ⏱️ {activeRoute.durationMins}{' '}
                {language === 'tr' ? 'dk sürüş' : 'mins drive'}
              </Text>
            </View>
            <TouchableOpacity style={styles.clearRouteBtn} onPress={onClearRoute}>
              <Ionicons name="close-circle" size={22} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isCalculatingRoute && (
        <View style={[styles.calculatingBanner, { backgroundColor: colors.surface }]}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.calculatingText, { color: colors.onSurface }]}>
            {language === 'tr' ? 'Canlı sürüş rotası çiziliyor...' : 'Calculating driving route...'}
          </Text>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  routeBanner: {
    position: 'absolute',
    top: 96,
    left: 16,
    right: 70,
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 5,
  },
  routeBannerContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeBannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeBannerTextGroup: { flex: 1, gap: 2 },
  routeDestTitle: { fontSize: 13, fontWeight: '700' },
  routeStatsText: { fontSize: 11, fontWeight: '600' },
  clearRouteBtn: { padding: 2 },
  calculatingBanner: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  calculatingText: { fontSize: 12, fontWeight: '600' },
});
