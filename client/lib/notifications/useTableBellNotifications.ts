import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useTableBellStore } from "../stores/appwrite/table-bell-store";
import { requestNotificationPermissions, triggerLocalNotification } from "./localNotify";

export function useTableBellNotifications(isAdmin: boolean) {
  const collection = useTableBellStore((s) => s.collection);
  const mountedAtRef = useRef<number | null>(null);
  const permissionsRequestedRef = useRef(false);
  const notifiedIdsRef = useRef<Set<string>>(new Set());
  const { t } = useTranslation(["activeBells"]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    if (mountedAtRef.current === null) {
      mountedAtRef.current = Date.now();
    }
    if (!permissionsRequestedRef.current) {
      permissionsRequestedRef.current = true;
      requestNotificationPermissions();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || mountedAtRef.current === null) {
      return;
    }

    const cutoff = mountedAtRef.current;
    const newBells = collection.filter((bell) => {
      const createdAt = new Date(bell.$createdAt).getTime();
      return (
        createdAt > cutoff &&
        !bell.acknowledgeTime &&
        !notifiedIdsRef.current.has(bell.$id)
      );
    });

    newBells.forEach((bell) => {
      // collection can be re-set multiple times for the same bell (realtime
      // event plus any reconnect-triggered refetch) — track what we've
      // already notified for so each bell only ever triggers one notification.
      notifiedIdsRef.current.add(bell.$id);
      const title = t("notificationTitle");
      const body = bell.reason
        ? t("notificationBodyWithReason", {
            table: bell.table,
            reason: bell.reason,
          })
        : t("notificationBody", { table: bell.table });
      triggerLocalNotification(title, body);
    });
  }, [collection, isAdmin, t]);
}
