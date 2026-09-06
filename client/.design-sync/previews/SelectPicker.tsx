import { useState } from "react";
import { SelectPicker, StyleSheet, Text, View, space, type, useTheme } from "boardgame-championship";

const styles = StyleSheet.create({
  wrap: { padding: 16, maxWidth: 380, gap: space[3] },
  field: { gap: space[1] },
  bar: { flexDirection: "row", gap: space[3] },
  barItem: { flex: 1, gap: space[1] },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space[4],
  },
});

const statusOptions = [
  { value: "all", label: "All" },
  { value: "live", label: "Live" },
  { value: "done", label: "Finished" },
];

export const Default = () => {
  const [value, setValue] = useState("all");
  return (
    <View style={styles.wrap}>
      <SelectPicker options={statusOptions} value={value} onChange={setValue} />
    </View>
  );
};

export const FilterBar = () => {
  const { colors } = useTheme();
  const [round, setRound] = useState("r3");
  const [table, setTable] = useState("t2");
  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        <View style={styles.barItem}>
          <Text style={[type.eyebrow, { color: colors.textMuted }]}>Round</Text>
          <SelectPicker
            options={[
              { value: "r1", label: "Round 1" },
              { value: "r2", label: "Round 2" },
              { value: "r3", label: "Round 3" },
            ]}
            value={round}
            onChange={setRound}
          />
        </View>
        <View style={styles.barItem}>
          <Text style={[type.eyebrow, { color: colors.textMuted }]}>Table</Text>
          <SelectPicker
            options={[
              { value: "t1", label: "Table 1" },
              { value: "t2", label: "Table 2" },
              { value: "t3", label: "Table 3" },
            ]}
            value={table}
            onChange={setTable}
          />
        </View>
      </View>
    </View>
  );
};

export const GamePicker = () => {
  const { colors } = useTheme();
  const [value, setValue] = useState("terraforming");
  return (
    <View style={styles.wrap}>
      <View style={styles.field}>
        <Text style={[type.eyebrow, { color: colors.textMuted }]}>Game</Text>
        <SelectPicker
          options={[
            { value: "catan", label: "Catan" },
            { value: "wingspan", label: "Wingspan" },
            { value: "terraforming", label: "Terraforming Mars: Ares Expedition" },
          ]}
          value={value}
          onChange={setValue}
        />
      </View>
    </View>
  );
};

export const SettingsRow = () => {
  const { colors } = useTheme();
  const [value, setValue] = useState("dark");
  return (
    <View style={styles.wrap}>
      <View style={styles.settingRow}>
        <Text style={[type.body, { color: colors.text }]}>Theme</Text>
        <View>
          <SelectPicker
            options={[
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
              { value: "oled", label: "OLED" },
            ]}
            value={value}
            onChange={setValue}
          />
        </View>
      </View>
    </View>
  );
};
