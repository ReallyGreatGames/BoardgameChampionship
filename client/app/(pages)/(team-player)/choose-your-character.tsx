import { usePlayer } from "@/lib/bootstrap/PlayerProvider";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { useTournament } from "@/lib/bootstrap/TournamentProvider";
import { GameHeader } from "@/lib/components/game/GameHeader";
import { PlayerPickerForm } from "@/lib/components/onboarding/PlayerPickerForm";
import { PlayerSelectionCard } from "@/lib/components/ui/PlayerSelectionCard";
import { SelectPicker } from "@/lib/components/ui/SelectPicker";
import i18n, { LANGUAGE_STORE_KEY } from "@/lib/i18n/i18n";
import { Player } from "@/lib/models/player";
import * as SecureStorage from "@/lib/secureStorage";
import { usePlayerStore } from "@/lib/stores/appwrite/player-store";
import { ColorScheme } from "@/lib/theme/colors";
import { inset, space } from "@/lib/theme/spacing";
import { fonts, type } from "@/lib/theme/typography";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { DrawerActions } from "expo-router/react-navigation";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Language = "en" | "de";
const LANGUAGES: Language[] = ["en", "de"];
const SCHEMES: ColorScheme[] = ["light", "dark", "oled", "highContrast"];

export default function ChooseYourCharacter() {
  const { assignPlayer, player } = usePlayer();
  const { colors, scheme, setScheme } = useTheme();
  const { type: tournamentType } = useTournament();
  const { t, i18n: i18nHook } = useTranslation(["settings", "menu"]);
  const navigation = useNavigation();
  const { from, gameId } = useLocalSearchParams<{
    from?: string;
    gameId?: string;
  }>();

  const playerStoreCollection = usePlayerStore((s) => s.collection);
  const playerStoreInitialized = usePlayerStore((s) => s.initialized);

  const isSetupFlow = !from;
  const [pickerVisible, setPickerVisible] = useState(!isSetupFlow);

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

  const canContinue =
    !playerStoreInitialized ||
    playerStoreCollection.length === 0 ||
    player !== null;

  async function handleConfirm(selectedPlayer: Player) {
    await assignPlayer(selectedPlayer);
    if (from === "game" && gameId) {
      router.replace({
        pathname: "/(pages)/(user)/game",
        params: { gameId },
      });
    } else if (from === "settings") {
      router.back();
    } else {
      setPickerVisible(false);
    }
  }

  const header = (
    <GameHeader
      title={t("menu:entries.chooseYourCharacter")}
      round={null}
      tableNumber={null}
      subtitle={subtitle}
      onMenuPress={openMenu}
    />
  );

  if (pickerVisible) {
    return (
      <View style={styles.container}>
        <Drawer.Screen options={{ swipeEnabled: false }} />
        {header}
        <View style={styles.pickerWrap}>
          <PlayerPickerForm
            onConfirm={handleConfirm}
            onBack={
              isSetupFlow ? () => setPickerVisible(false) : () => router.back()
            }
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Drawer.Screen options={{ swipeEnabled: false }} />
      {header}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
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

        <Text style={styles.sectionLabel}>{t("settings:account")}</Text>
        <View style={styles.cardSpaced}>
          <PlayerSelectionCard onPress={() => setPickerVisible(true)} />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.continueBtn,
            pressed && styles.continueBtnPressed,
            !canContinue && styles.continueBtnDisabled,
          ]}
          onPress={() => router.replace("/(pages)/(user)/schedule")}
          disabled={!canContinue}
        >
          <Text style={styles.continueBtnLabel}>
            {t("settings:continueSetup")}
          </Text>
        </Pressable>
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
    pickerWrap: {
      flex: 1,
      paddingTop: inset.card,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: inset.card,
      paddingTop: inset.card,
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
    rowLabel: {
      ...type.body,
      color: colors.text,
    },
    continueBtn: {
      marginTop: space[2],
      minHeight: 44,
      backgroundColor: colors.primary,
      borderRadius: 10,
      padding: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    continueBtnPressed: {
      opacity: 0.85,
    },
    continueBtnDisabled: {
      opacity: 0.4,
    },
    continueBtnLabel: {
      ...type.body,
      fontFamily: fonts.bodyBold,
      color: colors.onAccent,
    },
  });
}
