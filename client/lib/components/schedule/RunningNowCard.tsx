import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { Button } from "@/lib/components/ui/Button";
import { Markdown } from "@/lib/components/ui/Markdown";
import { Table } from "@/lib/components/game/Table";
import { useOpenGame } from "@/lib/components/schedule/useOpenGame";
import { useRoundCountdown } from "@/lib/hooks/useRoundCountdown";
import { Schedule } from "@/lib/models/schedule";
import { inset, space } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";
import { addMinutesToTime } from "@/lib/utils";

export type RunningNowAdmin = {
  onEdit: () => void;
  onStartNext: (() => void) | null;
  disabled: boolean;
};

interface Props {
  item: Schedule;
  admin?: RunningNowAdmin;
}

/** The green "live" dot, pinging once per 1.2s for as long as it is mounted. */
function LiveDot({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const pulse = () => {
      if (!mounted.current) {
        return;
      }
      scale.setValue(1);
      opacity.setValue(0.7);
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 2.5,
          duration: 1200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          pulse();
        }
      });
    };
    pulse();
    return () => {
      mounted.current = false;
    };
  }, [opacity, scale]);

  return (
    <View style={{ width: 8, height: 8, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={{
          position: "absolute",
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: color,
          transform: [{ scale }],
          opacity,
        }}
      />
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
    </View>
  );
}

export function RunningNowCard({ item, admin }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation(["components"]);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const openGame = useOpenGame();
  const countdown = useRoundCountdown(item);

  const totalSeconds = Math.max(1, item.durationPlanned * 60);
  const progress = Math.min(
    1,
    Math.max(0, (totalSeconds - countdown.secondsLeft) / totalSeconds),
  );
  const remaining = countdown.isOvertime
    ? t("schedule.overtime")
    : t("schedule.remaining", { minutes: Math.ceil(countdown.secondsLeft / 60) });

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.liveLabel}>
          <LiveDot color={colors.success} />
          <Text style={styles.liveText}>{t("schedule.runningNow")}</Text>
        </View>
        <Text style={styles.range}>
          {item.startTimePlanned} –{" "}
          {addMinutesToTime(item.startTimePlanned, item.durationPlanned)}
        </Text>
      </View>

      <Text style={styles.title}>{item.title}</Text>

      <View style={styles.progressBlock}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.remaining}>{remaining}</Text>
      </View>

      {item.gameId ? <Table gameId={item.gameId} /> : null}

      {item.description ? (
        <Markdown textStyle={styles.description}>{item.description}</Markdown>
      ) : null}

      {item.gameId ? (
        <Button
          label={t("schedule.goToGameButton")}
          icon="arrow-forward"
          onPress={() => openGame(item.gameId!)}
        />
      ) : null}

      {admin && (
        <View style={styles.adminRow}>
          <Button
            label={t("schedule.actions.edit")}
            icon="create-outline"
            variant="secondary"
            disabled={admin.disabled}
            onPress={admin.onEdit}
            style={styles.adminButton}
          />
          {admin.onStartNext && (
            <Button
              label={t("schedule.actions.startNext")}
              icon="play-circle-outline"
              disabled={admin.disabled}
              onPress={admin.onStartNext}
              style={[styles.adminButton, styles.startNextButton]}
            />
          )}
        </View>
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 14,
      padding: inset.card,
      gap: inset.list,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: inset.list,
    },
    liveLabel: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[2],
      minWidth: 0,
    },
    liveText: {
      ...type.eyebrow,
      color: colors.success,
    },
    range: {
      ...type.bodySmall,
      color: colors.textSecondary,
    },
    title: {
      ...type.h1,
      color: colors.text,
    },
    progressBlock: {
      gap: space[1],
    },
    progressTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.surfaceHigh,
      overflow: "hidden",
    },
    progressFill: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
    },
    remaining: {
      ...type.caption,
      color: colors.textSecondary,
    },
    description: {
      ...type.bodySmall,
      color: colors.textSecondary,
    },
    adminRow: {
      flexDirection: "row",
      gap: space[2],
      borderTopWidth: 1,
      borderTopColor: colors.divider,
      paddingTop: inset.list,
    },
    adminButton: {
      flex: 1,
      paddingHorizontal: space[3],
    },
    startNextButton: {
      backgroundColor: colors.success,
      borderColor: colors.success,
    },
  });
}
