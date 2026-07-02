import { Ionicons } from "@expo/vector-icons";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SIGNATURES_BUCKET_ID, storage } from "@/lib/appwrite";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { useTableBellActions } from "@/lib/hooks/useTableBellActions";
import type { Result } from "@/lib/models/result";
import type { Table } from "@/lib/models/table";
import type { TableBell } from "@/lib/models/table-bell";
import { useResultStore } from "@/lib/stores/appwrite/result-store";
import { useScheduleStore } from "@/lib/stores/appwrite/schedule-store";
import { useTableBellStore } from "@/lib/stores/appwrite/table-bell-store";
import { useTableStore } from "@/lib/stores/appwrite/table-store";
import { useTimerStore } from "@/lib/stores/appwrite/timer-store";
import { inset, space } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";
import {
  hasScorePlacementConflict,
  isValidPlacementCombo,
} from "@/lib/utils/placements";
import { resolveGameId, teamName, toNumberArray } from "@/lib/utils";
import { ChipGroup } from "@/lib/components/ui/ChipGroup";
import { Combobox } from "@/lib/components/ui/Combobox";
import { useDialog } from "@/lib/components/ui/Dialog";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import { PlayerResultRow, type PlayerResultRowHandle } from "@/lib/components/results/PlayerResultRow";
import { ResultsFilterDialog } from "@/lib/components/results/ResultsFilterDialog";
import { ScoreNavBar } from "@/lib/components/results/ScoreNavBar";
import { ScoreSignatureModal } from "@/lib/components/results/ScoreSignatureModal";
import { SearchInput } from "@/lib/components/ui/SearchInput";
import { SignatureSlot } from "@/lib/components/results/SignatureSlot";
import { StateBadge } from "@/lib/components/results/StateBadge";
import { TableCard } from "@/lib/components/results/TableCard";
import type { TableEntry } from "@/lib/components/results/types";

type ViewMode = "overview" | "input";
export type BellFilter = "any" | "active" | "acknowledged";
export type SubmitFilter = "all" | "submitted" | "notSubmitted";
export type TimerFilter = "any" | "running" | "noTimer";
export type SortOrder = "table" | "totalTimer" | "minTimer" | "resultStatus" | "bellFirst" | "sigsFirst";

const PLAYER_COUNT = 4;

export function ResultsAdminTab() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["scoreOverview", "tableOverview"]);
  const { confirm } = useDialog();
  const { width: screenWidth } = useWindowDimensions();

  const { collection: schedules } = useScheduleStore();
  const { collection: results } = useResultStore();
  const tables = useTableStore((s) => s.collection);
  const { collection: timers } = useTimerStore();
  const bells = useTableBellStore((s) => s.collection);
  const resultStore = useResultStore();
  const bellActions = useTableBellActions();

  // Shared state
  const [mode, setMode] = useState<ViewMode>("overview");
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now);

  // Overview state
  const [search, setSearch] = useState("");
  const [bellFilter, setBellFilter] = useState<BellFilter>("any");
  const [submitFilter, setSubmitFilter] = useState<SubmitFilter>("all");
  const [timerFilter, setTimerFilter] = useState<TimerFilter>("any");
  const [sortOrder, setSortOrder] = useState<SortOrder>("table");
  const [gridWidth, setGridWidth] = useState(0);
  const [filterDialogVisible, setFilterDialogVisible] = useState(false);

  // Input state
  const [currentTableIdx, setCurrentTableIdx] = useState(0);
  const [jumpText, setJumpText] = useState("");
  const [saving, setSaving] = useState(false);
  const [placements, setPlacements] = useState<string[]>(Array(PLAYER_COUNT).fill(""));
  const [scores, setScores] = useState<string[]>(Array(PLAYER_COUNT).fill(""));
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sigModalIdx, setSigModalIdx] = useState<number | null>(null);
  const [modalSvg, setModalSvg] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const rowRefs = useRef<(PlayerResultRowHandle | null)[]>([null, null, null, null]);
  const noteRef = useRef<TextInput | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const gameSchedules = useMemo(
    () => [...schedules].filter((s) => !!s.gameId).sort((a, b) => a.sortIndex - b.sortIndex),
    [schedules],
  );

  const defaultGameId = useMemo(() => {
    const active = gameSchedules.find((s) => s.isActive);
    if (active) return active.gameId!;
    const nextUp = gameSchedules.find((s) => !s.isFinished);
    if (nextUp) return nextUp.gameId!;
    return gameSchedules[gameSchedules.length - 1]?.gameId ?? null;
  }, [gameSchedules]);

  useEffect(() => {
    if (selectedGameId === null && defaultGameId !== null) {
      setSelectedGameId(defaultGameId);
    }
  }, [defaultGameId, selectedGameId]);

  useEffect(() => {
    setCurrentTableIdx(0);
  }, [selectedGameId]);

  const gameIndex = useMemo(
    () => gameSchedules.findIndex((s) => s.gameId === selectedGameId),
    [gameSchedules, selectedGameId],
  );

  const gameTables = useMemo(
    () =>
      tables
        .filter((t) => resolveGameId(t.game) === selectedGameId)
        .sort((a, b) => a.tableNumber - b.tableNumber),
    [tables, selectedGameId],
  );

  const tablesPerGame = gameTables.length;

  const globalPos = useCallback(
    (tableNumber: number) => tableNumber + tablesPerGame * Math.max(0, gameIndex),
    [tablesPerGame, gameIndex],
  );

  const resultForTable = useCallback(
    (tableNumber: number): Result | undefined =>
      results.find((r) => r.gameId === selectedGameId && r.table === tableNumber),
    [results, selectedGameId],
  );

  const progressStats = useMemo(() => {
    const sub = gameTables.filter((t) => resultForTable(t.tableNumber)?.submitted === true).length;
    const pending = gameTables.filter((t) => {
      const r = resultForTable(t.tableNumber);
      return r !== undefined && !r.submitted;
    }).length;
    return { submitted: sub, pending, total: gameTables.length };
  }, [gameTables, resultForTable]);

  const activeFilterCount = useMemo(
    () =>
      [bellFilter !== "any", submitFilter !== "all", timerFilter !== "any"].filter(Boolean)
        .length,
    [bellFilter, submitFilter, timerFilter],
  );

  const resetFilters = useCallback(() => {
    setBellFilter("any");
    setSubmitFilter("all");
    setTimerFilter("any");
    setSortOrder("table");
  }, []);

  // Build TableEntry list (for overview mode)
  const tableEntries = useMemo<TableEntry[]>(() => {
    if (!selectedGameId) return [];
    return gameTables.map((t): TableEntry => {
      const timer = timers.find(
        (tm) => resolveGameId(tm.games) === selectedGameId && tm.table === t.tableNumber,
      );
      const result = resultForTable(t.tableNumber);
      const bell = bells.find((b) => b.table === t.tableNumber);
      return {
        id: t.tableNumber,
        players: t.players,
        timer,
        result,
        bell,
        hasBell: !!bell && !bell.acknowledgeTime,
        bellAcknowledged: !!bell?.acknowledgeTime,
        isRunning: !!timer,
        isSubmitted: result?.submitted ?? false,
        hasNote: !!result?.note,
      };
    });
  }, [gameTables, timers, results, bells, selectedGameId, resultForTable]);

  const filteredEntries = useMemo<TableEntry[]>(() => {
    const q = search.trim().toLowerCase();
    return tableEntries.filter((entry) => {
      if (q) {
        const hit =
          String(entry.id).includes(q) ||
          entry.players.some((p) => teamName(p).toLowerCase().includes(q)) ||
          entry.players.some((p) => p.name.toLowerCase().includes(q));
        if (!hit) return false;
      }
      if (bellFilter === "active" && !entry.hasBell) return false;
      if (bellFilter === "acknowledged" && !entry.bellAcknowledged) return false;
      if (submitFilter === "submitted" && !entry.isSubmitted) return false;
      if (submitFilter === "notSubmitted") {
        const hasSig = entry.result?.signatureIds?.some(Boolean) ?? false;
        if (entry.isSubmitted || !entry.result || !hasSig) return false;
      }
      if (timerFilter === "running" && !entry.isRunning) return false;
      if (timerFilter === "noTimer" && !!entry.timer) return false;
      return true;
    });
  }, [tableEntries, search, bellFilter, submitFilter, timerFilter]);

  const sortedEntries = useMemo<TableEntry[]>(() => {
    return [...filteredEntries].sort((a, b) => {
      switch (sortOrder) {
        case "table":
          return a.id - b.id;
        case "totalTimer": {
          if (!a.timer && !b.timer) return a.id - b.id;
          if (!a.timer) return 1;
          if (!b.timer) return -1;
          const aSum = toNumberArray(a.timer.playerTimes).reduce((s, v) => s + v, 0);
          const bSum = toNumberArray(b.timer.playerTimes).reduce((s, v) => s + v, 0);
          return aSum - bSum;
        }
        case "minTimer": {
          if (!a.timer && !b.timer) return a.id - b.id;
          if (!a.timer) return 1;
          if (!b.timer) return -1;
          const aTimes = toNumberArray(a.timer.playerTimes);
          const bTimes = toNumberArray(b.timer.playerTimes);
          const aMin = aTimes.length ? Math.min(...aTimes) : Infinity;
          const bMin = bTimes.length ? Math.min(...bTimes) : Infinity;
          return aMin - bMin;
        }
        case "resultStatus": {
          const score = (e: TableEntry): number => {
            if (e.isSubmitted) return 4;
            if (!e.result) return 0;
            const sigs = e.result.signatureIds?.filter(Boolean).length ?? 0;
            const total = e.result.signatureIds?.length ?? 1;
            if (sigs === 0) return 1;
            if (sigs < total) return 2;
            return 3;
          };
          return score(a) - score(b);
        }
        case "bellFirst": {
          const aBell = a.hasBell ? 0 : a.bellAcknowledged ? 1 : 2;
          const bBell = b.hasBell ? 0 : b.bellAcknowledged ? 1 : 2;
          return aBell - bBell || a.id - b.id;
        }
        case "sigsFirst": {
          const aSigs = a.result?.signatureIds?.filter(Boolean).length ?? 0;
          const bSigs = b.result?.signatureIds?.filter(Boolean).length ?? 0;
          return aSigs - bSigs || a.id - b.id;
        }
        default:
          return a.id - b.id;
      }
    });
  }, [filteredEntries, sortOrder]);

  const numColumns = screenWidth >= 600 ? 2 : 1;
  const cardWidth = useMemo(() => {
    if (!gridWidth) return 0;
    return (gridWidth - (numColumns - 1) * inset.list) / numColumns;
  }, [gridWidth, numColumns]);

  // Input mode — current table
  const currentTable: Table | undefined = gameTables[currentTableIdx];
  const currentResult = useMemo(
    () => (currentTable ? resultForTable(currentTable.tableNumber) : undefined),
    [currentTable, resultForTable],
  );

  useEffect(() => {
    setPlacements(
      currentResult?.placements?.length === PLAYER_COUNT
        ? currentResult.placements
        : Array(PLAYER_COUNT).fill(""),
    );
    setScores(
      currentResult?.scores?.length === PLAYER_COUNT
        ? currentResult.scores.map(String)
        : Array(PLAYER_COUNT).fill(""),
    );
    setNote(currentResult?.note ?? "");
    setSubmitted(currentResult?.submitted ?? false);
  }, [currentResult, currentTableIdx]);

  // Arrow-key navigation between tables — web only
  useEffect(() => {
    if (mode !== "input" || Platform.OS !== "web") return;
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.key === "ArrowLeft") setCurrentTableIdx((i) => Math.max(0, i - 1));
      else if (e.key === "ArrowRight")
        setCurrentTableIdx((i) => Math.min(gameTables.length - 1, i + 1));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, gameTables.length]);

  // Signature modal
  const modalFileId =
    sigModalIdx !== null ? currentResult?.signatureIds?.[sigModalIdx] : undefined;

  useEffect(() => {
    if (!modalFileId) { setModalSvg(null); setModalLoading(false); return; }
    setModalSvg(null);
    setModalLoading(true);
    storage
      .getFileView({ bucketId: SIGNATURES_BUCKET_ID, fileId: modalFileId })
      .then((buf) => setModalSvg(new TextDecoder("utf-8").decode(buf)))
      .catch(() => setModalSvg(null))
      .finally(() => setModalLoading(false));
  }, [modalFileId]);

  const handleSave = useCallback(async () => {
    if (!currentTable || !selectedGameId || saving) return;
    const ok = await confirm({
      title: t("confirmSave.title"),
      message: t("confirmSave.message"),
      confirmLabel: t("confirmSave.confirm"),
      cancelLabel: t("confirmSave.cancel"),
    });
    if (!ok) return;
    setSaving(true);
    try {
      const data = {
        gameId: selectedGameId,
        table: currentTable.tableNumber,
        placements,
        scores: scores.map((s) => parseFloat(s) || 0),
        note: note.trim(),
        signatureIds: currentResult?.signatureIds ?? Array(PLAYER_COUNT).fill(""),
        submitted,
      };
      if (currentResult) {
        await resultStore.update({ $id: currentResult.$id, ...data });
      } else {
        await resultStore.add(data);
      }
    } finally {
      setSaving(false);
    }
  }, [currentTable, selectedGameId, saving, placements, scores, note, submitted, currentResult, resultStore, confirm, t]);

  const handleSetPlacement = useCallback((seatIdx: number, value: string) => {
    setPlacements((prev) => {
      const next = [...prev];
      next[seatIdx] = value;
      return next;
    });
  }, []);

  const handleSetScore = useCallback((idx: number, value: string) => {
    setScores((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  }, []);

  const handleJump = useCallback(() => {
    const raw = parseInt(jumpText, 10);
    if (isNaN(raw)) return;
    const idx = gameTables.findIndex((tbl) => tbl.tableNumber === raw);
    if (idx !== -1) { setCurrentTableIdx(idx); setJumpText(""); }
  }, [jumpText, gameTables]);

  const handleBellPress = useCallback(
    async (bell: TableBell) => {
      if (bell.acknowledgeTime) {
        await bellActions.dismiss(bell, {
          title: t("tableOverview:confirmDelete.title"),
          message: t("tableOverview:confirmDelete.message"),
          confirmLabel: t("tableOverview:confirmDelete.confirm"),
          cancelLabel: t("tableOverview:confirmDelete.cancel"),
          destructive: true,
        });
      } else {
        await bellActions.acknowledge(bell, {
          title: t("tableOverview:confirmAcknowledge.title"),
          message: t("tableOverview:confirmAcknowledge.message"),
          confirmLabel: t("tableOverview:confirmAcknowledge.confirm"),
          cancelLabel: t("tableOverview:confirmAcknowledge.cancel"),
        });
      }
    },
    [bellActions, t],
  );

  const handleCloseModal = useCallback(() => {
    setSigModalIdx(null);
    setConfirmingReset(false);
  }, []);

  const handleResetSingleSignature = useCallback(async () => {
    if (!currentResult || sigModalIdx === null) return;
    const newIds = [...(currentResult.signatureIds ?? Array(PLAYER_COUNT).fill(""))];
    newIds[sigModalIdx] = "";
    await resultStore.update({ $id: currentResult.$id, signatureIds: newIds });
    setSigModalIdx(null);
    setConfirmingReset(false);
  }, [currentResult, sigModalIdx, resultStore]);

  const scoreConflict = useMemo(
    () => hasScorePlacementConflict(placements, scores),
    [placements, scores],
  );
  const placementInvalid = useMemo(
    () => placements.every(Boolean) && !isValidPlacementCombo(placements),
    [placements],
  );
  const sigIds = currentResult?.signatureIds ?? [];
  const missingSig = sigIds.length > 0 && sigIds.some((id) => !id);

  if (gameSchedules.length === 0) {
    return <EmptyState message={t("noGame")} />;
  }

  const modalTitle =
    sigModalIdx !== null && currentTable?.players[sigModalIdx]
      ? `${teamName(currentTable.players[sigModalIdx])} · ${currentTable.players[sigModalIdx].name}`
      : `P${(sigModalIdx ?? 0) + 1}`;

  const header = (
    <View style={styles.stickyHeader}>
      {mode === "overview" && gameTables.length > 0 && (
        <>
          <SearchInput
            value={search}
            onChangeText={setSearch}
            placeholder={t("tableOverview:searchPlaceholder")}
            style={styles.headerSearch}
          />
          <TouchableOpacity
            style={styles.filtersButton}
            onPress={() => setFilterDialogVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="options-outline" size={16} color={colors.text} />
            <Text style={styles.filtersButtonText}>{t("tableOverview:filtersButton")}</Text>
            {activeFilterCount > 0 && (
              <View style={styles.filtersBadge}>
                <Text style={styles.filtersBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </>
      )}
      <ChipGroup
        mode="cycle"
        options={[
          { value: "overview", icon: "grid-outline", color: colors.primary, label: t("modeOverview") },
          { value: "input", icon: "create-outline", color: colors.primary, label: t("modeInput") },
        ]}
        value={mode}
        onChange={(v) => setMode(v as ViewMode)}
      />
      <Combobox
        value={selectedGameId ?? ""}
        options={gameSchedules.map((s) => ({ value: s.gameId!, label: s.title, isLive: s.isActive }))}
        onChange={(v) => setSelectedGameId(v)}
      />
      {gameTables.length > 0 && (
        <View style={styles.progressStats}>
          <Ionicons name="checkmark-circle-outline" size={14} color={colors.success} />
          <Text style={styles.progressText}>
            {progressStats.submitted}/{progressStats.total}
          </Text>
          <Ionicons name="hourglass-outline" size={14} color={colors.accent} />
          <Text style={styles.progressText}>{progressStats.pending}</Text>
        </View>
      )}
    </View>
  );

  // ── Overview mode ─────────────────────────────────────────────────────────
  if (mode === "overview") {
    return (
      <View style={styles.container}>
        {header}
        <ResultsFilterDialog
          visible={filterDialogVisible}
          onClose={() => setFilterDialogVisible(false)}
          bellFilter={bellFilter}
          onBellFilterChange={setBellFilter}
          submitFilter={submitFilter}
          onSubmitFilterChange={setSubmitFilter}
          timerFilter={timerFilter}
          onTimerFilterChange={setTimerFilter}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          onReset={resetFilters}
        />
        {gameTables.length === 0 ? (
          <EmptyState message={t("noTables")} />
        ) : (
            <ScrollView
              contentContainerStyle={styles.overviewList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {sortedEntries.length === 0 && tableEntries.length > 0 && (
                <EmptyState
                  message={t("tableOverview:noFilterResults")}
                  style={{ paddingVertical: inset.group, flex: 0 }}
                />
              )}
              <View
                style={styles.cardsGrid}
                onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}
              >
                {sortedEntries.map((entry) => {
                  const tableIdx = gameTables.findIndex((t) => t.tableNumber === entry.id);
                  return (
                    <TableCard
                      key={entry.id}
                      entry={entry}
                      cardWidth={cardWidth}
                      now={now}
                      onPress={() => {
                        setCurrentTableIdx(tableIdx >= 0 ? tableIdx : 0);
                        setMode("input");
                      }}
                      onBellPress={entry.bell ? () => handleBellPress(entry.bell!) : undefined}
                      bellLoading={entry.bell ? bellActions.isLoadingBell(entry.bell) : false}
                    />
                  );
                })}
              </View>
            </ScrollView>
        )}
      </View>
    );
  }

  // ── Input mode ────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {header}
      {gameTables.length === 0 ? (
        <EmptyState message={t("noTables")} />
      ) : (
        <View style={styles.inputOuter}>
          <ScoreNavBar
            currentIdx={currentTableIdx}
            total={gameTables.length}
            jumpText={jumpText}
            onJumpTextChange={setJumpText}
            onPrev={() => setCurrentTableIdx((i) => Math.max(0, i - 1))}
            onNext={() => setCurrentTableIdx((i) => Math.min(gameTables.length - 1, i + 1))}
            onJump={handleJump}
            t={t}
          />

          <ScrollView
            contentContainerStyle={styles.inputCard}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.inputCardHeader}>
              <Text style={styles.inputTableNum}>
                {currentTable
                  ? t("globalLabel").replace("{n}", String(globalPos(currentTable.tableNumber)))
                  : "–"}
              </Text>
              {currentTable && (
                <Text style={styles.inputGlobalNum}>
                  {t("tableLabel").replace("{n}", String(currentTable.tableNumber))}
                </Text>
              )}
              {currentResult && <StateBadge result={currentResult} t={t} />}
              <View style={styles.submittedToggle}>
                <Text style={styles.submittedToggleLabel}>{t("submittedLabel")}</Text>
                <Switch
                  value={submitted}
                  onValueChange={setSubmitted}
                  trackColor={{ true: colors.success, false: colors.border }}
                  thumbColor={submitted ? colors.onAccent : colors.textMuted}
                />
              </View>
            </View>

            {/* Column labels */}
            <View style={styles.columnLabels}>
              <Text style={styles.colLabelPlayer}>{t("colPlayer")}</Text>
              <Text style={styles.colLabelScore}>{t("colScore")}</Text>
              <Text style={styles.colLabelPlacement}>{t("colPlacement")}</Text>
              <Text style={styles.colLabelSig}>{t("colSig")}</Text>
            </View>

            {Array.from({ length: PLAYER_COUNT }, (_, i) => (
              <PlayerResultRow
                key={i}
                ref={(el) => { rowRefs.current[i] = el; }}
                playerName={currentTable?.players[i]?.name ?? `P${i + 1}`}
                playerTeam={currentTable?.players[i] ? teamName(currentTable.players[i]) : undefined}
                placement={placements[i]}
                score={scores[i]}
                onSetPlacement={(v) => handleSetPlacement(i, v)}
                onSetScore={(v) => handleSetScore(i, v)}
                onScoreSubmitEditing={() => {
                  if (i < PLAYER_COUNT - 1) rowRefs.current[i + 1]?.focusScore();
                  else noteRef.current?.focus();
                }}
                onScoreTabForward={() => {
                  if (i < PLAYER_COUNT - 1) rowRefs.current[i + 1]?.focusScore();
                  else rowRefs.current[0]?.focusChips();
                }}
                onScoreTabBackward={i > 0 ? () => rowRefs.current[i - 1]?.focusScore() : undefined}
                onChipTabForward={() => {
                  if (i < PLAYER_COUNT - 1) rowRefs.current[i + 1]?.focusChips();
                  else noteRef.current?.focus();
                }}
                onChipTabBackward={() => {
                  if (i > 0) rowRefs.current[i - 1]?.focusChips();
                  else rowRefs.current[PLAYER_COUNT - 1]?.focusScore();
                }}
                placementError={scoreConflict}
                signatureSlot={
                  <TouchableOpacity
                    onPress={currentResult?.signatureIds?.[i] ? () => setSigModalIdx(i) : undefined}
                    activeOpacity={currentResult?.signatureIds?.[i] ? 0.7 : 1}
                    disabled={!currentResult?.signatureIds?.[i]}
                    // @ts-expect-error — web-only: remove sig from tab order
                    tabIndex={Platform.OS === "web" ? -1 : undefined}
                  >
                    <SignatureSlot fileId={currentResult?.signatureIds?.[i]} />
                  </TouchableOpacity>
                }
              />
            ))}

            {/* Warnings — above the note field */}
            {(missingSig || scoreConflict || placementInvalid) && (
              <View style={styles.warningGroup}>
                {missingSig && (
                  <View style={styles.warningRow}>
                    <Ionicons name="warning-outline" size={15} color={colors.error} />
                    <Text style={styles.warningText}>{t("warnMissingSignature")}</Text>
                  </View>
                )}
                {scoreConflict && (
                  <View style={styles.warningRow}>
                    <Ionicons name="alert-circle-outline" size={15} color={colors.error} />
                    <Text style={styles.warningText}>{t("warnScoreConflict")}</Text>
                  </View>
                )}
                {placementInvalid && (
                  <View style={styles.warningRow}>
                    <Ionicons name="alert-circle-outline" size={15} color={colors.error} />
                    <Text style={styles.warningText}>{t("warnPlacementInvalid")}</Text>
                  </View>
                )}
              </View>
            )}

            <TextInput
              ref={noteRef}
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder={t("notePlaceholder")}
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.actionBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnLabel}>{t("save")}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      <ScoreSignatureModal
        visible={sigModalIdx !== null}
        title={modalTitle}
        modalLoading={modalLoading}
        modalSvg={modalSvg}
        confirmingReset={confirmingReset}
        onClose={handleCloseModal}
        onReset={handleResetSingleSignature}
        onConfirmReset={() => setConfirmingReset(true)}
        onCancelConfirm={() => setConfirmingReset(false)}
        t={t}
      />
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: { flex: 1 },
    stickyHeader: {
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: inset.list,
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: space[2],
    },
    progressStats: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    progressText: { ...type.caption, color: colors.textMuted },
    headerSearch: {
      flexGrow: 1,
      flexShrink: 1,
      maxWidth: 240,
      paddingVertical: 6,
    },
    filtersButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    filtersButtonText: { ...type.bodySmall, color: colors.text },
    filtersBadge: {
      backgroundColor: colors.accent,
      borderRadius: 10,
      minWidth: 18,
      height: 18,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
    },
    filtersBadgeText: {
      ...type.caption,
      fontSize: 11,
      color: colors.onAccent,
      fontWeight: "600",
    },
    overviewList: {
      gap: inset.list,
      paddingBottom: inset.screenBottom,
    },
    cardsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: inset.list,
    },
    inputOuter: { flex: 1 },
    inputCard: {
      padding: inset.card,
      gap: inset.list,
      paddingBottom: inset.screenBottom,
    },
    inputCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[3],
      paddingBottom: inset.list,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      flexWrap: "wrap",
    },
    inputTableNum: { ...type.h2, color: colors.text },
    inputGlobalNum: { ...type.body, color: colors.textMuted },
    submittedToggle: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[2],
      marginLeft: "auto",
    },
    submittedToggleLabel: { ...type.bodySmall, color: colors.textMuted },
    warningGroup: {
      gap: 4,
    },
    warningRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[2],
      backgroundColor: colors.error + "18",
      borderRadius: 8,
      paddingHorizontal: inset.card,
      paddingVertical: space[2],
      borderWidth: 1,
      borderColor: colors.error + "40",
    },
    warningText: { ...type.bodySmall, color: colors.error, flex: 1 },
    columnLabels: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[2],
    },
    colLabelPlayer: { ...type.caption, color: colors.textMuted, flex: 1 },
    colLabelScore: { ...type.caption, color: colors.textMuted, width: 64, textAlign: "center" },
    colLabelPlacement: { ...type.caption, color: colors.textMuted, width: 4 * 40 + 3 * 4, textAlign: "center" },
    colLabelSig: { ...type.caption, color: colors.textMuted, width: 48, textAlign: "center" },
    noteInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: inset.card,
      ...type.body,
      color: colors.text,
      backgroundColor: colors.surface,
      minHeight: 72,
      textAlignVertical: "top",
    },
    saveBtn: {
      paddingVertical: space[3],
      borderRadius: 8,
      backgroundColor: colors.primary,
      alignItems: "center",
    },
    saveBtnLabel: { ...type.body, color: colors.onAccent, fontWeight: "600" },
    actionBtnDisabled: { opacity: 0.45 },
  });
}
