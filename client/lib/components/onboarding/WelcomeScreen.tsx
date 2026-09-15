import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { useTournament } from "@/lib/bootstrap/TournamentProvider";
import { WelcomeHero } from "@/lib/components/onboarding/WelcomeHero";
import { Button } from "@/lib/components/ui/Button";
import { inset, space } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";

interface Props {
  onMenuPress: () => void;
  onLoginPress: () => void;
  onFaqPress: () => void;
}

export function WelcomeScreen({ onMenuPress, onLoginPress, onFaqPress }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation(["home"]);
  const { active: eventActive } = useTournament();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        body: {
          flex: 1,
          paddingHorizontal: inset.card,
          paddingTop: space[6],
          paddingBottom: inset.screenBottom,
        },
        description: {
          ...type.body,
          color: colors.textSecondary,
        },
        eventInactiveBanner: {
          marginTop: space[6],
          backgroundColor: colors.surfaceHigh,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          padding: inset.card,
        },
        eventInactiveText: {
          ...type.bodySmall,
          color: colors.textSecondary,
        },
        actions: {
          marginTop: space[8],
          alignItems: "flex-start",
          gap: inset.card,
        },
        loginButton: {
          alignSelf: "flex-start",
          minHeight: 48,
        },
        faqLink: {
          ...type.bodySmall,
          color: colors.textMuted,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.container}>
      <WelcomeHero onMenuPress={onMenuPress} />
      <View style={styles.body}>
        <Text style={styles.description}>{t("welcomeDescription")}</Text>
        {!eventActive && (
          <View style={styles.eventInactiveBanner}>
            <Text style={styles.eventInactiveText}>{t("eventNotActive")}</Text>
          </View>
        )}
        <View style={styles.actions}>
          <Button
            label={t("login")}
            icon="arrow-forward"
            iconPosition="right"
            onPress={onLoginPress}
            style={styles.loginButton}
          />
          <Pressable onPress={onFaqPress} hitSlop={8}>
            <Text style={styles.faqLink}>{t("faqLink")}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
