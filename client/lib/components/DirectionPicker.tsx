import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../bootstrap/ThemeProvider";
import { inset } from "../theme/spacing";
import { type } from "../theme/typography";

type DirectionPickerProps = {
  value: "up" | "down";
  onChange: (v: "up" | "down") => void;
  labelDown: string;
  labelUp: string;
};

export function DirectionPicker({ value, onChange, labelDown, labelUp }: DirectionPickerProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.dirRow}>
      <TouchableOpacity
        style={[styles.dirBtn, value === "down" && styles.dirBtnSelected]}
        onPress={() => onChange("down")}
      >
        <Ionicons
          name="arrow-down"
          size={16}
          color={value === "down" ? colors.accent : colors.textMuted}
        />
        <Text style={[styles.dirBtnText, value === "down" && styles.dirBtnTextSelected]}>
          {labelDown}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.dirBtn, value === "up" && styles.dirBtnSelected]}
        onPress={() => onChange("up")}
      >
        <Ionicons
          name="arrow-up"
          size={16}
          color={value === "up" ? colors.accent : colors.textMuted}
        />
        <Text style={[styles.dirBtnText, value === "up" && styles.dirBtnTextSelected]}>
          {labelUp}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    dirRow: {
      flexDirection: "row",
      gap: inset.tight,
    },
    dirBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      backgroundColor: colors.surfaceHigh,
    },
    dirBtnSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.surface,
    },
    dirBtnText: {
      ...type.caption,
      color: colors.textMuted,
    },
    dirBtnTextSelected: {
      color: colors.accent,
    },
  });
}
