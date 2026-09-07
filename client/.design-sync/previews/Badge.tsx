import { Badge, StyleSheet, Text, View, space, type, useTheme } from "boardgame-championship";

const styles = StyleSheet.create({
  wrap: { padding: 16, maxWidth: 400, gap: space[3] },
  row: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
  toneRow: { flexDirection: "row", alignItems: "center", gap: space[3] },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    gap: space[2],
  },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});

export const Tones = () => (
  <View style={styles.wrap}>
    <View style={styles.row}>
      <Badge label="Pending" />
      <Badge label="In progress" tone="info" />
      <Badge label="Submitted" tone="success" />
      <Badge label="2 signatures" tone="warning" />
      <Badge label="Overtime" tone="danger" />
    </View>
  </View>
);

export const ToneScale = () => {
  const { colors } = useTheme();
  const rows = [
    { tone: undefined, name: "neutral", label: "Not started" },
    { tone: "info" as const, name: "info", label: "Round 4 live" },
    { tone: "success" as const, name: "success", label: "Score confirmed" },
    { tone: "warning" as const, name: "warning", label: "Awaiting signature" },
    { tone: "danger" as const, name: "danger", label: "Result disputed" },
  ];
  return (
    <View style={styles.wrap}>
      {rows.map((r) => (
        <View key={r.name} style={styles.toneRow}>
          <Text style={[type.caption, { color: colors.textMuted, width: 72 }]}>{r.name}</Text>
          <Badge label={r.label} tone={r.tone} />
        </View>
      ))}
    </View>
  );
};

export const InMatchCard = () => {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardTop}>
          <Text style={[type.h3, { color: colors.text }]}>Table 2 · Wingspan</Text>
          <Badge label="Live" tone="info" />
        </View>
        <Text style={[type.bodySmall, { color: colors.textSecondary }]}>
          Dice &amp; Glory vs. The Rulebook Rebels
        </Text>
        <View style={styles.row}>
          <Badge label="Round 4" />
          <Badge label="Overtime" tone="danger" />
        </View>
      </View>
    </View>
  );
};

export const LongLabel = () => (
  <View style={styles.wrap}>
    <View style={styles.row}>
      <Badge label="Tiebreak pending review" tone="warning" />
      <Badge label="9" tone="success" />
    </View>
  </View>
);
