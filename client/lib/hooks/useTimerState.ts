import { useDialog } from "@/lib/components/ui/Dialog";
import { useTableBellStore } from "@/lib/stores/appwrite/table-bell-store";
import { useTimerSettingsStore } from "@/lib/stores/appwrite/timer-settings-store";
import { useTimerStore } from "@/lib/stores/appwrite/timer-store";
import { buildPlayerColor, PLAYER_COLORS } from "@/lib/utils/timerColors";
import {
  reconcileRoundAndPool,
  resolveGameId,
  toBooleanArray,
  toNumberArray,
} from "@/lib/utils";
import { getItemAsync } from "@/lib/secureStorage";
import { Animated, LayoutChangeEvent, useWindowDimensions } from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { TableBell } from "../models/table-bell";
import { Timer } from "../models/timer";
import { TimerPauseMode } from "./useTimerLocalSettings";

const DEFAULT_SECONDS = 10 * 60;
const PLAYER_COUNT = 4;
/** A seat resumed within this many ms of its own pause keeps its round time —
 *  prevents "reset my round time" abuse via quick pause/unpause. */
const ROUND_RESET_GRACE_MS = 3000;

type TickState = {
  /** Pool seconds remaining per seat. Ticks down uniformly regardless of
   *  `direction` — direction only changes how this is *displayed* (see
   *  TimerCell.tsx). Goes negative once a seat's pool is exhausted; the
   *  magnitude is the overtime overage, symmetric for both directions. */
  times: number[];
  /** Round-time seconds remaining per seat — only ticks while the matching
   *  `roundExpired` entry is false and `roundSecondsTotal > 0`. */
  roundTimesLeft: number[];
  /** Whether each seat's round-time phase has ended for the current round. */
  roundExpired: boolean[];
  /** Whether each seat's pool has been fully used up. */
  playersInOvertime: boolean[];
};

function makeDefaultTickState(totalSeconds: number, roundSecondsTotal: number): TickState {
  return {
    times: Array(PLAYER_COUNT).fill(totalSeconds),
    roundTimesLeft: Array(PLAYER_COUNT).fill(roundSecondsTotal),
    roundExpired: Array(PLAYER_COUNT).fill(false),
    playersInOvertime: Array(PLAYER_COUNT).fill(false),
  };
}

/** Whether resuming a seat paused at `lastPausedAtIso` should keep its
 *  current round-time progress (grace window) or start a fresh round. Pure
 *  so it's shared between a single-seat press and the pause/unpause-all
 *  button without duplicating the rule. */
function resumeRoundState(
  idx: number,
  now: number,
  lastPausedAtIso: string | null,
  roundSecondsTotal: number,
  roundTimesLeft: number[],
  roundExpired: boolean[],
): { roundTimesLeft: number[]; roundExpired: boolean[] } {
  const lastPausedAt = lastPausedAtIso ? new Date(lastPausedAtIso).getTime() : null;
  const withinGrace = lastPausedAt !== null && now - lastPausedAt < ROUND_RESET_GRACE_MS;
  if (withinGrace) {
    return { roundTimesLeft, roundExpired };
  }
  const nextRoundTimesLeft = [...roundTimesLeft];
  const nextRoundExpired = [...roundExpired];
  nextRoundTimesLeft[idx] = roundSecondsTotal;
  nextRoundExpired[idx] = false;
  return { roundTimesLeft: nextRoundTimesLeft, roundExpired: nextRoundExpired };
}

/** (Re)starts a seat's grace-bar animation from how much of the 3s window has
 *  actually elapsed (wall-clock, via `lastPausedAtIso`), rather than always
 *  animating a fresh full 3000ms. Used both for the local action that pauses
 *  a seat AND by the cross-device sync effect, so the two never compute this
 *  two different ways — the sync effect re-running this with the same
 *  `lastPausedAtIso` a moment later (once the save round-trips) lands on
 *  essentially the same value instead of visibly jumping. */
function syncGraceAnimation(
  anim: Animated.Value,
  isPausedSeat: boolean,
  lastPausedAtIso: string | null,
  now: number,
) {
  anim.stopAnimation();
  if (!isPausedSeat) {
    anim.setValue(0);
    return;
  }
  const lastPausedAt = lastPausedAtIso ? new Date(lastPausedAtIso).getTime() : null;
  const elapsed = lastPausedAt !== null ? now - lastPausedAt : ROUND_RESET_GRACE_MS;
  if (elapsed >= ROUND_RESET_GRACE_MS) {
    anim.setValue(1);
    return;
  }
  anim.setValue(Math.max(0, elapsed) / ROUND_RESET_GRACE_MS);
  Animated.timing(anim, {
    toValue: 1,
    duration: ROUND_RESET_GRACE_MS - elapsed,
    useNativeDriver: false,
  }).start();
}

export function useTimerState({
  gameId,
  tableNumber,
  bell,
  pauseMode,
}: {
  gameId: string | undefined;
  tableNumber: number | null;
  bell: TableBell | undefined;
  pauseMode: TimerPauseMode;
}) {
  const { t } = useTranslation(["timer"]);
  const { confirm } = useDialog();
  const timerStore = useTimerStore();
  const timerSettingsStore = useTimerSettingsStore();
  const tableBellStore = useTableBellStore();
  const { width, height } = useWindowDimensions();

  const timerSettings = useMemo(
    () => timerSettingsStore.collection.find((g) => g.$id === gameId),
    [timerSettingsStore.collection, gameId],
  );

  const existingTimer = useMemo(
    () =>
      tableNumber !== null
        ? timerStore.collection.find(
            (tm) =>
              tm.table === tableNumber &&
              resolveGameId(tm.games) === (gameId ?? null),
          )
        : undefined,
    [timerStore.collection, gameId, tableNumber],
  );

  const [storedHexColors, setStoredHexColors] = useState<string[] | null>(null);

  useEffect(() => {
    if (!gameId) {
      setStoredHexColors(null);
      return;
    }
    getItemAsync(`playerColors_${gameId}`).then((raw) => {
      if (!raw) {
        setStoredHexColors(null);
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setStoredHexColors(parsed);
        }
      } catch {
        setStoredHexColors(null);
      }
    });
  }, [gameId]);

  const playerColors = useMemo(() => {
    const saved = storedHexColors ?? timerSettings?.colors;
    return Array.from({ length: PLAYER_COUNT }, (_, i) => {
      const hex = saved?.[i];
      return hex
        ? buildPlayerColor(hex)
        : PLAYER_COLORS[i % PLAYER_COLORS.length];
    });
  }, [storedHexColors, timerSettings?.colors]);

  // `durationMinutesTotal`/`roundSecondsTotal` are numbers Appwrite fills
  // with a schema default of `0` when never explicitly set — indistinguish-
  // able from a deliberately-chosen `0` (e.g. round timer disabled on
  // purpose for this table). `hasCustomTimer` is the authoritative,
  // unambiguous signal instead: explicitly true/false, set only by
  // handleSaveCustomTimer/handleUseDefaultTimer. Deriving it from
  // `durationMinutesTotal > 0` instead (as before) broke tables with a
  // pre-existing custom *duration* only (saved before `roundSecondsTotal`
  // existed) — their round timer got silently disabled by that same `0`
  // default, since a custom duration alone doesn't mean roundSeconds was
  // ever deliberately touched.
  const hasCustomTimer = !!existingTimer?.hasCustomTimer;
  const effectiveDuration = hasCustomTimer
    ? existingTimer?.durationMinutesTotal || timerSettings?.durationMinutesTotal
    : timerSettings?.durationMinutesTotal;
  const totalSeconds = effectiveDuration
    ? (effectiveDuration * 60) / PLAYER_COUNT
    : DEFAULT_SECONDS;
  const roundSecondsTotal = hasCustomTimer
    ? existingTimer?.roundSecondsTotal ?? 0
    : timerSettings?.roundSecondsTotal || 0;
  const direction = hasCustomTimer
    ? existingTimer?.direction ?? timerSettings?.direction ?? "down"
    : timerSettings?.direction ?? "down";

  const [tickState, setTickState] = useState<TickState>(() =>
    makeDefaultTickState(totalSeconds, roundSecondsTotal),
  );
  const [playersPaused, setPlayersPaused] = useState<boolean[]>(() =>
    Array(PLAYER_COUNT).fill(true),
  );
  const [cellSize, setCellSize] = useState({ w: width / 2, h: height / 2 });

  const timerStartedRef = useRef(false);
  if (playersPaused.some((p) => !p)) {
    timerStartedRef.current = true;
  }

  const timerDocIdRef = useRef<string | null>(null);
  const roundLastPausedAtRef = useRef<(string | null)[]>(
    Array(PLAYER_COUNT).fill(null),
  );
  const bellFiredRef = useRef(false);
  const depleteAnims = useRef(
    Array.from({ length: PLAYER_COUNT }, () => new Animated.Value(0)),
  );
  const graceAnims = useRef(
    Array.from({ length: PLAYER_COUNT }, () => new Animated.Value(0)),
  );
  // Tracks which `roundLastPausedAt` timestamp each seat's grace animation
  // was last (re)started from — lets the sync effect below skip redundant
  // restarts when a seat's own pause moment hasn't changed.
  const lastSyncedGraceRef = useRef<(string | null)[]>(
    Array(PLAYER_COUNT).fill(undefined as unknown as string | null),
  );
  // The exact times/round/pause arrays this device last wrote — lets the
  // sync effect recognize its own realtime echo and trust local state
  // entirely instead of re-deriving anything from it (see the sync effect
  // below for why that matters beyond just the times).
  const lastWrittenTickRef = useRef<{
    playerTimes: number[];
    playersPaused: boolean[];
    roundTimesLeft: number[];
    roundExpired: boolean[];
  } | null>(null);
  // The last timer-doc id this device has fully hydrated (elapsed-since-
  // $updatedAt catch-up applied) at least once. Only the FIRST sync for a
  // given doc — mount, or switching to a different table/game — legitimately
  // needs that catch-up: the doc may genuinely have gone stale while nobody
  // had it open. Every later sync while already watching the same doc is
  // itself a live "just happened" snapshot (another device's press/pause/
  // reset) — re-applying elapsed correction on top of it double-counts pure
  // network latency (and any clock skew between this device and the Appwrite
  // server), which is exactly what made a freshly reset round time appear to
  // start a couple of seconds behind on every OTHER device watching the same
  // table, even though the acting device itself (which never re-derives its
  // own writes — see isOwnEcho above) showed it correctly.
  const hydratedDocIdRef = useRef<string | null>(null);
  const playersPausedRef = useRef(playersPaused);
  playersPausedRef.current = playersPaused;
  const roundSecondsTotalRef = useRef(roundSecondsTotal);
  roundSecondsTotalRef.current = roundSecondsTotal;

  // Syncs from the persisted timer doc when one exists for this table, or
  // resets to defaults otherwise. Kept as a single effect — splitting the
  // "sync" and "reset to defaults" branches into separate effects lets the
  // reset branch win the race on mount (it ran second and had no way to know
  // a persisted timer had just been loaded), wiping out another viewer's
  // in-progress timer with a fresh default instead of syncing to it.
  useEffect(() => {
    if (!existingTimer) {
      if (timerStartedRef.current) {
        return;
      }
      setTickState(makeDefaultTickState(totalSeconds, roundSecondsTotal));
      depleteAnims.current.forEach((anim) => anim.setValue(0));
      return;
    }

    timerDocIdRef.current = existingTimer.$id;

    const remotePaused = toBooleanArray(existingTimer.playersPaused);
    const paused =
      remotePaused.length === PLAYER_COUNT
        ? remotePaused
        : Array(PLAYER_COUNT).fill(true);
    setPlayersPaused(paused);

    const remoteLastPaused = existingTimer.roundLastPausedAt;
    const remoteLastPausedArr =
      Array.isArray(remoteLastPaused) && remoteLastPaused.length === PLAYER_COUNT
        ? remoteLastPaused
        : Array(PLAYER_COUNT).fill(null);

    const remoteTimes = toNumberArray(existingTimer.playerTimes);
    const remoteRoundTimes = toNumberArray(existingTimer.roundTimesLeft);
    const remoteRoundExpired = toBooleanArray(existingTimer.roundExpired);
    const remoteOvertime = toBooleanArray(existingTimer.playersInOvertime);

    const roundTimesLeftFallback =
      remoteRoundTimes.length === PLAYER_COUNT
        ? remoteRoundTimes
        : Array(PLAYER_COUNT).fill(roundSecondsTotal);
    const roundExpiredFallback =
      remoteRoundExpired.length === PLAYER_COUNT
        ? remoteRoundExpired
        : Array(PLAYER_COUNT).fill(false);

    // If every field we actually control matches what THIS device last
    // wrote, this update is just the realtime echo of our own save — trust
    // local state entirely rather than re-deriving anything from it, for two
    // separate reasons: (1) elapsed-since-$updatedAt would otherwise double-
    // count the save's own round-trip latency on top of what the local tick
    // loop already ticked through, and (2) `roundLastPausedAt` round-trips
    // through Appwrite's datetime storage, which can reformat the string
    // (dropped milliseconds, timezone notation) — re-parsing our OWN
    // just-written timestamp back off the echo risks misreading it, which
    // the grace-bar timing is very sensitive to (a misread of even a couple
    // seconds reads as "grace already expired"). Deliberately not comparing
    // roundLastPausedAt itself for this check — everything else matching is
    // signal enough, and it's the one field we most want to leave untouched.
    const written = lastWrittenTickRef.current;
    const isOwnEcho =
      remoteTimes.length === PLAYER_COUNT &&
      written !== null &&
      JSON.stringify(written.playerTimes) === JSON.stringify(remoteTimes) &&
      JSON.stringify(written.playersPaused) === JSON.stringify(paused) &&
      JSON.stringify(written.roundTimesLeft) === JSON.stringify(roundTimesLeftFallback) &&
      JSON.stringify(written.roundExpired) === JSON.stringify(roundExpiredFallback);
    if (isOwnEcho) {
      return;
    }

    roundLastPausedAtRef.current = remoteLastPausedArr;

    // The local pause action already starts each seat's grace animation
    // immediately (see handlePress/toggleAllPause/handlePause) using this
    // same function — this re-sync is what makes it reach every OTHER device
    // watching this table too. Skipped per-seat when that seat's pause
    // moment hasn't actually changed since the last sync, so unrelated
    // realtime updates (another seat's action touching the same doc) don't
    // keep restarting an already-correct, already-running animation.
    const graceNow = Date.now();
    paused.forEach((isPausedSeat, i) => {
      const lastPausedAtIso = isPausedSeat ? roundLastPausedAtRef.current[i] : null;
      if (lastSyncedGraceRef.current[i] === lastPausedAtIso) {
        return;
      }
      lastSyncedGraceRef.current[i] = lastPausedAtIso;
      syncGraceAnimation(graceAnims.current[i], isPausedSeat, lastPausedAtIso, graceNow);
    });

    if (remoteTimes.length !== PLAYER_COUNT) {
      return;
    }

    // Only the very first sync of a given doc (mount, or switching table/
    // game) fast-forwards for elapsed real time since it was last saved —
    // see hydratedDocIdRef above for why every later live update trusts the
    // incoming values as-is instead.
    const isFirstHydration = hydratedDocIdRef.current !== existingTimer.$id;
    hydratedDocIdRef.current = existingTimer.$id;

    const reconciled = isFirstHydration
      ? reconcileRoundAndPool(
          remoteTimes,
          roundTimesLeftFallback,
          roundExpiredFallback,
          paused,
          roundSecondsTotal,
          existingTimer.$updatedAt,
          Date.now(),
        )
      : {
          poolTimes: remoteTimes,
          roundTimesLeft: roundTimesLeftFallback,
          roundExpired: roundExpiredFallback,
        };
    const playersInOvertime = reconciled.poolTimes.map(
      (v, i) => (remoteOvertime[i] ?? false) || v <= 0,
    );

    setTickState({
      times: reconciled.poolTimes,
      roundTimesLeft: reconciled.roundTimesLeft,
      roundExpired: reconciled.roundExpired,
      playersInOvertime,
    });

    reconciled.poolTimes.forEach((v, i) => {
      depleteAnims.current[i].setValue(Math.min(1, Math.max(0, 1 - v / totalSeconds)));
    });
  }, [existingTimer, totalSeconds, roundSecondsTotal]);

  const getOrCreateTimerId = useCallback(async (): Promise<string | null> => {
    if (timerDocIdRef.current) {
      return timerDocIdRef.current;
    }
    if (tableNumber === null) {
      return null;
    }
    const inCollection = timerStore.collection.find(
      (tm) =>
        tm.table === tableNumber && resolveGameId(tm.games) === (gameId ?? null),
    );
    if (inCollection) {
      timerDocIdRef.current = inCollection.$id;
      return inCollection.$id;
    }
    const defaults = makeDefaultTickState(totalSeconds, roundSecondsTotal);
    const doc = await timerStore.add({
      table: tableNumber,
      games: gameId ?? null,
      playerTimes: defaults.times,
      playersPaused: Array(PLAYER_COUNT).fill(true),
      playersInOvertime: defaults.playersInOvertime,
      roundTimesLeft: defaults.roundTimesLeft,
      roundExpired: defaults.roundExpired,
      roundLastPausedAt: Array(PLAYER_COUNT).fill(null),
      playerPositions: [],
    });
    if (doc) {
      timerDocIdRef.current = doc.$id;
    }
    return doc?.$id ?? null;
  }, [timerStore, gameId, tableNumber, totalSeconds, roundSecondsTotal]);

  const persistPatch = useCallback(
    async (
      patch: Partial<
        Pick<
          Timer,
          | "playerTimes"
          | "playersPaused"
          | "playersInOvertime"
          | "roundTimesLeft"
          | "roundExpired"
          | "roundLastPausedAt"
          | "playerPositions"
          | "hasCustomTimer"
        >
      > & {
        // `null` (not just omitted/undefined) clears a per-table override so
        // the game's default takes over again — see handleUseDefaultTimer.
        durationMinutesTotal?: number | null;
        roundSecondsTotal?: number | null;
        direction?: Timer["direction"] | null;
      },
    ) => {
      const id = await getOrCreateTimerId();
      if (!id) {
        return;
      }
      if (patch.playerTimes && patch.playersPaused && patch.roundTimesLeft && patch.roundExpired) {
        lastWrittenTickRef.current = {
          playerTimes: patch.playerTimes,
          playersPaused: patch.playersPaused,
          roundTimesLeft: patch.roundTimesLeft,
          roundExpired: patch.roundExpired,
        };
      }
      await timerStore.update({ $id: id, ...patch } as any, true);
    },
    [timerStore, getOrCreateTimerId],
  );

  // Ticks every unpaused seat once per second — round time first (while the
  // round-timer feature is enabled and this seat's round hasn't expired yet),
  // then the pool once the round is spent. A single setState keeps the three
  // coupled arrays (times / roundTimesLeft / roundExpired) atomic per tick.
  useEffect(() => {
    if (!playersPaused.some((p) => !p)) {
      return;
    }
    const interval = setInterval(() => {
      setTickState((prev) => {
        const times = [...prev.times];
        const roundTimesLeft = [...prev.roundTimesLeft];
        const roundExpired = [...prev.roundExpired];
        const playersInOvertime = [...prev.playersInOvertime];

        for (let i = 0; i < PLAYER_COUNT; i++) {
          if (playersPausedRef.current[i]) {
            continue;
          }

          if (roundSecondsTotalRef.current > 0 && !roundExpired[i]) {
            roundTimesLeft[i] -= 1;
            if (roundTimesLeft[i] <= 0) {
              roundExpired[i] = true;
            }
          } else {
            times[i] -= 1;
            if (times[i] <= 0) {
              playersInOvertime[i] = true;
            }
          }

          Animated.timing(depleteAnims.current[i], {
            toValue: Math.min(1, Math.max(0, 1 - times[i] / totalSeconds)),
            duration: 950,
            useNativeDriver: false,
          }).start();
        }

        return { times, roundTimesLeft, roundExpired, playersInOvertime };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [playersPaused, totalSeconds]);

  // Auto-rings the table bell once a seat's pool is exhausted, same as
  // before — the deterministic bell id (table-bell-store.ts) is what keeps
  // this from creating duplicate bells when multiple devices race to notice
  // the same timeout at the same moment.
  useEffect(() => {
    if (tableNumber === null) {
      return;
    }
    const anyOvertime = tickState.playersInOvertime.some(Boolean);
    // Only reset the guard once overtime is actually resolved (reset, custom
    // timer, or a fresh round) — NOT just because the bell was dismissed or
    // acknowledged. Otherwise dismissing a bell while the pool is still
    // exhausted immediately re-creates it, since the underlying condition
    // never went away.
    if (!anyOvertime) {
      bellFiredRef.current = false;
      return;
    }
    // A still-unacknowledged bell already covers this table — don't
    // duplicate it. An already-acknowledged bell was for an earlier, now
    // resolved concern (e.g. a previous overtime episode) and shouldn't
    // silently block alerting staff to a fresh timeout.
    const blockingBell = bell && !bell.acknowledgeTime;
    if (bellFiredRef.current || blockingBell) {
      bellFiredRef.current = true;
      return;
    }
    bellFiredRef.current = true;
    if (bell) {
      // Re-ring the same (already-acknowledged) bell rather than creating a
      // second row — the deterministic id only allows one per table anyway.
      tableBellStore.update({
        $id: bell.$id,
        startTime: new Date().toISOString(),
        acknowledgeTime: null as unknown as undefined,
        locked: true,
        reason: t("timerElapsed"),
      });
    } else {
      tableBellStore.add({
        table: tableNumber,
        startTime: new Date().toISOString(),
        locked: true,
        reason: t("timerElapsed"),
      });
    }
  }, [tickState.playersInOvertime, bell, t, tableBellStore, tableNumber]);

  const handleCellLayout = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    setCellSize({ w, h });
  };

  const handlePress = (idx: number) => {
    const now = Date.now();
    const wasPaused = playersPaused[idx];

    const nextPaused = [...playersPaused];
    let nextRoundTimesLeft = tickState.roundTimesLeft;
    let nextRoundExpired = tickState.roundExpired;
    const nextLastPaused = [...roundLastPausedAtRef.current];

    if (pauseMode === "auto" && wasPaused) {
      // Activating a seat stops every other running seat — the classic
      // single-active-player feel. Manual mode skips this: seats keep
      // running independently until paused individually or via "pause all".
      for (let i = 0; i < PLAYER_COUNT; i++) {
        if (i !== idx && !nextPaused[i]) {
          nextPaused[i] = true;
          nextLastPaused[i] = new Date(now).toISOString();
          depleteAnims.current[i].stopAnimation();
          syncGraceAnimation(graceAnims.current[i], true, nextLastPaused[i], now);
          lastSyncedGraceRef.current[i] = nextLastPaused[i];
        }
      }
    }

    nextPaused[idx] = !wasPaused;

    if (nextPaused[idx]) {
      nextLastPaused[idx] = new Date(now).toISOString();
      syncGraceAnimation(graceAnims.current[idx], true, nextLastPaused[idx], now);
      lastSyncedGraceRef.current[idx] = nextLastPaused[idx];
    } else {
      const resumed = resumeRoundState(
        idx,
        now,
        nextLastPaused[idx],
        roundSecondsTotal,
        nextRoundTimesLeft,
        nextRoundExpired,
      );
      nextRoundTimesLeft = resumed.roundTimesLeft;
      nextRoundExpired = resumed.roundExpired;
      syncGraceAnimation(graceAnims.current[idx], false, null, now);
      lastSyncedGraceRef.current[idx] = null;
    }

    setPlayersPaused(nextPaused);
    setTickState((prev) => ({ ...prev, roundTimesLeft: nextRoundTimesLeft, roundExpired: nextRoundExpired }));
    roundLastPausedAtRef.current = nextLastPaused;

    persistPatch({
      playerTimes: tickState.times,
      playersPaused: nextPaused,
      playersInOvertime: tickState.playersInOvertime,
      roundTimesLeft: nextRoundTimesLeft,
      roundExpired: nextRoundExpired,
      roundLastPausedAt: nextLastPaused,
    });
  };

  const allPaused = playersPaused.every(Boolean);

  // Unconditionally pauses or resumes every seat — not just whichever seat
  // happens to be running (relevant in Auto mode, where normally only one
  // seat runs at a time: this button still has to reach the other three).
  const toggleAllPause = useCallback(() => {
    const now = Date.now();
    const nextLastPaused = [...roundLastPausedAtRef.current];
    const nextPaused = Array(PLAYER_COUNT).fill(!allPaused);
    let nextRoundTimesLeft = tickState.roundTimesLeft;
    let nextRoundExpired = tickState.roundExpired;

    if (allPaused) {
      // Resuming everyone — each seat still gets its own grace-window check.
      for (let i = 0; i < PLAYER_COUNT; i++) {
        const resumed = resumeRoundState(
          i,
          now,
          nextLastPaused[i],
          roundSecondsTotal,
          nextRoundTimesLeft,
          nextRoundExpired,
        );
        nextRoundTimesLeft = resumed.roundTimesLeft;
        nextRoundExpired = resumed.roundExpired;
        syncGraceAnimation(graceAnims.current[i], false, null, now);
        lastSyncedGraceRef.current[i] = null;
      }
    } else {
      playersPaused.forEach((paused, i) => {
        if (paused) {
          return;
        }
        nextLastPaused[i] = new Date(now).toISOString();
        depleteAnims.current[i].stopAnimation();
        syncGraceAnimation(graceAnims.current[i], true, nextLastPaused[i], now);
        lastSyncedGraceRef.current[i] = nextLastPaused[i];
      });
    }

    setPlayersPaused(nextPaused);
    setTickState((prev) => ({ ...prev, roundTimesLeft: nextRoundTimesLeft, roundExpired: nextRoundExpired }));
    roundLastPausedAtRef.current = nextLastPaused;

    persistPatch({
      playerTimes: tickState.times,
      playersPaused: nextPaused,
      playersInOvertime: tickState.playersInOvertime,
      roundTimesLeft: nextRoundTimesLeft,
      roundExpired: nextRoundExpired,
      roundLastPausedAt: nextLastPaused,
    });
  }, [allPaused, playersPaused, tickState, roundSecondsTotal, persistPatch]);

  const handleReset = async (): Promise<boolean> => {
    const ok = await confirm({
      title: t("confirmReset.title"),
      message: t("confirmReset.message"),
      confirmLabel: t("confirmReset.confirm"),
      cancelLabel: t("confirmReset.cancel"),
      destructive: true,
    });
    if (!ok) {
      return false;
    }

    timerStartedRef.current = false;
    bellFiredRef.current = false;
    const fresh = makeDefaultTickState(totalSeconds, roundSecondsTotal);
    const freshPaused = Array(PLAYER_COUNT).fill(true);
    const freshLastPaused = Array(PLAYER_COUNT).fill(null);

    setTickState(fresh);
    setPlayersPaused(freshPaused);
    roundLastPausedAtRef.current = freshLastPaused;
    depleteAnims.current.forEach((anim) => anim.setValue(0));
    graceAnims.current.forEach((anim) => anim.setValue(0));
    lastSyncedGraceRef.current = Array(PLAYER_COUNT).fill(null);

    persistPatch({
      playerTimes: fresh.times,
      playersPaused: freshPaused,
      playersInOvertime: fresh.playersInOvertime,
      roundTimesLeft: fresh.roundTimesLeft,
      roundExpired: fresh.roundExpired,
      roundLastPausedAt: freshLastPaused,
    });
    return true;
  };

  const handleSaveCustomTimer = useCallback(
    async (durationMinutes: number, dir: "up" | "down", newRoundSeconds: number) => {
      const newTotalSeconds = (durationMinutes * 60) / PLAYER_COUNT;
      const fresh = makeDefaultTickState(newTotalSeconds, newRoundSeconds);
      const freshPaused = Array(PLAYER_COUNT).fill(true);
      const freshLastPaused = Array(PLAYER_COUNT).fill(null);

      timerStartedRef.current = false;
      bellFiredRef.current = false;
      setTickState(fresh);
      setPlayersPaused(freshPaused);
      roundLastPausedAtRef.current = freshLastPaused;
      depleteAnims.current.forEach((anim) => anim.setValue(0));
      graceAnims.current.forEach((anim) => anim.setValue(0));
      lastSyncedGraceRef.current = Array(PLAYER_COUNT).fill(null);

      await persistPatch({
        durationMinutesTotal: durationMinutes,
        roundSecondsTotal: newRoundSeconds,
        direction: dir,
        hasCustomTimer: true,
        playerTimes: fresh.times,
        playersPaused: freshPaused,
        playersInOvertime: fresh.playersInOvertime,
        roundTimesLeft: fresh.roundTimesLeft,
        roundExpired: fresh.roundExpired,
        roundLastPausedAt: freshLastPaused,
      });
    },
    [persistPatch],
  );

  // Discards the per-table custom timer override (if any) and reverts to
  // the game's default timer settings — same reset semantics as
  // handleReset, but also clears durationMinutesTotal/roundSecondsTotal/
  // direction on the Timer doc so those fall back to `timerSettings` again.
  const handleUseDefaultTimer = useCallback(async (): Promise<boolean> => {
    const ok = await confirm({
      title: t("confirmUseDefaultTimer.title"),
      message: t("confirmUseDefaultTimer.message"),
      confirmLabel: t("confirmUseDefaultTimer.confirm"),
      cancelLabel: t("confirmUseDefaultTimer.cancel"),
      destructive: true,
    });
    if (!ok) {
      return false;
    }

    const defaultDuration = timerSettings?.durationMinutesTotal;
    const defaultRoundSeconds = timerSettings?.roundSecondsTotal || 0;
    const defaultTotalSeconds = defaultDuration
      ? (defaultDuration * 60) / PLAYER_COUNT
      : DEFAULT_SECONDS;
    const fresh = makeDefaultTickState(defaultTotalSeconds, defaultRoundSeconds);
    const freshPaused = Array(PLAYER_COUNT).fill(true);
    const freshLastPaused = Array(PLAYER_COUNT).fill(null);

    timerStartedRef.current = false;
    bellFiredRef.current = false;
    setTickState(fresh);
    setPlayersPaused(freshPaused);
    roundLastPausedAtRef.current = freshLastPaused;
    depleteAnims.current.forEach((anim) => anim.setValue(0));
    graceAnims.current.forEach((anim) => anim.setValue(0));
    lastSyncedGraceRef.current = Array(PLAYER_COUNT).fill(null);

    await persistPatch({
      durationMinutesTotal: null,
      roundSecondsTotal: null,
      direction: null,
      hasCustomTimer: false,
      playerTimes: fresh.times,
      playersPaused: freshPaused,
      playersInOvertime: fresh.playersInOvertime,
      roundTimesLeft: fresh.roundTimesLeft,
      roundExpired: fresh.roundExpired,
      roundLastPausedAt: freshLastPaused,
    });
    return true;
  }, [confirm, t, timerSettings, persistPatch]);

  // Force-pauses every running seat — used when leaving the timer screen so
  // no seat keeps ticking unattended once nobody's looking at this device.
  const handlePause = useCallback(() => {
    if (playersPaused.every(Boolean)) {
      return;
    }
    const now = Date.now();
    const nextLastPaused = [...roundLastPausedAtRef.current];
    playersPaused.forEach((paused, i) => {
      if (paused) {
        return;
      }
      nextLastPaused[i] = new Date(now).toISOString();
      depleteAnims.current[i].stopAnimation();
      syncGraceAnimation(graceAnims.current[i], true, nextLastPaused[i], now);
      lastSyncedGraceRef.current[i] = nextLastPaused[i];
    });
    const nextPaused = Array(PLAYER_COUNT).fill(true);
    setPlayersPaused(nextPaused);
    roundLastPausedAtRef.current = nextLastPaused;
    persistPatch({
      playerTimes: tickState.times,
      playersPaused: nextPaused,
      playersInOvertime: tickState.playersInOvertime,
      roundTimesLeft: tickState.roundTimesLeft,
      roundExpired: tickState.roundExpired,
      roundLastPausedAt: nextLastPaused,
    });
  }, [playersPaused, tickState, persistPatch]);

  return {
    times: tickState.times,
    roundTimesLeft: tickState.roundTimesLeft,
    roundExpired: tickState.roundExpired,
    playersInOvertime: tickState.playersInOvertime,
    playersPaused,
    allPaused,
    depleteAnims,
    graceAnims,
    totalSeconds,
    effectiveDuration,
    roundSecondsTotal,
    direction,
    playerColors,
    cellSize,
    handleCellLayout,
    handlePress,
    handlePause,
    handleReset,
    handleSaveCustomTimer,
    handleUseDefaultTimer,
    toggleAllPause,
    existingTimer,
    timerSettings,
  };
}
