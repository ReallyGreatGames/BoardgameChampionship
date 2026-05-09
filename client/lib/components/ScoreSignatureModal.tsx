import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SvgXml } from "react-native-svg";
import { useTheme } from "../bootstrap/ThemeProvider";
import { inset, space } from "../theme/spacing";
import { type } from "../theme/typography";
import { injectViewBox } from "../utils";

type Props = {
  visible: boolean;
  title: string;
  modalLoading: boolean;
  modalSvg: string | null;
  confirmingReset: boolean;
  onClose: () => void;
  onReset: () => void;
  onConfirmReset: () => void;
  onCancelConfirm: () => void;
  t: (key: string) => string;
};

export function ScoreSignatureModal({ visible, title, modalLoading, modalSvg, confirmingReset, onClose, onReset, onConfirmReset, onCancelConfirm, t }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.sigBox}>
            {modalLoading && <ActivityIndicator color={colors.primary} />}
            {!modalLoading && modalSvg && (
              <SvgXml xml={injectViewBox(modalSvg)} width={280} height={180} />
            )}
            {!modalLoading && !modalSvg && (
              <Ionicons name="alert-circle-outline" size={32} color={colors.error} />
            )}
          </View>

          {confirmingReset ? (
            <>
              <Text style={styles.confirmMsg}>{t("confirmResetOne.message")}</Text>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onCancelConfirm} activeOpacity={0.7}>
                  <Text style={styles.cancelLabel}>{t("confirmResetOne.cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.resetBtn} onPress={onReset} activeOpacity={0.7}>
                  <Text style={styles.resetLabel}>{t("confirmResetOne.reset")}</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.cancelLabel}>{t("confirmResetOne.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.resetBtn} onPress={onConfirmReset} activeOpacity={0.7}>
                <Text style={styles.resetLabel}>{t("confirmResetOne.reset")}</Text>
              </TouchableOpacity>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      alignItems: "center",
      justifyContent: "center",
      padding: inset.screen,
    },
    card: {
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: inset.card,
      width: "100%",
      maxWidth: 360,
      gap: inset.list,
    },
    title: { ...type.h3, color: colors.text },
    sigBox: {
      height: 180,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: "#ffffff",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    confirmMsg: { ...type.bodySmall, color: colors.textMuted },
    actions: { flexDirection: "row", gap: space[3] },
    cancelBtn: {
      flex: 1,
      paddingVertical: space[3],
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    cancelLabel: { ...type.body, color: colors.textSecondary },
    resetBtn: {
      flex: 1,
      paddingVertical: space[3],
      borderRadius: 8,
      backgroundColor: colors.error,
      alignItems: "center",
    },
    resetLabel: { ...type.body, color: "#ffffff", fontWeight: "600" },
  });
}
