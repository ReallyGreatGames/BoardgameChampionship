import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { inset, space } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";

type Props = {
  currentIdx: number;
  total: number;
  jumpText: string;
  onJumpTextChange: (v: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onJump: () => void;
  t: (key: string) => string;
};

export function ScoreNavBar({ currentIdx, total, jumpText, onJumpTextChange, onPrev, onNext, onJump, t }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const atStart = currentIdx === 0;
  const atEnd = currentIdx === total - 1;

  return (
    <View style={styles.navBar}>
      <TouchableOpacity
        style={[styles.navBtn, atStart && styles.navBtnDisabled]}
        onPress={onPrev}
        disabled={atStart}
      >
        <Ionicons name="chevron-back" size={20} color={atStart ? colors.textMuted : colors.text} />
      </TouchableOpacity>

      <View style={styles.navCenter}>
        <Text style={styles.navCurrent}>{currentIdx + 1}</Text>
        <TextInput
          style={styles.jumpInput}
          value={jumpText}
          onChangeText={onJumpTextChange}
          onSubmitEditing={onJump}
          placeholder={t("jumpPlaceholder")}
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          returnKeyType="go"
        />
        <Text style={styles.navCurrent}>{total}</Text>
      </View>

      <TouchableOpacity
        style={[styles.navBtn, atEnd && styles.navBtnDisabled]}
        onPress={onNext}
        disabled={atEnd}
      >
        <Ionicons name="chevron-forward" size={20} color={atEnd ? colors.textMuted : colors.text} />
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    navBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: space[3],
      paddingHorizontal: inset.card,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      gap: space[2],
    },
    navBtn: {
      padding: space[2],
      borderRadius: 6,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    navBtnDisabled: { opacity: 0.35 },
    navCenter: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: space[2],
    },
    navCurrent: { ...type.body, color: colors.text, fontWeight: "600", minWidth: 24, textAlign: "right" },
    jumpInput: {
      width: 80,
      height: 34,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      paddingHorizontal: space[2],
      ...type.bodySmall,
      color: colors.text,
      backgroundColor: colors.surface,
      textAlign: "center",
    },
  });
}
