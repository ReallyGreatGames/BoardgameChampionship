import { Ionicons } from "@expo/vector-icons";
import { ComponentProps, useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { space } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";
import { ui } from "@/lib/theme/ui";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: ComponentProps<typeof Ionicons>["name"];
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  disabled = false,
  loading = false,
  style,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const foreground = variant === "primary" || variant === "danger" ? colors.onAccent : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={foreground} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={foreground} />}
          <Text style={[styles.label, { color: foreground }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    button: {
      minHeight: 44,
      paddingHorizontal: space[5],
      borderRadius: ui.buttonRadius,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: space[2],
      borderWidth: 1,
    },
    primary: { backgroundColor: colors.accent, borderColor: colors.accent },
    secondary: { backgroundColor: colors.surfaceHigh, borderColor: colors.border },
    ghost: { backgroundColor: "transparent", borderColor: "transparent" },
    danger: { backgroundColor: colors.error, borderColor: colors.error },
    label: type.button,
    pressed: { opacity: 0.75 },
    disabled: { opacity: ui.disabledOpacity },
  });
}
