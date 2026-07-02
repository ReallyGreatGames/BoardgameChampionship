import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { BackButton } from "@/lib/components/ui/BackButton";
import { useDialog } from "@/lib/components/ui/Dialog";
import { PlayerResultRow, type PlayerResultRowHandle } from "@/lib/components/results/PlayerResultRow";
import { usePlayerTable } from "@/lib/hooks/usePlayerTable";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { useResultStore } from "@/lib/stores/appwrite/result-store";
import { useScheduleStore } from "@/lib/stores/appwrite/schedule-store";
import { useTableStore } from "@/lib/stores/appwrite/table-store";
import { inset, space } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";
import { ui } from "@/lib/theme/ui";
import { hasScorePlacementConflict, isValidPlacementCombo } from "@/lib/utils/placements";
import { teamName } from "@/lib/utils";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const PLAYER_COUNT = 4;

function padArray<T>(arr: T[], length: number, fill: T): T[] {
  const copy = [...arr];
  while (copy.length < length) copy.push(fill);
  return copy.slice(0, length);
}

export default function ResultsPage() {
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const { user, loading } = useRequireAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["results"]);
  const { confirm } = useDialog();
  const resultStore = useResultStore();
  const scheduleStore = useScheduleStore();
  const tableNumber = usePlayerTable(gameId);
  const tables = useTableStore((s) => s.collection);

  // Player names ordered by seat index
  const playerData = useMemo(() => {
    if (!gameId || tableNumber === null) return [];
    const entry = tables.find((tbl) => {
      const tGameId = typeof tbl.game === "string" ? tbl.game : tbl.game.$id;
      return tGameId === gameId && tbl.tableNumber === tableNumber;
    });
    return entry?.players ?? [];
  }, [tables, gameId, tableNumber]);

  const isActiveGame = useMemo(
    () => scheduleStore.collection.find((s) => s.isActive)?.gameId === gameId,
    [scheduleStore.collection, gameId],
  );

  const existingResult = useMemo(
    () =>
      resultStore.collection.find(
        (r) => r.gameId === gameId && r.table === tableNumber,
      ),
    [resultStore.collection, gameId, tableNumber],
  );

  // State: all arrays are seat-indexed (index = seat at table)
  const [placements, setPlacements] = useState<string[]>(() =>
    Array(PLAYER_COUNT).fill(""),
  );
  const [scores, setScores] = useState<string[]>(() =>
    Array(PLAYER_COUNT).fill(""),
  );
  const [note, setNote] = useState("");
  const [signatureIds, setSignatureIds] = useState<string[]>(() =>
    Array(PLAYER_COUNT).fill(""),
  );
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const acknowledgedAtRef = useRef<string | null>(null);
  const ownSaveRef = useRef(false);

  // Refs for score/chip tab order
  const scoreRefs = useRef<(PlayerResultRowHandle | null)[]>([null, null, null, null]);
  const noteRef = useRef<TextInput | null>(null);

  useEffect(() => {
    acknowledgedAtRef.current = null;
    ownSaveRef.current = false;
    setPlacements(Array(PLAYER_COUNT).fill(""));
    setScores(Array(PLAYER_COUNT).fill(""));
    setNote("");
    setSignatureIds(Array(PLAYER_COUNT).fill(""));
  }, [gameId, tableNumber]);

  useEffect(() => {
    if (!existingResult) return;
    if (acknowledgedAtRef.current === null) {
      acknowledgedAtRef.current = existingResult.$updatedAt;
      setPlacements(padArray(existingResult.placements ?? [], PLAYER_COUNT, ""));
      setScores(
        padArray((existingResult.scores ?? []).map(String), PLAYER_COUNT, ""),
      );
      setNote(existingResult.note ?? "");
      setSignatureIds(
        padArray(existingResult.signatureIds ?? [], PLAYER_COUNT, ""),
      );
    } else if (ownSaveRef.current) {
      ownSaveRef.current = false;
      acknowledgedAtRef.current = existingResult.$updatedAt;
    }
  }, [existingResult]);

  useFocusEffect(
    useCallback(() => {
      if (existingResult && acknowledgedAtRef.current !== null) {
        setSignatureIds(
          padArray(existingResult.signatureIds ?? [], PLAYER_COUNT, ""),
        );
      }
    }, [existingResult]),
  );

  const handleBack = useCallback(() => {
    if (gameId) router.replace(`/game?gameId=${gameId}`);
    else router.replace("/");
  }, [gameId]);

  const isSubmitted = existingResult?.submitted ?? false;
  const signatureCount = signatureIds.filter(Boolean).length;
  const anySigned = signatureCount > 0;
  const twoSigned = signatureCount >= 2;
  const hasNote = note.trim().length > 0;
  const disabled = isSubmitted || twoSigned;

  const allPlacementsSet = placements.every((p) => p !== "");
  const allScoresValid = scores.every((s) => {
    const n = parseFloat(s);
    return s.trim() !== "" && !isNaN(n) && n >= 0;
  });
  const placementComboValid = !allPlacementsSet || isValidPlacementCombo(placements);
  const scoreConflict = hasScorePlacementConflict(placements, scores);

  const canSave =
    allPlacementsSet &&
    allScoresValid &&
    placementComboValid &&
    !scoreConflict &&
    !isSubmitted &&
    isActiveGame;

  const canSubmit =
    !isSubmitted &&
    isActiveGame &&
    (signatureCount === PLAYER_COUNT || (signatureCount === 3 && hasNote));

  const showNoteHint = !isSubmitted && signatureCount === 3 && !hasNote;

  const buildPayload = useCallback(
    (submittedFlag: boolean) => ({
      gameId: gameId ?? "",
      table: tableNumber ?? 0,
      placements,
      scores: scores.map((s) => parseFloat(s) || 0),
      note: note.trim(),
      signatureIds,
      submitted: submittedFlag,
    }),
    [gameId, tableNumber, placements, scores, note, signatureIds],
  );

  const handleSave = useCallback(async (): Promise<boolean> => {
    if (!canSave || saving) return false;

    if (existingResult) {
      const timestampDrifted =
        existingResult.$updatedAt !== acknowledgedAtRef.current;
      const dbPlacements = padArray(existingResult.placements ?? [], PLAYER_COUNT, "");
      const dbScores = padArray(
        (existingResult.scores ?? []).map(String),
        PLAYER_COUNT,
        "",
      );
      const dbNote = existingResult.note ?? "";
      const valuesDiffer =
        placements.some((p, i) => p !== dbPlacements[i]) ||
        scores.some((s, i) => parseFloat(s) !== parseFloat(dbScores[i] || "0")) ||
        note.trim() !== dbNote.trim();

      if (timestampDrifted && valuesDiffer) {
        const overwrite = await confirm({
          title: t("confirmOverwrite.title"),
          message: t("confirmOverwrite.message"),
          confirmLabel: t("confirmOverwrite.confirm"),
          cancelLabel: t("confirmOverwrite.cancel"),
        });
        if (!overwrite) {
          setPlacements(dbPlacements);
          setScores(dbScores);
          setNote(dbNote);
          acknowledgedAtRef.current = existingResult.$updatedAt;
          return true;
        }
      }
    }

    setSaving(true);
    try {
      const data = buildPayload(false);
      if (existingResult) {
        await resultStore.update({ $id: existingResult.$id, ...data });
      } else {
        await resultStore.add(data);
      }
      ownSaveRef.current = true;
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  }, [canSave, saving, existingResult, placements, scores, note, confirm, t, buildPayload, resultStore]);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;

    // Always try to save first
    if (canSave) {
      const saved = await handleSave();
      if (!saved) return;
    }

    if (!canSubmit) {
      if (signatureCount < 3) {
        await confirm({
          title: t("sigRequiredTitle"),
          message: t("sigRequiredMessage"),
          confirmLabel: t("submitBlockedOk"),
          cancelLabel: null,
          icon: "pencil-outline",
        });
      } else {
        await confirm({
          title: t("submitBlockedTitle"),
          message: t("submitBlockedMessage"),
          confirmLabel: t("submitBlockedOk"),
          cancelLabel: null,
        });
      }
      return;
    }

    const ok = await confirm({
      title: t("confirmSubmit.title"),
      message: t("confirmSubmit.message"),
      confirmLabel: t("confirmSubmit.confirm"),
      cancelLabel: t("confirmSubmit.cancel"),
    });
    if (!ok) return;

    setSubmitting(true);
    try {
      const data = buildPayload(true);
      if (existingResult) {
        await resultStore.update({ $id: existingResult.$id, ...data });
      } else {
        await resultStore.add(data);
      }
    } finally {
      setSubmitting(false);
    }
  }, [
    submitting,
    canSave,
    canSubmit,
    handleSave,
    confirm,
    t,
    buildPayload,
    existingResult,
    resultStore,
  ]);

  const handleSetPlacement = useCallback((i: number, v: string) => {
    setPlacements((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  }, []);

  const handleSetScore = useCallback((i: number, v: string) => {
    setScores((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  }, []);

  const handleOpenSignature = useCallback(
    async (seat: number) => {
      if (canSave) {
        const saved = await handleSave();
        if (!saved) return;
      }
      router.push(`/(pages)/(user)/signature?gameId=${gameId}&place=${seat}`);
    },
    [canSave, handleSave, gameId],
  );

  if (loading || !user) return null;

  return (
    <View style={styles.container}>
      <BackButton onPress={handleBack} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.tableHeading}>
            {tableNumber !== null ? t("tableHeader").replace("{n}", String(tableNumber)) : "—"}
          </Text>
          {isSubmitted && (
            <View style={styles.submittedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={styles.submittedBadgeText}>{t("submitted")}</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          {Array.from({ length: PLAYER_COUNT }, (_, i) => {
            const player = playerData[i];
            const sigId = signatureIds[i];
            return (
              <PlayerResultRow
                key={i}
                ref={(el) => { scoreRefs.current[i] = el; }}
                playerName={player?.name ?? `P${i + 1}`}
                playerTeam={player ? teamName(player) : undefined}
                placement={placements[i]}
                score={scores[i]}
                onSetPlacement={(v) => handleSetPlacement(i, v)}
                onSetScore={(v) => handleSetScore(i, v)}
                onScoreSubmitEditing={() => {
                  if (i < PLAYER_COUNT - 1) scoreRefs.current[i + 1]?.focusScore();
                  else noteRef.current?.focus();
                }}
                onScoreTabForward={() => {
                  if (i < PLAYER_COUNT - 1) scoreRefs.current[i + 1]?.focusScore();
                  else scoreRefs.current[0]?.focusChips();
                }}
                onScoreTabBackward={i > 0 ? () => scoreRefs.current[i - 1]?.focusScore() : undefined}
                onChipTabForward={() => {
                  if (i < PLAYER_COUNT - 1) scoreRefs.current[i + 1]?.focusChips();
                  else noteRef.current?.focus();
                }}
                onChipTabBackward={() => {
                  if (i > 0) scoreRefs.current[i - 1]?.focusChips();
                  else scoreRefs.current[PLAYER_COUNT - 1]?.focusScore();
                }}
                disabled={disabled}
                placementError={scoreConflict}
                signatureSlot={
                  <TouchableOpacity
                    style={[
                      styles.sigBtn,
                      !!sigId && styles.sigBtnSigned,
                      (!isActiveGame ||
                        (!sigId && !anySigned && (!allPlacementsSet || !allScoresValid || isSubmitted))) &&
                        styles.sigBtnDisabled,
                    ]}
                    onPress={() => handleOpenSignature(i)}
                    disabled={
                      !isActiveGame ||
                      (!sigId && !anySigned && (!allPlacementsSet || !allScoresValid || isSubmitted))
                    }
                    activeOpacity={0.7}
                    // @ts-expect-error — web-only: remove sig from tab order
                    tabIndex={Platform.OS === "web" ? -1 : undefined}
                  >
                    <Ionicons
                      name={sigId ? "checkmark-circle" : "pencil-outline"}
                      size={20}
                      color={
                        sigId
                          ? colors.success
                          : !allPlacementsSet || !allScoresValid
                            ? colors.textMuted
                            : colors.primary
                      }
                    />
                  </TouchableOpacity>
                }
              />
            );
          })}

          {/* Error / hint area — anchored inside the card so the card position never shifts */}
          {(scoreConflict || !placementComboValid || (signatureCount < 3 && !isSubmitted && isActiveGame)) && (
            <View style={styles.cardErrors}>
              {scoreConflict && (
                <View style={styles.cardErrorRow}>
                  <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
                  <Text style={styles.cardErrorText}>{t("warnScoreConflict")}</Text>
                </View>
              )}
              {!placementComboValid && (
                <View style={styles.cardErrorRow}>
                  <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
                  <Text style={styles.cardErrorText}>{t("warnPlacementInvalid")}</Text>
                </View>
              )}
              {signatureCount < 3 && !isSubmitted && isActiveGame && (
                <View style={styles.cardErrorRow}>
                  <Ionicons name="pencil-outline" size={14} color={colors.error} />
                  <Text style={styles.cardErrorText}>{t("hintSignatures")}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{t("note")}</Text>
          <TextInput
            ref={noteRef}
            style={[
              styles.input,
              styles.noteInput,
              showNoteHint && styles.inputError,
            ]}
            value={note}
            onChangeText={setNote}
            placeholder={t("notePlaceholder")}
            placeholderTextColor={colors.textPlaceholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!isSubmitted}
          />
          {showNoteHint && (
            <View style={styles.hint}>
              <Ionicons name="warning-outline" size={13} color={colors.error} />
              <Text style={styles.hintError}>{t("hintNote")}</Text>
            </View>
          )}
          {!isActiveGame && !isSubmitted && (
            <View style={styles.hint}>
              <Ionicons name="lock-closed-outline" size={13} color={colors.textMuted} />
              <Text style={styles.hintMuted}>{t("notActiveGame")}</Text>
            </View>
          )}
        </View>

        {/* Single submit button */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            (isSubmitted || (!canSave && !canSubmit)) && styles.btnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitted || submitting || saving}
          activeOpacity={0.7}
        >
          {submitting || saving ? (
            <ActivityIndicator size="small" color={colors.onAccent} />
          ) : (
            <>
              <Ionicons
                name="checkmark-done-outline"
                size={18}
                color={isSubmitted ? colors.textMuted : colors.onAccent}
              />
              <Text style={[styles.submitBtnText, isSubmitted && styles.submitBtnTextMuted]}>
                {t("submit")}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: inset.screen,
      paddingTop: inset.group,
    },
    scroll: {
      paddingBottom: inset.screenBottom,
      gap: inset.group,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: inset.tight,
      paddingTop: inset.group,
    },
    tableHeading: {
      ...type.h2,
      color: colors.text,
      flex: 1,
    },
    submittedBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.success + "20",
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: colors.success + "60",
    },
    submittedBadgeText: {
      ...type.caption,
      color: colors.success,
      fontWeight: "600",
    },
    warnRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.error + "18",
      borderRadius: 8,
      paddingHorizontal: inset.card,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.error + "40",
    },
    warnText: {
      ...type.caption,
      color: colors.error,
      flex: 1,
    },
    cardErrors: {
      marginTop: space[2],
      marginBottom: space[1],
      gap: 4,
    },
    cardErrorRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.error + "18",
      borderRadius: 8,
      paddingHorizontal: inset.card,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.error + "40",
    },
    cardErrorText: {
      ...type.caption,
      color: colors.error,
      flex: 1,
    },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      overflow: "hidden",
      paddingHorizontal: inset.card,
    },
    sigBtn: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: colors.surfaceHigh,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
    },
    sigBtnDisabled: {
      opacity: 0.4,
    },
    sigBtnSigned: {
      backgroundColor: colors.success + "20",
      borderColor: colors.success,
    },
    field: {
      gap: 6,
    },
    fieldLabel: {
      ...type.caption,
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    input: {
      ...type.body,
      color: colors.text,
      backgroundColor: colors.surfaceHigh,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 10,
    },
    noteInput: {
      minHeight: 96,
    },
    inputError: {
      borderColor: colors.error,
    },
    hint: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    hintError: {
      ...type.caption,
      color: colors.error,
    },
    hintMuted: {
      ...type.caption,
      color: colors.textMuted,
    },
    submitBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: colors.accent,
      borderRadius: ui.buttonRadius,
      paddingVertical: 16,
    },
    submitBtnText: {
      ...type.button,
      color: colors.onAccent,
    },
    submitBtnTextMuted: {
      color: colors.textMuted,
    },
    btnDisabled: {
      opacity: 0.4,
    },
  });
}
