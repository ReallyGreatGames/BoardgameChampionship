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
import { Rule, RuleType } from "../models/rule";
import { inset } from "../theme/spacing";
import { type } from "../theme/typography";

export type RuleFormData = Omit<Rule, keyof Models.Document>;

type Props = {
  visible: boolean;
  item?: Rule;
  gameId: string;
  onClose: () => void;
  onSave: (data: RuleFormData) => Promise<void>;
};

type TypeConfig = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  labelKey: string;
};

const TYPE_CONFIGS: Record<RuleType, TypeConfig> = {
  change: { icon: "swap-horizontal-outline", labelKey: "types.change" },
  addition: { icon: "add-circle-outline", labelKey: "types.addition" },
  clarification: { icon: "information-circle-outline", labelKey: "types.clarification" },
};

const RULE_TYPES: RuleType[] = ["change", "addition", "clarification"];

function FormField({
  icon,
  label,
  required,
  children,
}: {
  icon: string;
  label: string;
  required?: boolean;
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
    </View>
  );
}

function fieldStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    field: { gap: 6 },
    labelRow: { flexDirection: "row", alignItems: "center", gap: 5 },
    label: { ...type.caption, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
    required: { color: colors.error },
  });
}

export function RuleModal({ visible, item, gameId, onClose, onSave }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["rules"]);

  const [selectedType, setSelectedType] = useState<RuleType>("change");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (item) {
      setSelectedType(item.type);
      setTitle(item.title);
      setText(item.text);
    } else {
      setSelectedType("change");
      setTitle("");
      setText("");
    }
    setSaving(false);
  }, [visible, item]);

  const isValid = title.trim().length > 0 && text.trim().length > 0;

  async function handleSave() {
    if (!isValid || saving) return;
    setSaving(true);
    try {
      await onSave({ gameId, type: selectedType, title: title.trim(), text: text.trim() });
      onClose();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to save.");
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
              {item ? t("form.editTitle") : t("form.addTitle")}
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
            <FormField icon="text-outline" label={t("form.titleField")} required>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder={t("form.titlePlaceholder")}
                placeholderTextColor={colors.textPlaceholder}
              />
            </FormField>

            <FormField icon="options-outline" label={t("form.typeField")} required>
              <View style={styles.typeRow}>
                {RULE_TYPES.map((ruleType) => {
                  const cfg = TYPE_CONFIGS[ruleType];
                  const selected = selectedType === ruleType;
                  const color = typeColor(ruleType, colors);
                  return (
                    <TouchableOpacity
                      key={ruleType}
                      style={[styles.typeChip, selected && { borderColor: color, backgroundColor: color + "18" }]}
                      onPress={() => setSelectedType(ruleType)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={cfg.icon}
                        size={18}
                        color={selected ? color : colors.textMuted}
                      />
                      <Text style={[styles.typeChipLabel, selected && { color }]}>
                        {t(cfg.labelKey)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </FormField>

            <FormField icon="document-text-outline" label={t("form.textField")} required>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={text}
                onChangeText={setText}
                placeholder={t("form.textPlaceholder")}
                placeholderTextColor={colors.textPlaceholder}
                multiline
                numberOfLines={4}
              />
            </FormField>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={[styles.saveBtn, (!isValid || saving) && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!isValid || saving}
            >
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.saveBtnText}>{t("form.save")}</Text>
              }
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function typeColor(
  ruleType: RuleType,
  colors: ReturnType<typeof useTheme>["colors"],
): string {
  switch (ruleType) {
    case "change": return colors.accent;
    case "addition": return colors.success;
    case "clarification": return colors.primary;
  }
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    overlay: { flex: 1, justifyContent: "flex-end" },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
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
    sheetTitle: { ...type.h3, color: colors.text },
    closeBtn: { padding: 6, borderRadius: 8 },
    scroll: { flexGrow: 0 },
    scrollContent: { padding: inset.card, gap: inset.group },
    typeRow: { flexDirection: "row", gap: inset.tight, flexWrap: "wrap" },
    typeChip: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      backgroundColor: colors.surfaceHigh,
      minWidth: 90,
    },
    typeChipLabel: { ...type.caption, color: colors.textMuted, textAlign: "center" },
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
    inputMultiline: { minHeight: 96, textAlignVertical: "top", paddingTop: 10 },
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
    saveBtnDisabled: { opacity: 0.4 },
    saveBtnText: { ...type.button, color: "#fff" },
  });
}
