import NetInfo from "@react-native-community/netinfo";
import { useCallback, useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useAuth } from "../auth";
import { useTableBellNotifications } from "../notifications/useTableBellNotifications";
import { useFeatureFlagStore } from "../stores/appwrite/feature-flag-store";
import { useLotteryStore } from "../stores/appwrite/lottery-store";
import { useOptionsLotteryStore } from "../stores/appwrite/options-lottery-store";
import { usePlayerStore } from "../stores/appwrite/player-store";
import { useResultStore } from "../stores/appwrite/result-store";
import { useRuleStore } from "../stores/appwrite/rule-store";
import { useScheduleStore } from "../stores/appwrite/schedule-store";
import { useTableBellStore } from "../stores/appwrite/table-bell-store";
import { useTableStore } from "../stores/appwrite/table-store";
import { useTeamStore } from "../stores/appwrite/team-store";
import { useTimerSeatStore } from "../stores/appwrite/timer-seat-store";
import { useTimerSettingsStore } from "../stores/appwrite/timer-settings-store";
import { useTimerStore } from "../stores/appwrite/timer-store";
import { useTournamentStore } from "../stores/appwrite/tournament-store";
import { subscribeTier } from "../stores/real-time-store";


const globalInits = [useFeatureFlagStore, useTournamentStore];

const userInits = [
  useScheduleStore,
  useTableBellStore,
  useRuleStore,
  useTimerStore,
  useTimerSeatStore,
  useTimerSettingsStore,
  useResultStore,
  useTableStore,
  useTeamStore,
  usePlayerStore,
  useLotteryStore,
  useOptionsLotteryStore,
];

const adminInits: any[] = [];

type Tier = "global" | "user" | "admin";

function tierEntries(stores: any[]) {
  return stores.map((store) => {
    const state = store.getState();
    return {
      key: state.key,
      set: state.realtimeSet,
      channel: state.channel,
      relationshipFields: state.relationshipFields,
      refetch: state.init,
    };
  });
}

async function loadTier(stores: any[]) {
  const results = await Promise.allSettled(
    stores.map((store) => store.getState().init()),
  );
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      console.error(`[realtime] init failed for ${stores[i].getState().key}`, result.reason);
    }
  });
}

const RECONNECT_DEDUPE_MS = 2000;

export function RealTimeStoreProvider() {
  const { isAdmin, isPinVerified, loading } = useAuth();
  const isAuthenticated = isAdmin || isPinVerified;

  useTableBellNotifications(isAdmin);

  const tierUnsubscribes = useRef<Record<Tier, (() => void) | null>>({
    global: null,
    user: null,
    admin: null,
  });

  const tierGenerations = useRef<Record<Tier, number>>({
    global: 0,
    user: 0,
    admin: 0,
  });
  const lastReconnectAt = useRef(0);

  const openTier = useCallback(async (tier: Tier, stores: any[]) => {
    const generation = ++tierGenerations.current[tier];
    try {
      await loadTier(stores);
      if (generation !== tierGenerations.current[tier]) {
        return;
      }
      const previous = tierUnsubscribes.current[tier];
      tierUnsubscribes.current[tier] = subscribeTier(tierEntries(stores));
      previous?.();
    } catch (e) {
      console.error(`[realtime] failed to open ${tier} tier`, e);
    }
  }, []);

  const closeTier = useCallback((tier: Tier) => {
    tierGenerations.current[tier]++;
    tierUnsubscribes.current[tier]?.();
    tierUnsubscribes.current[tier] = null;
  }, []);

  useEffect(
    () => () => {
      closeTier("global");
      closeTier("user");
      closeTier("admin");
    },
    [closeTier],
  );

  const reconnectAll = useCallback(
    (reason: string) => {
      const now = Date.now();
      if (now - lastReconnectAt.current < RECONNECT_DEDUPE_MS) {
        console.debug(`[realtime] ${reason} — reconnect already in progress, skipping`);
        return;
      }
      lastReconnectAt.current = now;
      console.debug(`[realtime] ${reason} — reconnecting all subscriptions`);
      openTier("global", globalInits);
      if (isAuthenticated) {
        openTier("user", userInits);
      } else {
        closeTier("user");
      }
      if (isAdmin) {
        openTier("admin", adminInits);
      } else {
        closeTier("admin");
      }
    },
    [isAuthenticated, isAdmin, openTier, closeTier],
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
    const handleAppStateChange = async (nextState: AppStateStatus) => {
      if (nextState !== "active") {
        return;
      }
      const netState = await NetInfo.fetch().catch(() => null);
      if (netState?.isConnected === false) {
        console.debug("[realtime] app foregrounded while offline — waiting for network");
        return;
      }
      reconnectAll("app foregrounded");
    };

    const sub = AppState.addEventListener("change", handleAppStateChange);
    return () => sub.remove();
  }, [reconnectAll]);

  return null;
}
