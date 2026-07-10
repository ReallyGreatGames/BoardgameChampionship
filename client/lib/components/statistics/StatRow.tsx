import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { type } from "@/lib/theme/typography";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  label: string;
  value: string;
  sub?: string;
  swatchColor?: string;
};

/** A compact label/value line — optionally with an identity swatch and a muted parenthetical. */
export function StatRow({ label, value, sub, swatchColor }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <View style={[styles.swatch, swatchColor ? { backgroundColor: swatchColor } : null]} />
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.value} numberOfLines={1}>
        {value}
        {sub && <Text style={styles.sub}> {sub}</Text>}
      </Text>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    swatch: {
      width: 8,
      height: 8,
      borderRadius: 2,
    },
    label: {
      ...type.caption,
      color: colors.textSecondary,
      width: 80,
    },
    value: {
      ...type.caption,
      color: colors.text,
      fontWeight: "600",
      flex: 1,
      textAlign: "right",
    },
    sub: {
      ...type.caption,
      color: colors.textMuted,
      fontWeight: "400",
    },
  });
}
