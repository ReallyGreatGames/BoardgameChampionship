import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../bootstrap/ThemeProvider";
import { type } from "../theme/typography";

export type ComboboxOption<T extends string> = {
  value: T;
  label: string;
  isLive?: boolean;
};

type ComboboxProps<T extends string> = {
  value: T;
  options: ComboboxOption<T>[];
  onChange: (value: T) => void;
};

export function Combobox<T extends string>({
  value,
  options,
  onChange,
}: ComboboxProps<T>) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [open, setOpen] = useState(false);
  const selected = options.find((opt) => opt.value === value);

  return (
    <>
      <Pressable style={styles.combobox} onPress={() => setOpen(true)}>
        {selected?.isLive && <View style={styles.liveDot} />}
        <Text style={styles.comboboxText} numberOfLines={1}>
          {selected?.label ?? ""}
        </Text>
        <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
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
                  <View style={styles.dropdownItemLabel}>
                    {opt.isLive && <View style={styles.liveDot} />}
                    <Text
                      style={[
                        styles.dropdownText,
                        active && styles.dropdownTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </View>
                  {active && (
                    <Ionicons name="checkmark" size={14} color={colors.text} />
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
      backgroundColor: colors.surfaceHigh,
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
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.success,
    },
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    dropdown: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      minWidth: 200,
      maxWidth: 320,
      overflow: "hidden",
    },
    dropdownItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    dropdownItemActive: {
      backgroundColor: colors.surfaceHigh,
    },
    dropdownItemLabel: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexShrink: 1,
    },
    dropdownText: {
      ...type.bodySmall,
      color: colors.textSecondary,
    },
    dropdownTextActive: {
      color: colors.text,
      fontWeight: "600",
    },
  });
}
