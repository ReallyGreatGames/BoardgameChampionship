import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { ParticipantGameEntry } from "@/lib/hooks/useParticipantOverview";
import { space } from "@/lib/theme/spacing";
import { fonts, type } from "@/lib/theme/typography";
import { formatPoints } from "@/lib/utils";

interface Props {
  entries: ParticipantGameEntry[];
}

export function PlayerGameList({ entries }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation(["home"]);

  const styles = useMemo(() => makeStyles(colors), [colors]);

  const metaFor = (entry: ParticipantGameEntry) => {
    const parts = [t("round", { round: entry.round })];
    parts.push(
      entry.tableNumber !== null
        ? t("table", { table: entry.tableNumber })
        : t("tableToBeAnnounced"),
    );
    if (entry.placement !== null) {
      parts.push(t(`placements.${entry.placement}`));
    }
    return parts.join(" · ");
  };

  return (
    <View>
      {entries.map((entry, index) => {
        const upcoming = entry.state === "upcoming";
        return (
          <View
            key={entry.scheduleId}
            style={[styles.row, index < entries.length - 1 && styles.rowDivider]}
          >
            <View style={styles.rowText}>
              <Text style={upcoming ? styles.titleUpcoming : styles.title} numberOfLines={1}>
                {entry.title}
              </Text>
              <Text style={upcoming ? styles.metaUpcoming : styles.meta} numberOfLines={1}>
                {metaFor(entry)}
              </Text>
            </View>
            {entry.points !== null ? (
              <Text style={styles.points}>{formatPoints(entry.points)}</Text>
            ) : (
              <Text style={styles.pending}>
                {entry.state === "playing" ? t("playingNow") : t("notPlayed")}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[3],
      paddingVertical: 9,
    },
    rowDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    rowText: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    title: {
      ...type.body,
      fontFamily: fonts.bodyBold,
      color: colors.text,
    },
    titleUpcoming: {
      ...type.body,
      fontFamily: fonts.bodyBold,
      color: colors.textMuted,
    },
    meta: {
      ...type.bodySmall,
      color: colors.textMuted,
    },
    metaUpcoming: {
      ...type.bodySmall,
      color: colors.textPlaceholder,
    },
    points: {
      fontFamily: fonts.displayBold,
      fontSize: 24,
      lineHeight: 26,
      color: colors.primary,
    },
    pending: {
      ...type.bodySmall,
      color: colors.textPlaceholder,
    },
  });
}
