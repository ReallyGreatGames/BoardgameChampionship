import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { space } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";
import { ui } from "@/lib/theme/ui";

export type GameAction = {
  key: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  badgeCount?: number;
  disabled: boolean;
  onPress: () => void;
};

interface Props {
  actions: GameAction[];
}

export function GameActionRow({ actions }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      {actions.map(({ key, icon, label, badgeCount, disabled, onPress }) => (
        <TouchableOpacity
          key={key}
          style={[styles.action, disabled && styles.actionDisabled]}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ disabled }}
          onPress={onPress}
          disabled={disabled}
        >
          <View style={styles.tile}>
            <Ionicons
              name={icon}
              size={26}
              color={disabled ? colors.textSecondary : colors.primary}
            />
            {!!badgeCount && badgeCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {badgeCount > 99 ? "99+" : badgeCount}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      gap: space[2],
    },
    action: {
      flex: 1,
      minWidth: 0,
      alignItems: "center",
      gap: space[2] - 2,
    },
    actionDisabled: {
      opacity: ui.disabledOpacity,
    },
    tile: {
      width: "100%",
      height: 56,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    badge: {
      position: "absolute",
      top: -6,
      right: -6,
      minWidth: 20,
      height: 20,
      paddingHorizontal: 5,
      borderRadius: 10,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeText: {
      ...type.caption,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "700",
      color: colors.onAccent,
    },
    label: {
      ...type.caption,
      color: colors.textSecondary,
      textAlign: "center",
    },
  });
}
