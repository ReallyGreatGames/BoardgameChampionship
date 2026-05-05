import NetInfo from "@react-native-community/netinfo";
import { useCallback, useEffect } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useAuth } from "../auth";
import { useTableBellNotifications } from "../notifications/useTableBellNotifications";
import { useFeatureFlagStore } from "../stores/appwrite/feature-flag-store";
import { useResultStore } from "../stores/appwrite/result-store";
import { useRuleStore } from "../stores/appwrite/rule-store";
import { useScheduleStore } from "../stores/appwrite/schedule-store";
import { useTableBellStore } from "../stores/appwrite/table-bell-store";
import { useTimerSettingsStore } from "../stores/appwrite/timer-settings-store";
import { useTimerStore } from "../stores/appwrite/timer-store";
import { clearAllSubscriptions } from "../stores/real-time-store";

/**
 * Initializes realtime store subscriptions after authentication.
 *
 * Add store init hooks to the arrays below:
 *   globalInits — runs immediately, no auth required
 *   userInits   — runs once when any authenticated user (PIN or admin) is ready
 *   adminInits  — runs once when an admin session is ready
 */

const globalInits = [useFeatureFlagStore];

const userInits = [
  useScheduleStore,
  useTableBellStore,
  useRuleStore,
  useTimerStore,
  useTimerSettingsStore,
  useResultStore,
];

const adminInits: any[] = [];

export function RealTimeStoreProvider() {
  const { isAdmin, isPinVerified, loading } = useAuth();
  const isAuthenticated = isAdmin || isPinVerified;

  useTableBellNotifications(isAdmin);

  const reconnectAll = useCallback(
    (reason: string) => {
      console.debug(`[realtime] ${reason} — reconnecting all subscriptions`);
      clearAllSubscriptions();
      globalInits.forEach((store) => store.getState().init());
      if (isAuthenticated)
        userInits.forEach((store) => store.getState().init());
      if (isAdmin) adminInits.forEach((store) => store.getState().init());
    },
    [isAuthenticated, isAdmin],
  );

  useEffect(() => {
    globalInits.forEach((store) => store.getState().init());
  }, []);

  useEffect(() => {
    if (loading || !isAuthenticated) return;
    userInits.forEach((store) => store.getState().init());
  }, [loading, isAuthenticated]);

  useEffect(() => {
    if (loading || !isAdmin) return;
    adminInits.forEach((store) => store.getState().init());
  }, [loading, isAdmin]);

  useEffect(() => {
    const wasConnected = { current: true };

    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected ?? false;
      if (!wasConnected.current && isConnected)
        reconnectAll("network restored");
      wasConnected.current = isConnected;
    });

    return () => unsubscribe();
  }, [reconnectAll]);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState !== "active") return;
      reconnectAll("app foregrounded");
    };

    const sub = AppState.addEventListener("change", handleAppStateChange);
    return () => sub.remove();
  }, [reconnectAll]);

  return null;
}
