import { PIN_STORE_KEY, useAuth } from "@/lib/auth";
import { usePlayer, PLAYER_INFO_KEY } from "@/lib/bootstrap/PlayerProvider";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import * as SecureStorage from "@/lib/secureStorage";
import i18n, { LANGUAGE_STORE_KEY } from "@/lib/i18n/i18n";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

type Language = "en" | "de";

const LANGUAGES: Language[] = ["en", "de"];

function LanguagePicker() {
  const { t, i18n: i18nHook } = useTranslation(["settings"]);
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const current = i18nHook.language as Language;

  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <>
      <Pressable style={styles.combobox} onPress={() => setOpen(true)}>
        <Text style={styles.comboboxText}>
          {t(`settings:languages.${current}`)}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.dropdown}>
            {LANGUAGES.map((code) => {
              const active = current === code;
              return (
                <Pressable
                  key={code}
                  style={[
                    styles.dropdownItem,
                    active && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    i18n.changeLanguage(code);
                    SecureStorage.setItemAsync(LANGUAGE_STORE_KEY, code);
                    setOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      active && styles.dropdownTextActive,
                    ]}
                  >
                    {t(`settings:languages.${code}`)}
                  </Text>
                  {active && (
                    <Ionicons name="checkmark" size={16} color={colors.text} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

export default function SettingsScreen() {
  const { t } = useTranslation(["settings"]);
  const { user, logout } = useAuth();
  const { player } = usePlayer();
  const { colors, isDark, toggleTheme } = useTheme();

  const styles = useMemo(() => makeStyles(colors), [colors]);

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
            await SecureStorage.deleteItemAsync(PLAYER_INFO_KEY);
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
              name="moon-outline"
              size={20}
              color={colors.textMuted}
              style={styles.rowIcon}
            />
            <Text style={styles.rowLabel}>{t("settings:darkMode")}</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.text}
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
          <LanguagePicker />
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
          <View style={styles.card}>
            {player && (
              <>
                <View style={styles.row}>
                  <View style={styles.rowLeft}>
                    <Ionicons
                      name="shield-outline"
                      size={20}
                      color={colors.textMuted}
                      style={styles.rowIcon}
                    />
                    <Text style={styles.rowLabel}>
                      {t("settings:currentTeam")}
                    </Text>
                  </View>
                  <Text style={styles.rowValue}>{player.team.name}</Text>
                </View>
                <View style={[styles.row, styles.rowBorderTop]}>
                  <View style={styles.rowLeft}>
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color={colors.textMuted}
                      style={styles.rowIcon}
                    />
                    <Text style={styles.rowLabel}>
                      {t("settings:currentPlayer")}
                    </Text>
                  </View>
                  <Text style={styles.rowValue}>{player.playerId}</Text>
                </View>
              </>
            )}
            <Pressable
              style={[styles.row, player && styles.rowBorderTop]}
              onPress={() =>
                router.push(
                  "/(pages)/(team-player)/choose-your-character?from=settings",
                )
              }
            >
              <View style={styles.rowLeft}>
                <Ionicons
                  name="people-outline"
                  size={20}
                  color={colors.textMuted}
                  style={styles.rowIcon}
                />
                <Text style={styles.rowLabel}>{t("settings:changeTeam")}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textMuted}
              />
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 24,
      paddingTop: 64,
    },
    title: {
      fontSize: 32,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 32,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.textSecondary,
      letterSpacing: 1.5,
      textTransform: "uppercase",
      marginBottom: 8,
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
      fontSize: 16,
      color: colors.text,
    },
    rowValue: {
      fontSize: 14,
      color: colors.textSecondary,
      flexShrink: 1,
      textAlign: "right",
      marginLeft: 8,
    },
    rowBorderTop: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    // Combobox
    combobox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
    comboboxText: {
      fontSize: 14,
      color: colors.text,
    },
    // Modal dropdown
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
    },
    dropdown: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      minWidth: 180,
      overflow: "hidden",
    },
    dropdownItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    dropdownItemActive: {
      backgroundColor: colors.surfaceHigh,
    },
    dropdownText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    dropdownTextActive: {
      color: colors.text,
      fontWeight: "600",
    },
  });
}
