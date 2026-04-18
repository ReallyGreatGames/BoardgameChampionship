import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { ScheduleList } from "@/lib/components/Schedule";
import { router } from "expo-router";
import { useEffect, useMemo } from "react";
import {
  StyleSheet,
  View
} from "react-native";

export default function ScheduleScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user, loading, isAdmin } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user || !isAdmin) {
      router.replace("/login");
    }
  }, [user, loading, isAdmin]);

  return (
    <View style={styles.container}>
      <ScheduleList></ScheduleList>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 24,
      paddingTop: 64,
    },
    title: {
      fontSize: 32,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 32,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.textSecondary,
      letterSpacing: 1.5,
      textTransform: "uppercase",
      marginBottom: 8,
      marginLeft: 4,
    },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      marginBottom: 24,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 14,
    },
    rowLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    rowIcon: {
      marginRight: 12,
    },
    rowLabel: {
      fontSize: 16,
      color: colors.text,
    },
    rowValue: {
      fontSize: 14,
      color: colors.textSecondary,
      flexShrink: 1,
      textAlign: "right",
      marginLeft: 8,
    },
    rowBorderTop: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    // Combobox
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
      fontSize: 14,
      color: colors.text,
    },
    // Modal dropdown
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
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
      fontSize: 16,
      color: colors.textSecondary,
    },
    dropdownTextActive: {
      color: colors.text,
      fontWeight: "600",
    },
  });
}
