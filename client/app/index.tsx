import { useEffect } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { account, useAuth } from "../lib/auth";

export default function Index() {
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    }
    if (user?.labels.includes("admin")) {
      router.replace("/admin");
    }
  }, [user, loading]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0f0f0f",
      }}
    >
      <ActivityIndicator size="large" color="#fff" />
      <Text style={{ color: "white" }}>Dummer normaler Nutzer</Text>
      <Pressable style={{ backgroundColor: "#ff0000", padding: 10, borderRadius: 8, marginTop: 5 }} onPress={async () => {
        await logout();
        router.replace("/login")
      }}>
        <Text>Log out</Text>
      </Pressable>
    </View>
  );
}
