import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { type } from "@/lib/theme/typography";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text } from "react-native";

type Props = {
  onPress: () => void;
};

export function BackButton({ onPress }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["navigation"]);

  return (
    <Pressable onPress={onPress} style={styles.btn}>
      <Ionicons name="arrow-back" size={18} color={colors.primary} />
      <Text style={styles.text}>{t("back")}</Text>
    </Pressable>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    btn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    text: {
      ...type.bodySmall,
      color: colors.primary,
    },
  });
}
