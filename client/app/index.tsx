import { useEffect } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../lib/auth";

export default function Index() {
  const { user, loading, logout, isAdmin, isPinVerified } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user || (!isAdmin && !isPinVerified)) {
      router.replace("/login");
      return;
    }
    if (isAdmin) {
      router.replace("/admin");
    }
  }, [user, loading, isAdmin, isPinVerified]);

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
