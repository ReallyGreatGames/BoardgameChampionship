import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { ParticipantGameEntry } from "@/lib/hooks/useParticipantOverview";
import { inset, space } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";
import { ui } from "@/lib/theme/ui";
import { formatPoints } from "@/lib/utils";

interface Props {
  entries: ParticipantGameEntry[];
  totalPoints: number;
  playedCount: number;
  totalCount: number;
}

export function PlayerScoreSummary({
  entries,
  totalPoints,
  playedCount,
  totalCount,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation(["home"]);

  const styles = useMemo(() => makeStyles(colors), [colors]);

  const segmentColor = (entry: ParticipantGameEntry) => {
    if (entry.state === "playing") {
      return colors.accent;
    }
    return entry.state === "played" ? colors.primary : colors.divider;
  };

  return (
    <View style={styles.card}>
      <View style={styles.headline}>
        <Text style={styles.points}>{formatPoints(totalPoints)}</Text>
        <Text style={styles.pointsLabel}>{t("points")}</Text>
        <Text style={styles.progressLabel}>
          {t("afterGames", { played: playedCount, total: totalCount })}
        </Text>
      </View>

      <View style={styles.track}>
        {entries.map((entry) => (
          <View
            key={entry.scheduleId}
            style={[styles.segment, { backgroundColor: segmentColor(entry) }]}
          />
        ))}
      </View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: ui.cardRadius,
      paddingVertical: space[3],
      paddingHorizontal: inset.card,
      gap: space[2],
    },
    headline: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: space[2],
    },
    points: {
      ...type.bigNumber,
      color: colors.text,
    },
    pointsLabel: {
      ...type.h2,
      color: colors.text,
    },
    progressLabel: {
      ...type.bodySmall,
      color: colors.textMuted,
      flex: 1,
      minWidth: 0,
      textAlign: "right",
    },
    track: {
      flexDirection: "row",
      gap: space[1],
    },
    segment: {
      flex: 1,
      height: 8,
      borderRadius: 4,
    },
  });
}
