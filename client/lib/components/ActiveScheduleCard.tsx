import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../bootstrap/ThemeProvider";
import { usePlayer } from "../bootstrap/PlayerProvider";
import { Schedule } from "../models/schedule";
import { inset } from "../theme/spacing";
import { type } from "../theme/typography";
import { addMinutesToTime } from "../utils";

interface Props {
  item: Schedule;
}

export function ActiveScheduleCard({ item }: Props) {
  const { colors } = useTheme();
  const { player } = usePlayer();
  const { t } = useTranslation(["home"]);

  const styles = useMemo(() => StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.accent + "40",
      borderRadius: 12,
      overflow: "hidden",
    },
    cardInner: {
      padding: inset.card,
      paddingBottom: inset.tight,
      gap: 4,
    },
    cardTitle: {
      ...type.h1,
      color: colors.text,
    },
    cardTime: {
      ...type.bodySmall,
      color: colors.textSecondary,
    },
    goToGameBtn: {
      margin: inset.card,
      backgroundColor: colors.accent,
      borderRadius: 8,
      paddingVertical: 13,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    goToGameBtnText: {
      ...type.button,
      color: colors.onAccent,
    },
  }), [colors]);

  return (
    <View style={styles.card}>
      <View style={styles.cardInner}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardTime}>
          {item.startTimePlanned} – {addMinutesToTime(item.startTimePlanned, item.durationPlanned)}
        </Text>
      </View>
      {item.gameId && (
        <TouchableOpacity
          style={styles.goToGameBtn}
          activeOpacity={0.85}
          onPress={() => {
            if (player?.team && player?.playerId) {
              router.push(`/game?gameId=${item.gameId}`);
            } else {
              router.push({ pathname: "/(pages)/(team-player)/choose-your-character", params: { gameId: item.gameId } });
            }
          }}
        >
          <Text style={styles.goToGameBtnText}>{t("goToGame")}</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.onAccent} />
        </TouchableOpacity>
      )}
    </View>
  );
}
