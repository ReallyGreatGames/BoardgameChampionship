import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../bootstrap/ThemeProvider";
import { inset } from "../theme/spacing";
import { type } from "../theme/typography";

export function Table({ gameId }: { gameId: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.gameSection}>
      {/* TODO: Load Data from Games - requires data import */}
      <Text style={styles.gameSectionHeader}>Tisch 14 // TODO</Text>
      <View style={styles.gameTable}>
        {[
          { team: "Team 1", player: "Spieler 1" },
          { team: "Team 2", player: "Spieler 2" },
          { team: "Team 3", player: "Spieler 3" },
          { team: "Team 4", player: "Spieler 4" },
        ].map((entry, i) => (
          <View key={i} style={styles.gameRow}>
            <Text style={styles.gameTeam}>{entry.team}</Text>
            <Text style={styles.gamePlayer}>{entry.player}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    gameSection: {
      marginTop: inset.tight,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      overflow: "hidden",
    },
    gameSectionHeader: {
      color: colors.text,
      fontWeight: "bold",
      backgroundColor: colors.surfaceHigh,
      paddingHorizontal: inset.card,
      paddingVertical: 6,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    gameTable: {
      gap: 0,
    },
    gameRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: inset.card,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    gameTeam: {
      ...type.bodySmall,
      color: colors.text,
    },
    gamePlayer: {
      ...type.bodySmall,
      color: colors.textSecondary,
    },
  });
}
