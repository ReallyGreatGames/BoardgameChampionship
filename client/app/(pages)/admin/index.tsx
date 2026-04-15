import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../../lib/auth";
import { type } from "../../../lib/theme/typography";
import { inset } from "../../../lib/theme/spacing";
import { colors } from "../../../lib/theme/colors";

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Admin content here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: inset.screen,
    paddingTop: inset.screenTopTall,
    paddingBottom: inset.screenBottom,
  },
  headerZone: {
    marginBottom: inset.group,
  },
  eyebrow: {
    ...type.eyebrow,
    color: colors.accent,
    marginBottom: inset.tight,
  },
  title: {
    ...type.h1,
    color: colors.text,
    marginBottom: 4,
  },
  email: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginBottom: inset.group,
  },
  placeholder: {
    ...type.body,
    color: colors.textMuted,
  },
  logoutButton: {
    position: "absolute",
    bottom: inset.screenBottom,
    right: inset.screen,
  },
  logoutText: {
    ...type.button,
    color: colors.error,
  },
});
