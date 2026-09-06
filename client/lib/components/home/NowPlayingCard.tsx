import { router } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { usePlayer } from "@/lib/bootstrap/PlayerProvider";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { Badge } from "@/lib/components/ui/Badge";
import { Button } from "@/lib/components/ui/Button";
import { ParticipantMatch } from "@/lib/hooks/useParticipantOverview";
import { useRoundCountdown } from "@/lib/hooks/useRoundCountdown";
import { inset, space } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";
import { ui } from "@/lib/theme/ui";

interface Props {
  match: ParticipantMatch;
}

export function NowPlayingCard({ match }: Props) {
  const { colors } = useTheme();
  const { player } = usePlayer();
  const { t } = useTranslation(["home"]);
  const countdown = useRoundCountdown(match.item);

  const styles = useMemo(() => makeStyles(colors), [colors]);

  const openMatch = () => {
    if (player?.team && player?.$id) {
      router.push(`/game?gameId=${match.gameId}&from=/`);
      return;
    }
    router.push({
      pathname: "/(pages)/(team-player)/choose-your-character",
      params: { gameId: match.gameId },
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{match.item.title}</Text>
        <Badge
          label={countdown.isOvertime ? t("overtime") : t("live")}
          tone={countdown.isOvertime ? "danger" : "info"}
        />
      </View>

      <View style={styles.detailBlock}>
        <Text style={styles.tableLine}>
          {match.tableNumber !== null
            ? t("tableAndRound", { table: match.tableNumber, round: match.round })
            : t("roundOnly", { round: match.round })}
        </Text>
        {match.opponents.length > 0 && (
          <View style={styles.opponents}>
            {match.opponents.map((opponent) => (
              <View key={opponent.id} style={styles.opponentRow}>
                {!!opponent.country && (
                  <Text style={styles.country}>{opponent.country}</Text>
                )}
                <Text style={styles.opponentName} numberOfLines={1}>
                  {opponent.teamName || opponent.name}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.countdownRow}>
        <Text style={styles.countdown}>{countdown.label}</Text>
        <Text style={styles.countdownCaption}>
          {countdown.isOvertime ? t("overRoundTime") : t("leftInRound")}
        </Text>
      </View>

      <Button label={t("openMatch")} icon="arrow-forward" onPress={openMatch} />
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.accent + "40",
      borderRadius: ui.cardRadius,
      padding: inset.card,
      gap: inset.list,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: inset.list,
    },
    title: {
      ...type.h1,
      color: colors.text,
      flex: 1,
      minWidth: 0,
    },
    detailBlock: {
      gap: space[1],
    },
    tableLine: {
      ...type.h3,
      color: colors.text,
    },
    opponents: {
      gap: space[1],
      paddingTop: 2,
    },
    opponentRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[2],
    },
    country: {
      ...type.eyebrow,
      letterSpacing: 1,
      color: colors.primary,
      backgroundColor: colors.surfaceHigh,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 2,
      overflow: "hidden",
    },
    opponentName: {
      ...type.body,
      color: colors.textSecondary,
      flex: 1,
      minWidth: 0,
    },
    countdownRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: inset.list,
      paddingTop: space[1],
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    countdown: {
      ...type.bigNumber,
      color: colors.accent,
    },
    countdownCaption: {
      ...type.bodySmall,
      color: colors.textSecondary,
      paddingBottom: space[3],
      flex: 1,
      minWidth: 0,
    },
  });
}
