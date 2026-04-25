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
  const { user, loading, isAdmin, isPinVerified } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!isPinVerified && !isAdmin) {
      router.replace("/(pages)/login");
    }
  }, [user, loading, isAdmin, isPinVerified]);

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
  });
}
