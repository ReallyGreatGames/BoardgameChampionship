import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../bootstrap/ThemeProvider";
import { type } from "../theme/typography";

type FormFieldProps = {
  icon: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
};

export function FormField({ icon, label, required, error, children }: FormFieldProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Ionicons name={icon as any} size={13} color={colors.textMuted} />
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      </View>
      {children}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    field: { gap: 6 },
    labelRow: { flexDirection: "row", alignItems: "center", gap: 5 },
    label: {
      ...type.caption,
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    required: { color: colors.error },
    error: { ...type.caption, color: colors.error },
  });
}
