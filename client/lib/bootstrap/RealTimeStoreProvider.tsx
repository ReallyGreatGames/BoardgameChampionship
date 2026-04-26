import { useEffect } from "react";
import { useAuth } from "../auth";
import { useTableBellNotifications } from "../notifications/useTableBellNotifications";
import { useResultStore } from "../stores/appwrite/result-store";
import { useRuleStore } from "../stores/appwrite/rule-store";
import { useScheduleStore } from "../stores/appwrite/schedule-store";
import { useTableBellStore } from "../stores/appwrite/table-bell-store";
import { useTimerSettingsStore } from "../stores/appwrite/timer-settings-store";
import { useTimerStore } from "../stores/appwrite/timer-store";



/**
 * Initializes realtime store subscriptions after authentication.
 *
 * Add store init hooks to the arrays below:
 *   userInits  — runs once when any authenticated user (PIN or admin) is ready
 *   adminInits — runs once when an admin session is ready
 */
export function RealTimeStoreProvider() {
  const { isAdmin, isPinVerified, loading } = useAuth();
  const isAuthenticated = isAdmin || isPinVerified;

  useTableBellNotifications(isAdmin);

  const userInits = [
    useScheduleStore,
    useTableBellStore,
    useRuleStore,
    useTimerStore,
    useTimerSettingsStore,
    useResultStore,
  ];

  const adminInits: any[] = [
  ];

  useEffect(() => {
    if (loading || !isAuthenticated) return;
    userInits.forEach((store) => store.getState().init());
  }, [loading, isAuthenticated]);

  useEffect(() => {
    if (loading || !isAdmin) return;
    adminInits.forEach((store) => store.getState().init());
  }, [loading, isAdmin]);

  return null;
}
