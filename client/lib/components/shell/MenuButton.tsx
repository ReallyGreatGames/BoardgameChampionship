import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { space } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";

interface Props {
  onPress: () => void;
}

export function MenuButton({ onPress }: Props) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation(["home"]);

  const styles = useMemo(() => {
    const foreground = isDark ? colors.text : colors.onAccent;
    const muted = isDark ? colors.textSecondary : colors.surfaceHigh;

    return StyleSheet.create({
      row: {
        flexDirection: "row",
        alignItems: "center",
        gap: space[2],
      },
      button: {
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        borderRadius: 10,
      },
      buttonPressed: {
        opacity: 0.6,
      },
      bar: {
        width: 20,
        height: 2,
        borderRadius: 1,
        backgroundColor: foreground,
      },
      barShort: {
        width: 14,
        height: 2,
        borderRadius: 1,
        backgroundColor: muted,
      },
      label: {
        ...type.caption,
        color: muted,
      },
    });
  }, [colors, isDark]);

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("home:openMenu")}
        onPress={onPress}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <View style={styles.bar} />
        <View style={styles.bar} />
        <View style={styles.barShort} />
      </Pressable>
      <Text style={styles.label}>{t("home:openMenu")}</Text>
    </View>
  );
}
