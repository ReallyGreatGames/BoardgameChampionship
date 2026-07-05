import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { ScheduleList } from "@/lib/components/schedule/Schedule";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { inset } from "@/lib/theme/spacing";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

export default function ScheduleScreen() {
  useRequireAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <ScheduleList />
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: inset.screen,
      paddingTop: inset.screenTop,
    },
  });
}
