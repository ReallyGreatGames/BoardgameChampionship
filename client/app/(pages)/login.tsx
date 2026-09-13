import { router, useFocusEffect, useNavigation } from "expo-router";
import { DrawerActions } from "expo-router/react-navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
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
import { WelcomeHero } from "@/lib/components/onboarding/WelcomeHero";
import { BackButton } from "@/lib/components/ui/BackButton";
import { Button } from "@/lib/components/ui/Button";
import { useDialog } from "@/lib/components/ui/Dialog";
import { fonts, type } from "../../lib/theme/typography";
import { inset, space } from "../../lib/theme/spacing";
import { ui } from "../../lib/theme/ui";
import { useRouter } from "@/lib/routing/useRouter";

const SECRET_TAPS = 7;

export default function LoginScreen() {
  const { t } = useTranslation(["login"]);
  const { login, loginWithPin } = useAuth();
  const { confirm } = useDialog();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [pinFocused, setPinFocused] = useState(false);

  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const passwordRef = useRef<TextInput>(null);
  const badgeAnim = useRef(new Animated.Value(0)).current;
  const { user } = useAuth();
  const { navigate } = useRouter();
  const { active: eventActive } = useTournament();
  const eventInactive = !adminMode && !eventActive;

  const styles = useMemo(() => makeStyles(colors), [colors]);

  const openMenu = useCallback(
    () => navigation.dispatch(DrawerActions.openDrawer()),
    [navigation],
  );

  useFocusEffect(() => {
    if (user) {
      navigate("/");
    }
  });

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
      <WelcomeHero
        onMenuPress={openMenu}
        title={adminMode ? "Admin Login" : t("welcome")}
        onTitlePress={handleTitleTap}
      >
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
      </WelcomeHero>

      <TouchableWithoutFeedback
        onPress={Platform.OS !== "web" ? Keyboard.dismiss : undefined}
      >
        <View style={styles.body}>
          <View style={styles.backButton}>
            <BackButton onPress={() => navigate("/")} />
          </View>

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
                  returnKeyType="next"
                  submitBehavior="submit"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  placeholder={t("password")}
                  placeholderTextColor={colors.textPlaceholder}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  returnKeyType="go"
                  onSubmitEditing={handleLogin}
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
                  onSubmitEditing={handleLogin}
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

          <View style={styles.actionZone}>
            <Button
              label={t("login")}
              onPress={handleLogin}
              disabled={eventInactive}
              loading={loading}
              style={styles.loginButton}
            />
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
    body: {
      flex: 1,
      paddingHorizontal: inset.card,
      paddingTop: space[5],
      paddingBottom: inset.screenBottom,
    },
    backButton: {
      paddingBottom: space[5],
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
      borderRadius: ui.inputRadius,
      padding: inset.card,
      color: colors.text,
      backgroundColor: colors.surfaceHigh,
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
      marginTop: inset.tight,
      fontFamily: fonts.displayBold,
      fontSize: 32,
      lineHeight: 36,
      letterSpacing: 10,
      color: colors.text,
      textAlign: "center",
    },
    pinInputFocused: {
      borderColor: colors.primary,
      backgroundColor: colors.surface,
    },
    inputDisabled: {
      opacity: ui.disabledOpacity,
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
      marginTop: space[10],
    },
    loginButton: {
      alignSelf: "stretch",
      minHeight: 52,
    },
  });
}
