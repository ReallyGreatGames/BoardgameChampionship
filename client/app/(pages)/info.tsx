import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../lib/bootstrap/ThemeProvider";
import { inset, space } from "../../lib/theme/spacing";
import { fonts, type } from "../../lib/theme/typography";

type FaqEntry = { q: string; a: string };

export default function InfoScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation(["info"]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const entries = t("faq", { returnObjects: true }) as FaqEntry[];

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
          gap: inset.list,
        },
        item: {
          backgroundColor: colors.surface,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: "hidden",
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: inset.card,
          gap: space[3],
        },
        question: {
          ...type.body,
          fontFamily: fonts.bodyMedium,
          color: colors.text,
          flex: 1,
        },
        divider: {
          height: 1,
          backgroundColor: colors.divider,
        },
        answer: {
          ...type.body,
          color: colors.textSecondary,
          padding: inset.card,
          paddingTop: space[3],
        },
      }),
    [colors],
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {entries.map((entry, i) => (
        <View key={i} style={styles.item}>
          <Pressable
            style={styles.header}
            onPress={() => setOpenIndex(openIndex === i ? null : i)}
          >
            <Text style={styles.question}>{entry.q}</Text>
            <Ionicons
              name={openIndex === i ? "chevron-up" : "chevron-down"}
              size={16}
              color={colors.textMuted}
            />
          </Pressable>
          {openIndex === i && (
            <>
              <View style={styles.divider} />
              <Text style={styles.answer}>{entry.a}</Text>
            </>
          )}
        </View>
      ))}
    </ScrollView>
  );
}
