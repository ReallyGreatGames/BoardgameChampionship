import { BackButton } from "@/lib/components/ui/BackButton";
import { usePlayerStore } from "@/lib/stores/appwrite/player-store";
import { useTeamStore } from "@/lib/stores/appwrite/team-store";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { Player } from "@/lib/models/player";
import { Team } from "@/lib/models/team";
import { inset } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";

type Props = {
  onConfirm: (player: Player) => void;
  onBack?: () => void;
};

function AnimatedTeamCard({
  team,
  onPress,
}: {
  team: Team;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      onPressIn={() =>
        Animated.spring(scale, {
          toValue: 0.96,
          useNativeDriver: true,
          speed: 60,
          bounciness: 0,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 30,
          bounciness: 5,
        }).start()
      }
      onPress={onPress}
    >
      <Animated.View style={[styles.teamCard, { transform: [{ scale }] }]}>
        <Text style={styles.teamCode}>{team.code}</Text>
        <View style={styles.teamInfo}>
          <Text style={styles.teamName}>{team.name}</Text>
          <Text style={styles.teamCountry}>{team.country}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

function AnimatedPlayerCard({
  player,
  onConfirm,
}: {
  player: Player;
  onConfirm: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const scale = useRef(new Animated.Value(1)).current;
  const confirmed = useRef(false);

  return (
    <Pressable
      onPressIn={() => {
        confirmed.current = false;
        Animated.spring(scale, {
          toValue: 0.9,
          useNativeDriver: true,
          speed: 60,
          bounciness: 0,
        }).start();
      }}
      onPress={() => {
        confirmed.current = true;
      }}
      onPressOut={() => {
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 22,
          bounciness: 18,
        }).start(() => {
          if (confirmed.current) {
            confirmed.current = false;
            onConfirm();
          }
        });
      }}
      style={styles.playerCardPressable}
    >
      <Animated.View style={[styles.playerCard, { transform: [{ scale }] }]}>
        <Text style={styles.playerNumber}>{player.playerNumber}</Text>
        <Text style={styles.playerLabel}>{player.name}</Text>
      </Animated.View>
    </Pressable>
  );
}

export function PlayerPickerForm({ onConfirm, onBack }: Props) {
  const [step, setStep] = useState<"team" | "player">("team");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamSearch, setTeamSearch] = useState("");
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["components"]);

  const teamStore = useTeamStore();
  const allPlayers = usePlayerStore((s) => s.collection);
  const playerStoreInitialized = usePlayerStore((s) => s.initialized);

  const filteredTeams = useMemo(() => {
    const q = teamSearch.toLowerCase().trim();
    const sorted = [...teamStore.collection].sort((a, b) =>
      a.code.localeCompare(b.code),
    );
    if (!q) return sorted;
    return sorted.filter(
      (t) =>
        t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q),
    );
  }, [teamStore.collection, teamSearch]);

  const players = useMemo(() => {
    if (!selectedTeam) return [];
    return allPlayers
      .filter((p) => {
        const teamId =
          typeof p.team === "string" ? p.team : (p.team as Team).$id;
        return teamId === selectedTeam.$id;
      })
      .sort((a, b) => a.playerNumber - b.playerNumber);
  }, [allPlayers, selectedTeam]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setStep("team");
        setSelectedTeam(null);
        setTeamSearch("");
      };
    }, []),
  );

  function handleTeamSelect(team: Team) {
    setSelectedTeam(team);
    fadeAnim.setValue(0);
    setStep("player");
  }

  useEffect(() => {
    if (step === "player") {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [step, fadeAnim]);

  if (!teamStore.initialized) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (step === "player" && selectedTeam) {
    const playerContent = () => {
      if (!playerStoreInitialized) {
        return (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        );
      }
      if (players.length === 0) {
        return (
          <View style={styles.centered}>
            <Text style={styles.errorText}>
              {t("components:playerPicker.noPlayersFound")}
            </Text>
          </View>
        );
      }

      return (
        <ScrollView
          style={styles.playerList}
          contentContainerStyle={styles.playerListContent}
        >
          {players.map((player) => (
            <AnimatedPlayerCard
              key={player.$id}
              player={player}
              onConfirm={() => {
                onConfirm({ ...player, team: selectedTeam });
                setSelectedTeam(null);
                setStep("team");
              }}
            />
          ))}
        </ScrollView>
      );
    };

    return (
      <View style={styles.container}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <BackButton onPress={() => setStep("team")} />

          <View style={styles.playerHeaderZone}>
            <Text style={styles.title}>{selectedTeam.name}</Text>
            <Text style={styles.subtitle}>
              {t("components:playerPicker.whoAreYou")}
            </Text>
          </View>

          {playerContent()}
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {onBack && <BackButton onPress={onBack} />}
      <TextInput
        style={styles.searchInput}
        value={teamSearch}
        onChangeText={setTeamSearch}
        placeholder={t("components:playerPicker.searchTeams")}
        placeholderTextColor={colors.textPlaceholder}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      >
        {filteredTeams.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>
              {teamStore.collection.length === 0
                ? t("components:playerPicker.serverError")
                : t("components:playerPicker.noTeamsFound")}
            </Text>
          </View>
        ) : (
          filteredTeams.map((team) => (
            <AnimatedTeamCard
              key={team.$id}
              team={team}
              onPress={() => handleTeamSelect(team)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: inset.screen,
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
      gap: inset.tight,
    },
    searchInput: {
      ...type.body,
      color: colors.text,
      backgroundColor: colors.surfaceHigh,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
      marginBottom: inset.list,
    },
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
    playerHeaderZone: {
      gap: 4,
      marginBottom: inset.section,
    },
    subtitle: {
      ...type.bodyLarge,
      color: colors.textSecondary,
    },
    playerList: {
      flex: 1,
    },
    playerListContent: {
      gap: inset.list,
      paddingBottom: inset.screenBottom,
    },
    playerCardPressable: {},
    playerCard: {
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
    playerNumber: {
      ...type.h2,
      color: colors.primary,
      width: 56,
      textAlign: "center",
    },
    playerLabel: {
      ...type.body,
      fontFamily: "DMSans_700Bold",
      color: colors.text,
    },
  });
}
