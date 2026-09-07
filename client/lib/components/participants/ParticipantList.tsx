import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SectionList, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { SearchInput } from "@/lib/components/ui/SearchInput";
import { CountrySection } from "@/lib/hooks/useTeamDirectory";
import { inset, space } from "@/lib/theme/spacing";
import { fonts, type } from "@/lib/theme/typography";

interface Props {
  sections: CountrySection[];
  search: string;
  onSearchChange: (value: string) => void;
  isLoading: boolean;
}

export function ParticipantList({ sections, search, onSearchChange, isLoading }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["participants"]);

  return (
    <View style={styles.container}>
      <View style={styles.searchWrapper}>
        <SearchInput
          value={search}
          onChangeText={onSearchChange}
          placeholder={t("search")}
        />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.$id}
        stickySectionHeadersEnabled
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.country}</Text>
            <Text style={styles.sectionLabel}>{section.label}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.code}>{item.code}</Text>
            <Text style={styles.name} numberOfLines={2}>
              {item.name}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>{t("empty")}</Text>
              <Text style={styles.emptyHint}>
                {search.trim() ? t("emptyHintSearch") : t("emptyHint")}
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    searchWrapper: {
      padding: inset.card,
    },
    list: {
      flexGrow: 1,
      paddingBottom: inset.screenBottom,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: inset.list,
      backgroundColor: colors.surfaceHigh,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingHorizontal: inset.card,
      paddingVertical: space[2],
    },
    sectionTitle: {
      ...type.eyebrow,
      color: colors.primary,
    },
    sectionLabel: {
      ...type.caption,
      color: colors.textMuted,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: inset.list,
      minHeight: 44,
      paddingHorizontal: inset.card,
      paddingVertical: space[3],
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    code: {
      ...type.caption,
      fontFamily: fonts.bodyBold,
      letterSpacing: 0.6,
      textAlign: "center",
      minWidth: 52,
      color: colors.primary,
      backgroundColor: colors.surfaceHigh,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      paddingHorizontal: space[2],
      paddingVertical: 4,
    },
    name: {
      ...type.body,
      fontFamily: fonts.bodyBold,
      flex: 1,
      minWidth: 0,
      color: colors.text,
    },
    empty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: space[2],
      padding: inset.section,
    },
    emptyTitle: {
      ...type.h2,
      color: colors.text,
      textAlign: "center",
    },
    emptyHint: {
      ...type.bodySmall,
      color: colors.textMuted,
      textAlign: "center",
    },
  });
}
