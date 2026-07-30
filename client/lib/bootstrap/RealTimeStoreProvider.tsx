import NetInfo from "@react-native-community/netinfo";
import { useCallback, useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useAuth } from "../auth";
import { useLotteryNotifications } from "../notifications/useLotteryNotifications";
import { useTableBellNotifications } from "../notifications/useTableBellNotifications";
import { useFeatureFlagStore } from "../stores/appwrite/feature-flag-store";
import { useLotteryStore } from "../stores/appwrite/lottery-store";
import { usePlayerStore } from "../stores/appwrite/player-store";
import { useResultStore } from "../stores/appwrite/result-store";
import { useRuleStore } from "../stores/appwrite/rule-store";
import { useScheduleStore } from "../stores/appwrite/schedule-store";
import { useTableBellStore } from "../stores/appwrite/table-bell-store";
import { useTableStore } from "../stores/appwrite/table-store";
import { useTeamStore } from "../stores/appwrite/team-store";
import { useTimerSettingsStore } from "../stores/appwrite/timer-settings-store";
import { useTimerStore } from "../stores/appwrite/timer-store";
import { useTournamentStore } from "../stores/appwrite/tournament-store";
import { subscribeTier } from "../stores/real-time-store";

/**
 * Initializes realtime store subscriptions after authentication.
 *
 * Add store init hooks to the arrays below:
 *   globalInits — runs immediately, no auth required
 *   userInits   — runs once when any authenticated user (PIN or admin) is ready
 *   adminInits  — runs once when an admin session is ready
 *
 * Each tier's stores fetch their own initial data independently (their own
 * init()), but share a single realtime subscription per tier — Appwrite
 * multiplexes every subscription onto one shared WebSocket regardless, and
 * subscribing once per tier (instead of once per store) avoids the socket
 * being torn down and rebuilt once per collection on every reconnect.
 */

const globalInits = [useFeatureFlagStore, useTournamentStore];

const userInits = [
  useScheduleStore,
  useTableBellStore,
  useRuleStore,
  useTimerStore,
  useTimerSettingsStore,
  useResultStore,
  useTableStore,
  useTeamStore,
  usePlayerStore,
  useLotteryStore,
];

const adminInits: any[] = [];

type Tier = "global" | "user" | "admin";

function tierEntries(stores: any[]) {
  return stores.map((store) => {
    const state = store.getState();
    return { key: state.key, set: state.realtimeSet, channel: state.channel };
  });
}

async function loadTier(stores: any[]) {
  await Promise.all(stores.map((store) => store.getState().init()));
}

export function RealTimeStoreProvider() {
  const { isAdmin, isPinVerified, loading } = useAuth();
  const isAuthenticated = isAdmin || isPinVerified;

  useTableBellNotifications(isAdmin);
  useLotteryNotifications(isAdmin);

  const tierUnsubscribes = useRef<Record<Tier, (() => void) | null>>({
    global: null,
    user: null,
    admin: null,
  });

  const openTier = useCallback(async (tier: Tier, stores: any[]) => {
    tierUnsubscribes.current[tier]?.();
    tierUnsubscribes.current[tier] = null;
    await loadTier(stores);
    tierUnsubscribes.current[tier] = subscribeTier(tierEntries(stores));
  }, []);

  const reconnectAll = useCallback(
    (reason: string) => {
      console.debug(`[realtime] ${reason} — reconnecting all subscriptions`);
      tierUnsubscribes.current.global?.();
      tierUnsubscribes.current.user?.();
      tierUnsubscribes.current.admin?.();
      tierUnsubscribes.current = { global: null, user: null, admin: null };

      openTier("global", globalInits);
      if (isAuthenticated) {
        openTier("user", userInits);
      }
      if (isAdmin) {
        openTier("admin", adminInits);
      }
    },
    [isAuthenticated, isAdmin, openTier],
  );

  useEffect(() => {
    openTier("global", globalInits);
  }, [openTier]);

  useEffect(() => {
    if (loading || !isAuthenticated) {
      return;
    }
    openTier("user", userInits);
  }, [loading, isAuthenticated, openTier]);

  useEffect(() => {
    if (loading || !isAdmin) {
      return;
    }
    openTier("admin", adminInits);
  }, [loading, isAdmin, openTier]);

  useEffect(() => {
    const wasConnected = { current: true };

    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected ?? false;
      if (!wasConnected.current && isConnected) {
        reconnectAll("network restored");
      }
      wasConnected.current = isConnected;
    });

    return () => unsubscribe();
  }, [reconnectAll]);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState !== "active") {
        return;
      }
      reconnectAll("app foregrounded");
    };

    const sub = AppState.addEventListener("change", handleAppStateChange);
    return () => sub.remove();
  }, [reconnectAll]);

  return null;
}
