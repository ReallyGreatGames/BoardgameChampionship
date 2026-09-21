import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { Button } from "@/lib/components/ui/Button";
import { CustomTimerModal } from "@/lib/components/timer/CustomTimerModal";
import { TimerOrientationMode, TimerPauseMode } from "@/lib/hooks/useTimerLocalSettings";
import { TableBell } from "@/lib/models/table-bell";
import { type } from "@/lib/theme/typography";
import { ui } from "@/lib/theme/ui";
import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import { GestureResponderEvent, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

type Props = {
  stage: "options" | "settings" | null;
  onClose: () => void;
  onOpenSettings: () => void;
  onBackToOptions: () => void;
  onReset: () => Promise<void>;
  onOpenCustomTimer: () => void;
  onOpenPlayerColors: () => void;
  onUseDefaultTimer: () => Promise<void>;
  onCloseTimer: () => void;
  orientationMode: TimerOrientationMode;
  onToggleOrientation: () => void;
  pauseMode: TimerPauseMode;
  onTogglePauseMode: () => void;
  bell: TableBell | undefined;
  bellElapsedLabel: string | undefined;
  onToggleBell: () => void;
  bellLoading?: boolean;
  bellDisabled?: boolean;
  customTimerOpen: boolean;
  onCloseCustomTimer: () => void;
  initialDuration: number | undefined;
  initialDirection: "up" | "down" | undefined;
  initialRoundSeconds: number | undefined;
  onSaveCustomTimer: (
    duration: number,
    dir: "up" | "down",
    roundSeconds: number,
  ) => Promise<void>;
};

function stopPropagation(e: GestureResponderEvent) {
  e.stopPropagation();
}

export function TimerMenu({
  stage,
  onClose,
  onOpenSettings,
  onBackToOptions,
  onReset,
  onOpenCustomTimer,
  onOpenPlayerColors,
  onUseDefaultTimer,
  onCloseTimer,
  orientationMode,
  onToggleOrientation,
  pauseMode,
  onTogglePauseMode,
  bell,
  bellElapsedLabel,
  onToggleBell,
  bellLoading,
  bellDisabled,
  customTimerOpen,
  onCloseCustomTimer,
  initialDuration,
  initialDirection,
  initialRoundSeconds,
  onSaveCustomTimer,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation(["timer"]);

  const bellRinging = !!bell && !bell.acknowledgeTime;
  const bellBaseLabel = bell?.acknowledgeTime
    ? t("bellAcknowledged")
    : bell
      ? t("bellRinging")
      : t("ringBell");
  const bellLabel = bell && bellElapsedLabel ? `${bellBaseLabel} · ${bellElapsedLabel}` : bellBaseLabel;

  return (
    <>
      {stage === "options" && (
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable
            style={[styles.card, { backgroundColor: colors.surfaceHigh, borderColor: colors.border }]}
            onPress={stopPropagation}
          >
            <View style={styles.header}>
              <Text style={[type.eyebrow, { color: colors.textSecondary }]}>
                {t("tableOptions")}
              </Text>
              <Pressable onPress={onClose} accessibilityLabel={t("close")}>
                <Ionicons name="close" size={20} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.grid}>
              <ToggleCard
                label={t("layout")}
                icon={orientationMode === "center" ? "grid-outline" : "reorder-two-outline"}
                value={orientationMode === "center" ? t("layoutCentre") : t("layoutSide")}
                accessibilityLabel={
                  orientationMode === "center" ? t("orientationCenter") : t("orientationSide")
                }
                onPress={onToggleOrientation}
              />
              <ToggleCard
                label={t("mode")}
                icon={pauseMode === "quickplay" ? "flash-outline" : "hand-left-outline"}
                value={pauseMode === "quickplay" ? t("modeQuickplay") : t("modeSimultaneous")}
                accessibilityLabel={
                  pauseMode === "quickplay" ? t("pauseModeQuickplay") : t("pauseModeSimultaneous")
                }
                onPress={onTogglePauseMode}
              />
            </View>

            <View style={styles.grid}>
              <Button
                label={bellLabel}
                icon={bell ? "notifications-off-outline" : "notifications-outline"}
                variant={bellRinging ? "primary" : "secondary"}
                onPress={onToggleBell}
                loading={bellLoading}
                disabled={bellDisabled}
                style={styles.gridButton}
              />
              <Button
                label={t("timerSettingsTitle")}
                icon="timer-outline"
                variant="secondary"
                onPress={onOpenSettings}
                style={styles.gridButton}
              />
            </View>

            <View style={styles.grid}>
              <Button
                label={t("closeTimer")}
                icon="exit-outline"
                variant="danger"
                onPress={onCloseTimer}
                style={styles.gridButton}
              />
            </View>
          </Pressable>
        </Pressable>
      )}

      {stage === "settings" && (
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable
            style={[styles.card, { backgroundColor: colors.surfaceHigh, borderColor: colors.border }]}
            onPress={stopPropagation}
          >
            <View style={styles.header}>
              <Pressable
                style={styles.headerBack}
                onPress={onBackToOptions}
                accessibilityLabel={t("backToOptions")}
              >
                <Ionicons name="chevron-back-outline" size={16} color={colors.textSecondary} />
                <Text style={[type.eyebrow, { color: colors.textSecondary }]}>
                  {t("timerSettingsTitle")}
                </Text>
              </Pressable>
              <Pressable onPress={onClose} accessibilityLabel={t("close")}>
                <Ionicons name="close" size={20} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.grid}>
              <Button
                label={t("resetTimers")}
                icon="refresh-outline"
                variant="secondary"
                onPress={onReset}
                style={styles.gridButton}
              />
              <Button
                label={t("customTimer")}
                icon="options-outline"
                variant="secondary"
                onPress={onOpenCustomTimer}
                style={styles.gridButton}
              />
            </View>

            <View style={styles.grid}>
              <Button
                label={t("useDefaultTimer")}
                icon="timer-outline"
                variant="secondary"
                onPress={onUseDefaultTimer}
                style={styles.gridButton}
              />
              <Button
                label={t("reassignColors")}
                icon="color-palette-outline"
                variant="secondary"
                onPress={onOpenPlayerColors}
                style={styles.gridButton}
              />
            </View>
          </Pressable>
        </Pressable>
      )}

      <CustomTimerModal
        visible={customTimerOpen}
        onClose={onCloseCustomTimer}
        initialDuration={initialDuration}
        initialDirection={initialDirection}
        initialRoundSeconds={initialRoundSeconds}
        onSave={onSaveCustomTimer}
      />
    </>
  );
}

type ToggleCardProps = {
  label: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  value: string;
  accessibilityLabel: string;
  onPress: () => void;
};

function ToggleCard({ label, icon, value, accessibilityLabel, onPress }: ToggleCardProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.toggleCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { backgroundColor: colors.surfaceHigh },
      ]}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.toggleCardTop}>
        <Text style={[type.eyebrow, { color: colors.textMuted, fontSize: 10 }]}>{label}</Text>
        <Ionicons name="swap-horizontal-outline" size={14} color={colors.textMuted} />
      </View>
      <View style={styles.toggleCardBottom}>
        <Ionicons name={icon} size={18} color={colors.text} />
        <Text style={[type.bodySmall, { color: colors.text }]}>{value}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: ui.backdropColor,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "90%",
    maxWidth: 420,
    borderRadius: ui.sheetRadius,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    paddingBottom: 2,
  },
  headerBack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  grid: {
    flexDirection: "row",
    gap: 8,
  },
  gridButton: {
    flex: 1,
  },
  toggleCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    gap: 4,
  },
  toggleCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleCardBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
