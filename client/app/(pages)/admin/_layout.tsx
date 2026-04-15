import { router, Stack } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../../../lib/auth";

export default function AdminLayout() {
  const { user, loading, isAdmin } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user || !isAdmin) {
      router.replace("/login");
    }
  }, [user, loading, isAdmin]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f0f0f" }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!user || !isAdmin) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
