import { router, useFocusEffect } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useAuth } from "../../lib/auth";
import { useTheme } from "../../lib/bootstrap/ThemeProvider";
import { useTournament } from "../../lib/bootstrap/TournamentProvider";
import { useDialog } from "@/lib/components/ui/Dialog";
import { type } from "../../lib/theme/typography";
import { inset } from "../../lib/theme/spacing";
import { useRouter } from "@/lib/routing/useRouter";

const SECRET_TAPS = 7;

export default function LoginScreen() {
  const { t } = useTranslation(["login"]);
  const { login, loginWithPin } = useAuth();
  const { confirm } = useDialog();
  const { colors } = useTheme();
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [pinFocused, setPinFocused] = useState(false);

  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const buttonScale = useRef(new Animated.Value(1)).current;
  const badgeAnim = useRef(new Animated.Value(0)).current;
  const { user } = useAuth();
  const { navigate } = useRouter();
  const { active: eventActive } = useTournament();
  const eventInactive = !adminMode && !eventActive;

  const styles = useMemo(() => makeStyles(colors), [colors]);

  useFocusEffect(() => {
    if (user) {
      navigate("/");
    }
  });

  // Admin badge spring-in when mode activates
  useEffect(() => {
    if (adminMode) {
      badgeAnim.setValue(0);
      Animated.spring(badgeAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 18,
        bounciness: 14,
      }).start();
    } else {
      badgeAnim.setValue(0);
    }
  }, [adminMode, badgeAnim]);

  function handleTitleTap() {
    tapCount.current += 1;
    if (tapTimer.current) {
      clearTimeout(tapTimer.current);
    }
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
        await confirm({
          title: "Error",
          message: "Email and password required.",
          cancelLabel: null,
        });
        return;
      }
      setLoading(true);
      try {
        await login(email, password);
        router.replace("/admin");
      } catch (e: any) {
        await confirm({
          title: "Login failed",
          message: e?.message ?? "Unknown error",
          cancelLabel: null,
        });
      } finally {
        setLoading(false);
      }
    } else {
      if (eventInactive) {
        return;
      }
      if (!pin) {
        await confirm({
          title: "Error",
          message: "PIN required.",
          cancelLabel: null,
        });
        return;
      }
      setLoading(true);
      try {
        await loginWithPin(pin);
        router.replace("/");
      } catch (e: any) {
        await confirm({
          title: "Invalid PIN",
          message: e?.message ?? "Unknown error",
          cancelLabel: null,
        });
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
      <TouchableWithoutFeedback
        onPress={Platform.OS !== "web" ? Keyboard.dismiss : undefined}
      >
        <View style={styles.inner}>
          {/* Zone 1 — Title */}
          <View style={styles.headerZone}>
            <Pressable onPress={handleTitleTap}>
              <Text style={styles.title}>
                {adminMode ? "Admin Login" : t("welcome")}
              </Text>
            </Pressable>
            {adminMode && (
              <Animated.View
                style={{
                  opacity: badgeAnim,
                  transform: [{ scale: badgeAnim }],
                }}
              >
                <Text style={styles.adminBadge}>ADMIN MODE</Text>
              </Animated.View>
            )}
          </View>

          {/* Zone 2 — Form */}
          <View style={styles.formZone}>
            {adminMode ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={colors.textPlaceholder}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t("password")}
                  placeholderTextColor={colors.textPlaceholder}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </>
            ) : (
              <View style={styles.pinContainer}>
                <Text style={styles.pinLabel}>{t("enterPin")}</Text>
                <Text style={styles.pinHint}>{t("pinHint")}</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.pinInput,
                    pinFocused && styles.pinInputFocused,
                    eventInactive && styles.inputDisabled,
                  ]}
                  placeholder="••••"
                  placeholderTextColor={colors.textPlaceholder}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={8}
                  value={pin}
                  onChangeText={setPin}
                  textAlign="center"
                  editable={!eventInactive}
                  onFocus={() => setPinFocused(true)}
                  onBlur={() => setPinFocused(false)}
                />
                {eventInactive && (
                  <View style={styles.eventInactiveHint}>
                    <Text style={styles.eventInactiveHintText}>
                      {t("eventInactiveHint")}
                    </Text>
                    <Pressable onPress={() => navigate("/(pages)/info")}>
                      <Text style={styles.eventInactiveFaqLink}>
                        {t("eventInactiveFaqLink")}
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Zone 3 — Action */}
          <View style={styles.actionZone}>
            {loading ? (
              <ActivityIndicator size="large" color={colors.accent} />
            ) : (
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <Pressable
                  style={[styles.button, eventInactive && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={eventInactive}
                  onPressIn={() =>
                    Animated.spring(buttonScale, {
                      toValue: 0.96,
                      useNativeDriver: true,
                      speed: 60,
                      bounciness: 0,
                    }).start()
                  }
                  onPressOut={() =>
                    Animated.spring(buttonScale, {
                      toValue: 1,
                      useNativeDriver: true,
                      speed: 30,
                      bounciness: 6,
                    }).start()
                  }
                >
                  <Text style={styles.buttonText}>{t("login")}</Text>
                </Pressable>
              </Animated.View>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    inner: {
      flex: 1,
      paddingHorizontal: inset.screen,
      paddingTop: inset.screenTopTall,
      paddingBottom: inset.screenBottom,
    },
    headerZone: {
      marginBottom: inset.section,
    },
    title: {
      ...type.h1,
      color: colors.text,
    },
    adminBadge: {
      ...type.eyebrow,
      color: colors.accent,
      marginTop: inset.tight,
    },
    formZone: {
      gap: inset.list,
    },
    input: {
      ...type.body,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: inset.card,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    pinContainer: {
      gap: inset.tight,
    },
    pinLabel: {
      ...type.bodySmall,
      color: colors.textSecondary,
    },
    pinHint: {
      ...type.caption,
      color: colors.textMuted,
    },
    pinInput: {
      ...type.h2,
      letterSpacing: 10,
      color: colors.text,
      textAlign: "center",
    },
    pinInputFocused: {
      borderColor: colors.primary,
      backgroundColor: colors.surfaceHigh,
    },
    inputDisabled: {
      opacity: 0.4,
    },
    eventInactiveHint: {
      marginTop: inset.tight,
      gap: 4,
    },
    eventInactiveHintText: {
      ...type.caption,
      color: colors.error,
    },
    eventInactiveFaqLink: {
      ...type.caption,
      color: colors.accent,
      textDecorationLine: "underline",
    },
    actionZone: {
      marginTop: inset.section,
    },
    button: {
      backgroundColor: colors.accent,
      borderRadius: 8,
      padding: inset.card,
      alignItems: "center",
    },
    buttonDisabled: {
      opacity: 0.4,
    },
    buttonText: {
      ...type.button,
      color: colors.onAccent,
    },
  });
}
