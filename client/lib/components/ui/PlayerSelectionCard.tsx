import { useAuth } from "@/lib/auth";
import { usePlayer } from "@/lib/bootstrap/PlayerProvider";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { useScheduleStore } from "@/lib/stores/appwrite/schedule-store";
import { type } from "@/lib/theme/typography";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  /** Navigation origin — determines where choose-your-character returns after selection. */
  from?: "settings" | "game";
  /** Called instead of navigating when set (e.g. inline step transition in setup screen). */
  onPress?: () => void;
  /** Bypass the allowUserChange schedule flag — always show the change button. */
  forceAllow?: boolean;
  /** Game ID to pass through when from="game". */
  gameId?: string;
};

export function PlayerSelectionCard({ from, onPress, forceAllow, gameId }: Props) {
  const { player } = usePlayer();
  const { isAdmin } = useAuth();
  const { colors } = useTheme();
  const { t } = useTranslation(["settings"]);
  const scheduleCollection = useScheduleStore((s) => s.collection);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const activeItem = useMemo(
    () => scheduleCollection.find((s) => s.isActive),
    [scheduleCollection],
  );
  const canChange =
    forceAllow || isAdmin || !player || activeItem?.allowUserChange !== false;

  function handlePress() {
    if (onPress) {
      onPress();
      return;
    }
    const params = new URLSearchParams({ from: from ?? "settings" });
    if (gameId) params.set("gameId", gameId);
    router.push(
      `/(pages)/(team-player)/choose-your-character?${params.toString()}` as any,
    );
  }

  return (
    <View style={styles.card}>
      {player ? (
        <>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="shield-outline" size={20} color={colors.textMuted} style={styles.icon} />
              <Text style={styles.label}>{t("currentTeam")}</Text>
            </View>
            <Text style={styles.value} numberOfLines={1}>{player.team.name}</Text>
          </View>
          <View style={[styles.row, styles.rowBorder]}>
            <View style={styles.rowLeft}>
              <Ionicons name="person-outline" size={20} color={colors.textMuted} style={styles.icon} />
              <Text style={styles.label}>{t("currentPlayer")}</Text>
            </View>
            <Text style={styles.value} numberOfLines={1}>{player.name}</Text>
          </View>
          {canChange && (
            <Pressable style={[styles.row, styles.rowBorder]} onPress={handlePress}>
              <View style={styles.rowLeft}>
                <Ionicons name="people-outline" size={20} color={colors.textMuted} style={styles.icon} />
                <Text style={styles.label}>{t("changeTeam")}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </>
      ) : (
        <Pressable style={styles.row} onPress={handlePress}>
          <View style={styles.rowLeft}>
            <Ionicons name="people-outline" size={20} color={colors.primary} style={styles.icon} />
            <Text style={[styles.label, { color: colors.primary }]}>{t("selectPlayer")}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </Pressable>
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 14,
    },
    rowLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    rowBorder: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    icon: {
      marginRight: 12,
    },
    label: {
      ...type.body,
      color: colors.text,
    },
    value: {
      ...type.bodySmall,
      color: colors.textSecondary,
      flexShrink: 1,
      textAlign: "right",
      marginLeft: 8,
    },
  });
}
