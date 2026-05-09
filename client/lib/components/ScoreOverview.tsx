import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SIGNATURES_BUCKET_ID, storage } from "../appwrite";
import { useTheme } from "../bootstrap/ThemeProvider";
import { Table } from "../models/table";
import { useResultStore } from "../stores/appwrite/result-store";
import { useScheduleStore } from "../stores/appwrite/schedule-store";
import { useTableStore } from "../stores/appwrite/table-store";
import { inset, space } from "../theme/spacing";
import { type } from "../theme/typography";
import { resolveGameId, teamName } from "../utils";
import { ChipGroup } from "./ChipGroup";
import { useDialog } from "./Dialog";
import { EmptyState } from "./EmptyState";
import { ScoreNavBar } from "./ScoreNavBar";
import { ScorePlayerRow } from "./ScorePlayerRow";
import { ScoreSignatureModal } from "./ScoreSignatureModal";
import { ScoreTableView } from "./ScoreTableView";
import { StateBadge } from "./StateBadge";

type ViewMode = "table" | "input";

const PLAYER_COUNT = 4;

export function ScoreOverview() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["scoreOverview"]);
  const { confirm } = useDialog();

  const { collection: schedules } = useScheduleStore();
  const { collection: results } = useResultStore();
  const tables = useTableStore((s) => s.collection);
  const resultStore = useResultStore();

  const [mode, setMode] = useState<ViewMode>("table");
  const [currentTableIdx, setCurrentTableIdx] = useState(0);
  const [jumpText, setJumpText] = useState("");
  const [saving, setSaving] = useState(false);
  const [sigModalIdx, setSigModalIdx] = useState<number | null>(null);
  const [modalSvg, setModalSvg] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const [placements, setPlacements] = useState<string[]>(Array(PLAYER_COUNT).fill(""));
  const [scores, setScores] = useState<string[]>(Array(PLAYER_COUNT).fill(""));
  const [note, setNote] = useState("");

  const gameSchedules = useMemo(
    () => [...schedules].filter((s) => !!s.gameId).sort((a, b) => a.sortIndex - b.sortIndex),
    [schedules],
  );

  const defaultGameId = useMemo(() => {
    const active = gameSchedules.find((s) => s.isActive);
    if (active) {return active.gameId!;}
    const nextUp = gameSchedules.find((s) => !s.isFinished);
    if (nextUp) {return nextUp.gameId!;}
    return gameSchedules[gameSchedules.length - 1]?.gameId ?? null;
  }, [gameSchedules]);

  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedGameId === null && defaultGameId !== null) {
      setSelectedGameId(defaultGameId);
    }
  }, [defaultGameId, selectedGameId]);

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
    (tableNumber: number) =>
      results.find((r) => r.gameId === selectedGameId && r.table === tableNumber),
    [results, selectedGameId],
  );

  const progressStats = useMemo(() => {
    const submitted = gameTables.filter(
      (t) => resultForTable(t.tableNumber)?.submitted === true,
    ).length;
    const pending = gameTables.filter((t) => {
      const r = resultForTable(t.tableNumber);
      return r !== undefined && !r.submitted;
    }).length;
    return { submitted, pending, total: gameTables.length };
  }, [gameTables, resultForTable]);

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
  }, [currentResult, currentTableIdx]);

  useEffect(() => {
    setCurrentTableIdx(0);
  }, [selectedGameId]);

  // Arrow key navigation in input mode (web only, skips when a text field is focused)
  useEffect(() => {
    if (mode !== "input" || typeof window === "undefined") {return;}
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") {return;}
      if (e.key === "ArrowLeft") {
        setCurrentTableIdx((i) => Math.max(0, i - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentTableIdx((i) => Math.min(gameTables.length - 1, i + 1));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, gameTables.length]);

  const modalFileId =
    sigModalIdx !== null ? currentResult?.signatureIds?.[sigModalIdx] : undefined;
  useEffect(() => {
    if (!modalFileId) {setModalSvg(null); setModalLoading(false); return;}
    setModalSvg(null);
    setModalLoading(true);
    storage
      .getFileView({ bucketId: SIGNATURES_BUCKET_ID, fileId: modalFileId })
      .then((buf) => setModalSvg(new TextDecoder("utf-8").decode(buf)))
      .catch(() => setModalSvg(null))
      .finally(() => setModalLoading(false));
  }, [modalFileId]);

  const handleSave = useCallback(async () => {
    if (!currentTable || !selectedGameId || saving) {return;}
    const ok = await confirm({
      title: t("confirmSave.title"),
      message: t("confirmSave.message"),
      confirmLabel: t("confirmSave.confirm"),
      cancelLabel: t("confirmSave.cancel"),
    });
    if (!ok) {return;}
    setSaving(true);
    try {
      const data = {
        gameId: selectedGameId,
        table: currentTable.tableNumber,
        placements,
        scores: scores.map((s) => parseFloat(s) || 0),
        note: note.trim(),
        signatureIds: currentResult?.signatureIds ?? Array(PLAYER_COUNT).fill(""),
        submitted: currentResult?.submitted ?? false,
      };
      if (currentResult) {
        await resultStore.update({ $id: currentResult.$id, ...data });
      } else {
        await resultStore.add(data);
      }
    } finally {
      setSaving(false);
    }
  }, [currentTable, selectedGameId, saving, placements, scores, note, currentResult, resultStore, confirm, t]);

  const handleCloseModal = useCallback(() => {
    setSigModalIdx(null);
    setConfirmingReset(false);
  }, []);

  const handleResetSingleSignature = useCallback(async () => {
    if (!currentResult || sigModalIdx === null) {return;}
    const newIds = [...(currentResult.signatureIds ?? Array(PLAYER_COUNT).fill(""))];
    newIds[sigModalIdx] = "";
    await resultStore.update({ $id: currentResult.$id, signatureIds: newIds });
    setSigModalIdx(null);
    setConfirmingReset(false);
  }, [currentResult, sigModalIdx, resultStore]);

  const handleSetPlacement = useCallback((seatIdx: number, value: string) => {
    setPlacements((prev) => {
      const next = [...prev];
      const conflictIdx = prev.findIndex((p, j) => j !== seatIdx && p === value);
      if (conflictIdx !== -1) {next[conflictIdx] = prev[seatIdx];}
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
    if (isNaN(raw)) {return;}
    const idx = gameTables.findIndex((t) => t.tableNumber === raw);
    if (idx !== -1) {
      setCurrentTableIdx(idx);
      setJumpText("");
    }
  }, [jumpText, gameTables]);

  if (gameSchedules.length === 0) {
    return <EmptyState message={t("noGame")} />;
  }

  const modalTitle =
    sigModalIdx !== null && currentTable?.players[sigModalIdx]
      ? `${teamName(currentTable.players[sigModalIdx])} · ${currentTable.players[sigModalIdx].name}`
      : `P${(sigModalIdx ?? 0) + 1}`;

  const header = (
    <View style={styles.stickyHeader}>
      <ChipGroup
        mode="select"
        options={gameSchedules.map((s) => ({ value: s.gameId!, label: s.title, isLive: s.isActive }))}
        value={selectedGameId ?? ""}
        onChange={(v) => setSelectedGameId(v)}
      />
      <View style={styles.modeRow}>
        <ChipGroup
          mode="select"
          options={[
            { value: "table", label: t("modeTable") },
            { value: "input", label: t("modeInput") },
          ]}
          value={mode}
          onChange={(v) => setMode(v as ViewMode)}
        />
        {gameTables.length > 0 && (
          <View style={styles.progressStats}>
            <Text style={styles.progressText}>
              {t("progressSubmitted")}: {progressStats.submitted} / {progressStats.total}
            </Text>
            <Text style={styles.progressSep}>·</Text>
            <Text style={styles.progressText}>
              {t("progressPending")}: {progressStats.pending}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  if (mode === "table") {
    return (
      <View style={styles.container}>
        {header}
        {gameTables.length === 0 ? (
          <EmptyState message={t("noTables")} />
        ) : (
          <ScoreTableView
            gameTables={gameTables}
            resultForTable={resultForTable}
            globalPos={globalPos}
            onTablePress={(idx) => { setCurrentTableIdx(idx); setMode("input"); }}
            t={t}
          />
        )}
      </View>
    );
  }

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
            </View>

            {Array.from({ length: PLAYER_COUNT }, (_, i) => (
              <ScorePlayerRow
                key={i}
                index={i}
                player={currentTable?.players[i]}
                placement={placements[i]}
                score={scores[i]}
                sigFileId={currentResult?.signatureIds?.[i]}
                onSetPlacement={handleSetPlacement}
                onSetScore={handleSetScore}
                onSigPress={setSigModalIdx}
                t={t}
              />
            ))}

            <TextInput
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
      gap: inset.list,
    },
    modeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: space[2],
    },
    progressStats: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[1],
    },
    progressText: { ...type.caption, color: colors.textMuted },
    progressSep: { ...type.caption, color: colors.border },
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
    },
    inputTableNum: { ...type.h2, color: colors.text },
    inputGlobalNum: { ...type.body, color: colors.textMuted },
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
