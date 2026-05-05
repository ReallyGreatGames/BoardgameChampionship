import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Pressable,
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
import { BottomSheet, makeSheetStyles } from "./BottomSheet";
import { FormField } from "./FormField";

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
  clarification: {
    icon: "information-circle-outline",
    labelKey: "types.clarification",
  },
};

const RULE_TYPES: RuleType[] = ["change", "addition", "clarification"];

export function RuleModal({ visible, item, gameId, onClose, onSave }: Props) {
  const { colors } = useTheme();
  const sheetStyles = useMemo(() => makeSheetStyles(colors), [colors]);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["rules"]);

  const [selectedType, setSelectedType] = useState<RuleType>("change");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
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
    if (!isValid || saving) {
      return;
    }
    setSaving(true);
    try {
      await onSave({
        gameId,
        type: selectedType,
        title: title.trim(),
        text: text.trim(),
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
      title={item ? t("form.editTitle") : t("form.addTitle")}
      footer={
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
            <Text style={sheetStyles.saveBtnText}>{t("form.save")}</Text>
          )}
        </Pressable>
      }
    >
      <FormField icon="text-outline" label={t("form.titleField")} required>
        <TextInput
          style={sheetStyles.input}
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
                style={[
                  styles.typeChip,
                  selected && {
                    borderColor: color,
                    backgroundColor: color + "18",
                  },
                ]}
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

      <FormField
        icon="document-text-outline"
        label={t("form.textField")}
        required
      >
        <TextInput
          style={[sheetStyles.input, sheetStyles.inputMultiline]}
          value={text}
          onChangeText={setText}
          placeholder={t("form.textPlaceholder")}
          placeholderTextColor={colors.textPlaceholder}
          multiline
          numberOfLines={4}
        />
      </FormField>
    </BottomSheet>
  );
}

export function typeColor(
  ruleType: RuleType,
  colors: ReturnType<typeof useTheme>["colors"],
): string {
  switch (ruleType) {
    case "change":
      return colors.accent;
    case "addition":
      return colors.success;
    case "clarification":
      return colors.primary;
  }
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
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
    typeChipLabel: {
      ...type.caption,
      color: colors.textMuted,
      textAlign: "center",
    },
  });
}
