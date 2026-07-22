import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "../../../hooks/useTranslation";
import { useAppTheme } from "../../../theme/ThemeProvider";
import { MagnitudeBadge } from "../../earthquake/components/MagnitudeBadge";
import { Earthquake } from "../../earthquake/types/earthquake.types";
import { formatEarthquakeDateTime } from "../../earthquake/utils/formatEarthquake";

interface EarthquakeDetailSheetContentProps {
  earthquake: Earthquake;
}

/**
 * PRD §8: Marker tıklanınca Bottom Sheet'te büyüklük, tarih, saat,
 * koordinatlar, derinlik gösterilir.
 */
export const EarthquakeDetailSheetContent: React.FC<
  EarthquakeDetailSheetContentProps
> = ({ earthquake }) => {
  const { colors } = useAppTheme();
  const { language } = useTranslation();
  const { date, time } = formatEarthquakeDateTime(earthquake.occurredAt, language);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <MagnitudeBadge magnitude={earthquake.magnitude} size="large" />
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.onSurface }]}>
            {earthquake.location}
          </Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            {date} · {time}
          </Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <DetailRow
        label={language === "tr" ? "Derinlik" : "Depth"}
        value={`${earthquake.depthKm.toFixed(1)} km`}
      />
      <DetailRow
        label={language === "tr" ? "Koordinatlar" : "Coordinates"}
        value={`${earthquake.latitude.toFixed(4)}, ${earthquake.longitude.toFixed(4)}`}
      />
      <DetailRow
        label={language === "tr" ? "Kaynak" : "Source"}
        value={earthquake.source}
      />
    </View>
  );
};

const DetailRow: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => {
  const { colors } = useAppTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
        {label}
      </Text>
      <Text style={[styles.value, { color: colors.onSurface }]}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 4 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 12,
  },
  headerText: { flex: 1 },
  title: { fontSize: 17, fontWeight: "700" },
  subtitle: { fontSize: 13, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 8 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  label: { fontSize: 14 },
  value: { fontSize: 14, fontWeight: "600" },
});
