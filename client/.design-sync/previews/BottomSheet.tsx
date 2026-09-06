import { useState } from "react";
import {
  BottomSheet,
  Button,
  StyleSheet,
  Text,
  View,
  space,
  type,
  useTheme,
} from "boardgame-championship";

// BottomSheet renders into an RN Modal, so every cell is shown in its OPEN
// state — a closed sheet paints nothing. The content behind it is the screen
// the sheet was opened from, so the dimmed backdrop reads correctly.
const styles = StyleSheet.create({
  screen: { padding: 24, gap: space[3] },
  screenTitle: { ...type.h2 },
  screenLine: { ...type.body },
  field: { gap: space[1] },
  label: { ...type.caption, textTransform: "uppercase", letterSpacing: 1 },
  value: { ...type.body },
  input: { borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: space[3],
    borderBottomWidth: 1,
  },
  rowLabel: { ...type.body },
  rowValue: { ...type.body, fontWeight: "700" },
  body: { ...type.bodySmall },
  footerRow: { flexDirection: "row", gap: space[3] },
  footerBtn: { flex: 1 },
});

function Screen({ heading, lines }: { heading: string; lines: string[] }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Text style={[styles.screenTitle, { color: colors.text }]}>{heading}</Text>
      {lines.map((l) => (
        <Text key={l} style={[styles.screenLine, { color: colors.textSecondary }]}>
          {l}
        </Text>
      ))}
    </View>
  );
}

export const RoundSettings = () => {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(true);
  return (
    <>
      <Screen
        heading="Round 3 — Catan"
        lines={["4 tables · 16 players", "Timer paused at 12:40"]}
      />
      <BottomSheet
        visible={visible}
        onClose={() => setVisible(false)}
        title="Round settings"
        footer={<Button label="Save round" onPress={() => setVisible(false)} />}
      >
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Round name</Text>
          <View
            style={[
              styles.input,
              { borderColor: colors.border, backgroundColor: colors.surfaceHigh },
            ]}
          >
            <Text style={[styles.value, { color: colors.text }]}>Round 3 — Catan</Text>
          </View>
        </View>
        <View style={[styles.row, { borderBottomColor: colors.divider }]}>
          <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Length</Text>
          <Text style={[styles.rowValue, { color: colors.text }]}>45 min</Text>
        </View>
        <View style={[styles.row, { borderBottomColor: colors.divider }]}>
          <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Tables</Text>
          <Text style={[styles.rowValue, { color: colors.text }]}>4</Text>
        </View>
        <View style={[styles.row, { borderBottomColor: colors.divider }]}>
          <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Table bell</Text>
          <Text style={[styles.rowValue, { color: colors.text }]}>On</Text>
        </View>
      </BottomSheet>
    </>
  );
};

export const TwoActionFooter = () => {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(true);
  return (
    <>
      <Screen heading="Results" lines={["18 results submitted", "2 awaiting a signature"]} />
      <BottomSheet
        visible={visible}
        onClose={() => setVisible(false)}
        title="Filter results"
        footer={
          <View style={styles.footerRow}>
            <View style={styles.footerBtn}>
              <Button label="Reset" variant="secondary" onPress={() => setVisible(false)} />
            </View>
            <View style={styles.footerBtn}>
              <Button label="Show 18 results" onPress={() => setVisible(false)} />
            </View>
          </View>
        }
      >
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Narrow the results feed down to a single round, table or team.
        </Text>
        <View style={[styles.row, { borderBottomColor: colors.divider }]}>
          <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Round</Text>
          <Text style={[styles.rowValue, { color: colors.accent }]}>Round 3</Text>
        </View>
        <View style={[styles.row, { borderBottomColor: colors.divider }]}>
          <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Table</Text>
          <Text style={[styles.rowValue, { color: colors.text }]}>All tables</Text>
        </View>
        <View style={[styles.row, { borderBottomColor: colors.divider }]}>
          <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Team</Text>
          <Text style={[styles.rowValue, { color: colors.text }]}>Meeple United</Text>
        </View>
      </BottomSheet>
    </>
  );
};

export const ScrollingBody = () => {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(true);
  const rules = [
    "Each table plays one full game of Catan.",
    "The winner takes 3 points, the runner-up takes 1 point.",
    "Ties are broken by longest road, then by largest army.",
    "A result needs two signatures before it counts.",
    "Rules questions go to the table captain, not the other table.",
    "A table that overruns the timer scores as a draw.",
    "Trading across tables is not allowed at any point.",
    "Late players forfeit their first round of the day.",
  ];
  return (
    <>
      <Screen heading="Tournament rules" lines={["Last updated before round one"]} />
      <BottomSheet
        visible={visible}
        onClose={() => setVisible(false)}
        title="House rules"
        footer={<Button label="Got it" onPress={() => setVisible(false)} />}
      >
        {rules.map((r, i) => (
          <View key={r} style={[styles.row, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.body, { color: colors.textSecondary, flex: 1 }]}>
              {i + 1}. {r}
            </Text>
          </View>
        ))}
      </BottomSheet>
    </>
  );
};
