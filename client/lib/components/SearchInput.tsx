import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { useTheme } from "../bootstrap/ThemeProvider";
import { inset } from "../theme/spacing";
import { type } from "../theme/typography";

type SearchInputProps = {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
};

export function SearchInput({ value, onChangeText, placeholder }: SearchInputProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.searchRow}>
      <Ionicons name="search-outline" size={16} color={colors.textMuted} />
      <TextInput
        style={styles.searchInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textPlaceholder}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => onChangeText("")}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <Ionicons name="close-circle" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: inset.card,
      paddingVertical: 10,
      gap: 8,
    },
    searchInput: {
      ...type.body,
      color: colors.text,
      flex: 1,
      padding: 0,
    },
  });
}
