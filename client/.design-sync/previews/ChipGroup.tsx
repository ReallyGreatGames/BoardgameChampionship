import { useState } from "react";
import {
  ChipGroup,
  StyleSheet,
  Text,
  View,
  useTheme,
  type as typography,
} from "boardgame-championship";

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 20, maxWidth: 420 },
  group: { gap: 8 },
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

const roundOptions = [
  { value: "all", label: "All" },
  { value: "live", label: "Live", isLive: true },
  { value: "done", label: "Finished", icon: "checkmark-circle-outline" },
];

export const RoundFilter = () => {
  const [value, setValue] = useState("live");
  return (
    <View style={styles.wrap}>
      <ChipGroup mode="select" options={roundOptions} value={value} onChange={setValue} />
    </View>
  );
};

export const TableFilter = () => {
  const [value, setValue] = useState("t3");
  const options = [
    { value: "all", label: "All tables" },
    { value: "t1", label: "Table 1" },
    { value: "t2", label: "Table 2" },
    { value: "t3", label: "Table 3", isLive: true },
    { value: "t4", label: "Table 4" },
    { value: "t5", label: "Table 5" },
  ];
  return (
    <View style={styles.wrap}>
      <ChipGroup mode="select" options={options} value={value} onChange={setValue} />
    </View>
  );
};

export const TintedRuleTypes = () => {
  const { colors } = useTheme();
  const [value, setValue] = useState("change");
  const options = [
    { value: "change", label: "Change", color: colors.accent, icon: "swap-horizontal-outline" },
    { value: "addition", label: "Addition", color: colors.success, icon: "add-circle-outline" },
    { value: "removal", label: "Removal", color: colors.error, icon: "remove-circle-outline" },
    { value: "note", label: "Clarification", color: colors.primary, icon: "information-circle-outline" },
  ];
  return (
    <View style={styles.wrap}>
      <ChipGroup mode="select" options={options} value={value} onChange={setValue} />
    </View>
  );
};

export const CycleMode = () => {
  const { colors } = useTheme();
  const options = [
    { value: "unscored", label: "Not scored" },
    { value: "win", label: "Win", color: colors.success, icon: "trophy-outline" },
    { value: "draw", label: "Draw", color: colors.primary, icon: "remove-outline" },
    { value: "loss", label: "Loss", color: colors.error, icon: "close-outline" },
  ];
  const [neutral, setNeutral] = useState("unscored");
  const [tinted, setTinted] = useState("win");
  return (
    <View style={styles.wrap}>
      <View style={styles.group}>
        <Caption>Neutral (first option)</Caption>
        <ChipGroup
          mode="cycle"
          options={options}
          value={neutral}
          onChange={setNeutral}
          style={{ alignSelf: "flex-start" }}
        />
      </View>
      <View style={styles.group}>
        <Caption>Advanced (tinted)</Caption>
        <ChipGroup
          mode="cycle"
          options={options}
          value={tinted}
          onChange={setTinted}
          style={{ alignSelf: "flex-start" }}
        />
      </View>
    </View>
  );
};
