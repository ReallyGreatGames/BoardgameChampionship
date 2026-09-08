import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { Button } from "@/lib/components/ui/Button";
import { Markdown } from "@/lib/components/ui/Markdown";
import { Table } from "@/lib/components/game/Table";
import { useOpenGame } from "@/lib/components/schedule/useOpenGame";
import { useRoundCountdown } from "@/lib/hooks/useRoundCountdown";
import { Schedule } from "@/lib/models/schedule";
import { inset, space } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";
import { ui } from "@/lib/theme/ui";

export type RunningNowAdmin = {
  onEdit: () => void;
  onStartNext: (() => void) | null;
  onTogglePause: () => void;
  isPaused: boolean;
  disabled: boolean;
};

interface Props {
  item: Schedule;
  admin?: RunningNowAdmin;
}

/**
 * The "live" dot, pinging once per 1.2s for as long as it is mounted and not
 * paused. While paused it renders as a static, muted dot instead.
 */
function LiveDot({ color, paused }: { color: string; paused: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const mounted = useRef(true);

  useEffect(() => {
    if (paused) {
      return;
    }
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
  }, [opacity, scale, paused]);

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

/** Fixed 44×44 icon-only admin control — Edit and pause/resume share this shape. */
function AdminIconButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        adminIconButtonStyles.button,
        { borderColor: colors.border, backgroundColor: colors.surfaceHigh },
        pressed && { backgroundColor: colors.surface },
        disabled && adminIconButtonStyles.disabled,
      ]}
    >
      <Ionicons name={icon} size={20} color={disabled ? colors.textMuted : colors.text} />
    </Pressable>
  );
}

const adminIconButtonStyles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: ui.buttonRadius,
    borderWidth: 1,
  },
  disabled: {
    opacity: ui.disabledOpacity,
  },
});

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
  const remaining = countdown.isPaused
    ? t("schedule.paused")
    : countdown.isOvertime
      ? t("schedule.overtime")
      : t("schedule.remaining", { minutes: Math.ceil(countdown.secondsLeft / 60) });

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.liveLabel}>
          <LiveDot
            color={countdown.isPaused ? colors.textMuted : colors.success}
            paused={countdown.isPaused}
          />
          <Text
            style={[
              styles.liveText,
              countdown.isPaused && styles.liveTextPaused,
            ]}
          >
            {countdown.isPaused ? t("schedule.paused") : t("schedule.runningNow")}
          </Text>
        </View>
        <View style={styles.plannedDuration}>
          <Ionicons name="time" size={15} color={colors.textSecondary} />
          <Text style={styles.range}>
            {t("schedule.durationPlannedMinutes", {
              minutes: item.durationPlanned,
            })}
          </Text>
        </View>
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
          <AdminIconButton
            icon="create-outline"
            label={t("schedule.actions.edit")}
            disabled={admin.disabled}
            onPress={admin.onEdit}
          />
          <AdminIconButton
            icon={admin.isPaused ? "play-circle-outline" : "pause-circle-outline"}
            label={t(
              admin.isPaused ? "schedule.actions.resume" : "schedule.actions.pause",
            )}
            disabled={admin.disabled}
            onPress={admin.onTogglePause}
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
    liveTextPaused: {
      color: colors.textMuted,
    },
    plannedDuration: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[1],
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
