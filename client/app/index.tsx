import { useRouter } from "@/lib/routing/useRouter";
import { useEffect } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../lib/auth";
import { colors } from "@/lib/theme/colors";

export default function Index() {
  const { user, loading, logout, isAdmin, isPinVerified } = useAuth();
  const { navigate, routeDeterministic } = useRouter();

  useEffect(() => {
    if (loading) return;
    routeDeterministic();
  }, [user, loading, isAdmin, isPinVerified, routeDeterministic]);

  return (
    <View style={styles.container}>
<ActivityIndicator size="large" color={colors.border} />
      <Text style={{ color: colors.text }}>Dummer normaler Nutzer</Text>
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
    backgroundColor: colors.background,
  },
  gear: {
    position: "absolute",
    top: 56,
    right: 24,
  },
});
