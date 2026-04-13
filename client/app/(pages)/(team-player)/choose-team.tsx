import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { type } from "../../../lib/theme/typography";
import { inset } from "../../../lib/theme/spacing";
import { colors } from "../../../lib/theme/colors";

export default function ChooseTeam() {
  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Identity</Text>
        <Pressable
          style={styles.item}
          onPress={() => router.navigate("/choose-your-character?from=settings")}
        >
          <Text style={styles.itemText}>Change Player / Team</Text>
          <Text style={styles.itemChevron}>›</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: inset.screen,
    paddingTop: inset.screenTop,
  },
  back: {
    ...type.bodySmall,
    color: colors.primary,
    marginBottom: inset.group,
  },
  title: {
    ...type.h1,
    color: colors.text,
    marginBottom: inset.section,
  },
  section: {
    gap: inset.tight,
  },
  sectionLabel: {
    ...type.eyebrow,
    color: colors.secondary,
    marginBottom: inset.tight,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: inset.card,
  },
  itemText: {
    ...type.body,
    color: colors.text,
  },
  itemChevron: {
    ...type.h3,
    color: colors.primary,
  },
});
