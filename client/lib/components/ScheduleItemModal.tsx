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
import { Models } from "react-native-appwrite";
import { useTheme } from "../bootstrap/ThemeProvider";
import { Schedule } from "../models/schedule";
import { inset } from "../theme/spacing";
import { type } from "../theme/typography";

type ScheduleIconEntry = { name: string; translationKey: string };

const SCHEDULE_ICONS: ScheduleIconEntry[] = [
  { name: "trophy-outline", translationKey: "trophy" },
  { name: "dice-outline", translationKey: "dice" },
  { name: "pause-circle-outline", translationKey: "break" },
  { name: "information-circle-outline", translationKey: "info" },
  { name: "document-outline", translationKey: "document" },
];

export type ScheduleFormData = Omit<Schedule, keyof Models.Document>;

type Props = {
  visible: boolean;
  /** undefined = add mode, defined = edit mode */
  item?: Schedule;
  nextSortIndex: number;
  onClose: () => void;
  /** Resolves on success, throws on failure */
  onSave: (data: ScheduleFormData) => Promise<void>;
};


function isValidTime(v: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(v)) return false;
  const [h, m] = v.split(":").map(Number);
  return h < 24 && m < 60;
}

function isValidDuration(v: string): boolean {
  const n = parseInt(v, 10);
  return !isNaN(n) && n > 0;
}


function FormField({
  icon,
  label,
  required,
  error,
  children,
}: {
  icon: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => fieldStyles(colors), [colors]);
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Ionicons name={icon as any} size={13} color={colors.textMuted} />
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      </View>
      {children}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function fieldStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    field: { gap: 6 },
    labelRow: { flexDirection: "row", alignItems: "center", gap: 5 },
    label: { ...type.caption, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
    required: { color: colors.error },
    error: { ...type.caption, color: colors.error },
  });
}

function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => iconPickerStyles(colors), [colors]);
  const { t } = useTranslation(["components"]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {SCHEDULE_ICONS.map((icon) => {
        const selected = value === icon.name;
        return (
          <TouchableOpacity
            key={icon.name}
            style={[styles.chip, selected && styles.chipSelected]}
            onPress={() => onChange(icon.name)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={icon.name as any}
              size={22}
              color={selected ? colors.accent : colors.textMuted}
            />
            <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
              {t(`schedule.form.icons.${icon.translationKey}`)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function iconPickerStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    row: { flexDirection: "row", gap: inset.tight, paddingVertical: 2 },
    chip: { alignItems: "center", gap: 4, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.surfaceHigh, minWidth: 68 },
    chipSelected: { borderColor: colors.accent, backgroundColor: colors.surface },
    chipLabel: { ...type.caption, color: colors.textMuted },
    chipLabelSelected: { color: colors.accent },
  });
}


export function ScheduleItemModal({ visible, item, nextSortIndex, onClose, onSave }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["components"]);

  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [gameId, setGameId] = useState("");
  const [saving, setSaving] = useState(false);
  const [timeBlurred, setTimeBlurred] = useState(false);
  const [durBlurred, setDurBlurred] = useState(false);

  // Sync state from item when modal opens
  useEffect(() => {
    if (!visible) return;
    if (item) {
      setTitle(item.title);
      setIcon(item.icon ?? "");
      setStartTime(item.startTimePlanned);
      setDuration(String(item.durationPlanned));
      setDescription(item.description ?? "");
      setGameId(item.gameId ?? "");
    } else {
      setTitle("");
      setIcon("");
      setStartTime("");
      setDuration("");
      setDescription("");
      setGameId("");
    }
    setSaving(false);
    setTimeBlurred(false);
    setDurBlurred(false);
  }, [visible, item]);

  const timeValid = isValidTime(startTime);
  const durValid = isValidDuration(duration);
  const isValid = title.trim().length > 0 && icon !== "" && timeValid && durValid;

  async function handleSave() {
    if (!isValid || saving) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        icon,
        startTimePlanned: startTime,
        durationPlanned: parseInt(duration, 10),
        description: description.trim() || undefined,
        gameId: gameId.trim() || undefined,
        sortIndex: item ? item.sortIndex : nextSortIndex,
        isActive: item ? item.isActive : false,
        isFinished: item ? item.isFinished : false,
      });
      onClose();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {item ? t("schedule.form.editTitle") : t("schedule.form.addTitle")}
            </Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <FormField
              icon="text-outline"
              label={t("schedule.form.titleField")}
              required
            >
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder={t("schedule.form.titlePlaceholder")}
                placeholderTextColor={colors.textPlaceholder}
              />
            </FormField>

            {/* Icon */}
            <FormField
              icon="shapes-outline"
              label={t("schedule.form.iconField")}
              required
            >
              <IconPicker value={icon} onChange={setIcon} />
            </FormField>

            {/* Start time */}
            <FormField
              icon="time-outline"
              label={t("schedule.form.startTimeField")}
              required
              error={timeBlurred && startTime !== "" && !timeValid ? t("schedule.form.validationStartTime") : undefined}
            >
              <TextInput
                style={[styles.input, timeBlurred && startTime !== "" && !timeValid && styles.inputError]}
                value={startTime}
                onChangeText={(v) => { setStartTime(v); if (timeBlurred && isValidTime(v)) setTimeBlurred(false); }}
                onBlur={() => setTimeBlurred(true)}
                placeholder={t("schedule.form.startTimePlaceholder")}
                placeholderTextColor={colors.textPlaceholder}
                keyboardType="numbers-and-punctuation"
              />
            </FormField>

            {/* Duration */}
            <FormField
              icon="hourglass-outline"
              label={t("schedule.form.durationField")}
              required
              error={durBlurred && duration !== "" && !durValid ? t("schedule.form.validationDuration") : undefined}
            >
              <TextInput
                style={[styles.input, durBlurred && duration !== "" && !durValid && styles.inputError]}
                value={duration}
                onChangeText={(v) => { setDuration(v); if (durBlurred && isValidDuration(v)) setDurBlurred(false); }}
                onBlur={() => setDurBlurred(true)}
                placeholder={t("schedule.form.durationPlaceholder")}
                placeholderTextColor={colors.textPlaceholder}
                keyboardType="number-pad"
              />
            </FormField>

            {/* Description (optional) */}
            <FormField
              icon="document-text-outline"
              label={t("schedule.form.descriptionField")}
            >
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={description}
                onChangeText={setDescription}
                placeholder={t("schedule.form.descriptionPlaceholder")}
                placeholderTextColor={colors.textPlaceholder}
                multiline
                numberOfLines={3}
              />
            </FormField>

            {/* Game ID (optional) */}
            <FormField
              icon="game-controller-outline"
              label={t("schedule.form.gameIdField")}
            >
              <TextInput
                style={styles.input}
                value={gameId}
                onChangeText={setGameId}
                placeholder={t("schedule.form.gameIdPlaceholder")}
                placeholderTextColor={colors.textPlaceholder}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </FormField>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.actionBtns}>
              <TouchableOpacity
                style={[styles.actionBtn, !item && styles.actionBtnDisabled]}
                disabled={!item}
              >
                <Ionicons name="timer-outline" size={16} color={!item ? colors.textMuted : colors.text} />
                <Text style={[styles.actionBtnText, !item && styles.actionBtnTextDisabled]}>
                  {t("schedule.form.actionTimer")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, !item && styles.actionBtnDisabled]}
                disabled={!item}
              >
                <Ionicons name="list-outline" size={16} color={!item ? colors.textMuted : colors.text} />
                <Text style={[styles.actionBtnText, !item && styles.actionBtnTextDisabled]}>
                  {t("schedule.form.actionRules")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, !item && styles.actionBtnDisabled]}
                disabled={!item}
              >
                <Ionicons name="gift-outline" size={16} color={!item ? colors.textMuted : colors.text} />
                <Text style={[styles.actionBtnText, !item && styles.actionBtnTextDisabled]}>
                  {t("schedule.form.actionLotteries")}
                </Text>
              </TouchableOpacity>
            </View>
            <Pressable
              style={[styles.saveBtn, (!isValid || saving) && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!isValid || saving}
            >
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.saveBtnText}>{t("schedule.form.save")}</Text>
              }
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
    inputMultiline: {
      minHeight: 72,
      textAlignVertical: "top",
      paddingTop: 10,
    },
    footer: {
      padding: inset.card,
      gap: inset.tight,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    actionBtns: {
      flexDirection: "row",
      gap: inset.tight,
      marginBottom: inset.tight,
    },
    actionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      backgroundColor: colors.accent,
    },
    actionBtnDisabled: {
      opacity: 0.35,
    },
    actionBtnText: {
      ...type.caption,
      color: colors.text,
      textAlign: "center",
    },
    actionBtnTextDisabled: {
      color: colors.textMuted,
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
