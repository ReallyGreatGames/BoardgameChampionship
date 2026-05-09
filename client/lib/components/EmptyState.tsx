import { useMemo } from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { useTheme } from "../bootstrap/ThemeProvider";
import { type } from "../theme/typography";

type Props = {
  message: string;
  style?: ViewStyle;
};

export function EmptyState({ message, style }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    text: {
      ...type.bodySmall,
      color: colors.textMuted,
    },
  });
}
