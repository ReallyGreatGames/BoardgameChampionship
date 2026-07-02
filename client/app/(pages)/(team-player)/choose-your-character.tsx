import { usePlayer } from "@/lib/bootstrap/PlayerProvider";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { PlayerPickerForm } from "@/lib/components/onboarding/PlayerPickerForm";
import { PlayerSelectionCard } from "@/lib/components/ui/PlayerSelectionCard";
import { SelectPicker } from "@/lib/components/ui/SelectPicker";
import i18n, { LANGUAGE_STORE_KEY } from "@/lib/i18n/i18n";
import { Player } from "@/lib/models/player";
import * as SecureStorage from "@/lib/secureStorage";
import { usePlayerStore } from "@/lib/stores/appwrite/player-store";
import { ColorScheme } from "@/lib/theme/colors";
import { inset } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";
import { router, useLocalSearchParams } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Language = "en" | "de";
const LANGUAGES: Language[] = ["en", "de"];
const SCHEMES: ColorScheme[] = ["light", "dark", "highContrast"];

export default function ChooseYourCharacter() {
  const { assignPlayer, player } = usePlayer();
  const { colors, scheme, setScheme } = useTheme();
  const { t, i18n: i18nHook } = useTranslation(["settings"]);
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

  if (pickerVisible) {
    return (
      <>
        <Drawer.Screen
          options={{ swipeEnabled: false, headerLeft: () => null }}
        />
        <PlayerPickerForm
          onConfirm={handleConfirm}
          onBack={
            isSetupFlow ? () => setPickerVisible(false) : () => router.back()
          }
        />
      </>
    );
  }

  return (
    <>
      <Drawer.Screen
        options={{ swipeEnabled: false, headerLeft: () => null }}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
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
        <PlayerSelectionCard onPress={() => setPickerVisible(true)} />

        <Pressable
          style={[
            styles.continueBtn,
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
    </>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    scroll: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: inset.screen,
      paddingTop: inset.screenTop,
      paddingBottom: inset.screenBottom,
      gap: 8,
    },
    sectionLabel: {
      ...type.eyebrow,
      color: colors.textSecondary,
      marginBottom: inset.tight,
      marginLeft: 4,
      marginTop: 8,
    },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 14,
    },
    rowLabel: {
      ...type.body,
      color: colors.text,
    },
    continueBtn: {
      marginTop: 16,
      backgroundColor: colors.primary,
      borderRadius: 10,
      padding: 16,
      alignItems: "center",
    },
    continueBtnDisabled: {
      opacity: 0.4,
    },
    continueBtnLabel: {
      ...type.body,
      fontFamily: "DMSans_700Bold",
      color: "#fff",
    },
  });
}
