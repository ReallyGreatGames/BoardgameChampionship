import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
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
import { BottomSheet, makeSheetStyles } from "./BottomSheet";
import { FormField } from "./FormField";

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
  item?: Schedule;
  nextSortIndex: number;
  onClose: () => void;
  onTimer?: (gameId: string) => void;
  onSave: (data: ScheduleFormData) => Promise<void>;
  onRules?: (gameId: string) => void;
};

function isValidTime(v: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(v)) {
    return false;
  }
  const [h, m] = v.split(":").map(Number);
  return h < 24 && m < 60;
}

function isValidDuration(v: string): boolean {
  const n = parseInt(v, 10);
  return !isNaN(n) && n > 0;
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
            <Text
              style={[styles.chipLabel, selected && styles.chipLabelSelected]}
            >
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
    chip: {
      alignItems: "center",
      gap: 4,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      backgroundColor: colors.surfaceHigh,
      minWidth: 68,
    },
    chipSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.surface,
    },
    chipLabel: { ...type.caption, color: colors.textMuted },
    chipLabelSelected: { color: colors.accent },
  });
}

export function ScheduleItemModal({
  visible,
  item,
  nextSortIndex,
  onClose,
  onSave,
  onRules,
  onTimer,
}: Props) {
  const { colors } = useTheme();
  const sheetStyles = useMemo(() => makeSheetStyles(colors), [colors]);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["components"]);

  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [gameId, setGameId] = useState("");
  const [allowUserChange, setAllowUserChange] = useState(false);
  const [saving, setSaving] = useState(false);
  const [timeBlurred, setTimeBlurred] = useState(false);
  const [durBlurred, setDurBlurred] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
    if (item) {
      setTitle(item.title);
      setIcon(item.icon ?? "");
      setStartTime(item.startTimePlanned);
      setDuration(String(item.durationPlanned));
      setDescription(item.description ?? "");
      setGameId(item.gameId ?? "");
      setAllowUserChange(item.allowUserChange ?? false);
    } else {
      setTitle("");
      setIcon("");
      setStartTime("");
      setDuration("");
      setDescription("");
      setGameId("");
      setAllowUserChange(false);
    }
    setSaving(false);
    setTimeBlurred(false);
    setDurBlurred(false);
  }, [visible, item]);

  const timeValid = isValidTime(startTime);
  const durValid = isValidDuration(duration);
  const isValid =
    title.trim().length > 0 && icon !== "" && timeValid && durValid;

  async function handleSave() {
    if (!isValid || saving) {
      return;
    }
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
        allowUserChange: item ? item.allowUserChange : false,
      });
      onClose();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={item ? t("schedule.form.editTitle") : t("schedule.form.addTitle")}
      footer={
        <>
          <View style={styles.actionBtns}>
            <TouchableOpacity
              style={[styles.actionBtn, !item && styles.actionBtnDisabled]}
              disabled={!item}
              onPress={() => item?.gameId && onTimer?.(item.gameId)}
            >
              <Ionicons
                name="timer-outline"
                size={16}
                color={!item ? colors.textMuted : colors.text}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  !item && styles.actionBtnTextDisabled,
                ]}
              >
                {t("schedule.form.actionTimer")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                (!item?.gameId || !onRules) && styles.actionBtnDisabled,
              ]}
              disabled={!item?.gameId || !onRules}
              onPress={() => item?.gameId && onRules?.(item.gameId)}
            >
              <Ionicons
                name="list-outline"
                size={16}
                color={
                  !item?.gameId || !onRules ? colors.textMuted : colors.text
                }
              />
              <Text
                style={[
                  styles.actionBtnText,
                  (!item?.gameId || !onRules) && styles.actionBtnTextDisabled,
                ]}
              >
                {t("schedule.form.actionRules")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, !item && styles.actionBtnDisabled]}
              disabled={!item}
            >
              <Ionicons
                name="gift-outline"
                size={16}
                color={!item ? colors.textMuted : colors.text}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  !item && styles.actionBtnTextDisabled,
                ]}
              >
                {t("schedule.form.actionLotteries")}
              </Text>
            </TouchableOpacity>
          </View>
          <Pressable
            style={[
              sheetStyles.saveBtn,
              (!isValid || saving) && sheetStyles.saveBtnDisabled,
            ]}
            onPress={handleSave}
            disabled={!isValid || saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.onAccent} />
            ) : (
              <Text style={sheetStyles.saveBtnText}>
                {t("schedule.form.save")}
              </Text>
            )}
          </Pressable>
        </>
      }
    >
      <FormField
        icon="text-outline"
        label={t("schedule.form.titleField")}
        required
      >
        <TextInput
          style={sheetStyles.input}
          value={title}
          onChangeText={setTitle}
          placeholder={t("schedule.form.titlePlaceholder")}
          placeholderTextColor={colors.textPlaceholder}
        />
      </FormField>

      <FormField
        icon="shapes-outline"
        label={t("schedule.form.iconField")}
        required
      >
        <IconPicker value={icon} onChange={setIcon} />
      </FormField>

      <FormField
        icon="time-outline"
        label={t("schedule.form.startTimeField")}
        required
        error={
          timeBlurred && startTime !== "" && !timeValid
            ? t("schedule.form.validationStartTime")
            : undefined
        }
      >
        <TextInput
          style={[
            sheetStyles.input,
            timeBlurred &&
              startTime !== "" &&
              !timeValid &&
              sheetStyles.inputError,
          ]}
          value={startTime}
          onChangeText={(v) => {
            setStartTime(v);
            if (timeBlurred && isValidTime(v)) {
              setTimeBlurred(false);
            }
          }}
          onBlur={() => setTimeBlurred(true)}
          placeholder={t("schedule.form.startTimePlaceholder")}
          placeholderTextColor={colors.textPlaceholder}
          keyboardType="numbers-and-punctuation"
        />
      </FormField>

      <FormField
        icon="hourglass-outline"
        label={t("schedule.form.durationField")}
        required
        error={
          durBlurred && duration !== "" && !durValid
            ? t("schedule.form.validationDuration")
            : undefined
        }
      >
        <TextInput
          style={[
            sheetStyles.input,
            durBlurred &&
              duration !== "" &&
              !durValid &&
              sheetStyles.inputError,
          ]}
          value={duration}
          onChangeText={(v) => {
            setDuration(v);
            if (durBlurred && isValidDuration(v)) {
              setDurBlurred(false);
            }
          }}
          onBlur={() => setDurBlurred(true)}
          placeholder={t("schedule.form.durationPlaceholder")}
          placeholderTextColor={colors.textPlaceholder}
          keyboardType="number-pad"
        />
      </FormField>

      <FormField
        icon="document-text-outline"
        label={t("schedule.form.descriptionField")}
      >
        <TextInput
          style={[sheetStyles.input, sheetStyles.inputMultiline]}
          value={description}
          onChangeText={setDescription}
          placeholder={t("schedule.form.descriptionPlaceholder")}
          placeholderTextColor={colors.textPlaceholder}
          multiline
          numberOfLines={3}
        />
      </FormField>

      <FormField
        icon="game-controller-outline"
        label={t("schedule.form.gameIdField")}
      >
        <TextInput
          style={sheetStyles.input}
          value={gameId}
          onChangeText={setGameId}
          placeholder={t("schedule.form.gameIdPlaceholder")}
          placeholderTextColor={colors.textPlaceholder}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </FormField>

      <FormField
        icon="people-outline"
        label={t("schedule.form.allowUserChangeField")}
      >
        <Switch
          value={allowUserChange}
          onValueChange={setAllowUserChange}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.text}
        />
      </FormField>
    </BottomSheet>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
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
  });
}
