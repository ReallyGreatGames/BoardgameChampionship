import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { Markdown } from "@/lib/components/ui/Markdown";
import { Table } from "@/lib/components/game/Table";
import { useOpenGame } from "@/lib/components/schedule/useOpenGame";
import { Schedule } from "@/lib/models/schedule";
import { inset, space } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";
import { ui } from "@/lib/theme/ui";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export type ScheduleRowAdmin = {
  /** Omitted in the "done" group, which is not reorderable. */
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  /** Rendered as "start" for upcoming rows and "restart" for done rows. */
  onSetActive?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
};

interface Props {
  schedule: Schedule;
  variant: "upcoming" | "done";
  admin?: ScheduleRowAdmin;
}

/**
 * One collapsed schedule entry with an expandable body, used for both the
 * "up next" and the "done" group. The currently running item is rendered by
 * `RunningNowCard` instead.
 */
export function ScheduleRow({ schedule, variant, admin }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation(["components"]);
  const isDone = variant === "done";
  const styles = useMemo(() => makeStyles(colors, isDone), [colors, isDone]);
  const openGame = useOpenGame();
  const [expanded, setExpanded] = useState(false);

  const chevronRotation = useRef(new Animated.Value(0)).current;
  const chevronStyle = {
    transform: [
      {
        rotate: chevronRotation.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "180deg"],
        }),
      },
    ],
  };

  useEffect(() => {
    Animated.timing(chevronRotation, {
      toValue: expanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [chevronRotation, expanded]);

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.header}
        onPress={handleToggle}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View style={styles.timeBlock}>
          <Text style={styles.durationNumber}>{schedule.durationPlanned}</Text>
          <Text style={styles.durationLabel}>
            {t("schedule.minutesUnit")}
          </Text>
        </View>
        {schedule.icon ? (
          <Ionicons
            name={schedule.icon as any}
            size={19}
            color={isDone ? colors.textMuted : colors.textSecondary}
          />
        ) : null}
        <Text style={styles.title} numberOfLines={2}>
          {schedule.title}
        </Text>
        {isDone && (
          <Ionicons name="checkmark-circle" size={17} color={colors.textMuted} />
        )}
        <Animated.View style={chevronStyle}>
          <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
        </Animated.View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          <View style={styles.metaRow}>
            <Ionicons name="time" size={15} color={colors.primary} />
            <Text style={styles.metaText}>
              {t("schedule.durationPlannedMinutes", {
                minutes: schedule.durationPlanned,
              })}
            </Text>
          </View>

          {schedule.gameId ? <Table gameId={schedule.gameId} /> : null}

          {schedule.description ? (
            <Markdown textStyle={styles.description}>
              {schedule.description}
            </Markdown>
          ) : null}

          {schedule.gameId ? (
            <TouchableOpacity
              style={styles.goToGame}
              activeOpacity={0.8}
              accessibilityRole="button"
              onPress={() => openGame(schedule.gameId!)}
            >
              <Text style={styles.goToGameText}>
                {t("schedule.goToGameButton")}
              </Text>
              <Ionicons name="arrow-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {admin && (
        <View style={styles.adminBar}>
          {admin.onMoveUp && (
            <IconAction
              icon="arrow-up"
              label={t("schedule.actions.moveUp")}
              color={colors.primary}
              disabled={admin.isFirst || admin.disabled}
              onPress={admin.onMoveUp}
            />
          )}
          {admin.onMoveDown && (
            <IconAction
              icon="arrow-down"
              label={t("schedule.actions.moveDown")}
              color={colors.primary}
              disabled={admin.isLast || admin.disabled}
              onPress={admin.onMoveDown}
            />
          )}
          {admin.onSetActive && (
            <TouchableOpacity
              style={[styles.pill, admin.disabled && styles.disabled]}
              onPress={admin.onSetActive}
              disabled={admin.disabled}
              accessibilityRole="button"
            >
              <Ionicons
                name={isDone ? "arrow-undo" : "play-circle-outline"}
                size={16}
                color={isDone ? colors.primary : colors.success}
              />
              <Text
                style={[
                  styles.pillText,
                  { color: isDone ? colors.primary : colors.success },
                ]}
              >
                {t(
                  isDone
                    ? "schedule.actions.restart"
                    : "schedule.actions.start",
                )}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.spacer} />
          {admin.disabled && (
            <ActivityIndicator size="small" color={colors.textMuted} />
          )}
          <IconAction
            icon="create-outline"
            label={t("schedule.actions.edit")}
            color={colors.primary}
            disabled={admin.disabled}
            onPress={admin.onEdit}
          />
          <IconAction
            icon="trash-outline"
            label={t("schedule.actions.delete")}
            color={colors.error}
            disabled={admin.disabled}
            onPress={admin.onDelete}
          />
        </View>
      )}
    </View>
  );
}

function IconAction({
  icon,
  label,
  color,
  disabled,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
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
        iconActionStyles.button,
        pressed && { backgroundColor: colors.surface },
        disabled && iconActionStyles.disabled,
      ]}
    >
      <Ionicons
        name={icon}
        size={17}
        color={disabled ? colors.textMuted : color}
      />
    </Pressable>
  );
}

const iconActionStyles = StyleSheet.create({
  button: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  disabled: {
    opacity: ui.disabledOpacity,
  },
});

function makeStyles(
  colors: ReturnType<typeof useTheme>["colors"],
  isDone: boolean,
) {
  return StyleSheet.create({
    card: {
      backgroundColor: isDone ? colors.background : colors.surface,
      borderWidth: 1,
      borderColor: isDone ? colors.divider : colors.border,
      borderRadius: ui.cardRadius,
      overflow: "hidden",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: inset.list,
      padding: inset.card,
      minHeight: 44,
    },
    timeBlock: {
      width: 46,
    },
    durationNumber: {
      ...type.h2,
      fontSize: 20,
      lineHeight: 22,
      color: isDone ? colors.textMuted : colors.text,
    },
    durationLabel: {
      ...type.caption,
      fontSize: 11,
      lineHeight: 14,
      color: colors.textMuted,
    },
    title: {
      ...(isDone ? type.body : type.h3),
      flex: 1,
      minWidth: 0,
      color: isDone ? colors.textMuted : colors.text,
    },
    body: {
      borderTopWidth: 1,
      borderTopColor: colors.divider,
      padding: inset.card,
      gap: inset.list,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[2],
    },
    metaText: {
      ...type.bodySmall,
      color: colors.textSecondary,
    },
    description: {
      ...type.bodySmall,
      color: colors.textSecondary,
    },
    goToGame: {
      minHeight: 48,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: ui.buttonRadius,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: space[2],
    },
    goToGameText: {
      ...type.button,
      fontSize: 15,
      color: colors.primary,
    },
    adminBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[1],
      borderTopWidth: 1,
      borderTopColor: colors.divider,
      backgroundColor: colors.surfaceHigh,
      paddingHorizontal: space[2],
      paddingVertical: 6,
    },
    spacer: {
      flex: 1,
    },
    pill: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[1],
      height: 34,
      paddingHorizontal: space[3],
      borderRadius: 8,
      backgroundColor: colors.surface,
    },
    pillText: {
      ...type.caption,
      fontFamily: type.eyebrow.fontFamily,
    },
    disabled: {
      opacity: ui.disabledOpacity,
    },
  });
}
