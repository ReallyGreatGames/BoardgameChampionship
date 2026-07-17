import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

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

export async function requestNotificationPermissions() {
  if (Platform.OS === "web") {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
    return;
  }
  await Notifications.requestPermissionsAsync();
}

function playWebNotificationSound() {
  try {
    const Ctx = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!Ctx) {
      return;
    }
    const ctx = new Ctx();
    const now = ctx.currentTime;

    // Two-tone chime: fundamental + harmonic
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

export async function triggerLocalNotification(title: string, body: string) {
  if (Platform.OS === "web") {
    playWebNotificationSound();

    if ("vibrate" in navigator) {
      navigator.vibrate([300, 100, 300, 100, 300]);
    }

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.png" });
    }
    return;
  }

  // Native: haptic + local OS notification (includes sound)
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null,
  });
}
