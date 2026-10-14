import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { useConnectivityStore } from "@/lib/stores/connectivity-store";
import { space } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";

type Status = "online" | "offline";

const VISIBLE_MS = 3000;
const COOLDOWN_MS = 15000;

export function ConnectivityPill() {
  const { colors } = useTheme();
  const { t } = useTranslation("connectivity");
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const isOnline = useConnectivityStore((s) => s.isOnline);
  const timerActive = useConnectivityStore((s) => s.timerActive);

  const [status, setStatus] = useState<Status | null>(null);
  const [displayStatus, setDisplayStatus] = useState<Status>("offline");

  const prevOnline = useRef<boolean | null>(null);
  const lastShownAt = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [anim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(anim, {
      toValue: status ? 1 : 0,
      duration: status ? 220 : 160,
      useNativeDriver: true,
    }).start();
  }, [status, anim]);

  useEffect(() => {
    if (isOnline === null) {
      return;
    }

    const prev = prevOnline.current;
    prevOnline.current = isOnline;

    if (prev === null || prev === isOnline || timerActive) {
      return;
    }

    const now = Date.now();
    if (now - lastShownAt.current < COOLDOWN_MS) {
      return;
    }
    lastShownAt.current = now;

    const next: Status = isOnline ? "online" : "offline";
    setDisplayStatus(next);
    setStatus(next);
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    hideTimer.current = setTimeout(() => setStatus(null), VISIBLE_MS);
  }, [isOnline, timerActive]);

  useEffect(
    () => () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    },
    [],
  );

  const tone = displayStatus === "online" ? colors.success : colors.error;
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-12, 0],
  });

  return (
    <View
      pointerEvents="none"
      style={[styles.wrap, { top: insets.top + space[2] }]}
    >
      <Animated.View
        style={[
          styles.pill,
          {
            opacity: anim,
            transform: [{ translateY }],
            borderColor: tone + "66",
          },
        ]}
      >
        <Ionicons
          name={displayStatus === "online" ? "wifi" : "cloud-offline-outline"}
          size={16}
          color={tone}
        />
        <Text style={[styles.label, { color: tone }]}>
          {t(displayStatus)}
        </Text>
      </Animated.View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    wrap: {
      position: "absolute",
      left: 0,
      right: 0,
      alignItems: "center",
      zIndex: 1000,
      elevation: 1000,
    },
    pill: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[2],
      paddingHorizontal: space[4],
      paddingVertical: space[2],
      borderRadius: 999,
      borderWidth: 1,
      backgroundColor: colors.surfaceHigh,
    },
    label: {
      ...type.caption,
      fontWeight: "700",
    },
  });
}
