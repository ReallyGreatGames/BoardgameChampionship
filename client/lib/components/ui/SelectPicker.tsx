import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { ui } from "@/lib/theme/ui";
import { type } from "@/lib/theme/typography";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

export type SelectOption<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
};

export function SelectPicker<T extends string>({
  value,
  options,
  onChange,
}: Props<T>) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const current = options.find((o) => o.value === value);

  return (
    <>
      <Pressable style={styles.combobox} onPress={() => setOpen(true)}>
        <Text style={styles.comboboxText}>{current?.label ?? ""}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        supportedOrientations={["portrait"]}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.dropdown}>
            {options.map((opt) => {
              const active = opt.value === value;
              return (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.dropdownItem,
                    active && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      active && styles.dropdownTextActive,
                    ]}
                  >
                    {opt.label}
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

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
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
      ...type.bodySmall,
      color: colors.text,
    },
    backdrop: {
      flex: 1,
      backgroundColor: ui.backdropColor,
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
      ...type.body,
      color: colors.textSecondary,
    },
    dropdownTextActive: {
      color: colors.text,
      fontWeight: "600",
    },
  });
}
