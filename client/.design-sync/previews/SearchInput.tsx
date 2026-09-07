import { useState } from "react";
import { SearchInput, StyleSheet, Text, View, space, type, useTheme } from "boardgame-championship";

const styles = StyleSheet.create({
  wrap: { padding: 16, maxWidth: 400, gap: space[3] },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    paddingVertical: space[3],
  },
});

export const WithQuery = () => {
  const [value, setValue] = useState("Catan");
  return (
    <View style={styles.wrap}>
      <SearchInput value={value} onChangeText={setValue} placeholder="Search games" />
    </View>
  );
};

export const EmptyWithPlaceholder = () => {
  const [value, setValue] = useState("");
  return (
    <View style={styles.wrap}>
      <SearchInput value={value} onChangeText={setValue} placeholder="Search teams or players" />
    </View>
  );
};

export const FilteringAList = () => {
  const [value, setValue] = useState("kni");
  const { colors } = useTheme();
  const teams = [
    { name: "Cardboard Knights", points: 15 },
    { name: "Knights of the Round Table", points: 11 },
    { name: "Night Owls Guild", points: 8 },
  ];
  return (
    <View style={styles.wrap}>
      <SearchInput value={value} onChangeText={setValue} placeholder="Search teams" />
      <View>
        {teams.map((t) => (
          <View key={t.name} style={[styles.resultRow, { borderBottomColor: colors.border }]}>
            <Text style={[type.body, { color: colors.text }]}>{t.name}</Text>
            <Text style={[type.bodySmall, { color: colors.textSecondary }]}>{t.points} pts</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export const LongQuery = () => {
  const [value, setValue] = useState("Terraforming Mars: Ares Expedition");
  return (
    <View style={styles.wrap}>
      <SearchInput value={value} onChangeText={setValue} placeholder="Search games" />
    </View>
  );
};
