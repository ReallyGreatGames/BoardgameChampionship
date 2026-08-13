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
/** A seat resumed within this many ms of its own pause keeps its round time —
 *  prevents "reset my round time" abuse via quick pause/unpause. */
const ROUND_RESET_GRACE_MS = 3000;
/** How far apart two `roundLastPausedAt` readings are allowed to be and
 *  still count as "the same write" for own-echo detection (see
 *  pausedAtRoughlyEqual) — covers Appwrite's datetime storage reformatting
 *  (dropped milliseconds) round-tripping our OWN write, while staying far
 *  tighter than any two independently-acting devices' clocks could
 *  plausibly land by coincidence. */
const OWN_ECHO_TIMESTAMP_TOLERANCE_MS = 1500;

/** One device-authored write to a single seat, snapshotted at
 *  persistSeatPatch-time — used only to recognize that write's own realtime
 *  echo (see pendingWritesRef). Scalar, not arrays: each seat is its own
 *  Appwrite document now (see lib/models/timer-seat.ts), so there's nothing
 *  left to bundle across seats. */
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

/** Tolerant equality for a single `roundLastPausedAt` reading — used only to
 *  decide whether an incoming update is this device's OWN echo. Two
 *  INDEPENDENT devices pausing/resuming the same seat, even seconds apart in
 *  the same manual test, still land far outside `toleranceMs`; deliberately
 *  not exact-string equality (see the echo-check comment in the sync effect
 *  for why that's fragile against Appwrite's datetime storage reformatting
 *  our own value). */
function pausedAtRoughlyEqual(a: string | null, b: string | null, toleranceMs: number): boolean {
  if (a === null || b === null) {
    return a === b;
  }
  const at = parseIso(a);
  const bt = parseIso(b);
  return at !== null && bt !== null && Math.abs(at - bt) <= toleranceMs;
}

/** Whether toggling from `wasAllPaused` to `willBeAllPaused` starts or ends
 *  the table's shared "at least one seat running" clock — returns the doc
 *  fields to persist, or null if this action didn't cross that boundary
 *  (e.g. auto-mode swapping which single seat is active touches neither
 *  edge). Called from every seat-pause action itself (see handlePress etc.)
 *  rather than a generic `allPaused`-watching effect — an effect can't tell
 *  a LOCAL action's transition apart from this device simply catching up to
 *  an already-running table on mount/reconnect, which would otherwise reset
 *  `tableActiveResumedAt` to "now" and silently drop whatever the table had
 *  already accumulated before this device connected. */
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
    // The last running seat just stopped — fold the just-finished active
    // stretch into the total.
    const resumedAt = parseIso(resumedAtIso);
    const elapsedMs = resumedAt !== null ? Math.max(0, now - resumedAt) : 0;
    return { tableActiveAccumulatedMs: accumulatedMs + elapsedMs, tableActiveResumedAt: null };
  }
  // The first seat just started — begin counting from now.
  return { tableActiveAccumulatedMs: accumulatedMs, tableActiveResumedAt: new Date(now).toISOString() };
}

/** Pure — reads index `seat` out of five parallel per-seat arrays into the
 *  shape persistSeatPatch expects. Shared by every action that persists a
 *  seat's tick state (handlePress/toggleAllPause/handlePause/the three
 *  reset-shaped handlers via persistAllSeatsFresh) so they can't drift on
 *  which field comes from which array. */
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

/** Shared "use the cached/already-known doc if there is one, otherwise
 *  create it" tail end of getOrCreateTimerId/getOrCreateSeatDocId — the
 *  cache-ref and tableNumber-null checks stay at each call site (both
 *  short-circuit before this is even called), only "existing doc found vs.
 *  needs creating" is common between the two. */
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
    // started: the first-ever sync of a brand new seat doc sends it through
    // here with `lastPausedAtIso === null`, and the resulting anim=1 read as
    // `graceExpired` a moment later.
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

  // Every seat document that exists so far for this table/game — sparse:
  // a seat with no document yet simply hasn't been touched by anyone (see
  // the sync effect's per-seat defaulting).
  const existingSeats = useMemo(
    () =>
      tableNumber !== null
        ? timerSeatStore.collection.filter(
            (s) => s.table === tableNumber && resolveGameId(s.games) === (gameId ?? null),
          )
        : [],
    [timerSeatStore.collection, gameId, tableNumber],
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
  const seatDocIdRef = useRef<(string | null)[]>(Array(PLAYER_COUNT).fill(null));
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
  // Server-anchored (seat doc's `$updatedAt`-substituted) equivalent of
  // `roundLastPausedAtRef`, used ONLY by `resumeRoundState`'s grace check —
  // deliberately NOT what feeds the grace-bar animation or what gets
  // persisted back. See the sync effect for why these two need to diverge:
  // this app's realtime delivery can lag by multiple real seconds (see
  // hydratedSeatDocIdRef's comment), which the animation tolerates fine
  // (it's cosmetic — a late-discovered pause just animates less), but which
  // turns the FUNCTIONAL round-reset decision unusable if it's ALSO forced
  // through the exact same substitution: a cross-device resume would then
  // read as "outside grace" almost every time purely from delivery lag.
  // Kept separate so only the "is this seat's clock-skew-prone raw
  // timestamp trustworthy for a security-relevant decision" question uses
  // the server-anchored value; the animation keeps using the original, more
  // forgiving raw value.
  const correctedLastPausedAtRef = useRef<(string | null)[]>(
    Array(PLAYER_COUNT).fill(null),
  );
  // Every write THIS device has sent per seat that hasn't been recognized as
  // its own realtime echo yet — lets the sync effect trust local state
  // entirely instead of re-deriving anything from an echo of its own save.
  // A queue per seat, not a single last-write slot: spamming a button fires
  // several writes before any of their echoes round-trip back, and each one
  // needs to be recognized individually — matching only the MOST RECENT
  // write meant an earlier click's echo, arriving after a newer click had
  // already overwritten this ref, was misread as a genuinely remote change
  // (double animations) or a genuinely remote update got misread as an echo
  // and silently dropped.
  const pendingWritesRef = useRef<PendingSeatWrite[][]>(
    Array.from({ length: PLAYER_COUNT }, () => []),
  );
  // Chains each seat's own writes strictly in click order — without it,
  // spamming a button fires several updateRow calls in parallel for that
  // seat, and a slower-arriving OLDER one can land at the server after a
  // faster NEWER one and silently undo it. Independent seats never share a
  // chain — they're different Appwrite documents now, nothing to serialize
  // against each other.
  const writeChainRef = useRef<Promise<void>[]>(
    Array.from({ length: PLAYER_COUNT }, () => Promise.resolve()),
  );
  const tableWriteChainRef = useRef<Promise<void>>(Promise.resolve());
  // The last doc id each seat has fully hydrated (elapsed-since-$updatedAt
  // catch-up applied) at least once. Only the FIRST sync for a given seat
  // doc — mount, or switching to a different table/game — legitimately
  // needs that catch-up: the doc may genuinely have gone stale while nobody
  // had it open. Every later sync while already watching the same doc is
  // itself a live "just happened" snapshot (another device's press/pause/
  // reset) — re-applying elapsed correction on top of it double-counts pure
  // network latency (and any clock skew between this device and the Appwrite
  // server), which is exactly what made a freshly reset round time appear to
  // start a couple of seconds behind on every OTHER device watching the same
  // seat, even though the acting device itself (which never re-derives its
  // own writes — see the echo check below) showed it correctly.
  const hydratedSeatDocIdRef = useRef<(string | null)[]>(Array(PLAYER_COUNT).fill(null));
  // The exact seat-doc OBJECT (by reference) last incorporated into local
  // state, per seat. `existingSeats` is one combined array/memo over ALL
  // four seats, so pressing ONE seat re-runs the sync effect for every
  // seat, not just the one that changed — but an untouched seat's entry in
  // the underlying collection keeps its EXACT SAME object reference (see
  // updateRealtimeCollectionUpdate in real-time-store.ts, which only
  // replaces the one matching document). Without this check, an unrelated
  // seat's write would make this effect re-derive THIS seat's pool time
  // from its own doc's last-SAVED checkpoint — stale by design, since saves
  // only happen on press/pause/reset, not every tick — snapping its
  // LOCALLY-ticked-down value backward to that checkpoint. Cleared to null
  // whenever a seat's doc disappears/gets recreated, and updated for BOTH
  // the echo branch and the genuine-update branch below, so either one
  // "locks in" this exact object as already-seen.
  const lastProcessedSeatDocRef = useRef<(TimerSeat | null)[]>(Array(PLAYER_COUNT).fill(null));
  // The highest `$updatedAt` this device has actually applied per seat.
  // Belt-and-suspenders alongside updateRealtimeCollectionUpdate's own
  // last-write-wins check in real-time-store.ts: that check protects the
  // STORE's collection array, but a plain collection replace — the initial
  // fetch, or a reconnect's refetch (see fetchCollection) — bypasses it
  // entirely (it's a raw `set`, not routed through the realtime merge
  // logic). If such a refetch's response reflects a moment BEFORE a write
  // still in flight had committed, this seat would otherwise silently jump
  // backward to that older snapshot. Kept separate from
  // lastProcessedSeatDocRef (object identity) because a refetch always
  // produces brand-new objects even for genuinely-unchanged data — this is
  // the check that catches "different object, but actually OLDER content".
  const latestSeenSeatUpdatedAtRef = useRef<(string | null)[]>(Array(PLAYER_COUNT).fill(null));
  // Table-wide elapsed-time bookkeeping (see tableActiveTransition and the
  // Timer model's tableActiveAccumulatedMs/tableActiveResumedAt doc
  // comments). Refs, not state — the displayed value is derived at render
  // time from wall-clock `Date.now()`, ticking for free off the same
  // interval that already re-renders every second while any seat runs.
  const tableActiveAccumulatedMsRef = useRef(0);
  const tableActiveResumedAtRef = useRef<string | null>(null);
  // Same "belt-and-suspenders against a stale collection replace" guard as
  // latestSeenSeatUpdatedAtRef above, for the table-wide doc.
  const latestSeenTableUpdatedAtRef = useRef<string | null>(null);
  const playersPausedRef = useRef(playersPaused);
  playersPausedRef.current = playersPaused;
  const roundSecondsTotalRef = useRef(roundSecondsTotal);
  roundSecondsTotalRef.current = roundSecondsTotal;

  // Table-wide fields only (duration/round-time/direction are read directly
  // off `existingTimer` above via resolveEffectiveTimer — nothing to sync
  // into local state for those). Deliberately simple last-known-wins by
  // `$updatedAt` (see latestSeenTableUpdatedAtRef) — no echo-detection or
  // clock-skew correction beyond that; unlike the per-seat sync below,
  // nothing here is animation-sensitive.
  useEffect(() => {
    if (!existingTimer) {
      return;
    }
    // Reject a revision OLDER than one already applied — protects against a
    // stale collection replace (initial fetch / reconnect refetch bypasses
    // the realtime merge's own last-write-wins check entirely, see
    // latestSeenTableUpdatedAtRef's doc comment) landing after this device
    // already applied its OWN more recent write locally.
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

  // Syncs each seat from its own document when one exists, or defaults it
  // otherwise — independently per seat, since each is its own Appwrite doc
  // now. One combined setState per array (times/paused/etc.) keeps every
  // seat's update atomic within this pass, same as before the per-seat
  // split; seats this pass has nothing new for (own echo, or no doc yet
  // while this device already has something running) simply carry their
  // current local value forward unchanged.
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
        // Never touched by anyone (locally or remotely) — default it,
        // UNLESS this device already has something running for this seat
        // that just hasn't round-tripped into a doc yet (a create is in
        // flight): mirrors the old whole-doc "reset to defaults unless
        // already started" guard, now per seat.
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

      // This seat's document is the EXACT SAME object we already
      // incorporated last time — nothing changed for THIS seat; some OTHER
      // seat is what triggered this effect run (see lastProcessedSeatDocRef
      // above for why re-deriving anyway would be actively wrong here).
      if (seatDoc === lastProcessedSeatDocRef.current[i]) {
        continue;
      }

      // A DIFFERENT object than last time, but OLDER by `$updatedAt` than
      // one already applied — a stale collection replace (see
      // latestSeenSeatUpdatedAtRef's doc comment), not a genuine new
      // change. Still record the object identity so a later re-run with
      // this SAME stale object doesn't re-evaluate it every time.
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

      // If every field THIS seat's write actually controls matches one of
      // this device's still-unconfirmed writes, this update is just the
      // realtime echo of our own save — trust local state entirely rather
      // than re-deriving anything from it, for two separate reasons: (1)
      // elapsed-since-$updatedAt would otherwise double-count the save's
      // own round-trip latency on top of what the local tick loop already
      // ticked through, and (2) `roundLastPausedAt` round-trips through
      // Appwrite's datetime storage, which can reformat the string (dropped
      // milliseconds, timezone notation) — re-parsing our OWN just-written
      // timestamp back off the echo risks misreading it, which the
      // grace-bar timing is very sensitive to.
      //
      // `roundLastPausedAt` IS still checked, but tolerantly (see
      // pausedAtRoughlyEqual) rather than by exact string equality — exact
      // equality would reject genuine echoes over the reformatting risk
      // above, but SKIPPING the field entirely turned out worse: two
      // devices that each did their own quick pause/unpause on a
      // freshly-reset timer can produce byte-identical playerTime/paused/
      // roundTimeLeft/roundExpired purely by coincidence, which made one
      // device mistake the OTHER's genuinely new update for its own echo.
      //
      // Checked against EVERY still-unconfirmed write this seat has sent
      // (not just the latest — see pendingWritesRef), since a spammed click
      // can have several in flight before any of their echoes come back.
      const matchIdx = pendingWritesRef.current[i].findIndex(
        (written) =>
          written.playerTime === seatDoc.playerTime &&
          written.paused === paused &&
          written.roundTimeLeft === seatDoc.roundTimeLeft &&
          written.roundExpired === seatDoc.roundExpired &&
          pausedAtRoughlyEqual(written.roundLastPausedAt, remoteLastPaused, OWN_ECHO_TIMESTAMP_TOLERANCE_MS),
      );
      if (matchIdx !== -1) {
        // This seat's writes reach Appwrite in strict click order (see
        // writeChainRef in persistSeatPatch) — a match this far into the
        // queue means every OLDER entry's write already landed too, its
        // echo just hasn't arrived (or never will, deduped by
        // Appwrite/isNewUpdate). Drop them all so a stale entry can't later
        // false-match an unrelated remote update.
        pendingWritesRef.current[i] = pendingWritesRef.current[i].slice(matchIdx + 1);
        lastProcessedSeatDocRef.current[i] = seatDoc;
        continue;
      }

      // Only the very first sync of a given seat doc (mount, or switching
      // table/game) fast-forwards for elapsed real time since it was last
      // saved — see hydratedSeatDocIdRef above for why every later live
      // update trusts the incoming values as-is instead.
      const isFirstHydration = hydratedSeatDocIdRef.current[i] !== seatDoc.$id;

      // Captured before the overwrite just below — this seat's raw value as
      // of the PREVIOUS sync, used only to detect whether it genuinely
      // changed since then (see the correction step right after).
      const previousRawLastPaused = roundLastPausedAtRef.current[i];

      // `roundLastPausedAt` is authored by whichever device paused this
      // seat, using ITS OWN clock — feeds both the grace-bar animation AND
      // (via resumeRoundState) the actual round-reset decision. Kept raw
      // here for the animation: this app's realtime delivery can itself lag
      // by multiple real seconds, and the animation is cosmetic enough that
      // a late-discovered pause just animating less is preferable to a
      // "corrected" version that reads as already-expired on almost every
      // remote sync regardless of clock skew.
      roundLastPausedAtRef.current[i] = remoteLastPaused;

      // Server-anchored variant, kept ONLY for resumeRoundState's grace
      // check (see correctedLastPausedAtRef above for why it must stay
      // separate from the raw value the animation uses). Substituting this
      // seat doc's `$updatedAt` for the acting device's self-reported
      // timestamp removes that device's clock skew from THIS decision
      // specifically. Only recomputed when the raw timestamp actually
      // changed since the last sync; untouched seats keep their
      // previously-frozen correction, and first hydration falls back to the
      // raw value (a stale pause is stale by minutes, not milliseconds, so
      // the imprecision there is harmless).
      if (remoteLastPaused !== previousRawLastPaused) {
        correctedLastPausedAtRef.current[i] =
          remoteLastPaused === null || isFirstHydration ? remoteLastPaused : seatDoc.$updatedAt;
      }

      // The local pause action already starts this seat's grace animation
      // immediately (see handlePress/toggleAllPause/handlePause) using this
      // same function — this re-sync is what makes it reach every OTHER
      // device watching this seat too. Skipped when this seat's pause
      // moment hasn't actually changed since the last sync, so an unrelated
      // realtime update doesn't keep restarting an already-correct,
      // already-running animation.
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
        // The cached doc id may be stale (doc deleted/recreated server-side)
        // — drop it and resolve/create again, then retry once, so a
        // transient or stale-id failure doesn't leave this device silently
        // diverged from the backend until an app restart.
        seatDocIdRef.current[seat] = null;
        const retryId = await getOrCreateSeatDocId(seat);
        if (retryId) {
          await timerSeatStore.update({ $id: retryId, ...patch }, true);
        }
      };
      // Chains AFTER every earlier not-yet-sent write to THIS seat (see
      // writeChainRef above) — spamming a button no longer races several
      // updateRow calls for the same seat over the network against each
      // other. A different seat's writes are never chained against this
      // one — they're independent documents now, so there's no shared
      // ordering to protect.
      const chained = writeChainRef.current[seat].then(run, run);
      writeChainRef.current[seat] = chained;
      return chained;
    },
    [timerSeatStore, getOrCreateSeatDocId],
  );

  // Applies a table-active boundary crossing (see tableActiveTransition) if
  // this action actually caused one: updates both refs and persists, in one
  // place instead of duplicated at every call site that can cross the
  // boundary (handlePress/toggleAllPause/handlePause).
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

  // Persists a freshly-reset tick state to every seat — shared by
  // handleReset/handleSaveCustomTimer/handleUseDefaultTimer, which only
  // differ in which budget they reset to and which table-wide fields (if
  // any) go alongside it.
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
    correctedLastPausedAtRef.current = freshLastPaused;
    // Any writes still queued from before this reset can never match the
    // post-reset state — drop them rather than let them sit unmatched
    // forever (see pendingWritesRef).
    pendingWritesRef.current = Array.from({ length: PLAYER_COUNT }, () => []);
    // A reset starts a fresh game/session — the table's cumulative elapsed
    // time starts over too, rather than folding in whatever elapsed before
    // the reset (see tableActiveTransition for the non-reset case, which
    // DOES fold elapsed time in).
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
    // Only seats this action actually changes get a fresh write — an
    // untouched seat's doc has nothing new to checkpoint (it isn't ticking
    // while paused, and its pause flag isn't changing), so leaving it alone
    // is both correct and exactly what the per-seat-document split enables:
    // previously EVERY press had to resend all four seats since they shared
    // one document.
    const touchedSeats = new Set<number>([idx]);

    if (pauseMode === "auto" && wasPaused) {
      // Activating a seat stops every other running seat — the classic
      // single-active-player feel. Manual mode skips this: seats keep
      // running independently until paused individually or via "pause all".
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

    // toggleAllPause always flips between fully paused and fully running by
    // construction (nextPaused is a uniform fill above) — wasAllPaused is
    // just `allPaused` itself, no need to recompute it from nextPaused.
    applyTableActiveTransition(allPaused, !allPaused, now);

    // Every seat is affected by construction — unlike handlePress, there's
    // no "untouched seat" to skip here.
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

    persistTablePatch({ tableActiveAccumulatedMs: 0, tableActiveResumedAt: null });
    persistAllSeatsFresh(fresh, freshPaused, freshLastPaused);
    return true;
  };

  const handleSaveCustomTimer = useCallback(
    async (durationMinutes: number, dir: "up" | "down", newRoundSeconds: number) => {
      const newTotalSeconds = (durationMinutes * 60) / PLAYER_COUNT;
      const { fresh, freshPaused, freshLastPaused } = resetTimerLocally(newTotalSeconds, newRoundSeconds);

      // Table doc and seat docs are independent writes — run them together
      // instead of waiting a full round trip for the table patch before
      // even starting the seat ones.
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

    // Table doc and seat docs are independent writes — run them together
    // instead of waiting a full round trip for the table patch before even
    // starting the seat ones.
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

    // The early return above already guarantees at least one seat was
    // running (wasAllPaused === false) and every seat ends up paused here.
    applyTableActiveTransition(false, true, now);

    // Only seats that were actually running get a fresh write — an
    // already-paused seat's doc has nothing new to checkpoint (see
    // handlePress).
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

  // Recomputed fresh every render rather than kept as its own ticking
  // state — the per-second tick effect above already forces a re-render
  // every second while any seat is running (and while `allPaused`,
  // `tableActiveResumedAt` is null so this is just the frozen accumulated
  // total) — see tableActiveAccumulatedMsRef's doc comment.
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
