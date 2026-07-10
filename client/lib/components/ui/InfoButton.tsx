import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { useDialog } from "@/lib/components/ui/Dialog";

type Props = {
  title: string;
  message: string;
};

export function InfoButton({ title, message }: Props) {
  const { colors } = useTheme();
  const { confirm } = useDialog();

  return (
    <Pressable
      onPress={() => confirm({ title, message, cancelLabel: null })}
      style={styles.button}
      hitSlop={8}
    >
      <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 2,
  },
});
