import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { useRouter } from "@/lib/routing/useRouter";
import { inset } from "@/lib/theme/spacing";
import { useEffect, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../lib/auth";

export default function Index() {
  const { user, loading, isAdmin, isPinVerified } = useAuth();
  const { routeDeterministic, navigate } = useRouter();
  const { colors } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
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
    button: {
      backgroundColor: colors.accent,
      borderRadius: 8,
      padding: inset.card,
      alignItems: "center",
    }
  }), [colors]);

  useEffect(() => {
    if (loading) return;
    routeDeterministic();
  }, [user, loading, isAdmin, isPinVerified, routeDeterministic]);

  return (
    <View style={styles.container}>
      <Text style={{ color: "red" }}>PLATZHALTER</Text>
      <Text style={{ color: colors.text }}>Das ist die Startseite. Hier steht wie alles geht!</Text>
      {!user && (
        <Pressable style={styles.button} onPress={() => navigate("/(pages)/login")}>
          <Text style={{ color: colors.text }}>Hier gehts zum Login</Text>
        </Pressable>
      )}
    </View>
  );
}
