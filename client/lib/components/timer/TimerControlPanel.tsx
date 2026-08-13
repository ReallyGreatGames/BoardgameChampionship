import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { type } from "@/lib/theme/typography";
import { inset } from "@/lib/theme/spacing";
import { TimerOrientationMode, TimerPauseMode } from "@/lib/hooks/useTimerLocalSettings";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { TableBell } from "@/lib/models/table-bell";

type Props = {
  onOpenMenu: () => void;
  orientationMode: TimerOrientationMode;
  onToggleOrientation: () => void;
  pauseMode: TimerPauseMode;
  onTogglePauseMode: () => void;
  bell: TableBell | undefined;
  bellElapsedLabel: string | undefined;
  onToggleBell: () => void;
  bellLoading?: boolean;
  bellDisabled?: boolean;
  allPaused: boolean;
  onToggleAllPause: () => void;
  /** Total time the table has had at least one seat running, pre-formatted
   *  (mm:ss) — deliberately small/secondary here, not a focal element (see
   *  useTimerState's tableElapsedSeconds). */
  tableElapsedLabel: string;
};

/**
 * Replaces the old small round menu-trigger button in the center of the
 * timer screen: a compact row of icon toggles (orientation, menu, pause
 * mode) on top of two full-width action bars (table bell, pause/resume all).
 */
export function TimerControlPanel({
  onOpenMenu,
  orientationMode,
  onToggleOrientation,
  pauseMode,
  onTogglePauseMode,
  bell,
  bellElapsedLabel,
  onToggleBell,
  bellLoading,
  bellDisabled,
  allPaused,
  onToggleAllPause,
  tableElapsedLabel,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation(["timer"]);

  const bellColor = bell?.acknowledgeTime ? colors.success : bell ? colors.accent : colors.text;
  const bellLabel = bell?.acknowledgeTime
    ? t("bellAcknowledged")
    : bell
      ? t("bellRinging")
      : t("ringBell");

  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: colors.surfaceHigh + "ee", borderColor: colors.border },
      ]}
      pointerEvents="box-none"
    >
      {/* Small and non-interactive on purpose — the whole-table elapsed
          time is useful context, not something anyone needs to focus on
          (see useTimerState's tableElapsedSeconds doc comment). */}
      <View style={styles.tableElapsedRow}>
        <Ionicons name="time-outline" size={14} color={colors.textMuted} />
        <Text style={[type.eyebrow, { color: colors.textMuted }]}>
          {t("tableTimeElapsed")} · {tableElapsedLabel}
        </Text>
      </View>

      <View style={styles.iconRow}>
        <IconToggle
          icon={orientationMode === "center" ? "grid-outline" : "reorder-two-outline"}
          accessibilityLabel={
            orientationMode === "center" ? t("orientationCenter") : t("orientationSide")
          }
          onPress={onToggleOrientation}
        />
        <IconToggle icon="ellipsis-horizontal" accessibilityLabel={t("openMenu")} onPress={onOpenMenu} />
        <IconToggle
          icon={pauseMode === "auto" ? "flash-outline" : "hand-left-outline"}
          accessibilityLabel={pauseMode === "auto" ? t("pauseModeAuto") : t("pauseModeManual")}
          onPress={onTogglePauseMode}
        />
      </View>

      <PanelBar
        icon={bell ? "notifications-off-outline" : "notifications-outline"}
        color={bellColor}
        label={bellLabel}
        trailingLabel={bellElapsedLabel}
        onPress={onToggleBell}
        loading={bellLoading}
        disabled={bellDisabled}
      />

      <PanelBar
        icon={allPaused ? "play-circle-outline" : "pause-circle-outline"}
        color={colors.text}
        label={allPaused ? t("resumeAll") : t("pauseAll")}
        onPress={onToggleAllPause}
      />
    </View>
  );
}

type IconToggleProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  accessibilityLabel: string;
  onPress: () => void;
};

function IconToggle({ icon, accessibilityLabel, onPress }: IconToggleProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.iconToggle,
        { borderColor: colors.border },
        pressed && { backgroundColor: colors.surface },
      ]}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
    >
      <Ionicons name={icon} size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

type PanelBarProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  label: string;
  trailingLabel?: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

function PanelBar({ icon, color, label, trailingLabel, onPress, loading, disabled }: PanelBarProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.panelBar,
        { borderColor: colors.border },
        pressed && !disabled && { backgroundColor: colors.surface },
        disabled && { opacity: 0.4 },
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Ionicons name={icon} size={20} color={color} />
      )}
      <Text style={[type.bodySmall, { color, flex: 1 }]} numberOfLines={1}>
        {label}
      </Text>
      {trailingLabel && (
        <Text style={[styles.trailingLabel, { color }]}>{trailingLabel}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: 220,
    borderRadius: 14,
    borderWidth: 1,
    padding: inset.tight,
    gap: inset.tight,
  },
  tableElapsedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  iconRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: inset.tight,
  },
  iconToggle: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  panelBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  trailingLabel: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
