import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../bootstrap/ThemeProvider";
import { inset } from "../theme/spacing";
import { ui } from "../theme/ui";
import { type } from "../theme/typography";

export type DialogOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type DialogContextValue = {
  confirm: (options: DialogOptions) => Promise<boolean>;
};

const DialogContext = createContext<DialogContextValue>({
  confirm: async () => false,
});

export const useDialog = () => useContext(DialogContext);

export const DialogProvider: FC<PropsWithChildren> = ({ children }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<DialogOptions>({ title: "" });

  const confirm = useCallback((opts: DialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setOptions(opts);
      setVisible(true);
    });
  }, []);

  function handleConfirm() {
    setVisible(false);
    resolveRef.current?.(true);
    resolveRef.current = null;
  }

  function handleCancel() {
    setVisible(false);
    resolveRef.current?.(false);
    resolveRef.current = null;
  }

  return (
    <DialogContext.Provider value={{ confirm }}>
      {children}
      <Modal
        transparent
        animationType="fade"
        visible={visible}
        onRequestClose={handleCancel}
      >
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.title}>{options.title}</Text>
            {options.message ? (
              <Text style={styles.message}>{options.message}</Text>
            ) : null}
            <View style={styles.buttons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                <Text style={styles.cancelLabel}>
                  {options.cancelLabel ?? "Cancel"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  options.destructive && styles.confirmBtnDestructive,
                ]}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmLabel}>
                  {options.confirmLabel ?? "OK"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </DialogContext.Provider>
  );
};

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: ui.backdropColor,
      justifyContent: "center",
      alignItems: "center",
      padding: inset.screen,
    },
    card: {
      width: "100%",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: inset.group,
      gap: inset.list,
    },
    title: {
      ...type.h3,
      color: colors.text,
    },
    message: {
      ...type.body,
      color: colors.textSecondary,
    },
    buttons: {
      flexDirection: "row",
      gap: inset.tight,
      marginTop: inset.tight,
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    cancelLabel: {
      ...type.button,
      color: colors.textSecondary,
    },
    confirmBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: colors.accent,
      alignItems: "center",
    },
    confirmBtnDestructive: {
      backgroundColor: colors.error,
    },
    confirmLabel: {
      ...type.button,
      color: colors.onAccent,
    },
  });
}
