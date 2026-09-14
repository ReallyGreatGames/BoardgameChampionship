import { useAuth } from "@/lib/auth";
import { usePlayer } from "@/lib/bootstrap/PlayerProvider";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { useScheduleStore } from "@/lib/stores/appwrite/schedule-store";
import { fonts, type } from "@/lib/theme/typography";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  from?: "settings" | "game";
  onPress?: () => void;
  forceAllow?: boolean;
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
    if (gameId) {
      params.set("gameId", gameId);
    }
    router.push(
      `/(pages)/(team-player)/choose-your-character?${params.toString()}` as any,
    );
  }

  return (
    <View style={styles.card}>
      {player ? (
        <>
          <View style={styles.row}>
            <Text style={styles.label}>{t("currentTeam")}</Text>
            <Text style={styles.value} numberOfLines={1}>
              {player.team.name}
            </Text>
          </View>
          <View style={[styles.row, styles.rowBorder]}>
            <Text style={styles.label}>{t("currentPlayer")}</Text>
            <Text style={styles.value} numberOfLines={1}>
              {t("playerValue", { n: player.playerNumber, name: player.name })}
            </Text>
          </View>
          {canChange && (
            <Pressable
              style={({ pressed }) => [
                styles.row,
                styles.rowBorder,
                pressed && styles.rowPressed,
              ]}
              onPress={handlePress}
            >
              <Text style={styles.action}>{t("changeTeam")}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </>
      ) : (
        <Pressable
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          onPress={handlePress}
        >
          <Text style={styles.action}>{t("selectPlayer")}</Text>
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
      gap: 12,
      minHeight: 44,
      padding: 14,
    },
    rowPressed: {
      backgroundColor: colors.surfaceHigh,
    },
    rowBorder: {
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    label: {
      ...type.body,
      color: colors.textMuted,
    },
    value: {
      ...type.body,
      fontFamily: fonts.bodyBold,
      color: colors.text,
      flexShrink: 1,
      textAlign: "right",
    },
    action: {
      ...type.body,
      color: colors.primary,
    },
  });
}
