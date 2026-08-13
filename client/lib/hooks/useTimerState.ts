import { useDialog } from "@/lib/components/ui/Dialog";
import { useTableBellStore } from "@/lib/stores/appwrite/table-bell-store";
import { useTimerSeatStore } from "@/lib/stores/appwrite/timer-seat-store";
import { useTimerSettingsStore } from "@/lib/stores/appwrite/timer-settings-store";
import { useTimerStore } from "@/lib/stores/appwrite/timer-store";
import { buildPlayerColor, PLAYER_COLORS } from "@/lib/utils/timerColors";
import {
  computeTableElapsedSeconds,
  reconcileRoundAndPool,
  resolveEffectiveTimer,
  resolveGameId,
} from "@/lib/utils";
import { useSecureStoragePerGame } from "@/lib/hooks/useSecureStoragePerGame";
import { Animated, LayoutChangeEvent, useWindowDimensions } from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { TableBell } from "../models/table-bell";
import { Timer } from "../models/timer";
import { TimerSeat } from "../models/timer-seat";
import { TimerPauseMode } from "./useTimerLocalSettings";

const DEFAULT_SECONDS = 10 * 60;
const PLAYER_COUNT = 4;
const ROUND_RESET_GRACE_MS = 3000;
const OWN_ECHO_TIMESTAMP_TOLERANCE_MS = 1500;

type PendingSeatWrite = {
  playerTime: number;
  paused: boolean;
  roundTimeLeft: number;
  roundExpired: boolean;
  roundLastPausedAt: string | null;
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

async function getOrCreateDocId(
  existingDoc: { $id: string } | undefined,
  create: () => Promise<{ $id: string } | null>,
): Promise<string | null> {
  if (existingDoc) {
    return existingDoc.$id;
  }
  const doc = await create();
  return doc?.$id ?? null;
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
  const playersPausedRef = useRef(playersPaused);
  playersPausedRef.current = playersPaused;
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

      const seenUpdatedAt = latestSeenSeatUpdatedAtRef.current[i];
      if (
        seenUpdatedAt !== null &&
        new Date(seatDoc.$updatedAt).getTime() < new Date(seenUpdatedAt).getTime()
      ) {
        lastProcessedSeatDocRef.current[i] = seatDoc;
        continue;
      }
      latestSeenSeatUpdatedAtRef.current[i] = seatDoc.$updatedAt;

      const paused = seatDoc.paused;
      const remoteLastPaused = seatDoc.roundLastPausedAt ?? null;

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

      const isFirstHydration = hydratedSeatDocIdRef.current[i] !== seatDoc.$id;

      const previousRawLastPaused = roundLastPausedAtRef.current[i];

      roundLastPausedAtRef.current[i] = remoteLastPaused;

      if (remoteLastPaused !== previousRawLastPaused) {
        correctedLastPausedAtRef.current[i] =
          remoteLastPaused === null || isFirstHydration ? remoteLastPaused : seatDoc.$updatedAt;
      }

      const lastPausedAtIso = paused ? remoteLastPaused : null;
      if (lastSyncedGraceRef.current[i] !== lastPausedAtIso) {
        lastSyncedGraceRef.current[i] = lastPausedAtIso;
        syncGraceAnimation(graceAnims.current[i], paused, lastPausedAtIso, graceNow);
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
      outcomes[i] = {
        paused,
        poolTime,
        roundTimeLeft: reconciled.roundTimesLeft[0],
        roundExpired: reconciled.roundExpired[0],
        inOvertime: (seatDoc.inOvertime ?? false) || poolTime <= 0,
      };
      lastProcessedSeatDocRef.current[i] = seatDoc;
      depleteAnims.current[i].setValue(Math.min(1, Math.max(0, 1 - poolTime / totalSeconds)));
    }

    if (outcomes.every((o) => o === null)) {
      return;
    }

    setPlayersPaused((prev) => prev.map((p, i) => outcomes[i]?.paused ?? p));
    setTickState((prev) => ({
      times: prev.times.map((v, i) => outcomes[i]?.poolTime ?? v),
      roundTimesLeft: prev.roundTimesLeft.map((v, i) => outcomes[i]?.roundTimeLeft ?? v),
      roundExpired: prev.roundExpired.map((v, i) => outcomes[i]?.roundExpired ?? v),
      playersInOvertime: prev.playersInOvertime.map((v, i) => outcomes[i]?.inOvertime ?? v),
    }));
  }, [existingSeats, totalSeconds, roundSecondsTotal]);

  const getOrCreateTimerId = useCallback(async (): Promise<string | null> => {
    if (timerDocIdRef.current) {
      return timerDocIdRef.current;
    }
    if (tableNumber === null) {
      return null;
    }
    const id = await getOrCreateDocId(existingTimer, () =>
      timerStore.add({
        table: tableNumber,
        games: gameId ?? null,
        tableActiveAccumulatedMs: 0,
        tableActiveResumedAt: null,
        playerPositions: [],
      }),
    );
    timerDocIdRef.current = id;
    return id;
  }, [timerStore, gameId, tableNumber, existingTimer]);

  const getOrCreateSeatDocId = useCallback(
    async (seat: number): Promise<string | null> => {
      if (seatDocIdRef.current[seat]) {
        return seatDocIdRef.current[seat];
      }
      if (tableNumber === null) {
        return null;
      }
      const id = await getOrCreateDocId(
        existingSeats.find((s) => s.seat === seat),
        () =>
          timerSeatStore.add({
            table: tableNumber,
            games: gameId ?? null,
            seat,
            playerTime: totalSeconds,
            paused: true,
            inOvertime: false,
            roundTimeLeft: roundSecondsTotal,
            roundExpired: false,
            roundLastPausedAt: null,
          }),
      );
      seatDocIdRef.current[seat] = id;
      return id;
    },
    [timerSeatStore, gameId, tableNumber, totalSeconds, roundSecondsTotal, existingSeats],
  );

  const persistTablePatch = useCallback(
    (patch: TablePatch) => {
      const run = async () => {
        const id = await getOrCreateTimerId();
        if (!id) {
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
        const id = await getOrCreateSeatDocId(seat);
        if (!id) {
          return;
        }
        if (
          patch.playerTime !== undefined &&
          patch.paused !== undefined &&
          patch.roundTimeLeft !== undefined &&
          patch.roundExpired !== undefined &&
          patch.roundLastPausedAt !== undefined
        ) {
          pendingWritesRef.current[seat].push({
            playerTime: patch.playerTime,
            paused: patch.paused,
            roundTimeLeft: patch.roundTimeLeft,
            roundExpired: patch.roundExpired,
            roundLastPausedAt: patch.roundLastPausedAt,
          });
        }

        const ok = await timerSeatStore.update({ $id: id, ...patch }, true);
        if (ok) {
          return;
        }
        seatDocIdRef.current[seat] = null;
        const retryId = await getOrCreateSeatDocId(seat);
        if (retryId) {
          await timerSeatStore.update({ $id: retryId, ...patch }, true);
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
    const wasPaused = playersPaused[idx];
    const wasAllPaused = playersPaused.every(Boolean);

    const nextPaused = [...playersPaused];
    let nextRoundTimesLeft = tickState.roundTimesLeft;
    let nextRoundExpired = tickState.roundExpired;
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

    setPlayersPaused(nextPaused);
    setTickState((prev) => ({ ...prev, roundTimesLeft: nextRoundTimesLeft, roundExpired: nextRoundExpired }));
    roundLastPausedAtRef.current = nextLastPaused;
    correctedLastPausedAtRef.current = nextCorrectedLastPaused;

    applyTableActiveTransition(wasAllPaused, nextPaused.every(Boolean), now);

    touchedSeats.forEach((seat) => {
      persistSeatPatch(
        seat,
        seatPatchAt(
          seat,
          tickState.times,
          nextPaused,
          tickState.playersInOvertime,
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
    const nextLastPaused = [...roundLastPausedAtRef.current];
    const nextCorrectedLastPaused = [...correctedLastPausedAtRef.current];
    const nextPaused = Array(PLAYER_COUNT).fill(!allPaused);
    let nextRoundTimesLeft = tickState.roundTimesLeft;
    let nextRoundExpired = tickState.roundExpired;

    if (allPaused) {
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

    applyTableActiveTransition(allPaused, !allPaused, now);

    for (let i = 0; i < PLAYER_COUNT; i++) {
      persistSeatPatch(
        i,
        seatPatchAt(
          i,
          tickState.times,
          nextPaused,
          tickState.playersInOvertime,
          nextRoundTimesLeft,
          nextRoundExpired,
          nextLastPaused,
        ),
      );
    }
  }, [allPaused, playersPaused, tickState, roundSecondsTotal, persistSeatPatch, applyTableActiveTransition, pauseSeatLocally]);

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

    applyTableActiveTransition(false, true, now);

    playersPaused.forEach((paused, i) => {
      if (paused) {
        return;
      }
      persistSeatPatch(
        i,
        seatPatchAt(
          i,
          tickState.times,
          nextPaused,
          tickState.playersInOvertime,
          tickState.roundTimesLeft,
          tickState.roundExpired,
          nextLastPaused,
        ),
      );
    });
  }, [playersPaused, tickState, persistSeatPatch, applyTableActiveTransition, pauseSeatLocally]);

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
