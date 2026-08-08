import { useDialog } from "@/lib/components/ui/Dialog";
import { useTableBellStore } from "@/lib/stores/appwrite/table-bell-store";
import { useTimerSettingsStore } from "@/lib/stores/appwrite/timer-settings-store";
import { useTimerStore } from "@/lib/stores/appwrite/timer-store";
import { buildPlayerColor, PLAYER_COLORS } from "@/lib/utils/timerColors";
import {
  arraysEqual,
  reconcileRoundAndPool,
  resolveEffectiveTimer,
  resolveGameId,
  toBooleanArray,
  toNumberArray,
} from "@/lib/utils";
import { useSecureStoragePerGame } from "@/lib/hooks/useSecureStoragePerGame";
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
/** How far apart two `roundLastPausedAt` readings are allowed to be and
 *  still count as "the same write" for own-echo detection (see
 *  roundLastPausedRoughlyEqual) — covers Appwrite's datetime storage
 *  reformatting (dropped milliseconds) round-tripping our OWN write, while
 *  staying far tighter than any two independently-acting devices' clocks
 *  could plausibly land by coincidence. */
const OWN_ECHO_TIMESTAMP_TOLERANCE_MS = 1500;

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

function makeAnimatedValueArray(): Animated.Value[] {
  return Array.from({ length: PLAYER_COUNT }, () => new Animated.Value(0));
}

function parseIso(iso: string | null): number | null {
  return iso ? new Date(iso).getTime() : null;
}

/** Tolerant per-seat equality for `roundLastPausedAt` arrays — used only to
 *  decide whether an incoming update is this device's OWN echo. Two
 *  INDEPENDENT devices pausing/resuming the same seat, even seconds apart in
 *  the same manual test, still land far outside `toleranceMs`; deliberately
 *  not exact-string equality (see the isOwnEcho comment on why that's
 *  fragile against Appwrite's datetime storage reformatting our own value). */
function roundLastPausedRoughlyEqual(
  a: (string | null)[],
  b: (string | null)[],
  toleranceMs: number,
): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    const av = a[i];
    const bv = b[i];
    if (av === null || bv === null) {
      if (av !== bv) {
        return false;
      }
      continue;
    }
    const at = parseIso(av);
    const bt = parseIso(bv);
    if (at === null || bt === null || Math.abs(at - bt) > toleranceMs) {
      return false;
    }
  }
  return true;
}

function parsePlayerColors(raw: string): string[] | null {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
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
  const lastPausedAt = parseIso(lastPausedAtIso);
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
  const lastPausedAt = parseIso(lastPausedAtIso);
  if (lastPausedAt === null) {
    // Paused but never actually paused-with-a-timestamp yet (fresh seat,
    // still on its very first round) — grace doesn't apply. Treating this
    // as "already fully elapsed" (as if resuming would forfeit progress)
    // made TimerCell hide the round badge for a round that hadn't even
    // started: the first-ever sync of a brand new Timer doc sends every
    // untouched seat through here with `lastPausedAtIso === null`, and the
    // resulting anim=1 read as `graceExpired` a moment later.
    anim.setValue(0);
    return;
  }
  const elapsed = now - lastPausedAt;
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

  // Keyed by (gameId, tableNumber) — matches game.tsx's write side exactly
  // (see useSecureStoragePerGame and the comment on playerColorsKey there).
  // A game can have several tables; each needs its own setup, so this can't
  // be keyed by gameId alone.
  const playerColorsScope =
    gameId && tableNumber !== null ? `${gameId}_${tableNumber}` : undefined;
  const [storedHexColors] = useSecureStoragePerGame<string[] | null>(
    "playerColors",
    playerColorsScope,
    null,
    parsePlayerColors,
  );

  const playerColors = useMemo(() => {
    const saved = storedHexColors ?? timerSettings?.colors;
    return Array.from({ length: PLAYER_COUNT }, (_, i) => {
      const hex = saved?.[i];
      return hex
        ? buildPlayerColor(hex)
        : PLAYER_COLORS[i % PLAYER_COLORS.length];
    });
  }, [storedHexColors, timerSettings?.colors]);

  const { effectiveDuration, roundSecondsTotal, direction } = resolveEffectiveTimer(
    existingTimer,
    timerSettings,
  );
  const totalSeconds = effectiveDuration
    ? (effectiveDuration * 60) / PLAYER_COUNT
    : DEFAULT_SECONDS;

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
  // Per seat — Manual mode allows several seats to run (and time out)
  // independently, so one seat's already-acknowledged bell must not
  // silently swallow a DIFFERENT seat's fresh timeout (see the bell effect).
  const bellFiredRef = useRef<boolean[]>(Array(PLAYER_COUNT).fill(false));
  const depleteAnims = useRef(makeAnimatedValueArray());
  const graceAnims = useRef(makeAnimatedValueArray());
  // Tracks which `roundLastPausedAt` timestamp each seat's grace animation
  // was last (re)started from — lets the sync effect below skip redundant
  // restarts when a seat's own pause moment hasn't changed.
  const lastSyncedGraceRef = useRef<(string | null)[]>(
    Array(PLAYER_COUNT).fill(undefined as unknown as string | null),
  );
  // The raw (uncorrected) `roundLastPausedAt` value last seen per seat from
  // the remote doc — used only to detect whether a seat's pause moment
  // genuinely changed since the previous sync (see the sync effect's
  // clock-skew correction below).
  const rawLastPausedAtRef = useRef<(string | null)[]>(
    Array(PLAYER_COUNT).fill(undefined as unknown as string | null),
  );
  // Server-anchored (`$updatedAt`-substituted) equivalent of
  // `roundLastPausedAtRef`, used ONLY by `resumeRoundState`'s grace check —
  // deliberately NOT what feeds the grace-bar animation or what gets
  // persisted back. See the sync effect for why these two need to diverge:
  // this app's realtime delivery can lag by multiple real seconds (see
  // hydratedDocIdRef's comment), which the animation tolerates fine (it's
  // cosmetic — a late-discovered pause just animates less), but which turns
  // the FUNCTIONAL round-reset decision unusable if it's ALSO forced through
  // the exact same substitution: a cross-device resume would then read as
  // "outside grace" almost every time purely from delivery lag. Kept
  // separate so only the "is this seat's clock-skew-prone raw timestamp
  // trustworthy for a security-relevant decision" question uses the
  // server-anchored value; the animation keeps using the original, more
  // forgiving raw value.
  const correctedLastPausedAtRef = useRef<(string | null)[]>(
    Array(PLAYER_COUNT).fill(null),
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
    // seconds reads as "grace already expired").
    //
    // `roundLastPausedAt` IS still checked, but tolerantly (see
    // roundLastPausedRoughlyEqual) rather than by exact string equality —
    // exact equality would reject genuine echoes over the reformatting risk
    // above, but SKIPPING the field entirely turned out worse: two devices
    // that each did their own quick pause/unpause on a freshly-reset timer
    // can produce byte-identical playerTimes/playersPaused/roundTimesLeft/
    // roundExpired purely by coincidence (nothing had ticked yet to tell
    // them apart), which made one device mistake the OTHER's genuinely new
    // update for its own echo and silently skip processing it — including
    // the grace-bar animation. `roundLastPausedAtRef.current` (read here,
    // before this effect reassigns it below) is this device's own most
    // recent per-seat pause timestamp, checked against the incoming value
    // within a tolerance — comfortably wider than storage reformatting,
    // comfortably narrower than two independently-acting devices' timestamps
    // could plausibly coincide.
    const written = lastWrittenTickRef.current;
    const isOwnEcho =
      remoteTimes.length === PLAYER_COUNT &&
      written !== null &&
      arraysEqual(written.playerTimes, remoteTimes) &&
      arraysEqual(written.playersPaused, paused) &&
      arraysEqual(written.roundTimesLeft, roundTimesLeftFallback) &&
      arraysEqual(written.roundExpired, roundExpiredFallback) &&
      roundLastPausedRoughlyEqual(
        roundLastPausedAtRef.current,
        remoteLastPausedArr,
        OWN_ECHO_TIMESTAMP_TOLERANCE_MS,
      );
    if (isOwnEcho) {
      return;
    }

    // Only the very first sync of a given doc (mount, or switching table/
    // game) fast-forwards for elapsed real time since it was last saved —
    // see hydratedDocIdRef above for why every later live update trusts the
    // incoming values as-is instead. Read here (rather than only further
    // below, where this check used to live) because the clock-skew
    // correction right after it needs the same distinction — but the actual
    // hydratedDocIdRef WRITE stays at its original spot, gated on remoteTimes
    // being valid, so a malformed/missing playerTimes on this sync doesn't
    // burn the one legitimate "first hydration" catch-up for this doc.
    const isFirstHydration = hydratedDocIdRef.current !== existingTimer.$id;

    // `roundLastPausedAt` entries are authored by whichever device paused
    // that seat, using ITS OWN clock — feeds both the grace-bar animation
    // AND (via resumeRoundState) the actual round-reset decision. Kept raw
    // here for the animation: this app's realtime delivery can itself lag by
    // multiple real seconds (see hydratedDocIdRef's comment above), and the
    // animation is cosmetic enough that a late-discovered pause just
    // animating less is preferable to a "corrected" version that reads as
    // already-expired on almost every remote sync regardless of clock skew.
    roundLastPausedAtRef.current = remoteLastPausedArr;

    // Server-anchored variant, kept ONLY for resumeRoundState's grace check
    // (see correctedLastPausedAtRef above for why it must stay separate from
    // the raw value the animation uses). Substituting `existingTimer.
    // $updatedAt` for the acting device's self-reported timestamp removes
    // that device's clock skew from THIS decision specifically — the one
    // place a skewed clock could otherwise let round-time survive a resume
    // it shouldn't, or force a reset on one that was legitimately quick.
    // Doc-level, so only trustworthy exactly when a seat's raw timestamp
    // just changed on a live (non-first-hydration) sync; untouched seats
    // keep their previously-frozen correction, and first hydration falls
    // back to the raw value (a stale pause is stale by minutes, not
    // milliseconds, so the imprecision there is harmless).
    const docUpdatedAtIso = existingTimer.$updatedAt;
    correctedLastPausedAtRef.current = remoteLastPausedArr.map((iso, i) => {
      if (iso === rawLastPausedAtRef.current[i]) {
        return correctedLastPausedAtRef.current[i];
      }
      rawLastPausedAtRef.current[i] = iso;
      if (iso === null || isFirstHydration) {
        return iso;
      }
      return docUpdatedAtIso;
    });

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

    // isFirstHydration was already read above (the clock-skew correction
    // needs the same distinction) — the ref write happens here, same spot as
    // before this fix, once we know remoteTimes is actually usable.
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
    if (existingTimer) {
      timerDocIdRef.current = existingTimer.$id;
      return existingTimer.$id;
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
  }, [timerStore, gameId, tableNumber, totalSeconds, roundSecondsTotal, existingTimer]);

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
          | "durationMinutesTotal"
          | "roundSecondsTotal"
          | "direction"
        >
      >,
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
      const ok = await timerStore.update({ $id: id, ...patch }, true);
      if (ok) {
        return;
      }
      // The cached doc id may be stale (doc deleted/recreated server-side) —
      // drop it and resolve/create again, then retry once, so a transient
      // or stale-id failure doesn't leave this device silently diverged from
      // the backend until an app restart (parity with the pre-rework
      // saveState, which had the same self-heal).
      timerDocIdRef.current = null;
      const retryId = await getOrCreateTimerId();
      if (retryId) {
        await timerStore.update({ $id: retryId, ...patch }, true);
      }
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
            // Only the pool actually changed this tick — restarting this
            // animation while a seat is still in its round-time phase would
            // just re-target the exact value it's already resting at.
            Animated.timing(depleteAnims.current[i], {
              toValue: Math.min(1, Math.max(0, 1 - times[i] / totalSeconds)),
              duration: 950,
              useNativeDriver: false,
            }).start();
          }
        }

        return { times, roundTimesLeft, roundExpired, playersInOvertime };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [playersPaused, totalSeconds]);

  // Auto-rings the table bell once a seat's pool is exhausted. Tracked per
  // seat (not as one shared flag) — Manual mode allows multiple seats to run
  // (and time out) independently, so a bell already acknowledged for an
  // earlier seat's timeout must not silently swallow a LATER, different
  // seat's fresh timeout. The deterministic bell id (table-bell-store.ts) is
  // what keeps this from creating duplicate bells when multiple devices race
  // to notice the same timeout at the same moment.
  useEffect(() => {
    if (tableNumber === null) {
      return;
    }
    const overtime = tickState.playersInOvertime;
    let hasFreshTimeout = false;
    overtime.forEach((isOver, i) => {
      if (!isOver) {
        // Only reset a seat's own guard once ITS overtime is actually
        // resolved (reset, custom timer, fresh round) — not just because
        // the bell was dismissed/acknowledged, and not because of some
        // OTHER seat's state.
        bellFiredRef.current[i] = false;
        return;
      }
      if (!bellFiredRef.current[i]) {
        hasFreshTimeout = true;
      }
    });
    if (!hasFreshTimeout) {
      return;
    }
    overtime.forEach((isOver, i) => {
      if (isOver) {
        bellFiredRef.current[i] = true;
      }
    });
    // A still-unacknowledged bell already covers this table — don't
    // duplicate it. An already-acknowledged bell was for an earlier, now-
    // resolved (or different-seat) concern and shouldn't silently block
    // alerting staff to this fresh timeout.
    if (bell && !bell.acknowledgeTime) {
      return;
    }
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

  // Pauses seat `i` locally: freezes its deplete animation, records the
  // pause moment, and (re)starts its grace-bar animation from it. The one
  // piece of "what does pausing a seat do" logic, shared by every path that
  // can pause a seat (press, pause-all, auto-mode preemption, force-pause on
  // screen exit) so none of them can drift from the others.
  // `nextCorrectedLastPaused` mirrors `nextLastPaused` for this same seat —
  // a LOCAL pause needs no cross-device clock correction (same clock through
  // both the pause and any later resume on this device), so both arrays get
  // the identical timestamp. See correctedLastPausedAtRef for why the two
  // arrays exist at all.
  const pauseSeatLocally = useCallback(
    (
      i: number,
      now: number,
      nextLastPaused: (string | null)[],
      nextCorrectedLastPaused: (string | null)[],
    ) => {
      nextLastPaused[i] = new Date(now).toISOString();
      nextCorrectedLastPaused[i] = nextLastPaused[i];
      depleteAnims.current[i].stopAnimation();
      syncGraceAnimation(graceAnims.current[i], true, nextLastPaused[i], now);
      lastSyncedGraceRef.current[i] = nextLastPaused[i];
    },
    [],
  );

  // Resets every seat to a fresh timer state (local state + anims), for a
  // given pool/round-time budget. Shared by handleReset, handleSaveCustomTimer
  // and handleUseDefaultTimer — the only thing that differs between them is
  // which budget to reset to and which extra fields (if any) to persist.
  const resetTimerLocally = useCallback((newTotalSeconds: number, newRoundSeconds: number) => {
    timerStartedRef.current = false;
    bellFiredRef.current = Array(PLAYER_COUNT).fill(false);
    const fresh = makeDefaultTickState(newTotalSeconds, newRoundSeconds);
    const freshPaused = Array(PLAYER_COUNT).fill(true);
    const freshLastPaused: (string | null)[] = Array(PLAYER_COUNT).fill(null);

    setTickState(fresh);
    setPlayersPaused(freshPaused);
    roundLastPausedAtRef.current = freshLastPaused;
    rawLastPausedAtRef.current = freshLastPaused;
    correctedLastPausedAtRef.current = freshLastPaused;
    depleteAnims.current.forEach((anim) => anim.setValue(0));
    graceAnims.current.forEach((anim) => anim.setValue(0));
    lastSyncedGraceRef.current = Array(PLAYER_COUNT).fill(null);

    return { fresh, freshPaused, freshLastPaused };
  }, []);

  const handlePress = (idx: number) => {
    const now = Date.now();
    const wasPaused = playersPaused[idx];

    const nextPaused = [...playersPaused];
    let nextRoundTimesLeft = tickState.roundTimesLeft;
    let nextRoundExpired = tickState.roundExpired;
    const nextLastPaused = [...roundLastPausedAtRef.current];
    const nextCorrectedLastPaused = [...correctedLastPausedAtRef.current];

    if (pauseMode === "auto" && wasPaused) {
      // Activating a seat stops every other running seat — the classic
      // single-active-player feel. Manual mode skips this: seats keep
      // running independently until paused individually or via "pause all".
      for (let i = 0; i < PLAYER_COUNT; i++) {
        if (i !== idx && !nextPaused[i]) {
          nextPaused[i] = true;
          pauseSeatLocally(i, now, nextLastPaused, nextCorrectedLastPaused);
        }
      }
    }

    nextPaused[idx] = !wasPaused;

    if (nextPaused[idx]) {
      pauseSeatLocally(idx, now, nextLastPaused, nextCorrectedLastPaused);
    } else {
      const resumed = resumeRoundState(
        idx,
        now,
        correctedLastPausedAtRef.current[idx],
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
    correctedLastPausedAtRef.current = nextCorrectedLastPaused;
    // This device authored every entry in `nextLastPaused` itself (no cross-
    // device skew involved) — mark it as already-raw so the next remote sync
    // recognizes its own echo unchanged instead of "correcting" it again.
    rawLastPausedAtRef.current = nextLastPaused;

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
    const nextCorrectedLastPaused = [...correctedLastPausedAtRef.current];
    const nextPaused = Array(PLAYER_COUNT).fill(!allPaused);
    let nextRoundTimesLeft = tickState.roundTimesLeft;
    let nextRoundExpired = tickState.roundExpired;

    if (allPaused) {
      // Resuming everyone — each seat still gets its own grace-window check.
      for (let i = 0; i < PLAYER_COUNT; i++) {
        const resumed = resumeRoundState(
          i,
          now,
          correctedLastPausedAtRef.current[i],
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
        pauseSeatLocally(i, now, nextLastPaused, nextCorrectedLastPaused);
      });
    }

    setPlayersPaused(nextPaused);
    setTickState((prev) => ({ ...prev, roundTimesLeft: nextRoundTimesLeft, roundExpired: nextRoundExpired }));
    roundLastPausedAtRef.current = nextLastPaused;
    correctedLastPausedAtRef.current = nextCorrectedLastPaused;
    rawLastPausedAtRef.current = nextLastPaused;

    persistPatch({
      playerTimes: tickState.times,
      playersPaused: nextPaused,
      playersInOvertime: tickState.playersInOvertime,
      roundTimesLeft: nextRoundTimesLeft,
      roundExpired: nextRoundExpired,
      roundLastPausedAt: nextLastPaused,
    });
  }, [allPaused, playersPaused, tickState, roundSecondsTotal, persistPatch, pauseSeatLocally]);

  // Manual mode allows multiple seats to run concurrently; Auto mode's whole
  // premise (single active-pip highlighting, "starting one stops the
  // others") assumes at most one. Switching Manual → Auto while more than
  // one seat is still running would otherwise silently violate that
  // invariant until the user happens to press one of them — force-pause
  // everyone instead, the same "stop first, let the user pick" concept as
  // the auto-mode preemption in handlePress. Reacts only to the mode
  // actually CHANGING (via prevPauseModeRef), not to every render where
  // several seats happen to be running — the explicit "resume all" button
  // must still be able to run every seat at once regardless of mode.
  const prevPauseModeRef = useRef(pauseMode);
  useEffect(() => {
    const prev = prevPauseModeRef.current;
    prevPauseModeRef.current = pauseMode;
    if (prev === pauseMode || pauseMode !== "auto") {
      return;
    }
    if (playersPausedRef.current.filter((p) => !p).length <= 1) {
      return;
    }
    toggleAllPause();
  }, [pauseMode, toggleAllPause]);

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

    const { fresh, freshPaused, freshLastPaused } = resetTimerLocally(totalSeconds, roundSecondsTotal);

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
      const { fresh, freshPaused, freshLastPaused } = resetTimerLocally(newTotalSeconds, newRoundSeconds);

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
    [persistPatch, resetTimerLocally],
  );

  // Discards the per-table custom timer override (if any) and reverts to
  // the game's default timer settings — same reset semantics as
  // handleReset. Only `hasCustomTimer: false` is persisted (not null'd-out
  // duration/round/direction values) — resolveEffectiveTimer already ignores
  // those fields entirely once `hasCustomTimer` is false, and Appwrite's
  // acceptance of an explicit `null` write for a non-nullable numeric/string
  // attribute isn't guaranteed, so there's nothing to gain from writing it.
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
    const { fresh, freshPaused, freshLastPaused } = resetTimerLocally(
      defaultTotalSeconds,
      defaultRoundSeconds,
    );

    await persistPatch({
      hasCustomTimer: false,
      playerTimes: fresh.times,
      playersPaused: freshPaused,
      playersInOvertime: fresh.playersInOvertime,
      roundTimesLeft: fresh.roundTimesLeft,
      roundExpired: fresh.roundExpired,
      roundLastPausedAt: freshLastPaused,
    });
    return true;
  }, [confirm, t, timerSettings, persistPatch, resetTimerLocally]);

  // Force-pauses every running seat — used when leaving the timer screen so
  // no seat keeps ticking unattended once nobody's looking at this device.
  const handlePause = useCallback(() => {
    if (playersPaused.every(Boolean)) {
      return;
    }
    const now = Date.now();
    const nextLastPaused = [...roundLastPausedAtRef.current];
    const nextCorrectedLastPaused = [...correctedLastPausedAtRef.current];
    playersPaused.forEach((paused, i) => {
      if (paused) {
        return;
      }
      pauseSeatLocally(i, now, nextLastPaused, nextCorrectedLastPaused);
    });
    const nextPaused = Array(PLAYER_COUNT).fill(true);
    setPlayersPaused(nextPaused);
    roundLastPausedAtRef.current = nextLastPaused;
    correctedLastPausedAtRef.current = nextCorrectedLastPaused;
    rawLastPausedAtRef.current = nextLastPaused;
    persistPatch({
      playerTimes: tickState.times,
      playersPaused: nextPaused,
      playersInOvertime: tickState.playersInOvertime,
      roundTimesLeft: tickState.roundTimesLeft,
      roundExpired: tickState.roundExpired,
      roundLastPausedAt: nextLastPaused,
    });
  }, [playersPaused, tickState, persistPatch, pauseSeatLocally]);

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
