import { BackButton, StyleSheet, Text, View, space, type, useTheme } from "boardgame-championship";

const styles = StyleSheet.create({
  wrap: { padding: 16, maxWidth: 380, gap: space[4] },
  header: { gap: space[2] },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: space[3],
    paddingHorizontal: space[4],
  },
});

export const Default = () => (
  <View style={styles.wrap}>
    <BackButton onPress={() => {}} />
  </View>
);

export const ScreenHeader = () => {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <BackButton onPress={() => {}} />
        <Text style={[type.h2, { color: colors.text }]}>Round 3 · Table 4</Text>
        <Text style={[type.bodySmall, { color: colors.textSecondary }]}>
          Meeple United vs. Cardboard Knights
        </Text>
      </View>
    </View>
  );
};

export const OnSurfaceBar = () => {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.bar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <BackButton onPress={() => {}} />
        <Text style={[type.eyebrow, { color: colors.textMuted }]}>Tournament rules</Text>
      </View>
    </View>
  );
};
