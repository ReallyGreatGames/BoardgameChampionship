import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../bootstrap/ThemeProvider";

type Props = {
  index: number;
  sigIds: string[];
  isSubmitted: boolean;
};

export function SignatureStatusIcon({ index, sigIds, isSubmitted }: Props) {
  const { colors } = useTheme();
  const signed = !!sigIds[index];
  if (signed && isSubmitted) {
    return <Ionicons name="checkmark-circle" size={12} color={colors.success} />;
  }
  if (signed && !isSubmitted) {
    return <Ionicons name="checkmark" size={12} color={colors.text} />;
  }
  if (!signed && isSubmitted) {
    return <Ionicons name="help-circle" size={12} color={colors.error} />;
  }
  return null;
}
