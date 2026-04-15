import { useAuth } from "@/lib/auth";
import { usePlayer } from "@/lib/bootstrap/PlayerProvider";
import i18n from "@/lib/i18n/i18n";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
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
  const [open, setOpen] = useState(false);
  const current = i18nHook.language as Language;

  return (
    <>
      <Pressable style={styles.combobox} onPress={() => setOpen(true)}>
        <Text style={styles.comboboxText}>
          {t(`settings:languages.${current}`)}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#888" />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.dropdown}>
            {LANGUAGES.map((code) => {
              const active = current === code;
              return (
                <Pressable
                  key={code}
                  style={[styles.dropdownItem, active && styles.dropdownItemActive]}
                  onPress={() => {
                    i18n.changeLanguage(code);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.dropdownText, active && styles.dropdownTextActive]}>
                    {t(`settings:languages.${code}`)}
                  </Text>
                  {active && <Ionicons name="checkmark" size={16} color="#fff" />}
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
  const { user } = useAuth();
  const { player } = usePlayer();

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>{t("settings:appearance")}</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons
              name="moon-outline"
              size={20}
              color="#888"
              style={styles.rowIcon}
            />
            <Text style={styles.rowLabel}>{t("settings:darkMode")}</Text>
          </View>
          <Switch
            value={true}
            onValueChange={() => {}}
            trackColor={{ false: "#333", true: "#555" }}
            thumbColor="#fff"
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
              color="#888"
              style={styles.rowIcon}
            />
            <Text style={styles.rowLabel}>{t("settings:language")}</Text>
          </View>
          <LanguagePicker />
        </View>
      </View>

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
                      color="#888"
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
                      color="#888"
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
                  color="#888"
                  style={styles.rowIcon}
                />
                <Text style={styles.rowLabel}>{t("settings:changeTeam")}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#888" />
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    padding: 24,
    paddingTop: 64,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#888",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
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
    color: "#fff",
  },
  rowValue: {
    fontSize: 14,
    color: "#888",
  },
  rowBorderTop: {
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  // Combobox
  combobox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  comboboxText: {
    fontSize: 14,
    color: "#fff",
  },
  // Modal dropdown
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdown: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
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
    backgroundColor: "#2a2a2a",
  },
  dropdownText: {
    fontSize: 16,
    color: "#888",
  },
  dropdownTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
});
