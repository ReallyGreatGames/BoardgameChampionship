import { router, Stack } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../../../../lib/auth";
import { useTheme } from "../../../../lib/bootstrap/ThemeProvider";

export default function AdminLayout() {
  const { user, loading, isAdmin } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!user || !isAdmin) {
      router.replace("/login");
    }
  }, [user, loading, isAdmin]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
