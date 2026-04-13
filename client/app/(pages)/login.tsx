import { router } from "expo-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../../lib/auth";

const SECRET_TAPS = 7;

export default function LoginScreen() {
  const { t } = useTranslation(["login"]);
  const { login, loginWithPin } = useAuth();
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminMode, setAdminMode] = useState(false);

  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleTitleTap() {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => {
      tapCount.current = 0;
    }, 2000);
    if (tapCount.current >= SECRET_TAPS) {
      tapCount.current = 0;
      setAdminMode((v) => !v);
    }
  }

  async function handleLogin() {
    if (adminMode) {
      if (!email || !password) {
        Alert.alert("Error", "Email and password required.");
        return;
      }
      setLoading(true);
      try {
        await login(email, password);
        router.replace("/admin");
      } catch (e: any) {
        Alert.alert("Login failed", e?.message ?? "Unknown error");
      } finally {
        setLoading(false);
      }
    } else {
      if (!pin) {
        Alert.alert("Error", "PIN required.");
        return;
      }
      setLoading(true);
      try {
        await loginWithPin(pin);
        router.replace("/");
      } catch (e: any) {
        Alert.alert("Invalid PIN", e?.message ?? "Unknown error");
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Pressable onPress={handleTitleTap}>
        <Text style={styles.title}>
          {adminMode ? "Admin Login" : t("welcome")}
        </Text>
      </Pressable>

      {adminMode && <Text style={styles.adminBadge}>ADMIN MODE</Text>}

      {adminMode ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#888"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder={t("password")}
            placeholderTextColor="#888"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </>
      ) : (
        <View style={styles.pinContainer}>
          <Text style={styles.pinLabel}>{t("enterPin")}</Text>
          <TextInput
            style={[styles.input, styles.pinInput]}
            placeholder="••••"
            placeholderTextColor="#555"
            keyboardType="number-pad"
            secureTextEntry
            maxLength={8}
            value={pin}
            onChangeText={setPin}
            textAlign="center"
          />
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Pressable style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>{t("login")}</Text>
        </Pressable>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 16,
    backgroundColor: "#0f0f0f",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  adminBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ff4444",
    letterSpacing: 2,
    marginBottom: 8,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    padding: 14,
    color: "#fff",
    fontSize: 16,
    backgroundColor: "#1a1a1a",
  },
  pinContainer: {
    width: "100%",
    alignItems: "center",
    gap: 8,
  },
  pinLabel: {
    color: "#888",
    fontSize: 14,
  },
  pinInput: {
    fontSize: 24,
    letterSpacing: 8,
  },
  button: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#0f0f0f",
    fontWeight: "700",
    fontSize: 16,
  },
});
