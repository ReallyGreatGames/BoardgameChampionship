import { ScheduleList } from "@/lib/components/Schedule";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../../lib/bootstrap/ThemeProvider";
import { TournamentSettings } from "../../../lib/components/TournamentSettings";
import { inset } from "../../../lib/theme/spacing";

export default function AdminDashboard() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <TournamentSettings />
      <ScheduleList />
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: inset.screen,
      paddingTop: inset.screenTopTall,
      paddingBottom: inset.screenBottom,
    },
  });
}
