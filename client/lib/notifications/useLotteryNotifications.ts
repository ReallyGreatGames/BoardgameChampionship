import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLotteryStore } from "../stores/appwrite/lottery-store";
import { useScheduleStore } from "../stores/appwrite/schedule-store";
import { parseLotteryFileName } from "../utils/lottery";
import { requestNotificationPermissions, triggerLocalNotification } from "./localNotify";

/** Notifies non-admin users when a new lottery photo is uploaded, for any game. */
export function useLotteryNotifications(isAdmin: boolean) {
  const collection = useLotteryStore((s) => s.collection);
  const schedules = useScheduleStore((s) => s.collection);
  const mountedAtRef = useRef<number | null>(null);
  const permissionsRequestedRef = useRef(false);
  const notifiedIdsRef = useRef<Set<string>>(new Set());
  const { t } = useTranslation(["lottery"]);

  useEffect(() => {
    if (isAdmin) {
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
    if (isAdmin || mountedAtRef.current === null) {
      return;
    }

    const cutoff = mountedAtRef.current;
    const newPhotos = collection.filter(
      (photo) =>
        new Date(photo.$createdAt).getTime() > cutoff &&
        !notifiedIdsRef.current.has(photo.$id),
    );

    newPhotos.forEach((photo) => {
      // collection can be re-set multiple times for the same upload (the
      // realtime `create` event, plus the explicit post-upload refresh that
      // closes the app-backgrounding race) — track what we've already
      // notified for so each photo only ever triggers one notification.
      notifiedIdsRef.current.add(photo.$id);
      const gameId = parseLotteryFileName(photo.name)?.gameId;
      const gameName = schedules.find((s) => s.gameId === gameId)?.title;
      const title = t("notificationTitle");
      const body = gameName
        ? t("notificationBody", { game: gameName })
        : t("notificationBodyGeneric");
      triggerLocalNotification(title, body);
    });
  }, [collection, schedules, isAdmin, t]);
}
