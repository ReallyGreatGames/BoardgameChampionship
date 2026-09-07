import { DataTable, StyleSheet, View } from "boardgame-championship";

const styles = StyleSheet.create({
  wrap: { padding: 16 },
});

const columns = [
  { key: "team", label: "Team" },
  { key: "played", label: "Played", align: "right" as const },
  { key: "points", label: "Points", align: "right" as const },
  { key: "rank", label: "Rank", align: "right" as const },
];

export const Standings = () => (
  <View style={styles.wrap}>
    <DataTable
      columns={columns}
      rows={[
        { id: 1, team: "Meeple United", played: 6, points: 18, rank: 1 },
        { id: 2, team: "Cardboard Knights", played: 6, points: 15, rank: 2 },
        { id: 3, team: "Dice & Glory", played: 6, points: 12, rank: 3 },
        { id: 4, team: "The Rulebook Rebels", played: 6, points: 9, rank: 4 },
      ]}
    />
  </View>
);

export const Empty = () => (
  <View style={styles.wrap}>
    <DataTable columns={columns} rows={[]} emptyMessage="No results submitted yet." />
  </View>
);
