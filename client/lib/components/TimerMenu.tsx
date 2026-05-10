import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { CustomTimerModal } from "@/lib/components/CustomTimerModal";
import { useTableBellActions } from "@/lib/hooks/useTableBellActions";
import { type } from "@/lib/theme/typography";
import { ui } from "@/lib/theme/ui";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { TableBell } from "../models/table-bell"

type Props = {
  open: boolean;
  onClose: () => void;
  bell: TableBell | undefined;
  bellActions: ReturnType<typeof useTableBellActions>;
  onToggleBell: () => Promise<void>;
  onReset: () => Promise<void>;
  onOpenCustomTimer: () => void;
  onCloseTimer: () => void;
  customTimerOpen: boolean;
  onCloseCustomTimer: () => void;
  initialDuration: number | undefined;
  initialDirection: "up" | "down" | undefined;
  onSaveCustomTimer: (duration: number, dir: "up" | "down") => Promise<void>;
};

export function TimerMenu({
  open,
  onClose,
  bell,
  bellActions,
  onToggleBell,
  onReset,
  onOpenCustomTimer,
  onCloseTimer,
  customTimerOpen,
  onCloseCustomTimer,
  initialDuration,
  initialDirection,
  onSaveCustomTimer,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation(["timer"]);

  return (
    <>
      {open && (
        <Pressable style={styles.menuBackdrop} onPress={onClose}>
          <View
            style={[
              styles.menuCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text
              style={[
                type.eyebrow,
                {
                  color: colors.textMuted,
                  marginBottom: 8,
                  paddingHorizontal: 20,
                  paddingTop: 8,
                },
              ]}
            >
              {t("paused")}
            </Text>

            <MenuButton
              icon={bell ? "notifications-off-outline" : "notifications-outline"}
              label={
                bell?.acknowledgeTime
                  ? t("bellAcknowledged")
                  : bell
                    ? t("bellRinging")
                    : t("ringBell")
              }
              color={
                bell?.acknowledgeTime
                  ? colors.success
                  : bell
                    ? colors.accent
                    : colors.text
              }
              onPress={onToggleBell}
              disabled={bellActions.isLoading || (!!bell && !bellActions.canDelete(bell))}
              loading={bellActions.isLoading}
            />

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <MenuButton
              icon="refresh-outline"
              label={t("resetTimers")}
              color={colors.text}
              onPress={onReset}
            />

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <MenuButton
              icon="time-outline"
              label={t("customTimer")}
              color={colors.text}
              onPress={onOpenCustomTimer}
            />

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <MenuButton
              icon="exit-outline"
              label={t("closeTimer")}
              color={colors.error}
              onPress={onCloseTimer}
            />
          </View>
        </Pressable>
      )}

      <CustomTimerModal
        visible={customTimerOpen}
        onClose={onCloseCustomTimer}
        initialDuration={initialDuration}
        initialDirection={initialDirection}
        onSave={onSaveCustomTimer}
      />
    </>
  );
}

type MenuButtonProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

function MenuButton({ icon, label, color, onPress, disabled, loading }: MenuButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuBtn,
        pressed && { backgroundColor: colors.surfaceHigh },
        disabled && { opacity: 0.4 },
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Ionicons name={icon} size={22} color={color} />
      )}
      <Text style={[type.body, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  menuBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: ui.backdropColor,
    justifyContent: "center",
    alignItems: "center",
  },
  menuCard: {
    width: 240,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 0,
    alignItems: "stretch",
  },
  menuBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 20,
  },
});
