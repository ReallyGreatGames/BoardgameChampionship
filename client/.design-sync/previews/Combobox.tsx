import { useState } from "react";
import {
  Combobox,
  StyleSheet,
  Text,
  View,
  useTheme,
  type as typography,
} from "boardgame-championship";

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 20, maxWidth: 420, alignItems: "flex-start" },
  row: { padding: 16, flexDirection: "row", flexWrap: "wrap", gap: 16, alignItems: "center" },
  group: { gap: 6, alignItems: "flex-start" },
});

const Caption = ({ children }: { children: string }) => {
  const { colors } = useTheme();
  return (
    <Text
      style={[
        typography.caption,
        { color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
      ]}
    >
      {children}
    </Text>
  );
};

const phaseOptions = [
  { value: "all", label: "All rounds" },
  { value: "live", label: "Round 4 — live", isLive: true },
  { value: "done", label: "Finished rounds" },
];

export const TournamentPhase = () => {
  const [value, setValue] = useState("live");
  return (
    <View style={styles.wrap}>
      <Combobox options={phaseOptions} value={value} onChange={setValue} />
    </View>
  );
};

export const SelectedStates = () => {
  const [live, setLive] = useState("live");
  const [done, setDone] = useState("done");
  return (
    <View style={styles.wrap}>
      <View style={styles.group}>
        <Caption>Live option selected</Caption>
        <Combobox options={phaseOptions} value={live} onChange={setLive} />
      </View>
      <View style={styles.group}>
        <Caption>Plain option selected</Caption>
        <Combobox options={phaseOptions} value={done} onChange={setDone} />
      </View>
    </View>
  );
};

export const FilterBar = () => {
  const [game, setGame] = useState("catan");
  const [table, setTable] = useState("t3");
  const gameOptions = [
    { value: "catan", label: "Catan" },
    { value: "carcassonne", label: "Carcassonne" },
    { value: "azul", label: "Azul" },
  ];
  const tableOptions = [
    { value: "all", label: "All tables" },
    { value: "t3", label: "Table 3", isLive: true },
    { value: "t4", label: "Table 4" },
  ];
  return (
    <View style={styles.row}>
      <View style={styles.group}>
        <Caption>Game</Caption>
        <Combobox options={gameOptions} value={game} onChange={setGame} />
      </View>
      <View style={styles.group}>
        <Caption>Table</Caption>
        <Combobox options={tableOptions} value={table} onChange={setTable} />
      </View>
    </View>
  );
};
