import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { PieChart, PieSlice } from "@/lib/components/ui/PieChart";
import { PlacementLegend } from "@/lib/components/statistics/PlacementLegend";
import { StatRow } from "@/lib/components/statistics/StatRow";
import { inset, space } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";
import { ui } from "@/lib/theme/ui";
import { SeatStats } from "@/lib/utils/statistics";

/**
 * Placement is ordinal (1st is strictly better than 2nd, etc.), so slices are
 * one hue at monotone opacity steps rather than unrelated categorical colors.
 */
const PLACEMENT_OPACITIES = ["FF", "CC", "88", "44"];

type Props = {
  seat: SeatStats;
};

function formatPercent(value: number | null): string {
  return value === null ? "–" : `${Math.round(value * 100)}%`;
}

function formatScore(value: number | null): string {
  return value === null ? "–" : value.toFixed(1);
}

export function SeatCard({ seat }: Props) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const isCompact = screenWidth < ui.breakpointTablet;
  const styles = useMemo(() => makeStyles(colors, isCompact), [colors, isCompact]);
  const { t } = useTranslation(["statistics"]);

  const sliceColor = (i: number) => `${colors.primary}${PLACEMENT_OPACITIES[i] ?? "44"}`;

  const slices: PieSlice[] = seat.placementCounts.map((count, i) => ({
    value: count,
    color: sliceColor(i),
  }));

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t("seatLabel", { n: seat.seat + 1 })}</Text>

      <View style={styles.barRow}>
        <Text style={styles.barLabel}>{t("winRate")}</Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${(seat.winRate ?? 0) * 100}%` }]} />
        </View>
        <Text style={styles.barValue}>
          {formatPercent(seat.winRate)}
          {seat.matches > 0 && (
            <Text style={styles.barValueCount}>
              {" "}
              ({seat.wins}/{seat.matches})
            </Text>
          )}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <View style={styles.pieSection}>
          <PieChart slices={slices} />

          <PlacementLegend
            placementRates={seat.placementRates}
            placementCounts={seat.placementCounts}
            matches={seat.matches}
            sliceColor={sliceColor}
          />
        </View>

        <View style={styles.scoreStatsColumn}>
          <StatRow label={t("scoreMin")} value={formatScore(seat.minScore)} />
          <StatRow label={t("scoreAvg")} value={formatScore(seat.avgScore)} />
          <StatRow label={t("scoreMedian")} value={formatScore(seat.medianScore)} />
          <StatRow label={t("scoreMax")} value={formatScore(seat.maxScore)} />
          <StatRow label={t("scoreStdDev")} value={formatScore(seat.stdDevScore)} />
        </View>
      </View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"], isCompact: boolean) {
  return StyleSheet.create({
    card: {
      width: isCompact ? "100%" : "48%",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: inset.card,
      gap: space[2],
    },
    title: {
      ...type.bodySmall,
      color: colors.text,
      fontWeight: "700",
    },
    barRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[2],
    },
    barLabel: {
      ...type.caption,
      color: colors.textSecondary,
      width: 56,
    },
    barTrack: {
      flex: 1,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
      overflow: "hidden",
    },
    barFill: {
      height: "100%",
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
    barValue: {
      ...type.caption,
      color: colors.text,
      fontWeight: "600",
      width: 84,
      textAlign: "right",
    },
    barValueCount: {
      ...type.caption,
      color: colors.textMuted,
      fontWeight: "400",
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
    },
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: space[3],
    },
    pieSection: {
      flex: 1,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: space[3],
    },
    scoreStatsColumn: {
      flex: 1,
      gap: 4,
    },
  });
}
