import { PIN_STORE_KEY, useAuth } from "@/lib/auth";
import { usePlayer } from "@/lib/bootstrap/PlayerProvider";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { useTournament } from "@/lib/bootstrap/TournamentProvider";
import { GameHeader } from "@/lib/components/game/GameHeader";
import { BackButton } from "@/lib/components/ui/BackButton";
import { PlayerSelectionCard } from "@/lib/components/ui/PlayerSelectionCard";
import { SelectPicker } from "@/lib/components/ui/SelectPicker";
import * as SecureStorage from "@/lib/secureStorage";
import i18n, { LANGUAGE_STORE_KEY } from "@/lib/i18n/i18n";
import { ColorScheme } from "@/lib/theme/colors";
import { inset, space } from "@/lib/theme/spacing";
import { fonts, type } from "@/lib/theme/typography";
import { goBackTo, goTo } from "@/lib/utils/navigation";
import { Ionicons } from "@expo/vector-icons";
import { router, useNavigation } from "expo-router";
import { DrawerActions } from "expo-router/react-navigation";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Language = "en" | "de";

const LANGUAGES: Language[] = ["en", "de"];
const SCHEMES: ColorScheme[] = ["light", "dark", "oled", "highContrast"];

export default function SettingsScreen() {
  const { t, i18n: i18nHook } = useTranslation(["settings", "menu", "login"]);
  const { user, logout } = useAuth();
  const { player, clearPlayer } = usePlayer();
  const { type: tournamentType } = useTournament();
  const { colors, scheme, setScheme } = useTheme();
  const navigation = useNavigation();

  const styles = useMemo(() => makeStyles(colors), [colors]);

  const schemeOptions = useMemo(
    () => SCHEMES.map((s) => ({ value: s, label: t(`settings:schemes.${s}`) })),
    [t],
  );
  const languageOptions = useMemo(
    () =>
      LANGUAGES.map((l) => ({ value: l, label: t(`settings:languages.${l}`) })),
    [t],
  );

  const openMenu = useCallback(
    () => navigation.dispatch(DrawerActions.openDrawer()),
    [navigation],
  );

  const subtitle = player
    ? `${player.name} · ${player.team.name}`
    : t(`menu:${tournamentType}`);

  async function handleLogout() {
    await logout();
    router.replace("/(pages)/login");
  }

  async function handleDebugReset() {
    Alert.alert(
      "Ultimate Debug Reset",
      "This will wipe all local storage and log you out. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Nuke it",
          style: "destructive",
          onPress: async () => {
            await clearPlayer();
            await SecureStorage.deleteItemAsync(PIN_STORE_KEY);
            if (user) {
              await logout();
            }
          },
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      <GameHeader
        title={t("settings:title")}
        round={null}
        tableNumber={null}
        subtitle={subtitle}
        onMenuPress={openMenu}
      />

      <View style={styles.backButton}>
        <BackButton onPress={() => goBackTo("/")} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>{t("settings:appearance")}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t("settings:colorScheme")}</Text>
            <SelectPicker
              value={scheme}
              options={schemeOptions}
              onChange={setScheme}
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>{t("settings:language")}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t("settings:language")}</Text>
            <SelectPicker
              value={i18nHook.language as Language}
              options={languageOptions}
              onChange={(v) => {
                i18n.changeLanguage(v);
                SecureStorage.setItemAsync(LANGUAGE_STORE_KEY, v);
              }}
            />
          </View>
        </View>

        {__DEV__ && (
          <>
            <Text style={styles.sectionLabel}>Debug</Text>
            <View style={styles.card}>
              <Pressable style={styles.row} onPress={handleDebugReset}>
                <Text style={[styles.rowLabel, { color: colors.error }]}>
                  Ultimate Debug Reset
                </Text>
              </Pressable>
            </View>
          </>
        )}

        {user && (
          <>
            <Text style={styles.sectionLabel}>{t("settings:account")}</Text>
            <View style={styles.cardSpaced}>
              <PlayerSelectionCard from="settings" />
            </View>
          </>
        )}

        <Text style={styles.sectionLabel}>{t("settings:legal")}</Text>
        <View style={styles.card}>
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => goTo("/settings", "/(pages)/legal")}
          >
            <Text style={styles.rowLabel}>{t("settings:legalNotice")}</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
        </View>

        {user && (
          <Pressable
            style={({ pressed }) => [
              styles.logout,
              pressed && styles.logoutPressed,
            ]}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>{t("login:logout")}</Text>
          </Pressable>
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
    },
    backButton: {
      paddingHorizontal: inset.card,
      paddingTop: inset.card,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: inset.card,
      paddingTop: space[2],
      paddingBottom: inset.group,
    },
    sectionLabel: {
      ...type.eyebrow,
      color: colors.textSecondary,
      marginBottom: inset.tight,
      marginLeft: 4,
    },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      marginBottom: inset.card,
      overflow: "hidden",
    },
    cardSpaced: {
      marginBottom: inset.card,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: space[3],
      minHeight: 44,
      padding: 14,
    },
    rowPressed: {
      backgroundColor: colors.surfaceHigh,
    },
    rowLabel: {
      ...type.body,
      color: colors.text,
    },
    logout: {
      marginTop: space[2],
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
      padding: 14,
      borderWidth: 1,
      borderColor: `${colors.error}66`,
      borderRadius: 10,
    },
    logoutPressed: {
      backgroundColor: `${colors.error}14`,
    },
    logoutText: {
      ...type.body,
      fontFamily: fonts.bodyMedium,
      color: colors.error,
    },
  });
}
