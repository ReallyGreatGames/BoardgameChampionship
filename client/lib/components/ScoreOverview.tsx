import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SvgXml } from "react-native-svg";
import { SIGNATURES_BUCKET_ID, storage } from "../appwrite";
import { useTheme } from "../bootstrap/ThemeProvider";
import { Player } from "../models/player";
import { Table } from "../models/table";
import { useResultStore } from "../stores/appwrite/result-store";
import { useScheduleStore } from "../stores/appwrite/schedule-store";
import { useTableStore } from "../stores/appwrite/table-store";
import { inset, space } from "../theme/spacing";
import { type } from "../theme/typography";
import { resolveGameId } from "../utils";
import { useDialog } from "./Dialog";

type ViewMode = "table" | "input";

const PLAYER_COUNT = 4;
const PLACEMENTS = ["1", "2", "3", "4"] as const;

function teamName(player: Player): string {
  return typeof player.team === "string" ? player.team : player.team.name;
}

// SVGs saved by signature.tsx lack viewBox, so SvgXml clips instead of scaling.
// Inject viewBox from width/height so the content scales to the display size.
function injectViewBox(xml: string): string {
  if (xml.includes("viewBox")) return xml;
  return xml.replace(/<svg([^>]*)>/, (_, attrs: string) => {
    const w = attrs.match(/width="([^"]+)"/)?.[1];
    const h = attrs.match(/height="([^"]+)"/)?.[1];
    if (!w || !h) return `<svg${attrs}>`;
    return `<svg${attrs} viewBox="0 0 ${w} ${h}">`;
  });
}

function StateBadge({
  result,
  colors,
  t,
}: {
  result: ReturnType<typeof useResultStore>["collection"][number] | undefined;
  colors: ReturnType<typeof useTheme>["colors"];
  t: (key: string) => string;
}) {
  const styles = useMemo(() => makeBadgeStyles(colors), [colors]);
  if (!result) {
    return (
      <View style={[styles.badge, styles.badgeNone]}>
        <Text style={[styles.badgeText, { color: colors.textMuted }]}>
          {t("statNone")}
        </Text>
      </View>
    );
  }
  if (result.submitted) {
    return (
      <View style={[styles.badge, styles.badgeSubmitted]}>
        <Text style={[styles.badgeText, { color: colors.success }]}>
          {t("statSubmitted")}
        </Text>
      </View>
    );
  }
  const sigCount = result.signatureIds?.filter(Boolean).length ?? 0;
  if (sigCount > 0) {
    return (
      <View style={[styles.badge, styles.badgeSigned]}>
        <Text style={[styles.badgeText, { color: "#B45309" }]}>
          {t("statSigned").replace("{n}", String(sigCount))}
        </Text>
      </View>
    );
  }
  return (
    <View style={[styles.badge, styles.badgeSaved]}>
      <Text style={[styles.badgeText, { color: colors.primary }]}>
        {t("statSaved")}
      </Text>
    </View>
  );
}

function makeBadgeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    badge: {
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderWidth: 1,
    },
    badgeText: {
      ...type.caption,
      fontWeight: "600",
    },
    badgeNone: {
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    badgeSaved: {
      borderColor: colors.primary + "66",
      backgroundColor: colors.primary + "18",
    },
    badgeSigned: {
      borderColor: "#F59E0B66",
      backgroundColor: "#F59E0B18",
    },
    badgeSubmitted: {
      borderColor: colors.success + "66",
      backgroundColor: colors.success + "18",
    },
  });
}

function SignatureSlot({
  fileId,
  colors,
}: {
  fileId: string | undefined;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const [svg, setSvg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!fileId) { setSvg(null); setError(false); setLoading(false); return; }
    setSvg(null);
    setError(false);
    setLoading(true);
    storage
      .getFileView({ bucketId: SIGNATURES_BUCKET_ID, fileId })
      .then((buffer) => setSvg(new TextDecoder("utf-8").decode(buffer)))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [fileId]);

  const borderColor = fileId ? colors.primary + "66" : colors.border;

  return (
    <View
      style={[
        sigSlotStyles.container,
        { borderColor, backgroundColor: "#ffffff" },
      ]}
    >
      {loading && <ActivityIndicator size="small" color={colors.textMuted} />}
      {!loading && svg && <SvgXml xml={injectViewBox(svg)} width={64} height={40} />}
      {!loading && !svg && !error && (
        <Ionicons name="create-outline" size={20} color={colors.textMuted} />
      )}
      {error && (
        <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
      )}
    </View>
  );
}

const sigSlotStyles = StyleSheet.create({
  container: {
    width: 68,
    height: 44,
    borderWidth: 1,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});

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

  // Form state for easy input mode
  const [placements, setPlacements] = useState<string[]>(
    Array(PLAYER_COUNT).fill(""),
  );
  const [scores, setScores] = useState<string[]>(Array(PLAYER_COUNT).fill(""));
  const [note, setNote] = useState("");

  const gameSchedules = useMemo(
    () =>
      [...schedules]
        .filter((s) => !!s.gameId)
        .sort((a, b) => a.sortIndex - b.sortIndex),
    [schedules],
  );

  const defaultGameId = useMemo(() => {
    const active = gameSchedules.find((s) => s.isActive);
    if (active) return active.gameId!;
    const nextUp = gameSchedules.find((s) => !s.isFinished);
    if (nextUp) return nextUp.gameId!;
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
    (tableNumber: number) =>
      tableNumber + tablesPerGame * Math.max(0, gameIndex),
    [tablesPerGame, gameIndex],
  );

  const resultForTable = useCallback(
    (tableNumber: number) =>
      results.find(
        (r) => r.gameId === selectedGameId && r.table === tableNumber,
      ),
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

  // Reset form when game changes
  useEffect(() => {
    setCurrentTableIdx(0);
  }, [selectedGameId]);

  // Arrow key navigation in input mode (web only, skips when a text field is focused)
  useEffect(() => {
    if (mode !== "input" || typeof window === "undefined") return;
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.key === "ArrowLeft") {
        setCurrentTableIdx((i) => Math.max(0, i - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentTableIdx((i) => Math.min(gameTables.length - 1, i + 1));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, gameTables.length]);

  // Load SVG for signature modal
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
  }, [
    currentTable,
    selectedGameId,
    saving,
    placements,
    scores,
    note,
    currentResult,
    resultStore,
    confirm,
    t,
  ]);

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

  const handleSetPlacement = useCallback(
    (seatIdx: number, value: string) => {
      setPlacements((prev) => {
        const next = [...prev];
        const conflictIdx = prev.findIndex((p, j) => j !== seatIdx && p === value);
        if (conflictIdx !== -1) next[conflictIdx] = prev[seatIdx];
        next[seatIdx] = value;
        return next;
      });
    },
    [],
  );

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
    const idx = gameTables.findIndex((t) => t.tableNumber === raw);
    if (idx !== -1) {
      setCurrentTableIdx(idx);
      setJumpText("");
    }
  }, [jumpText, gameTables]);

  if (gameSchedules.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{t("noGame")}</Text>
      </View>
    );
  }

  const header = (
    <View style={styles.stickyHeader}>
      <View style={styles.gamePicker}>
        {gameSchedules.map((s) => {
          const isSelected = s.gameId === selectedGameId;
          return (
            <Pressable
              key={s.$id}
              style={[
                styles.gamePickerBtn,
                isSelected && styles.gamePickerBtnActive,
              ]}
              onPress={() => setSelectedGameId(s.gameId!)}
            >
              {s.isActive && (
                <View
                  style={[
                    styles.liveIndicator,
                    isSelected && styles.liveIndicatorActive,
                  ]}
                />
              )}
              <Text
                style={[
                  styles.gamePickerLabel,
                  isSelected && styles.gamePickerLabelActive,
                ]}
                numberOfLines={1}
              >
                {s.title}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.modeRow}>
        <View style={styles.modeToggle}>
          {(["table", "input"] as ViewMode[]).map((m) => (
            <Pressable
              key={m}
              style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
              onPress={() => setMode(m)}
            >
              <Text
                style={[
                  styles.modeBtnLabel,
                  mode === m && styles.modeBtnLabelActive,
                ]}
              >
                {t(m === "table" ? "modeTable" : "modeInput")}
              </Text>
            </Pressable>
          ))}
        </View>

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
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t("noTables")}</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.tableList}
            showsVerticalScrollIndicator={false}
          >
            {/* Column headers */}
            <View style={styles.tableHeaderRow}>
              <View style={styles.colTable}>
                <Text style={styles.colHeader}>{t("tableLabel").replace("{n}", "#")}</Text>
              </View>
              {Array.from({ length: PLAYER_COUNT }, (_, i) => (
                <View key={i} style={styles.colPlayer}>
                  <Text style={styles.colHeader}>{t("placementLabel").replace("{n}", String(i + 1))}</Text>
                </View>
              ))}
              <View style={styles.colState}>
                <Text style={styles.colHeader}> </Text>
              </View>
            </View>

            {gameTables.map((table, rowIdx) => {
              const result = resultForTable(table.tableNumber);
              const isEven = rowIdx % 2 === 0;
              return (
                <TouchableOpacity
                  key={table.$id}
                  style={[
                    styles.tableRow,
                    { backgroundColor: isEven ? colors.surface : colors.background },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setCurrentTableIdx(rowIdx);
                    setMode("input");
                  }}
                >
                  {/* Table # */}
                  <View style={styles.colTable}>
                    <Text style={styles.tableNum}>
                      {t("globalLabel").replace("{n}", String(globalPos(table.tableNumber)))}
                    </Text>
                    <Text style={styles.globalNum}>
                      {t("tableLabel").replace("{n}", String(table.tableNumber))}
                    </Text>
                  </View>

                  {/* Players */}
                  {Array.from({ length: PLAYER_COUNT }, (_, i) => {
                    const player: Player | undefined = table.players[i];
                    const placement = result?.placements?.[i] ?? "–";
                    const score = result?.scores?.[i];
                    return (
                      <View key={i} style={styles.colPlayer}>
                        <View style={styles.playerScoreRow}>
                          <View style={[styles.placementPill, placement === "–" && styles.placementPillEmpty]}>
                            <Text style={[styles.placementPillText, placement === "–" && styles.placementPillTextEmpty]}>
                              {placement !== "–" ? placement : "–"}
                            </Text>
                          </View>
                          <Text style={styles.playerScore} numberOfLines={1}>
                            {score !== undefined ? String(score) : ""}
                          </Text>
                        </View>
                        <Text style={styles.playerName} numberOfLines={1}>
                          {player ? player.name : "–"}
                        </Text>
                      </View>
                    );
                  })}

                  {/* State */}
                  <View style={styles.colState}>
                    <StateBadge result={result} colors={colors} t={t} />
                    {result?.note ? (
                      <Ionicons
                        name="document-text-outline"
                        size={12}
                        color={colors.textMuted}
                        style={{ marginTop: 2 }}
                      />
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {header}
      {gameTables.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t("noTables")}</Text>
        </View>
      ) : (
        <View style={styles.inputOuter}>
          {/* Navigation bar */}
          <View style={styles.navBar}>
            <TouchableOpacity
              style={[styles.navBtn, currentTableIdx === 0 && styles.navBtnDisabled]}
              onPress={() => setCurrentTableIdx((i) => Math.max(0, i - 1))}
              disabled={currentTableIdx === 0}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={currentTableIdx === 0 ? colors.textMuted : colors.text}
              />
            </TouchableOpacity>

            <View style={styles.navCenter}>
              <Text style={styles.navCurrent}>{currentTableIdx + 1}</Text>
              <TextInput
                style={styles.jumpInput}
                value={jumpText}
                onChangeText={setJumpText}
                onSubmitEditing={handleJump}
                placeholder={t("jumpPlaceholder")}
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                returnKeyType="go"
              />
              <Text style={styles.navCurrent}>{gameTables.length}</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.navBtn,
                currentTableIdx === gameTables.length - 1 && styles.navBtnDisabled,
              ]}
              onPress={() =>
                setCurrentTableIdx((i) => Math.min(gameTables.length - 1, i + 1))
              }
              disabled={currentTableIdx === gameTables.length - 1}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={
                  currentTableIdx === gameTables.length - 1
                    ? colors.textMuted
                    : colors.text
                }
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.inputCard}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Card header */}
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
              {currentResult && (
                <StateBadge result={currentResult} colors={colors} t={t} />
              )}
            </View>

            {/* Player rows */}
            {Array.from({ length: PLAYER_COUNT }, (_, i) => {
              const player: Player | undefined = currentTable?.players[i];
              const sigFileId = currentResult?.signatureIds?.[i];
              return (
                <View key={i} style={styles.inputPlayerRow}>
                  <Text style={[
                    styles.placementPrefix,
                    placements[i] ? styles.placementPrefixSet : styles.placementPrefixEmpty,
                  ]}>
                    {placements[i] || "–"}
                  </Text>

                  <View style={styles.inputPlayerInfo}>
                    <Text style={styles.inputPlayerName} numberOfLines={1}>
                      {player ? player.name : `P${i + 1}`}
                    </Text>
                    {player && (
                      <Text style={styles.inputPlayerTeam} numberOfLines={1}>
                        {teamName(player)}
                      </Text>
                    )}
                  </View>

                  <View style={styles.placementRow}>
                    {PLACEMENTS.map((p) => {
                      const active = placements[i] === p;
                      return (
                        <TouchableOpacity
                          key={p}
                          style={[
                            styles.placementBtn,
                            active && styles.placementBtnActive,
                          ]}
                          onPress={() => handleSetPlacement(i, p)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.placementBtnLabel,
                              active && styles.placementBtnLabelActive,
                            ]}
                          >
                            {p}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TextInput
                    style={styles.scoreInput}
                    value={scores[i]}
                    onChangeText={(v) => handleSetScore(i, v)}
                    placeholder={t("scorePlaceholder")}
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    returnKeyType="next"
                  />

                  <TouchableOpacity
                    onPress={sigFileId ? () => setSigModalIdx(i) : undefined}
                    activeOpacity={sigFileId ? 0.7 : 1}
                    disabled={!sigFileId}
                  >
                    <SignatureSlot fileId={sigFileId} colors={colors} />
                  </TouchableOpacity>
                </View>
              );
            })}

            {/* Note field */}
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder={t("notePlaceholder")}
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />

            {/* Save button */}
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

      {/* Signature modal */}
      <Modal
        visible={sigModalIdx !== null}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <Pressable style={styles.modalBackdrop} onPress={handleCloseModal}>
          <Pressable style={styles.modalCard} onPress={() => { }}>
            <Text style={styles.modalTitle}>
              {sigModalIdx !== null && currentTable?.players[sigModalIdx]
                ? `${teamName(currentTable.players[sigModalIdx])} · ${currentTable.players[sigModalIdx].name}`
                : `P${(sigModalIdx ?? 0) + 1}`}
            </Text>

            <View style={styles.modalSigBox}>
              {modalLoading && <ActivityIndicator color={colors.primary} />}
              {!modalLoading && modalSvg && (
                <SvgXml xml={injectViewBox(modalSvg)} width={280} height={180} />
              )}
              {!modalLoading && !modalSvg && (
                <Ionicons name="alert-circle-outline" size={32} color={colors.error} />
              )}
            </View>

            {confirmingReset ? (
              <>
                <Text style={styles.modalConfirmMsg}>{t("confirmResetOne.message")}</Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setConfirmingReset(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalCancelLabel}>{t("confirmResetOne.cancel")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalResetBtn}
                    onPress={handleResetSingleSignature}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalResetLabel}>{t("confirmResetOne.reset")}</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={handleCloseModal}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelLabel}>{t("confirmResetOne.cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalResetBtn}
                  onPress={() => setConfirmingReset(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalResetLabel}>{t("confirmResetOne.reset")}</Text>
                </TouchableOpacity>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: { flex: 1 },
    empty: { flex: 1, alignItems: "center", justifyContent: "center" },
    emptyText: { ...type.bodySmall, color: colors.textMuted },

    // ── Sticky header ─────────────────────────────────────────────────────────
    stickyHeader: {
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: inset.list,
      gap: inset.list,
    },
    gamePicker: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: space[1],
    },
    gamePickerBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[1],
      paddingVertical: space[2],
      paddingHorizontal: space[4],
      borderRadius: 6,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    gamePickerBtnActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    liveIndicator: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.success,
    },
    liveIndicatorActive: { backgroundColor: colors.onAccent },
    gamePickerLabel: { ...type.bodySmall, color: colors.textSecondary },
    gamePickerLabelActive: {
      color: colors.onAccent,
      fontWeight: "600",
    },
    modeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: space[2],
    },
    modeToggle: {
      flexDirection: "row",
      gap: space[1],
    },
    progressStats: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[1],
    },
    progressText: { ...type.caption, color: colors.textMuted },
    progressSep: { ...type.caption, color: colors.border },
    modeBtn: {
      paddingVertical: space[2],
      paddingHorizontal: space[4],
      borderRadius: 6,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modeBtnActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    modeBtnLabel: { ...type.bodySmall, color: colors.textSecondary },
    modeBtnLabelActive: { color: colors.onAccent, fontWeight: "600" },

    // ── Table view ────────────────────────────────────────────────────────────
    tableList: { paddingBottom: inset.screenBottom },
    tableHeaderRow: {
      flexDirection: "row",
      paddingHorizontal: inset.card,
      paddingVertical: space[2],
      backgroundColor: colors.surfaceHigh,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    colHeader: { ...type.caption, color: colors.textMuted, fontWeight: "600" },
    tableRow: {
      flexDirection: "row",
      paddingHorizontal: inset.card,
      paddingVertical: space[3],
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
      alignItems: "center",
    },
    colTable: { width: 52 },
    colPlayer: { flex: 1, paddingHorizontal: 2 },
    colState: { width: 72, alignItems: "flex-end" },
    tableNum: { ...type.bodySmall, color: colors.text, fontWeight: "600" },
    globalNum: { ...type.caption, color: colors.textMuted },
    playerScoreRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    placementPill: {
      width: 20,
      height: 20,
      borderRadius: 4,
      backgroundColor: colors.primary + "22",
      borderWidth: 1,
      borderColor: colors.primary + "55",
      alignItems: "center",
      justifyContent: "center",
    },
    placementPillEmpty: {
      backgroundColor: "transparent",
      borderColor: colors.border,
    },
    placementPillText: { ...type.caption, color: colors.primary, fontWeight: "700" },
    placementPillTextEmpty: { color: colors.textMuted },
    playerScore: { ...type.bodySmall, color: colors.text, fontWeight: "600" },
    playerName: { ...type.caption, color: colors.textMuted },
    playerTeam: { ...type.caption, color: colors.textMuted },

    // ── Easy input mode ───────────────────────────────────────────────────────
    inputOuter: { flex: 1 },
    navBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: space[3],
      paddingHorizontal: inset.card,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      gap: space[2],
    },
    navBtn: {
      padding: space[2],
      borderRadius: 6,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    navBtnDisabled: { opacity: 0.35 },
    navCenter: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: space[2],
    },
    navCurrent: { ...type.body, color: colors.text, fontWeight: "600", minWidth: 24, textAlign: "right" },
    navTotal: { ...type.body, color: colors.textMuted, minWidth: 36 },
    jumpInput: {
      width: 80,
      height: 34,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      paddingHorizontal: space[2],
      ...type.bodySmall,
      color: colors.text,
      backgroundColor: colors.surface,
      textAlign: "center",
    },
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
    inputPlayerRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: space[2],
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
      gap: space[1],
    },
    inputPlayerInfo: { flex: 1, minWidth: 0 },
    inputPlayerName: { ...type.bodySmall, color: colors.text, fontWeight: "600" },
    inputPlayerTeam: { ...type.caption, color: colors.textMuted },
    placementRow: { flexDirection: "row", gap: 3, alignItems: "center" },
    placementBtn: {
      width: 26,
      height: 26,
      borderRadius: 5,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    placementBtnActive: {
      width: 32,
      height: 32,
      borderRadius: 6,
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    placementBtnLabel: { ...type.bodySmall, color: colors.textSecondary },
    placementBtnLabelActive: { color: colors.onAccent, fontWeight: "600" },
    placementPrefix: {
      ...type.body,
      fontWeight: "700",
      width: 20,
      textAlign: "center",
    },
    placementPrefixSet: { color: colors.primary },
    placementPrefixEmpty: { color: colors.textMuted },
    scoreInput: {
      width: 56,
      height: 34,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 5,
      paddingHorizontal: space[2],
      ...type.bodySmall,
      color: colors.text,
      backgroundColor: colors.surface,
      textAlign: "center",
    },
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

    // ── Signature modal ───────────────────────────────────────────────────────
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      alignItems: "center",
      justifyContent: "center",
      padding: inset.screen,
    },
    modalCard: {
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: inset.card,
      width: "100%",
      maxWidth: 360,
      gap: inset.list,
    },
    modalTitle: { ...type.h3, color: colors.text },
    modalSigBox: {
      height: 180,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: "#ffffff",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    modalConfirmMsg: { ...type.bodySmall, color: colors.textMuted },
    modalActions: { flexDirection: "row", gap: space[3] },
    modalCancelBtn: {
      flex: 1,
      paddingVertical: space[3],
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    modalCancelLabel: { ...type.body, color: colors.textSecondary },
    modalResetBtn: {
      flex: 1,
      paddingVertical: space[3],
      borderRadius: 8,
      backgroundColor: colors.error,
      alignItems: "center",
    },
    modalResetLabel: { ...type.body, color: "#ffffff", fontWeight: "600" },
  });
}
