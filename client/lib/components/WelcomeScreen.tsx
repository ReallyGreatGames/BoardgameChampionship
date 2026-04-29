import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../bootstrap/ThemeProvider";
import { inset, space } from "../theme/spacing";
import { type } from "../theme/typography";
import { useTournament } from "../bootstrap/TournamentProvider";

const LOGOS: Partial<Record<string, number>> = {
  dmmib: require("../../assets/images/logo-dmmib.png"),
  europemasters: require("../../assets/images/logo-europemasters.png"),
};

interface Props {
  onLoginPress: () => void;
  onFaqPress: () => void;
}

export function WelcomeScreen({ onLoginPress, onFaqPress }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation(["home"]);
  const { type: tournamentType } = useTournament();

  const logo = tournamentType ? LOGOS[tournamentType] : undefined;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
          paddingHorizontal: inset.screen,
          justifyContent: "flex-start",
        },
        logo: {
          width: "100%",
          height: 80,
          resizeMode: "contain",
          marginBottom: space[8],
        },
        welcomeText: {
          ...type.display,
          color: colors.text,
        },
        description: {
          ...type.body,
          color: colors.textSecondary,
          marginTop: space[6],
          marginBottom: space[8],
        },
        loginButton: {
          backgroundColor: colors.accent,
          borderRadius: 8,
          paddingVertical: 14,
          paddingHorizontal: inset.group,
          flexDirection: "row",
          alignItems: "center",
          alignSelf: "flex-start",
          gap: 8,
        },
        loginButtonText: {
          ...type.button,
          color: colors.onAccent,
        },
        faqLink: {
          ...type.bodySmall,
          color: colors.textMuted,
          marginTop: space[4],
        },
      }),
    [colors],
  );

  return (
    <View style={styles.container}>
      {logo && <Image source={logo} style={styles.logo} />}
      <Text style={styles.welcomeText}>{t("welcome")}</Text>
      <Text style={styles.description}>{t("welcomeDescription")}</Text>
      <Pressable style={styles.loginButton} onPress={onLoginPress}>
        <Text style={styles.loginButtonText}>{t("login")}</Text>
        <Ionicons name="arrow-forward" size={16} color={colors.onAccent} />
      </Pressable>
      <Pressable onPress={onFaqPress}>
        <Text style={styles.faqLink}>{t("faqLink")}</Text>
      </Pressable>
    </View>
  );
}
