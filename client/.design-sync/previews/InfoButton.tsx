import { InfoButton, StyleSheet, Text, View, space, type, useTheme } from "boardgame-championship";

// The (i) is a 16px muted glyph — it only reads as a component next to the
// heading it annotates, which is how the app uses it (StatisticsTab,
// TeamPerformanceTable).
const styles = StyleSheet.create({
  wrap: { padding: 16, maxWidth: 480 },
  card: { borderWidth: 1, borderRadius: 10, padding: 16, gap: space[3] },
  headingRow: { flexDirection: "row", alignItems: "center", gap: space[1] },
  heading: { ...type.h3 },
  body: { ...type.bodySmall },
  headerRow: { flexDirection: "row", paddingBottom: space[2], borderBottomWidth: 1 },
  row: { flexDirection: "row", paddingVertical: space[2] },
  teamCol: { flex: 2 },
  numCol: { flex: 1, textAlign: "right" },
  headerCell: { ...type.caption, textTransform: "uppercase", letterSpacing: 1 },
  cell: { ...type.bodySmall },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: space[2],
    borderBottomWidth: 1,
  },
  statLabelGroup: { flexDirection: "row", alignItems: "center", gap: space[1] },
  statLabel: { ...type.bodySmall },
  statValue: { ...type.bodySmall, fontWeight: "700" },
});

export const SectionHeading = () => {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={styles.headingRow}>
        <Text style={[styles.heading, { color: colors.text }]}>Seat details</Text>
        <InfoButton
          title="Seat details"
          message="Per-seat win rate and finishing places across every table of the tournament. Seats are numbered clockwise from the start player."
        />
      </View>
      <Text style={[styles.body, { color: colors.textSecondary, marginTop: space[2] }]}>
        13 matches recorded across 4 tables.
      </Text>
    </View>
  );
};

export const TableHeading = () => {
  const { colors } = useTheme();
  const rows = [
    { team: "Meeple United", actual: "1.85", expected: "2.10" },
    { team: "Cardboard Knights", actual: "2.31", expected: "2.05" },
    { team: "Dice & Glory", actual: "2.92", expected: "2.48" },
  ];
  return (
    <View style={styles.wrap}>
      <View style={styles.headingRow}>
        <Text style={[styles.heading, { color: colors.text }]}>Team performance</Text>
        <InfoButton
          title="Team performance"
          message="Actual average placement compared with the placement expected from each team's seating draw. A negative delta means the team over-performed."
        />
      </View>
      <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerCell, styles.teamCol, { color: colors.textMuted }]}>Team</Text>
        <Text style={[styles.headerCell, styles.numCol, { color: colors.textMuted }]}>Actual</Text>
        <Text style={[styles.headerCell, styles.numCol, { color: colors.textMuted }]}>Expected</Text>
      </View>
      {rows.map((r) => (
        <View key={r.team} style={styles.row}>
          <Text style={[styles.cell, styles.teamCol, { color: colors.text }]}>{r.team}</Text>
          <Text style={[styles.cell, styles.numCol, { color: colors.text }]}>{r.actual}</Text>
          <Text style={[styles.cell, styles.numCol, { color: colors.textSecondary }]}>
            {r.expected}
          </Text>
        </View>
      ))}
    </View>
  );
};

export const AnnotatedStats = () => {
  const { colors } = useTheme();
  const stats = [
    {
      label: "Strength of schedule",
      value: "0.58",
      info: "The average final rank of every opponent a team has faced so far, normalised to 0–1.",
    },
    {
      label: "Tie breakers",
      value: "3 applied",
      info: "Ties are broken by head-to-head result first, then strength of schedule, then total victory points.",
    },
    {
      label: "Seat bias",
      value: "+0.12",
      info: "How much better the average seat 1 finish is than the field average. Anything above 0.25 is worth re-drawing.",
    },
  ];
  return (
    <View style={styles.wrap}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {stats.map((s) => (
          <View key={s.label} style={[styles.statRow, { borderBottomColor: colors.divider }]}>
            <View style={styles.statLabelGroup}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{s.label}</Text>
              <InfoButton title={s.label} message={s.info} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{s.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};
