import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../lib/auth";
import { useRouter } from "@/lib/routing/useRouter";

export default function Index() {
  const { user, loading, logout, isAdmin, isPinVerified } = useAuth();
  const { navigate, routeDeterministic } = useRouter();

  useEffect(() => {
    if (loading) return;
    routeDeterministic();
  }, [user, loading, isAdmin, isPinVerified, routeDeterministic]);

  return (
    <View style={styles.container}>
      <Pressable style={styles.gear} onPress={() => router.navigate("/settings")}>
        <Ionicons name="settings-outline" size={24} color="#888" />
      </Pressable>
      <ActivityIndicator size="large" color="#fff" />
      <Text style={{ color: "white" }}>Dummer normaler Nutzer</Text>
      <Pressable
        style={{
          backgroundColor: "#ff0000",
          padding: 10,
          borderRadius: 8,
          marginTop: 5,
        }}
        onPress={async () => {
          await logout();
          navigate("/login");
        }}
      >
        <Text>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f0f0f",
  },
  gear: {
    position: "absolute",
    top: 56,
    right: 24,
  },
});
