import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { ScheduleHeader } from "@/lib/components/schedule/ScheduleHeader";
import { ScheduleList } from "@/lib/components/schedule/Schedule";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { useScheduleStore } from "@/lib/stores/appwrite/schedule-store";
import { inset } from "@/lib/theme/spacing";
import { useNavigation } from "expo-router";
import { DrawerActions } from "expo-router/react-navigation";
import { useCallback, useMemo } from "react";
import { StyleSheet, View } from "react-native";

export default function ScheduleScreen() {
  useRequireAuth();
  const { colors } = useTheme();
  const { isAdmin } = useAuth();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const count = useScheduleStore((s) => s.collection.length);

  const openMenu = useCallback(
    () => navigation.dispatch(DrawerActions.openDrawer()),
    [navigation],
  );

  return (
    <View style={styles.container}>
      <ScheduleHeader count={count} isAdmin={isAdmin} onMenuPress={openMenu} />
      <View style={styles.body}>
        <ScheduleList />
      </View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    body: {
      flex: 1,
      paddingHorizontal: inset.card,
      paddingTop: inset.card,
    },
  });
}
