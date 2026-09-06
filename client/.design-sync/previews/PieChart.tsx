import { PieChart, StyleSheet, Text, View, space, type, useTheme } from "boardgame-championship";

// Mirrors lib/components/statistics/SeatCard.tsx: one navy ramp for the four
// finishing places, drawn from the live palette so the chart stays on-brand.
const PLACEMENT_OPACITIES = ["FF", "CC", "88", "44"];

const styles = StyleSheet.create({
  wrap: { padding: 16 },
  card: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    gap: space[2],
    maxWidth: 420,
  },
  chartRow: { flexDirection: "row", alignItems: "center", gap: space[5] },
  legend: { gap: space[2], flexShrink: 1 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: space[2] },
  swatch: { width: 12, height: 12, borderRadius: 3 },
  legendLabel: { ...type.bodySmall, width: 108 },
  legendValue: { ...type.bodySmall, fontWeight: "700" },
  title: { ...type.bodySmall, fontWeight: "700" },
  eyebrow: { ...type.eyebrow },
  caption: { ...type.caption },
  barRow: { flexDirection: "row", alignItems: "center", gap: space[2] },
  barLabel: { ...type.caption, width: 56 },
  barTrack: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4, width: "62%" },
  barValue: { ...type.caption, fontWeight: "700", width: 84, textAlign: "right" },
  divider: { height: 1 },
  sizeRow: { flexDirection: "row", alignItems: "flex-end", gap: space[8] },
  sizeCol: { alignItems: "center", gap: space[2] },
  emptyRow: { flexDirection: "row", alignItems: "center", gap: space[4] },
});

function Legend({ items }: { items: { color: string; label: string; value: string }[] }) {
  const { colors } = useTheme();
  return (
    <View style={styles.legend}>
      {items.map((it) => (
        <View key={it.label} style={styles.legendRow}>
          <View style={[styles.swatch, { backgroundColor: it.color }]} />
          <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>{it.label}</Text>
          <Text style={[styles.legendValue, { color: colors.text }]}>{it.value}</Text>
        </View>
      ))}
    </View>
  );
}

export const PlacementDistribution = () => {
  const { colors } = useTheme();
  const shade = (i: number) => `${colors.primary}${PLACEMENT_OPACITIES[i]}`;
  const counts = [7, 5, 3, 1];
  const total = 16;
  return (
    <View style={styles.wrap}>
      <View style={styles.chartRow}>
        <PieChart
          size={160}
          slices={counts.map((value, i) => ({ value, color: shade(i) }))}
        />
        <Legend
          items={counts.map((c, i) => ({
            color: shade(i),
            label: ["1st place", "2nd place", "3rd place", "4th place"][i],
            value: `${c} · ${Math.round((c / total) * 100)}%`,
          }))}
        />
      </View>
    </View>
  );
};

export const MatchOutcomes = () => {
  const { colors } = useTheme();
  const slices = [
    { value: 11, color: colors.accent, label: "Won" },
    { value: 6, color: colors.primary, label: "Lost" },
    { value: 3, color: colors.success, label: "Drawn" },
  ];
  return (
    <View style={styles.wrap}>
      <View style={styles.chartRow}>
        <PieChart size={140} slices={slices.map(({ value, color }) => ({ value, color }))} />
        <View style={styles.legend}>
          <Text style={[styles.eyebrow, { color: colors.textMuted }]}>Meeple United</Text>
          <Legend
            items={slices.map((s) => ({
              color: s.color,
              label: s.label,
              value: `${s.value} of 20`,
            }))}
          />
        </View>
      </View>
    </View>
  );
};

export const SeatStatCard = () => {
  const { colors } = useTheme();
  const shade = (i: number) => `${colors.primary}${PLACEMENT_OPACITIES[i]}`;
  const counts = [8, 3, 1, 1];
  return (
    <View style={styles.wrap}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Seat 1</Text>
        <View style={styles.barRow}>
          <Text style={[styles.barLabel, { color: colors.textSecondary }]}>Win rate</Text>
          <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.barFill, { backgroundColor: colors.primary }]} />
          </View>
          <Text style={[styles.barValue, { color: colors.text }]}>62% (8/13)</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.chartRow}>
          <PieChart size={112} slices={counts.map((value, i) => ({ value, color: shade(i) }))} />
          <Legend
            items={counts.map((c, i) => ({
              color: shade(i),
              label: `${["1st", "2nd", "3rd", "4th"][i]} place`,
              value: `${Math.round((c / 13) * 100)}%`,
            }))}
          />
        </View>
      </View>
    </View>
  );
};

export const Sizes = () => {
  const { colors } = useTheme();
  const slices = [
    { value: 5, color: colors.accent },
    { value: 3, color: colors.primary },
    { value: 2, color: colors.success },
  ];
  return (
    <View style={styles.wrap}>
      <View style={styles.sizeRow}>
        {[
          { size: undefined, label: "default (88)" },
          { size: 120, label: "120" },
          { size: 160, label: "160" },
        ].map((s) => (
          <View key={s.label} style={styles.sizeCol}>
            <PieChart size={s.size} slices={slices} />
            <Text style={[styles.caption, { color: colors.textMuted }]}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export const NoResultsYet = () => {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={styles.emptyRow}>
        <PieChart size={112} slices={[]} />
        <View style={styles.legend}>
          <Text style={[styles.title, { color: colors.text }]}>Seat 4</Text>
          <Text style={[styles.caption, { color: colors.textSecondary }]}>
            No games recorded yet — the chart falls back to a plain border circle.
          </Text>
        </View>
      </View>
    </View>
  );
};
