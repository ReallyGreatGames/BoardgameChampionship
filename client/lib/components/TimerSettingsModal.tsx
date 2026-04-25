import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../bootstrap/ThemeProvider";
import { useTimerSettingsStore } from "../stores/appwrite/timer-settings-store";
import { inset } from "../theme/spacing";
import { type } from "../theme/typography";

type Props = {
  visible: boolean;
  gameId: string | null;
  onClose: () => void;
  /** Called when a new TimerSettings doc was created so the caller can update the linked gameId */
  onCreated?: (newGameId: string) => void;
};

export function TimerSettingsModal({ visible, gameId, onClose, onCreated }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["components"]);
  const { collection, add, update } = useTimerSettingsStore();

  const existing = useMemo(
    () => (gameId ? collection.find((s) => s.$id === gameId) : undefined),
    [collection, gameId],
  );

  const [duration, setDuration] = useState("");
  const [direction, setDirection] = useState<"up" | "down">("down");
  const [saving, setSaving] = useState(false);
  const [durBlurred, setDurBlurred] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (existing) {
      setDuration(String(existing.durationMinutesTotal));
      setDirection(existing.direction);
    } else {
      setDuration("");
      setDirection("down");
    }
    setSaving(false);
    setDurBlurred(false);
  }, [visible, existing]);

  const durNum = parseInt(duration, 10);
  const durValid = !isNaN(durNum) && durNum > 0;
  const isValid = durValid;

  async function handleSave() {
    if (!isValid || saving) return;
    setSaving(true);
    try {
      const data = {
        durationMinutesTotal: durNum,
        direction,
      };
      if (existing) {
        const ok = await update({ $id: existing.$id, ...data });
        if (!ok) throw new Error();
      } else {
        const doc = await add(data);
        if (!doc) throw new Error();
        onCreated?.(doc.$id);
      }
      onClose();
    } catch {
      Alert.alert("Error", "Failed to save timer settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {existing
                ? t("timerSettingsModal.editTitle")
                : t("timerSettingsModal.addTitle")}
            </Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Ionicons name="hourglass-outline" size={13} color={colors.textMuted} />
                <Text style={styles.label}>{t("timerSettingsModal.durationField")}</Text>
              </View>
              <TextInput
                style={[
                  styles.input,
                  durBlurred && duration !== "" && !durValid && styles.inputError,
                ]}
                value={duration}
                onChangeText={(v) => {
                  setDuration(v);
                  if (durBlurred) {
                    const n = parseInt(v, 10);
                    if (!isNaN(n) && n > 0) setDurBlurred(false);
                  }
                }}
                onBlur={() => setDurBlurred(true)}
                placeholder={t("timerSettingsModal.durationPlaceholder")}
                placeholderTextColor={colors.textPlaceholder}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Ionicons name="swap-vertical-outline" size={13} color={colors.textMuted} />
                <Text style={styles.label}>{t("timerSettingsModal.directionField")}</Text>
              </View>
              <View style={styles.dirRow}>
                <TouchableOpacity
                  style={[styles.dirBtn, direction === "down" && styles.dirBtnSelected]}
                  onPress={() => setDirection("down")}
                >
                  <Ionicons
                    name="arrow-down"
                    size={16}
                    color={direction === "down" ? colors.accent : colors.textMuted}
                  />
                  <Text style={[styles.dirBtnText, direction === "down" && styles.dirBtnTextSelected]}>
                    {t("timerSettingsModal.directionDown")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dirBtn, direction === "up" && styles.dirBtnSelected]}
                  onPress={() => setDirection("up")}
                >
                  <Ionicons
                    name="arrow-up"
                    size={16}
                    color={direction === "up" ? colors.accent : colors.textMuted}
                  />
                  <Text style={[styles.dirBtnText, direction === "up" && styles.dirBtnTextSelected]}>
                    {t("timerSettingsModal.directionUp")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={[styles.saveBtn, (!isValid || saving) && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!isValid || saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>{t("timerSettingsModal.save")}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.6)",
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: colors.border,
      maxHeight: "90%",
    },
    sheetHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: inset.card,
      paddingTop: inset.card,
      paddingBottom: inset.tight,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    sheetTitle: {
      ...type.h3,
      color: colors.text,
    },
    closeBtn: {
      padding: 6,
      borderRadius: 8,
    },
    scroll: {
      flexGrow: 0,
    },
    scrollContent: {
      padding: inset.card,
      gap: inset.group,
    },
    field: { gap: 6 },
    labelRow: { flexDirection: "row", alignItems: "center", gap: 5 },
    label: {
      ...type.caption,
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    input: {
      ...type.body,
      color: colors.text,
      backgroundColor: colors.surfaceHigh,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: inset.card,
    },
    inputError: {
      borderColor: colors.error,
    },
    dirRow: {
      flexDirection: "row",
      gap: inset.tight,
    },
    dirBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      backgroundColor: colors.surfaceHigh,
    },
    dirBtnSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.surface,
    },
    dirBtnText: {
      ...type.caption,
      color: colors.textMuted,
    },
    dirBtnTextSelected: {
      color: colors.accent,
    },
    footer: {
      padding: inset.card,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    saveBtn: {
      backgroundColor: colors.accent,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: "center",
    },
    saveBtnDisabled: {
      opacity: 0.4,
    },
    saveBtnText: {
      ...type.button,
      color: colors.text,
    },
  });
}
