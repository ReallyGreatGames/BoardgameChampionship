import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { TableBell } from "../models/table-bell";
import { useTableBellStore } from "../stores/appwrite/table-bell-store";

// Show notifications even while the app is foregrounded (native only)
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function requestNotificationPermissions() {
  if (Platform.OS === "web") {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
    return;
  }
  await Notifications.requestPermissionsAsync();
}

function playWebBellSound() {
  try {
    const Ctx = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;

    // Two-tone bell: fundamental + harmonic
    [880, 1108].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.6, now + 1.0);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.35 / (i + 1), now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
      osc.start(now);
      osc.stop(now + 1.4);
    });
  } catch {
    // AudioContext not available — silent fallback
  }
}

async function triggerNotifications(bell: TableBell) {
  if (Platform.OS === "web") {
    playWebBellSound();

    if ("vibrate" in navigator) {
      navigator.vibrate([300, 100, 300, 100, 300]);
    }

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Table Bell!", {
        body: `Table ${bell.table} needs attention!`,
        icon: "/favicon.png",
      });
    }
    return;
  }

  // Native: haptic + local OS notification (includes sound)
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Table Bell!",
      body: `Table ${bell.table} needs attention!`,
      sound: true,
    },
    trigger: null,
  });
}

export function useTableBellNotifications(isAdmin: boolean) {
  const collection = useTableBellStore((s) => s.collection);
  const mountedAtRef = useRef<number | null>(null);
  const permissionsRequestedRef = useRef(false);

  useEffect(() => {
    if (!isAdmin) return;
    if (mountedAtRef.current === null) {
      mountedAtRef.current = Date.now();
    }
    if (!permissionsRequestedRef.current) {
      permissionsRequestedRef.current = true;
      requestNotificationPermissions();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || mountedAtRef.current === null) return;

    const cutoff = mountedAtRef.current;
    const newBells = collection.filter((bell) => {
      const createdAt = new Date(bell.$createdAt).getTime();
      return createdAt > cutoff && !bell.acknowledgeTime;
    });

    newBells.forEach(triggerNotifications);
  }, [collection, isAdmin]);
}
