import { useDialog } from "@/lib/components/Dialog";
import { useTableBellStore } from "@/lib/stores/appwrite/table-bell-store";
import { useTimerSettingsStore } from "@/lib/stores/appwrite/timer-settings-store";
import { useTimerStore } from "@/lib/stores/appwrite/timer-store";
import { buildPlayerColor, PLAYER_COLORS } from "@/lib/utils/timerColors";
import { resolveGameId, toBooleanArray, toNumberArray } from "@/lib/utils";
import { Table } from "@/lib/models/table";
import { Animated, LayoutChangeEvent, useWindowDimensions } from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { TableBell } from "../models/table-bell";

const DEFAULT_SECONDS = 10 * 60;
const OVERTIME_SECONDS = 30;
const PLAYER_COUNT = 4;

export function useTimerState({
  gameId,
  tableNumber,
  currentTable,
  bell,
}: {
  gameId: string | undefined;
  tableNumber: number | null;
  currentTable: Table | null | undefined;
  bell: TableBell | undefined;
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
            (t) =>
              t.table === tableNumber &&
              resolveGameId(t.games) === (gameId ?? null),
          )
        : undefined,
    [timerStore.collection, gameId, tableNumber],
  );

  const playerColors = useMemo(() => {
    const gameColors = currentTable?.game?.colors;
    return Array.from({ length: PLAYER_COUNT }, (_, i) => {
      const hex = gameColors?.[i];
      return hex
        ? buildPlayerColor(hex)
        : PLAYER_COLORS[i % PLAYER_COLORS.length];
    });
  }, [currentTable]);

  const effectiveDuration =
    existingTimer?.durationMinutesTotal ?? timerSettings?.durationMinutesTotal;
  const totalSeconds = effectiveDuration
    ? (effectiveDuration * 60) / PLAYER_COUNT
    : DEFAULT_SECONDS;
  const direction =
    existingTimer?.direction ?? timerSettings?.direction ?? "down";

  const [times, setTimes] = useState<number[]>(() =>
    Array(PLAYER_COUNT).fill(totalSeconds),
  );
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [playersInOvertime, setPlayersInOvertime] = useState<boolean[]>(() =>
    Array(PLAYER_COUNT).fill(false),
  );
  const [paused, setPaused] = useState(false);
  const [cellSize, setCellSize] = useState({ w: width / 2, h: height / 2 });

  const timerStartedRef = useRef(false);
  if (activeIdx !== null) {
    timerStartedRef.current = true;
  }

  const timerDocIdRef = useRef<string | null>(null);
  const depleteAnims = useRef(
    Array.from({ length: PLAYER_COUNT }, () => new Animated.Value(0)),
  );
  const activeIdxRef = useRef(activeIdx);
  activeIdxRef.current = activeIdx;
  const playersInOvertimeRef = useRef(playersInOvertime);
  playersInOvertimeRef.current = playersInOvertime;
  const bellFiredRef = useRef(new Set<number>());

  useEffect(() => {
    if (!existingTimer) {
      return;
    }
    timerDocIdRef.current = existingTimer.$id;
    setActiveIdx(existingTimer.activePlayerTimer ?? null);
    setPaused(existingTimer.paused ?? false);

    const remoteTimes = toNumberArray(existingTimer.playerTimes);
    if (remoteTimes.length !== PLAYER_COUNT) {
      return;
    }
    setTimes(remoteTimes);

    const remoteOvertime = toBooleanArray(
      (existingTimer as any).playersInOvertime,
    );
    if (remoteOvertime.length === PLAYER_COUNT) {
      setPlayersInOvertime(remoteOvertime);
    }

    remoteTimes.forEach((remoteTime, i) => {
      const base = remoteOvertime[i] ? OVERTIME_SECONDS : totalSeconds;
      depleteAnims.current[i].setValue(1 - Math.min(remoteTime, base) / base);
    });
  }, [existingTimer, totalSeconds]);

  const saveState = useCallback(
    async (
      currentTimes: number[],
      activePlayer: number | null,
      isPaused: boolean,
      overtime: boolean[],
    ) => {
      const id = timerDocIdRef.current;
      if (!id) {
        return;
      }
      const ok = await timerStore.update(
        {
          $id: id,
          playerTimes: currentTimes,
          activePlayerTimer: activePlayer as any,
          paused: isPaused,
          playersInOvertime: overtime,
        },
        true,
      );

      if (!ok) {
        timerDocIdRef.current = null;
        const inCollection =
          tableNumber !== null
            ? timerStore.collection.find(
                (t) =>
                  t.table === tableNumber &&
                  resolveGameId(t.games) === (gameId ?? null),
              )
            : undefined;

        if (inCollection) {
          timerDocIdRef.current = inCollection.$id;
          await timerStore.update(
            {
              $id: inCollection.$id,
              playerTimes: currentTimes,
              activePlayerTimer: activePlayer as any,
              paused: isPaused,
              playersInOvertime: overtime,
            },
            true,
          );
        } else if (tableNumber !== null) {
          const doc = await timerStore.add({
            table: tableNumber,
            playerTimes: currentTimes,
            games: gameId ?? null,
            activePlayerTimer: activePlayer,
            paused: isPaused,
            playersInOvertime: overtime,
          });
          if (doc) {
            timerDocIdRef.current = doc.$id;
          }
        }
      }
    },
    [timerStore, gameId, tableNumber],
  );

  useEffect(() => {
    if (timerStartedRef.current) {
      return;
    }
    setTimes(Array(PLAYER_COUNT).fill(totalSeconds));
    depleteAnims.current.forEach((anim) => anim.setValue(0));
  }, [totalSeconds]);

  useEffect(() => {
    if (activeIdx === null || paused) {
      return;
    }
    const interval = setInterval(() => {
      setTimes((prev) => {
        const idx = activeIdxRef.current;
        if (idx === null || prev[idx] <= 0) {
          return prev;
        }
        const next = [...prev];
        next[idx] -= 1;
        const base = playersInOvertimeRef.current[idx]
          ? OVERTIME_SECONDS
          : totalSeconds;
        Animated.timing(depleteAnims.current[idx], {
          toValue: 1 - next[idx] / base,
          duration: 950,
          useNativeDriver: false,
        }).start();
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeIdx, paused, totalSeconds]);

  useEffect(() => {
    if (activeIdx === null || times[activeIdx] !== 0) {
      return;
    }
    if (bellFiredRef.current.has(activeIdx)) {
      return;
    }
    bellFiredRef.current.add(activeIdx);
    if (!bell && tableNumber !== null) {
      tableBellStore.add({
        table: tableNumber,
        startTime: new Date().toISOString(),
        locked: true,
        reason: t("timerElapsed"),
      });
    }
  }, [times, activeIdx, bell, t, tableBellStore, tableNumber]);

  const handleCellLayout = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    setCellSize({ w, h });
  };

  const handlePress = (idx: number) => {
    if (times[idx] <= 0) {
      const nextTimes = [...times];
      if (
        activeIdx !== null &&
        activeIdx !== idx &&
        playersInOvertime[activeIdx] &&
        nextTimes[activeIdx] > 0
      ) {
        nextTimes[activeIdx] = 0;
        depleteAnims.current[activeIdx].setValue(1);
      }
      nextTimes[idx] = OVERTIME_SECONDS;
      const nextOvertime = [...playersInOvertime];
      nextOvertime[idx] = true;
      setTimes(nextTimes);
      setPlayersInOvertime(nextOvertime);
      setActiveIdx(idx);
      setPaused(false);
      depleteAnims.current[idx].setValue(0);
      saveState(nextTimes, idx, false, nextOvertime);
      return;
    }

    if (activeIdx === idx) {
      const newPaused = !paused;
      if (newPaused) {
        depleteAnims.current[idx].stopAnimation();
        const base = playersInOvertime[idx] ? OVERTIME_SECONDS : totalSeconds;
        depleteAnims.current[idx].setValue(1 - times[idx] / base);
      }
      setPaused(newPaused);
      saveState(times, idx, newPaused, playersInOvertime);
    } else {
      const nextTimes = [...times];
      if (
        activeIdx !== null &&
        playersInOvertime[activeIdx] &&
        nextTimes[activeIdx] > 0
      ) {
        nextTimes[activeIdx] = 0;
        depleteAnims.current[activeIdx].setValue(1);
      }
      if (playersInOvertime[idx]) {
        nextTimes[idx] = OVERTIME_SECONDS;
        depleteAnims.current[idx].setValue(0);
      }
      setTimes(nextTimes);

      if (!timerStartedRef.current) {
        if (timerDocIdRef.current) {
          saveState(nextTimes, idx, false, playersInOvertime);
        } else {
          const inCollection =
            tableNumber !== null
              ? timerStore.collection.find(
                  (t) =>
                    t.table === tableNumber &&
                    resolveGameId(t.games) === (gameId ?? null),
                )
              : undefined;
          if (inCollection) {
            timerDocIdRef.current = inCollection.$id;
            saveState(nextTimes, idx, false, playersInOvertime);
          } else if (tableNumber !== null) {
            timerStore
              .add({
                table: tableNumber,
                playerTimes: nextTimes,
                games: gameId ?? null,
                activePlayerTimer: idx,
                paused: false,
                playersInOvertime,
              })
              .then((doc) => {
                if (doc) {
                  timerDocIdRef.current = doc.$id;
                }
              });
          }
        }
      } else if (activeIdx !== null) {
        saveState(nextTimes, idx, false, playersInOvertime);
      }
      setActiveIdx(idx);
      setPaused(false);
    }
  };

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

    const defaultTimes = Array(PLAYER_COUNT).fill(totalSeconds);
    const defaultOvertime = Array(PLAYER_COUNT).fill(false);
    timerStartedRef.current = false;
    setTimes(defaultTimes);
    setPlayersInOvertime(defaultOvertime);
    setActiveIdx(0);
    setPaused(true);
    depleteAnims.current.forEach((anim) => anim.setValue(0));
    saveState(defaultTimes, 0, true, defaultOvertime);
    return true;
  };

  const handleSaveCustomTimer = useCallback(
    async (durationMinutes: number, dir: "up" | "down") => {
      const newTotalSeconds = (durationMinutes * 60) / PLAYER_COUNT;
      const defaultTimes = Array(PLAYER_COUNT).fill(newTotalSeconds);
      const defaultOvertime = Array(PLAYER_COUNT).fill(false);
      timerStartedRef.current = false;
      setTimes(defaultTimes);
      setPlayersInOvertime(defaultOvertime);
      setActiveIdx(0);
      setPaused(true);
      depleteAnims.current.forEach((anim) => anim.setValue(0));

      const id = timerDocIdRef.current;
      if (id) {
        await timerStore.update(
          {
            $id: id,
            durationMinutesTotal: durationMinutes,
            direction: dir,
            playerTimes: defaultTimes,
            activePlayerTimer: 0 as any,
            playersInOvertime: [false, false, false, false],
            paused: true,
          },
          true,
        );
      } else if (tableNumber !== null) {
        const doc = await timerStore.add({
          table: tableNumber,
          games: gameId ?? null,
          durationMinutesTotal: durationMinutes,
          direction: dir,
          playerTimes: defaultTimes,
          activePlayerTimer: 0,
          playersInOvertime: [false, false, false, false],
          paused: true,
        });
        if (doc) {
          timerDocIdRef.current = doc.$id;
        }
      }
    },
    [timerStore, gameId, tableNumber],
  );

  return {
    times,
    activeIdx,
    paused,
    playersInOvertime,
    depleteAnims,
    totalSeconds,
    direction,
    playerColors,
    cellSize,
    handleCellLayout,
    handlePress,
    handleReset,
    handleSaveCustomTimer,
    existingTimer,
    timerSettings,
  };
}
