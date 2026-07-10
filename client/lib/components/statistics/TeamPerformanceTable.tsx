import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import { InfoButton } from "@/lib/components/ui/InfoButton";
import { inset, space } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";
import { TeamSeatPerformance } from "@/lib/utils/statistics";

type Props = {
  teamPerformance: TeamSeatPerformance[];
};

export function TeamPerformanceTable({ teamPerformance }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["statistics"]);

  return (
    <View>
      <View style={styles.headingRow}>
        <Text style={styles.heading}>{t("teamPerformanceHeading")}</Text>
        <InfoButton title={t("teamPerformanceHeading")} message={t("infoTeamPerformance")} />
      </View>

      {teamPerformance.length === 0 ? (
        <EmptyState message={t("noData")} style={{ paddingVertical: inset.group, flex: 0 }} />
      ) : (
        <View style={styles.list}>
          <View style={styles.headerRow}>
            <Text style={[styles.headerCell, styles.headerTeamCol]}>{t("colTeam")}</Text>
            <Text style={styles.headerCell}>{t("colActualPlacement")}</Text>
            <Text style={styles.headerCell}>{t("colExpectedPlacement")}</Text>
            <Text style={styles.headerCell}>{t("colDelta")}</Text>
          </View>
          {teamPerformance.map((tp) => (
            <View key={tp.teamId} style={styles.row}>
              <View style={styles.teamCol}>
                <Text style={styles.teamName} numberOfLines={1}>
                  {tp.teamName}
                </Text>
                <Text style={styles.teamCode}>{tp.teamCode}</Text>
              </View>
              <Text style={styles.value}>{tp.avgActualPlacement.toFixed(2)}</Text>
              <Text style={styles.value}>{tp.avgExpectedPlacement.toFixed(2)}</Text>
              <Text
                style={[
                  styles.value,
                  tp.delta > 0.005
                    ? styles.deltaPositive
                    : tp.delta < -0.005
                      ? styles.deltaNegative
                      : null,
                ]}
              >
                {tp.delta > 0 ? "+" : ""}
                {tp.delta.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    headingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    heading: {
      fontSize: 13,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      color: colors.accent,
    },
    list: {
      marginTop: space[2],
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      overflow: "hidden",
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: inset.card,
      paddingVertical: space[2],
      backgroundColor: colors.surfaceHigh,
      gap: space[2],
    },
    headerCell: {
      ...type.caption,
      color: colors.textMuted,
      fontWeight: "700",
      textTransform: "uppercase",
      width: 64,
      textAlign: "right",
    },
    headerTeamCol: {
      flex: 1,
      textAlign: "left",
      width: undefined,
    },
    teamCol: {
      flex: 1,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: inset.card,
      paddingVertical: 8,
      gap: space[2],
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
    },
    teamName: {
      ...type.bodySmall,
      color: colors.text,
    },
    teamCode: {
      ...type.caption,
      color: colors.textMuted,
    },
    value: {
      ...type.bodySmall,
      color: colors.textSecondary,
      width: 64,
      textAlign: "right",
    },
    deltaPositive: {
      color: colors.success,
      fontWeight: "700",
    },
    deltaNegative: {
      color: colors.error,
      fontWeight: "700",
    },
  });
}
