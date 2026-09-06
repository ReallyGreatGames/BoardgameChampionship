import { useDialog } from "@/lib/components/ui/Dialog";
import { useSecureStoragePerGame } from "@/lib/hooks/useSecureStoragePerGame";
import { useTableBellStore } from "@/lib/stores/appwrite/table-bell-store";
import { useTimerSeatStore } from "@/lib/stores/appwrite/timer-seat-store";
import { useTimerSettingsStore } from "@/lib/stores/appwrite/timer-settings-store";
import { useTimerStore } from "@/lib/stores/appwrite/timer-store";
import {
  computeTableElapsedSeconds,
  reconcileRoundAndPool,
  resolveEffectiveTimer,
  resolveGameId,
} from "@/lib/utils";
import { buildPlayerColor, PLAYER_COLORS } from "@/lib/utils/timerColors";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Easing, LayoutChangeEvent, useWindowDimensions } from "react-native";
import { TableBell } from "../models/table-bell";
import { Timer } from "../models/timer";
import { TimerSeat } from "../models/timer-seat";
import { TimerPauseMode } from "./useTimerLocalSettings";

const DEFAULT_SECONDS = 10 * 60;
const PLAYER_COUNT = 4;
const ROUND_RESET_GRACE_MS = 3000;
const OWN_ECHO_TIMESTAMP_TOLERANCE_MS = 1500;
const PENDING_WRITE_MAX_AGE_MS = 15000;
const SPAM_WINDOW_MS = 2000;
const SPAM_MAX_PRESSES = 12;
const SPAM_COOLDOWN_MS = 3000;

type PendingSeatWrite = {
  playerTime: number;
  paused: boolean;
  roundTimeLeft: number;
  roundExpired: boolean;
  roundLastPausedAt: string | null;
  addedAt: number;
};

type SeatPatch = Partial<
  Pick<TimerSeat, "playerTime" | "paused" | "inOvertime" | "roundTimeLeft" | "roundExpired" | "roundLastPausedAt">
>;

type TablePatch = Partial<
  Pick<
    Timer,
    | "playerPositions"
    | "hasCustomTimer"
    | "durationMinutesTotal"
    | "roundSecondsTotal"
    | "direction"
    | "tableActiveAccumulatedMs"
    | "tableActiveResumedAt"
  >
>;

type TickState = {
  times: number[];
  roundTimesLeft: number[];
  roundExpired: boolean[];
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

function updateClockOffsetEstimate(ref: { current: number }, remoteUpdatedAtIso: string, localNow: number): void {
  const remoteMs = parseIso(remoteUpdatedAtIso);
  if (remoteMs === null) {
    return;
  }
  const sample = remoteMs - localNow;
  if (sample > ref.current) {
    ref.current = sample;
  }
}

function pausedAtRoughlyEqual(a: string | null, b: string | null, toleranceMs: number): boolean {
  if (a === null || b === null) {
    return a === b;
  }
  const at = parseIso(a);
  const bt = parseIso(b);
  return at !== null && bt !== null && Math.abs(at - bt) <= toleranceMs;
}

function tableActiveTransition(
  wasAllPaused: boolean,
  willBeAllPaused: boolean,
  now: number,
  accumulatedMs: number,
  resumedAtIso: string | null,
): { tableActiveAccumulatedMs: number; tableActiveResumedAt: string | null } | null {
  if (wasAllPaused === willBeAllPaused) {
    return null;
  }
  if (willBeAllPaused) {
    const resumedAt = parseIso(resumedAtIso);
    const elapsedMs = resumedAt !== null ? Math.max(0, now - resumedAt) : 0;
    return { tableActiveAccumulatedMs: accumulatedMs + elapsedMs, tableActiveResumedAt: null };
  }
  return { tableActiveAccumulatedMs: accumulatedMs, tableActiveResumedAt: new Date(now).toISOString() };
}

function seatPatchAt(
  seat: number,
  times: number[],
  paused: boolean[],
  overtime: boolean[],
  roundTimesLeft: number[],
  roundExpired: boolean[],
  lastPaused: (string | null)[],
): SeatPatch {
  return {
    playerTime: times[seat],
    paused: paused[seat],
    inOvertime: overtime[seat],
    roundTimeLeft: roundTimesLeft[seat],
    roundExpired: roundExpired[seat],
    roundLastPausedAt: lastPaused[seat],
  };
}

function parsePlayerColors(raw: string): string[] | null {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

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
    anim.setValue(0);
    return;
  }
  const elapsed = now - lastPausedAt;
  if (elapsed >= ROUND_RESET_GRACE_MS) {
    console.log("[DEBUG-grace7f3] syncGraceAnimation: already expired", { now, lastPausedAt, elapsed });
    anim.setValue(1);
    return;
  }
  const seedFraction = Math.max(0, elapsed) / ROUND_RESET_GRACE_MS;
  const duration = ROUND_RESET_GRACE_MS - elapsed;
  console.log("[DEBUG-grace7f3] syncGraceAnimation: seeding", {
    now,
    lastPausedAt,
    elapsed,
    seedFraction,
    duration,
  });
  anim.setValue(seedFraction);
  Animated.timing(anim, {
    toValue: 1,
    duration,
    easing: Easing.linear,
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
  const timerSeatStore = useTimerSeatStore();
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

  const existingSeats = useMemo(
    () =>
      tableNumber !== null
        ? timerSeatStore.collection.filter(
          (s) => s.table === tableNumber && resolveGameId(s.games) === (gameId ?? null),
        )
        : [],
    [timerSeatStore.collection, gameId, tableNumber],
  );

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
  const [spamProtectionActive, setSpamProtectionActive] = useState(false);

  const pressHistoryRef = useRef<number[]>([]);
  const spamCooldownUntilRef = useRef(0);
  const spamCooldownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const registerPressAndCheckSpam = useCallback((now: number): boolean => {
    if (now < spamCooldownUntilRef.current) {
      return false;
    }
    const recent = pressHistoryRef.current.filter((t) => now - t < SPAM_WINDOW_MS);
    recent.push(now);
    pressHistoryRef.current = recent;
    if (recent.length <= SPAM_MAX_PRESSES) {
      return true;
    }
    pressHistoryRef.current = [];
    spamCooldownUntilRef.current = now + SPAM_COOLDOWN_MS;
    setSpamProtectionActive(true);
    if (spamCooldownTimeoutRef.current) {
      clearTimeout(spamCooldownTimeoutRef.current);
    }
    spamCooldownTimeoutRef.current = setTimeout(() => {
      setSpamProtectionActive(false);
      spamCooldownTimeoutRef.current = null;
    }, SPAM_COOLDOWN_MS);
    return false;
  }, []);

  useEffect(() => {
    return () => {
      if (spamCooldownTimeoutRef.current) {
        clearTimeout(spamCooldownTimeoutRef.current);
      }
    };
  }, []);

  const timerStartedRef = useRef(false);
  if (playersPaused.some((p) => !p)) {
    timerStartedRef.current = true;
  }

  const timerDocIdRef = useRef<string | null>(null);
  const seatDocIdRef = useRef<(string | null)[]>(Array(PLAYER_COUNT).fill(null));
  const roundLastPausedAtRef = useRef<(string | null)[]>(
    Array(PLAYER_COUNT).fill(null),
  );
  const bellFiredRef = useRef<boolean[]>(Array(PLAYER_COUNT).fill(false));
  const depleteAnims = useRef(makeAnimatedValueArray());
  const graceAnims = useRef(makeAnimatedValueArray());
  const lastSyncedGraceRef = useRef<(string | null)[]>(
    Array(PLAYER_COUNT).fill(undefined as unknown as string | null),
  );
  const correctedLastPausedAtRef = useRef<(string | null)[]>(
    Array(PLAYER_COUNT).fill(null),
  );
  const pendingWritesRef = useRef<PendingSeatWrite[][]>(
    Array.from({ length: PLAYER_COUNT }, () => []),
  );
  const writeChainRef = useRef<Promise<void>[]>(
    Array.from({ length: PLAYER_COUNT }, () => Promise.resolve()),
  );
  const tableWriteChainRef = useRef<Promise<void>>(Promise.resolve());
  const hydratedSeatDocIdRef = useRef<(string | null)[]>(Array(PLAYER_COUNT).fill(null));
  const lastProcessedSeatDocRef = useRef<(TimerSeat | null)[]>(Array(PLAYER_COUNT).fill(null));
  const latestSeenSeatUpdatedAtRef = useRef<(string | null)[]>(Array(PLAYER_COUNT).fill(null));
  const tableActiveAccumulatedMsRef = useRef(0);
  const tableActiveResumedAtRef = useRef<string | null>(null);
  const latestSeenTableUpdatedAtRef = useRef<string | null>(null);
  const clockOffsetEstimateRef = useRef(0);
  const playersPausedRef = useRef(playersPaused);
  playersPausedRef.current = playersPaused;
  const tickStateRef = useRef(tickState);
  tickStateRef.current = tickState;
  const roundSecondsTotalRef = useRef(roundSecondsTotal);
  roundSecondsTotalRef.current = roundSecondsTotal;

  useEffect(() => {
    if (!existingTimer) {
      return;
    }
    const seen = latestSeenTableUpdatedAtRef.current;
    if (seen !== null && new Date(existingTimer.$updatedAt).getTime() < new Date(seen).getTime()) {
      return;
    }
    latestSeenTableUpdatedAtRef.current = existingTimer.$updatedAt;
    updateClockOffsetEstimate(clockOffsetEstimateRef, existingTimer.$updatedAt, Date.now());
    timerDocIdRef.current = existingTimer.$id;
    tableActiveAccumulatedMsRef.current =
      typeof existingTimer.tableActiveAccumulatedMs === "number"
        ? existingTimer.tableActiveAccumulatedMs
        : 0;
    tableActiveResumedAtRef.current = existingTimer.tableActiveResumedAt ?? null;
  }, [existingTimer]);

  useEffect(() => {
    const graceNow = Date.now();
    type SeatOutcome = {
      paused: boolean;
      poolTime: number;
      roundTimeLeft: number;
      roundExpired: boolean;
      inOvertime: boolean;
    };
    const outcomes: (SeatOutcome | null)[] = Array(PLAYER_COUNT).fill(null);

    for (let i = 0; i < PLAYER_COUNT; i++) {
      const seatDoc = existingSeats.find((s) => s.seat === i);

      if (!seatDoc) {
        lastProcessedSeatDocRef.current[i] = null;
        if (!timerStartedRef.current) {
          depleteAnims.current[i].setValue(0);
          outcomes[i] = {
            paused: true,
            poolTime: totalSeconds,
            roundTimeLeft: roundSecondsTotal,
            roundExpired: false,
            inOvertime: false,
          };
        }
        continue;
      }

      if (seatDoc === lastProcessedSeatDocRef.current[i]) {
        continue;
      }

      const paused = seatDoc.paused;
      const remoteLastPaused = seatDoc.roundLastPausedAt ?? null;

      pendingWritesRef.current[i] = pendingWritesRef.current[i].filter(
        (written) => graceNow - written.addedAt <= PENDING_WRITE_MAX_AGE_MS,
      );

      const matchIdx = pendingWritesRef.current[i].findIndex(
        (written) =>
          written.playerTime === seatDoc.playerTime &&
          written.paused === paused &&
          written.roundTimeLeft === seatDoc.roundTimeLeft &&
          written.roundExpired === seatDoc.roundExpired &&
          pausedAtRoughlyEqual(written.roundLastPausedAt, remoteLastPaused, OWN_ECHO_TIMESTAMP_TOLERANCE_MS),
      );
      if (matchIdx !== -1) {
        pendingWritesRef.current[i] = pendingWritesRef.current[i].slice(matchIdx + 1);
        lastProcessedSeatDocRef.current[i] = seatDoc;
        continue;
      }

      const seenUpdatedAt = latestSeenSeatUpdatedAtRef.current[i];
      if (
        seenUpdatedAt !== null &&
        new Date(seatDoc.$updatedAt).getTime() < new Date(seenUpdatedAt).getTime()
      ) {
        lastProcessedSeatDocRef.current[i] = seatDoc;
        continue;
      }
      latestSeenSeatUpdatedAtRef.current[i] = seatDoc.$updatedAt;
      updateClockOffsetEstimate(clockOffsetEstimateRef, seatDoc.$updatedAt, graceNow);

      const isFirstHydration = hydratedSeatDocIdRef.current[i] !== seatDoc.$id;

      const previousRawLastPaused = roundLastPausedAtRef.current[i];

      roundLastPausedAtRef.current[i] = remoteLastPaused;

      if (remoteLastPaused !== previousRawLastPaused) {
        correctedLastPausedAtRef.current[i] =
          remoteLastPaused === null || isFirstHydration ? remoteLastPaused : seatDoc.$updatedAt;
      }

      const rawLastPausedAtIso = paused ? remoteLastPaused : null;
      if (lastSyncedGraceRef.current[i] !== rawLastPausedAtIso) {
        lastSyncedGraceRef.current[i] = rawLastPausedAtIso;

        if (paused && !isFirstHydration) {
          const nowIso = new Date(graceNow).toISOString();
          syncGraceAnimation(graceAnims.current[i], true, nowIso, graceNow);
        } else {
          const animAnchorIso = paused ? seatDoc.$updatedAt : null;
          const correctedGraceNow = graceNow + clockOffsetEstimateRef.current;

          syncGraceAnimation(graceAnims.current[i], paused, animAnchorIso, correctedGraceNow);
        }
      }

      hydratedSeatDocIdRef.current[i] = seatDoc.$id;

      const reconciled = isFirstHydration
        ? reconcileRoundAndPool(
          [seatDoc.playerTime],
          [seatDoc.roundTimeLeft],
          [seatDoc.roundExpired],
          [paused],
          roundSecondsTotal,
          [seatDoc.$updatedAt],
          Date.now(),
        )
        : {
          poolTimes: [seatDoc.playerTime],
          roundTimesLeft: [seatDoc.roundTimeLeft],
          roundExpired: [seatDoc.roundExpired],
        };

      const poolTime = reconciled.poolTimes[0];
      const inOvertime = (seatDoc.inOvertime ?? false) || poolTime <= 0;
      outcomes[i] = {
        paused,
        poolTime,
        roundTimeLeft: reconciled.roundTimesLeft[0],
        roundExpired: reconciled.roundExpired[0],
        inOvertime,
      };
      if (isFirstHydration) {
        bellFiredRef.current[i] = inOvertime;
      }
      lastProcessedSeatDocRef.current[i] = seatDoc;
      depleteAnims.current[i].setValue(Math.min(1, Math.max(0, 1 - poolTime / totalSeconds)));
    }

    if (outcomes.every((o) => o === null)) {
      return;
    }

    const nextPlayersPaused = playersPausedRef.current.map((p, i) => outcomes[i]?.paused ?? p);
    const nextTick = {
      times: tickStateRef.current.times.map((v, i) => outcomes[i]?.poolTime ?? v),
      roundTimesLeft: tickStateRef.current.roundTimesLeft.map((v, i) => outcomes[i]?.roundTimeLeft ?? v),
      roundExpired: tickStateRef.current.roundExpired.map((v, i) => outcomes[i]?.roundExpired ?? v),
      playersInOvertime: tickStateRef.current.playersInOvertime.map((v, i) => outcomes[i]?.inOvertime ?? v),
    };
    playersPausedRef.current = nextPlayersPaused;
    tickStateRef.current = nextTick;
    setPlayersPaused(nextPlayersPaused);
    setTickState(nextTick);
  }, [existingSeats, totalSeconds, roundSecondsTotal]);

  const getOrCreateTimerId = useCallback(
    async (initialPatch?: TablePatch): Promise<{ id: string | null; created: boolean }> => {
      if (timerDocIdRef.current) {
        return { id: timerDocIdRef.current, created: false };
      }
      if (tableNumber === null) {
        return { id: null, created: false };
      }
      if (existingTimer) {
        timerDocIdRef.current = existingTimer.$id;
        return { id: existingTimer.$id, created: false };
      }
      const doc = await timerStore.add({
        table: tableNumber,
        games: gameId ?? null,
        tableActiveAccumulatedMs: 0,
        tableActiveResumedAt: null,
        playerPositions: [],
        ...initialPatch,
      });
      timerDocIdRef.current = doc?.$id ?? null;
      return { id: doc?.$id ?? null, created: true };
    },
    [timerStore, gameId, tableNumber, existingTimer],
  );

  const getOrCreateSeatDocId = useCallback(
    async (seat: number, initialPatch?: SeatPatch): Promise<{ id: string | null; created: boolean }> => {
      if (seatDocIdRef.current[seat]) {
        return { id: seatDocIdRef.current[seat], created: false };
      }
      if (tableNumber === null) {
        return { id: null, created: false };
      }
      const existing = existingSeats.find((s) => s.seat === seat);
      if (existing) {
        seatDocIdRef.current[seat] = existing.$id;
        return { id: existing.$id, created: false };
      }
      const doc = await timerSeatStore.add({
        table: tableNumber,
        games: gameId ?? null,
        seat,
        playerTime: totalSeconds,
        paused: true,
        inOvertime: false,
        roundTimeLeft: roundSecondsTotal,
        roundExpired: false,
        roundLastPausedAt: null,
        ...initialPatch,
      });
      seatDocIdRef.current[seat] = doc?.$id ?? null;
      return { id: doc?.$id ?? null, created: true };
    },
    [timerSeatStore, gameId, tableNumber, totalSeconds, roundSecondsTotal, existingSeats],
  );

  const persistTablePatch = useCallback(
    (patch: TablePatch) => {
      const run = async () => {
        const { id, created } = await getOrCreateTimerId(patch);
        if (!id || created) {
          // A brand-new Timer doc is created WITH this patch's values
          // already merged in (see getOrCreateTimerId) -- a separate
          // follow-up update here would briefly leave the doc showing its
          // hardcoded creation defaults until that update lands, and any
          // realtime "create" echo carrying those defaults isn't recognized
          // by the seat-sync effect's own-write detection the way an
          // "update" echo is, so it would flash back to the pre-patch state.
          return;
        }
        await timerStore.update({ $id: id, ...patch }, true);
      };
      const chained = tableWriteChainRef.current.then(run, run);
      tableWriteChainRef.current = chained;
      return chained;
    },
    [timerStore, getOrCreateTimerId],
  );

  const persistSeatPatch = useCallback(
    (seat: number, patch: SeatPatch) => {
      const run = async () => {
        const isFullPatch =
          patch.playerTime !== undefined &&
          patch.paused !== undefined &&
          patch.roundTimeLeft !== undefined &&
          patch.roundExpired !== undefined &&
          patch.roundLastPausedAt !== undefined;

        const { id, created } = await getOrCreateSeatDocId(seat, patch);
        if (!id) {
          return;
        }
        if (isFullPatch) {
          pendingWritesRef.current[seat].push({
            playerTime: patch.playerTime!,
            paused: patch.paused!,
            roundTimeLeft: patch.roundTimeLeft!,
            roundExpired: patch.roundExpired!,
            roundLastPausedAt: patch.roundLastPausedAt!,
            addedAt: Date.now(),
          });
        }
        if (created) {
          // See persistTablePatch's comment -- the doc was created WITH
          // this patch's values already merged in, so a separate update
          // would only reintroduce the same create-vs-update echo race.
          return;
        }

        const ok = await timerSeatStore.update({ $id: id, ...patch }, true);
        if (ok) {
          return;
        }
        seatDocIdRef.current[seat] = null;
        const retry = await getOrCreateSeatDocId(seat, patch);
        if (retry.id && !retry.created) {
          await timerSeatStore.update({ $id: retry.id, ...patch }, true);
        }
      };
      const chained = writeChainRef.current[seat].then(run, run);
      writeChainRef.current[seat] = chained;
      return chained;
    },
    [timerSeatStore, getOrCreateSeatDocId],
  );

  const applyTableActiveTransition = useCallback(
    (wasAllPaused: boolean, willBeAllPaused: boolean, now: number) => {
      const tableActiveUpdate = tableActiveTransition(
        wasAllPaused,
        willBeAllPaused,
        now,
        tableActiveAccumulatedMsRef.current,
        tableActiveResumedAtRef.current,
      );
      if (!tableActiveUpdate) {
        return;
      }
      tableActiveAccumulatedMsRef.current = tableActiveUpdate.tableActiveAccumulatedMs;
      tableActiveResumedAtRef.current = tableActiveUpdate.tableActiveResumedAt;
      persistTablePatch(tableActiveUpdate);
    },
    [persistTablePatch],
  );

  const persistAllSeatsFresh = useCallback(
    (fresh: TickState, freshPaused: boolean[], freshLastPaused: (string | null)[]) =>
      Promise.all(
        Array.from({ length: PLAYER_COUNT }, (_, i) =>
          persistSeatPatch(
            i,
            seatPatchAt(
              i,
              fresh.times,
              freshPaused,
              fresh.playersInOvertime,
              fresh.roundTimesLeft,
              fresh.roundExpired,
              freshLastPaused,
            ),
          ),
        ),
      ),
    [persistSeatPatch],
  );

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

  useEffect(() => {
    if (tableNumber === null) {
      return;
    }
    const overtime = tickState.playersInOvertime;
    let hasFreshTimeout = false;
    overtime.forEach((isOver, i) => {
      if (!isOver) {
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
    if (bell && !bell.acknowledgeTime) {
      return;
    }
    if (bell) {
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

  const resetTimerLocally = useCallback((newTotalSeconds: number, newRoundSeconds: number) => {
    timerStartedRef.current = false;
    bellFiredRef.current = Array(PLAYER_COUNT).fill(false);
    const fresh = makeDefaultTickState(newTotalSeconds, newRoundSeconds);
    const freshPaused = Array(PLAYER_COUNT).fill(true);
    const freshLastPaused: (string | null)[] = Array(PLAYER_COUNT).fill(null);

    tickStateRef.current = fresh;
    playersPausedRef.current = freshPaused;
    setTickState(fresh);
    setPlayersPaused(freshPaused);
    roundLastPausedAtRef.current = freshLastPaused;
    correctedLastPausedAtRef.current = freshLastPaused;
    pendingWritesRef.current = Array.from({ length: PLAYER_COUNT }, () => []);
    tableActiveAccumulatedMsRef.current = 0;
    tableActiveResumedAtRef.current = null;
    depleteAnims.current.forEach((anim) => anim.setValue(0));
    graceAnims.current.forEach((anim) => anim.setValue(0));
    lastSyncedGraceRef.current = Array(PLAYER_COUNT).fill(null);

    return { fresh, freshPaused, freshLastPaused };
  }, []);

  const handlePress = (idx: number) => {
    const now = Date.now();
    if (!registerPressAndCheckSpam(now)) {
      return;
    }
    const currentPaused = playersPausedRef.current;
    const currentTick = tickStateRef.current;
    const wasPaused = currentPaused[idx];
    const wasAllPaused = currentPaused.every(Boolean);

    const nextPaused = [...currentPaused];
    let nextRoundTimesLeft = currentTick.roundTimesLeft;
    let nextRoundExpired = currentTick.roundExpired;
    const nextLastPaused = [...roundLastPausedAtRef.current];
    const nextCorrectedLastPaused = [...correctedLastPausedAtRef.current];
    const touchedSeats = new Set<number>([idx]);

    if (pauseMode === "auto" && wasPaused) {
      for (let i = 0; i < PLAYER_COUNT; i++) {
        if (i !== idx && !nextPaused[i]) {
          nextPaused[i] = true;
          pauseSeatLocally(i, now, nextLastPaused, nextCorrectedLastPaused);
          touchedSeats.add(i);
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

    const nextTick = { ...currentTick, roundTimesLeft: nextRoundTimesLeft, roundExpired: nextRoundExpired };
    playersPausedRef.current = nextPaused;
    tickStateRef.current = nextTick;
    setPlayersPaused(nextPaused);
    setTickState(nextTick);
    roundLastPausedAtRef.current = nextLastPaused;
    correctedLastPausedAtRef.current = nextCorrectedLastPaused;

    applyTableActiveTransition(wasAllPaused, nextPaused.every(Boolean), now);

    touchedSeats.forEach((seat) => {
      persistSeatPatch(
        seat,
        seatPatchAt(
          seat,
          currentTick.times,
          nextPaused,
          currentTick.playersInOvertime,
          nextRoundTimesLeft,
          nextRoundExpired,
          nextLastPaused,
        ),
      );
    });
  };

  const allPaused = playersPaused.every(Boolean);

  const toggleAllPause = useCallback(() => {
    const now = Date.now();
    if (!registerPressAndCheckSpam(now)) {
      return;
    }
    const currentPaused = playersPausedRef.current;
    const currentTick = tickStateRef.current;
    const wasAllPaused = currentPaused.every(Boolean);
    const nextLastPaused = [...roundLastPausedAtRef.current];
    const nextCorrectedLastPaused = [...correctedLastPausedAtRef.current];
    const nextPaused = Array(PLAYER_COUNT).fill(!wasAllPaused);
    let nextRoundTimesLeft = currentTick.roundTimesLeft;
    let nextRoundExpired = currentTick.roundExpired;

    if (wasAllPaused) {
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
      currentPaused.forEach((paused, i) => {
        if (paused) {
          return;
        }
        pauseSeatLocally(i, now, nextLastPaused, nextCorrectedLastPaused);
      });
    }

    const nextTick = { ...currentTick, roundTimesLeft: nextRoundTimesLeft, roundExpired: nextRoundExpired };
    playersPausedRef.current = nextPaused;
    tickStateRef.current = nextTick;
    setPlayersPaused(nextPaused);
    setTickState(nextTick);
    roundLastPausedAtRef.current = nextLastPaused;
    correctedLastPausedAtRef.current = nextCorrectedLastPaused;

    applyTableActiveTransition(wasAllPaused, !wasAllPaused, now);

    for (let i = 0; i < PLAYER_COUNT; i++) {
      persistSeatPatch(
        i,
        seatPatchAt(
          i,
          currentTick.times,
          nextPaused,
          currentTick.playersInOvertime,
          nextRoundTimesLeft,
          nextRoundExpired,
          nextLastPaused,
        ),
      );
    }
  }, [roundSecondsTotal, persistSeatPatch, applyTableActiveTransition, pauseSeatLocally, registerPressAndCheckSpam]);

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

    persistTablePatch({ tableActiveAccumulatedMs: 0, tableActiveResumedAt: null });
    persistAllSeatsFresh(fresh, freshPaused, freshLastPaused);
    return true;
  };

  const handleSaveCustomTimer = useCallback(
    async (durationMinutes: number, dir: "up" | "down", newRoundSeconds: number) => {
      const newTotalSeconds = (durationMinutes * 60) / PLAYER_COUNT;
      const { fresh, freshPaused, freshLastPaused } = resetTimerLocally(newTotalSeconds, newRoundSeconds);

      await Promise.all([
        persistTablePatch({
          durationMinutesTotal: durationMinutes,
          roundSecondsTotal: newRoundSeconds,
          direction: dir,
          hasCustomTimer: true,
          tableActiveAccumulatedMs: 0,
          tableActiveResumedAt: null,
        }),
        persistAllSeatsFresh(fresh, freshPaused, freshLastPaused),
      ]);
    },
    [persistTablePatch, persistAllSeatsFresh, resetTimerLocally],
  );

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

    await Promise.all([
      persistTablePatch({
        hasCustomTimer: false,
        tableActiveAccumulatedMs: 0,
        tableActiveResumedAt: null,
      }),
      persistAllSeatsFresh(fresh, freshPaused, freshLastPaused),
    ]);
    return true;
  }, [confirm, t, timerSettings, persistTablePatch, persistAllSeatsFresh, resetTimerLocally]);

  const handlePause = useCallback(() => {
    const currentPaused = playersPausedRef.current;
    if (currentPaused.every(Boolean)) {
      return;
    }
    const currentTick = tickStateRef.current;
    const now = Date.now();
    const nextLastPaused = [...roundLastPausedAtRef.current];
    const nextCorrectedLastPaused = [...correctedLastPausedAtRef.current];
    currentPaused.forEach((paused, i) => {
      if (paused) {
        return;
      }
      pauseSeatLocally(i, now, nextLastPaused, nextCorrectedLastPaused);
    });
    const nextPaused = Array(PLAYER_COUNT).fill(true);
    playersPausedRef.current = nextPaused;
    setPlayersPaused(nextPaused);
    roundLastPausedAtRef.current = nextLastPaused;
    correctedLastPausedAtRef.current = nextCorrectedLastPaused;

    applyTableActiveTransition(false, true, now);

    currentPaused.forEach((paused, i) => {
      if (paused) {
        return;
      }
      persistSeatPatch(
        i,
        seatPatchAt(
          i,
          currentTick.times,
          nextPaused,
          currentTick.playersInOvertime,
          currentTick.roundTimesLeft,
          currentTick.roundExpired,
          nextLastPaused,
        ),
      );
    });
  }, [persistSeatPatch, applyTableActiveTransition, pauseSeatLocally]);

  const tableElapsedSeconds = computeTableElapsedSeconds(
    tableActiveAccumulatedMsRef.current,
    tableActiveResumedAtRef.current,
    Date.now(),
  );

  return {
    times: tickState.times,
    roundTimesLeft: tickState.roundTimesLeft,
    roundExpired: tickState.roundExpired,
    playersInOvertime: tickState.playersInOvertime,
    playersPaused,
    allPaused,
    spamProtectionActive,
    tableElapsedSeconds,
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
