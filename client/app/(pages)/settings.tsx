import { PIN_STORE_KEY, useAuth } from "@/lib/auth";
import { usePlayer } from "@/lib/bootstrap/PlayerProvider";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { PlayerSelectionCard } from "@/lib/components/ui/PlayerSelectionCard";
import { SelectPicker } from "@/lib/components/ui/SelectPicker";
import * as SecureStorage from "@/lib/secureStorage";
import i18n, { LANGUAGE_STORE_KEY } from "@/lib/i18n/i18n";
import { ColorScheme } from "@/lib/theme/colors";
import { inset } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

type Language = "en" | "de";

const LANGUAGES: Language[] = ["en", "de"];
const SCHEMES: ColorScheme[] = ["light", "dark", "highContrast"];

export default function SettingsScreen() {
  const { t, i18n: i18nHook } = useTranslation(["settings"]);
  const { user, logout } = useAuth();
  const { clearPlayer } = usePlayer();
  const { colors, scheme, setScheme } = useTheme();

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
      <Text style={styles.sectionLabel}>{t("settings:appearance")}</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons
              name="color-palette-outline"
              size={20}
              color={colors.textMuted}
              style={styles.rowIcon}
            />
            <Text style={styles.rowLabel}>{t("settings:colorScheme")}</Text>
          </View>
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
          <View style={styles.rowLeft}>
            <Ionicons
              name="language-outline"
              size={20}
              color={colors.textMuted}
              style={styles.rowIcon}
            />
            <Text style={styles.rowLabel}>{t("settings:language")}</Text>
          </View>
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
              <View style={styles.rowLeft}>
                <Ionicons
                  name="nuclear-outline"
                  size={20}
                  color={colors.error}
                  style={styles.rowIcon}
                />
                <Text style={[styles.rowLabel, { color: colors.error }]}>
                  Ultimate Debug Reset
                </Text>
              </View>
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
        <Pressable style={styles.row} onPress={() => router.push("/(pages)/legal")}>
          <View style={styles.rowLeft}>
            <Ionicons
              name="document-text-outline"
              size={20}
              color={colors.textMuted}
              style={styles.rowIcon}
            />
            <Text style={styles.rowLabel}>{t("settings:legalNotice")}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: inset.screen,
      paddingTop: inset.screenTop,
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
      marginBottom: 24,
      overflow: "hidden",
    },
    cardSpaced: {
      marginBottom: 24,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 14,
    },
    rowLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    rowIcon: {
      marginRight: 12,
    },
    rowLabel: {
      ...type.body,
      color: colors.text,
    },
    rowValue: {
      ...type.bodySmall,
      color: colors.textSecondary,
      flexShrink: 1,
      textAlign: "right",
      marginLeft: 8,
    },
    rowBorderTop: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
  });
}
