import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { usePlayer } from "../bootstrap/PlayerProvider";
import { useTheme } from "../bootstrap/ThemeProvider";
import { useTableStore } from "../stores/appwrite/table-store";
import { inset } from "../theme/spacing";
import { type } from "../theme/typography";

export function Table({ gameId }: { gameId: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { player: currentPlayer } = usePlayer();
  const collection = useTableStore((s) => s.collection);

  const table = collection.find((t) => {
    const tableGameId = typeof t.game === "string" ? t.game : t.game.$id;
    const gameMatches = tableGameId === gameId;
    const playerMatches =
      t.players?.some((p) => p.$id === currentPlayer?.$id) ?? false;
    return gameMatches && playerMatches;
  });

  if (!table) {
    return null;
  }

  return (
    <View style={styles.gameSection}>
      <Text style={styles.gameSectionHeader}>Tisch {table.tableNumber}</Text>
      <View style={styles.gameTable}>
        {(table.players ?? []).map((player, i) => (
          <View
            key={player.$id}
            style={[
              styles.gameRow,
              player.$id === currentPlayer?.$id && styles.gameRowActive,
            ]}
          >
            <Text
              style={[
                styles.gameTeam,
                player.$id === currentPlayer?.$id && styles.gameTeamActive,
              ]}
            >
              {player.name}
            </Text>
            <Text style={styles.gamePlayer}>Spieler {i + 1}</Text>
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
    gameRowActive: {
      backgroundColor: colors.surfaceHigh,
    },
    gameTeam: {
      ...type.bodySmall,
      color: colors.text,
    },
    gameTeamActive: {
      fontWeight: "bold",
    },
    gamePlayer: {
      ...type.bodySmall,
      color: colors.textSecondary,
    },
  });
}
