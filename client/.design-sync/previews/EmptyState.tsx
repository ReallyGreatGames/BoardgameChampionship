import { EmptyState, StyleSheet, Text, View, space, type, useTheme } from "boardgame-championship";

const styles = StyleSheet.create({
  wrap: { padding: 16, maxWidth: 400 },
  box: { height: 160, justifyContent: "center" },
  panel: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  panelHeader: {
    borderBottomWidth: 1,
    paddingVertical: space[3],
    paddingHorizontal: space[4],
  },
  panelBody: { height: 180 },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    paddingVertical: space[2],
    paddingHorizontal: space[4],
  },
});

export const Default = () => (
  <View style={styles.wrap}>
    <View style={styles.box}>
      <EmptyState message="Nothing to show yet." />
    </View>
  </View>
);

export const InPanel = () => {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.panel, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <View style={[styles.panelHeader, { borderBottomColor: colors.border }]}>
          <Text style={[type.h3, { color: colors.text }]}>Standings</Text>
        </View>
        <View style={styles.panelBody}>
          <EmptyState message="No results submitted for round 4 yet." />
        </View>
      </View>
    </View>
  );
};

export const LongMessage = () => (
  <View style={styles.wrap}>
    <View style={styles.box}>
      <EmptyState message="No teams have entered the lottery yet. Once players draw their tables, the pairings for round 1 will appear here." />
    </View>
  </View>
);

export const WithStyleOverride = () => {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
        <Text style={[type.eyebrow, { color: colors.textMuted }]}>Team</Text>
        <Text style={[type.eyebrow, { color: colors.textMuted }]}>Points</Text>
      </View>
      <EmptyState
        message="No teams match “knight”."
        style={{
          minHeight: 120,
          borderWidth: 1,
          borderTopWidth: 0,
          borderColor: colors.border,
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
          paddingHorizontal: space[4],
        }}
      />
    </View>
  );
};
