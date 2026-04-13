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
        <ActivityIndicator size="large" color="#fff" />
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
        <Text style={styles.title}>{selectedTeam.name}</Text>
        <Text style={styles.subtitle}>Who are you?</Text>
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
      <Text style={styles.title}>Choose Your Team</Text>
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {teams?.map((team) => (
          <Pressable
            key={team.code}
            style={styles.teamCard}
            onPress={() => handleTeamSelect(team)}
          >
            <Text style={styles.teamCode}>{team.code}</Text>
            <View>
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
    backgroundColor: "#0f0f0f",
    padding: 32,
    paddingTop: 64,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f0f0f",
  },
  back: {
    color: "#888",
    fontSize: 14,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    marginBottom: 32,
  },
  errorText: {
    color: "#ff4444",
    fontSize: 16,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 12,
    paddingBottom: 32,
  },
  teamCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    padding: 16,
  },
  teamCode: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    width: 48,
    textAlign: "center",
  },
  teamName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  teamCountry: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  playerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  playerCard: {
    flex: 1,
    minWidth: "40%",
    aspectRatio: 1,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  playerNumber: {
    fontSize: 48,
    fontWeight: "700",
    color: "#fff",
  },
  playerLabel: {
    fontSize: 14,
    color: "#888",
  },
});
