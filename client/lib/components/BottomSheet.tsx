import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../bootstrap/ThemeProvider";
import { inset } from "../theme/spacing";
import { ui } from "../theme/ui";
import { type } from "../theme/typography";

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  footer: React.ReactNode;
  children: React.ReactNode;
};

export function BottomSheet({ visible, onClose, title, footer, children }: BottomSheetProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeSheetStyles(colors), [colors]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
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
            {children}
          </ScrollView>

          <View style={styles.footer}>
            {footer}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function makeSheetStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: ui.backdropColor,
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: ui.sheetRadius,
      borderTopRightRadius: ui.sheetRadius,
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
    footer: {
      padding: inset.card,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    saveBtn: {
      backgroundColor: colors.accent,
      borderRadius: ui.buttonRadius,
      paddingVertical: 14,
      alignItems: "center" as const,
    },
    saveBtnDisabled: {
      opacity: ui.disabledOpacity,
    },
    saveBtnText: {
      ...type.button,
      color: colors.onAccent,
    },
    input: {
      ...type.body,
      color: colors.text,
      backgroundColor: colors.surfaceHigh,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: ui.inputRadius,
      paddingVertical: 10,
      paddingHorizontal: inset.card,
    },
    inputError: {
      borderColor: colors.error,
    },
    inputMultiline: {
      minHeight: 96,
      textAlignVertical: "top" as const,
      paddingTop: 10,
    },
  });
}
