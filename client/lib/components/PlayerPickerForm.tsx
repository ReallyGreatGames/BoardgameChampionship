import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Query } from "react-native-appwrite";
import { tablesDB } from "../appwrite";
import { Team } from "../bootstrap/PlayerProvider";
import { type } from "../theme/typography";
import { inset } from "../theme/spacing";
import { colors } from "../theme/colors";

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;

async function fetchTeams(): Promise<Team[]> {
  const res = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: "teams",
    queries: [Query.orderAsc("name")],
  });
  return res.rows.map((row) => ({
    name: row.name as string,
    code: row.code as string,
    country: row.country as string,
  }));
}

type Props = {
  onConfirm: (team: Team, playerId: string) => void;
  onBack?: () => void;
};

export function PlayerPickerForm({ onConfirm, onBack }: Props) {
  const [step, setStep] = useState<"team" | "player">("team");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const { data: teams, isLoading, isError } = useQuery<Team[]>({
    queryKey: ["teams"],
    queryFn: fetchTeams,
  });

  function handleTeamSelect(team: Team) {
    setSelectedTeam(team);
    setStep("player");
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load teams.</Text>
      </View>
    );
  }

  if (step === "player" && selectedTeam) {
    return (
      <View style={styles.container}>
        <Pressable onPress={() => setStep("team")}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>

        <View style={styles.playerHeaderZone}>
          <Text style={styles.title}>{selectedTeam.name}</Text>
          <Text style={styles.subtitle}>Who are you?</Text>
        </View>

        <View style={styles.playerGrid}>
          {["1", "2", "3", "4"].map((id) => (
            <Pressable
              key={id}
              style={styles.playerCard}
              onPress={() => onConfirm(selectedTeam, id)}
            >
              <Text style={styles.playerNumber}>{id}</Text>
              <Text style={styles.playerLabel}>Player {id}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {onBack && (
        <Pressable onPress={onBack}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
      )}

      <View style={styles.teamHeaderZone}>
        <Text style={styles.title}>Choose Your Team</Text>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {teams?.map((team) => (
          <Pressable
            key={team.code}
            style={styles.teamCard}
            onPress={() => handleTeamSelect(team)}
          >
            <Text style={styles.teamCode}>{team.code}</Text>
            <View style={styles.teamInfo}>
              <Text style={styles.teamName}>{team.name}</Text>
              <Text style={styles.teamCountry}>{team.country}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: inset.screen,
    paddingTop: inset.screenTop,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  back: {
    ...type.bodySmall,
    color: colors.primary,
    marginBottom: inset.group,
  },

  // Team selection
  teamHeaderZone: {
    marginBottom: inset.group,
  },
  title: {
    ...type.h1,
    color: colors.text,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: inset.list,
    paddingBottom: inset.screenBottom,
  },
  teamCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: inset.group,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: inset.card,
    paddingHorizontal: inset.card,
  },
  teamCode: {
    ...type.h2,
    color: colors.primary,
    width: 56,
    textAlign: "center",
  },
  teamInfo: {
    flex: 1,
    gap: 2,
  },
  teamName: {
    ...type.body,
    fontFamily: "DMSans_700Bold",
    color: colors.text,
  },
  teamCountry: {
    ...type.caption,
    color: colors.textSecondary,
  },
  errorText: {
    ...type.body,
    color: colors.error,
  },

  // Player selection
  playerHeaderZone: {
    gap: 4,
    marginBottom: inset.section,
  },
  subtitle: {
    ...type.bodyLarge,
    color: colors.textSecondary,
  },
  playerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: inset.card,
  },
  playerCard: {
    flex: 1,
    minWidth: "40%",
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    gap: inset.tight,
  },
  playerNumber: {
    ...type.bigNumber,
    color: colors.text,
  },
  playerLabel: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
});
