import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { type } from "@/lib/theme/typography";

type Tone = "neutral" | "info" | "success" | "warning" | "danger";

type Props = {
  label: string;
  tone?: Tone;
};

export function Badge({ label, tone = "neutral" }: Props) {
  const { colors } = useTheme();
  const color = {
    neutral: colors.textSecondary,
    info: colors.primary,
    success: colors.success,
    warning: "#B45309",
    danger: colors.error,
  }[tone];

  return (
    <View style={[styles.badge, { backgroundColor: color + "18", borderColor: color + "66" }]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  label: { ...type.caption, fontWeight: "700" },
});
