import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Earthquake } from '../../earthquake/types/earthquake.types';
import { MagnitudeBadge } from '../../earthquake/components/MagnitudeBadge';
import { formatEarthquakeDateTime } from '../../earthquake/utils/formatEarthquake';
import { useTranslation } from '../../../hooks/useTranslation';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';

interface EarthquakeCalloutProps {
  earthquake: Earthquake;
  onPressDetails: () => void;
  onClose: () => void;
}

export const EarthquakeCallout: React.FC<EarthquakeCalloutProps> = ({
  earthquake,
  onPressDetails,
  onClose,
}) => {
  const { colors } = useAppTheme();
  const { language } = useTranslation();
  const { time } = formatEarthquakeDateTime(earthquake.occurredAt);

  return (
    <View style={[styles.calloutCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Close Button */}
      <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
        <Ionicons name="close-circle" size={18} color={colors.onSurfaceVariant} />
      </TouchableOpacity>

      <View style={styles.contentRow}>
        <MagnitudeBadge magnitude={earthquake.magnitude} size="small" />
        <View style={styles.infoGroup}>
          <Text style={[styles.locationText, { color: colors.onSurface }]} numberOfLines={1}>
            {earthquake.location}
          </Text>
          <Text style={[styles.timeText, { color: colors.onSurfaceVariant }]}>
            🕒 {time} · {earthquake.depthKm.toFixed(1)} km {language === 'tr' ? 'derinlik' : 'depth'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.detailBtn, { backgroundColor: colors.primary }]}
        onPress={onPressDetails}
      >
        <Text style={styles.detailBtnText}>
          {language === 'tr' ? 'Tüm Detayları Gör' : 'View Full Details'}
        </Text>
        <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  calloutCard: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    width: 240,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  closeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 10,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 16,
  },
  infoGroup: {
    flex: 1,
    gap: 2,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 11,
  },
  detailBtn: {
    height: 32,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  detailBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
