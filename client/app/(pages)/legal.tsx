import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { inset, space } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function LegalScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation(["legal"]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        content: {
          padding: inset.screen,
          paddingTop: inset.section,
          paddingBottom: inset.screenBottom,
          gap: space[6],
        },
        section: {
          gap: space[3],
        },
        sectionTitle: {
          ...type.h3,
          color: colors.text,
        },
        paragraph: {
          ...type.body,
          color: colors.textSecondary,
          lineHeight: 22,
        },
      }),
    [colors],
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("legal:imprint.title")}</Text>
        <Text style={styles.paragraph}>{t("legal:imprint.body")}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("legal:privacy.title")}</Text>
        <Text style={styles.paragraph}>{t("legal:privacy.body")}</Text>
      </View>
    </ScrollView>
  );
}
