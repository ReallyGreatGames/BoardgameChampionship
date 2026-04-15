import { useRouter } from "@/lib/routing/useRouter";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../lib/auth";
import { colors } from "@/lib/theme/colors";

export default function Index() {
  const { user, loading, isAdmin, isPinVerified } = useAuth();
  const { routeDeterministic } = useRouter();

  useEffect(() => {
    if (loading) return;
    routeDeterministic();
  }, [user, loading, isAdmin, isPinVerified, routeDeterministic]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.border} />
      <Text style={{ color: colors.text }}>Dummer normaler Nutzer</Text>
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
