import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../../lib/auth";

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.badge}>ADMIN</Text>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.email}>{user?.email}</Text>

      <View style={styles.divider} />

      <Text style={styles.placeholder}>Admin content here.</Text>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    padding: 32,
    paddingTop: 80,
  },
  badge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ff4444",
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "#666",
    marginBottom: 32,
  },
  divider: {
    height: 1,
    backgroundColor: "#222",
    marginBottom: 32,
  },
  placeholder: {
    color: "#444",
    fontSize: 14,
  },
  logoutButton: {
    position: "absolute",
    bottom: 48,
    right: 32,
  },
  logoutText: {
    color: "#ff4444",
    fontWeight: "600",
    fontSize: 14,
  },
});
