import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { ParticipantList } from "@/lib/components/participants/ParticipantList";
import { ParticipantListHeader } from "@/lib/components/participants/ParticipantListHeader";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { useTeamDirectory } from "@/lib/hooks/useTeamDirectory";
import { useNavigation } from "expo-router";
import { DrawerActions } from "expo-router/react-navigation";
import { useCallback, useMemo } from "react";
import { StyleSheet, View } from "react-native";

export default function ParticipantsPage() {
  const { user, loading } = useRequireAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const { sections, count, search, setSearch, isLoading } = useTeamDirectory();

  const openMenu = useCallback(
    () => navigation.dispatch(DrawerActions.openDrawer()),
    [navigation],
  );

  if (loading || !user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ParticipantListHeader count={count} onMenuPress={openMenu} />
      <ParticipantList
        sections={sections}
        search={search}
        onSearchChange={setSearch}
        isLoading={isLoading}
      />
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
  });
}
