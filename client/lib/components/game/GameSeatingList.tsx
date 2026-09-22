import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { usePlayer } from "@/lib/bootstrap/PlayerProvider";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { Player } from "@/lib/models/player";
import { Table } from "@/lib/models/table";
import { space } from "@/lib/theme/spacing";
import { fonts, type } from "@/lib/theme/typography";
import { ui } from "@/lib/theme/ui";

interface Props {
  table: Table | null | undefined;
}

function teamOf(player: Player): { name: string; country: string } {
  const team = player.team;
  if (!team || typeof team === "string") {
    return { name: "", country: "" };
  }
  return { name: team.name ?? "", country: team.country ?? "" };
}

export function GameSeatingList({ table }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { player: currentPlayer } = usePlayer();
  const { t } = useTranslation(["game"]);

  if (!table) {
    return null;
  }

  const players = table.players ?? [];

  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>{t("seating.title")}</Text>

      <View style={styles.card}>
        {players.map((player, index) => {
          const isMe = player.$id === currentPlayer?.$id;
          const team = teamOf(player);

          return (
            <View
              key={`${player.$id}-${index}`}
              style={[
                styles.row,
                index > 0 && styles.rowDivided,
                isMe && styles.rowMe,
              ]}
            >
              <View style={[styles.seat, isMe && styles.seatMe]}>
                <Text style={[styles.seatText, isMe && styles.seatTextMe]}>
                  {index + 1}
                </Text>
              </View>

              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>
                  {player.name}
                </Text>
                <View style={styles.metaRow}>
                  {!!team.country && (
                    <Text style={styles.country}>{team.country}</Text>
                  )}
                  <Text style={styles.team} numberOfLines={1}>
                    {team.name}
                  </Text>
                </View>
              </View>

              <Text style={styles.seatLabel}>
                {t("seating.seat", { seat: index + 1 })}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    section: {
      gap: space[2],
    },
    eyebrow: {
      ...type.eyebrow,
      color: colors.textMuted,
    },
    card: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: ui.cardRadius,
      overflow: "hidden",
      backgroundColor: colors.background,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[3],
      minHeight: 44,
      paddingHorizontal: space[3],
      paddingVertical: space[3],
    },
    rowDivided: {
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    rowMe: {
      backgroundColor: colors.surface,
    },
    seat: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceHigh,
    },
    seatMe: {
      backgroundColor: colors.primary,
    },
    seatText: {
      fontFamily: fonts.displayBold,
      fontSize: 20,
      lineHeight: 22,
      color: colors.primary,
    },
    seatTextMe: {
      color: colors.onAccent,
    },
    info: {
      flex: 1,
      minWidth: 0,
      gap: 1,
    },
    name: {
      ...type.body,
      fontFamily: fonts.bodyBold,
      color: colors.text,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[1] + 2,
      minWidth: 0,
    },
    country: {
      ...type.eyebrow,
      fontSize: 10,
      letterSpacing: 1,
      color: colors.primary,
      backgroundColor: colors.surfaceHigh,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 4,
      paddingHorizontal: space[1],
    },
    team: {
      ...type.bodySmall,
      fontFamily: fonts.body,
      flex: 1,
      minWidth: 0,
      color: colors.textMuted,
    },
    seatLabel: {
      ...type.caption,
      color: colors.textSecondary,
      textAlign: "right",
    },
  });
}
