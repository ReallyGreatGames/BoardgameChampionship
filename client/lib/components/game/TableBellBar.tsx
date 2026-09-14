import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { inset, space } from "@/lib/theme/spacing";
import { fonts, type } from "@/lib/theme/typography";
import { ui } from "@/lib/theme/ui";

export type TableBellState = "idle" | "ringing" | "acknowledged" | "unavailable";

interface Props {
  state: TableBellState;
  hint: string;
  disabled: boolean;
  isLoading: boolean;
  locked: boolean;
  onPress: () => void;
}

export function TableBellBar({
  state,
  hint,
  disabled,
  isLoading,
  locked,
  onPress,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["game"]);
  const insets = useSafeAreaInsets();

  const tint =
    state === "unavailable"
      ? colors.textSecondary
      : state === "acknowledged"
        ? colors.success
        : state === "ringing"
          ? colors.accent
          : colors.primary;

  const pillStyle =
    state === "acknowledged"
      ? styles.pillSuccess
      : state === "ringing"
        ? styles.pillActive
        : undefined;

  const icon: React.ComponentProps<typeof Ionicons>["name"] =
    state === "ringing" || state === "acknowledged"
      ? "notifications-off-outline"
      : "notifications-outline";

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + space[3] }]}>
      <TouchableOpacity
        style={[styles.pill, pillStyle, disabled && styles.pillDisabled]}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={t("actions.tableBell")}
        accessibilityHint={hint}
        accessibilityState={{ disabled }}
        onPress={onPress}
        disabled={disabled}
      >
        {state === "acknowledged" && (
          <Ionicons name="walk-outline" size={22} color={tint} />
        )}
        <Ionicons name={icon} size={26} color={tint} />

        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: tint }]} numberOfLines={1}>
            {t("actions.tableBell")}
          </Text>
          <Text style={[styles.hint, { color: tint }]} numberOfLines={2}>
            {hint}
          </Text>
        </View>

        {locked && <Ionicons name="lock-closed-outline" size={16} color={tint} />}
        {isLoading && <ActivityIndicator size="small" color={tint} />}
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    bar: {
      borderTopWidth: 1,
      borderTopColor: colors.divider,
      backgroundColor: colors.surface,
      paddingHorizontal: inset.card,
      paddingTop: space[3],
    },
    pill: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[3],
      minHeight: 60,
      paddingHorizontal: inset.card,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    pillActive: {
      backgroundColor: colors.accent + "18",
      borderColor: colors.accent,
    },
    pillSuccess: {
      backgroundColor: colors.success + "18",
      borderColor: colors.success,
    },
    pillDisabled: {
      opacity: ui.disabledOpacity,
    },
    textBlock: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      ...type.body,
      fontFamily: fonts.bodyBold,
      lineHeight: 22,
    },
    hint: {
      ...type.bodySmall,
      fontFamily: fonts.body,
    },
  });
}
