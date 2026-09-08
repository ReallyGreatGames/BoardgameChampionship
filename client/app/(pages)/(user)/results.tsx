import { SIGNATURES_BUCKET_ID, storage } from "@/lib/appwrite";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { GameHeader } from "@/lib/components/game/GameHeader";
import { BackButton } from "@/lib/components/ui/BackButton";
import { useDialog } from "@/lib/components/ui/Dialog";
import {
  PlayerResultColumnHeaders,
  PlayerResultRow,
  SIGNATURE_COLUMN_WIDTH,
  type PlayerResultRowHandle,
} from "@/lib/components/results/PlayerResultRow";
import { useGameScheduleInfo } from "@/lib/hooks/useGameScheduleInfo";
import { usePlayerTable } from "@/lib/hooks/usePlayerTable";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { NO_SIGNATURE } from "@/lib/models/result";
import { useResultStore } from "@/lib/stores/appwrite/result-store";
import { useScheduleStore } from "@/lib/stores/appwrite/schedule-store";
import { useTableStore } from "@/lib/stores/appwrite/table-store";
import { inset, space } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";
import { ui } from "@/lib/theme/ui";
import { hasScorePlacementConflict, isValidPlacementCombo } from "@/lib/utils/placements";
import { teamName } from "@/lib/utils";
import { goBackTo, goTo } from "@/lib/utils/navigation";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useNavigation } from "expo-router";
import { DrawerActions } from "expo-router/react-navigation";
import { Check, Signature } from "lucide-react-native";
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
  const { gameId, from } = useLocalSearchParams<{ gameId: string; from?: string }>();
  const { user, loading } = useRequireAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["results"]);
  const { confirm } = useDialog();
  const navigation = useNavigation();
  const game = useGameScheduleInfo(gameId);
  const resultStore = useResultStore();
  const scheduleStore = useScheduleStore();
  const tableNumber = usePlayerTable(gameId);
  const tables = useTableStore((s) => s.collection);

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
  const [signaturesReset, setSignaturesReset] = useState(false);

  const acknowledgedAtRef = useRef<string | null>(null);
  const ownSaveRef = useRef(false);
  const droppedSignatureIdsRef = useRef<string[]>([]);

  const scoreRefs = useRef<(PlayerResultRowHandle | null)[]>([null, null, null, null]);
  const noteRef = useRef<TextInput | null>(null);

  useEffect(() => {
    acknowledgedAtRef.current = null;
    ownSaveRef.current = false;
    setPlacements(Array(PLAYER_COUNT).fill(""));
    setScores(Array(PLAYER_COUNT).fill(""));
    setNote("");
    setSignatureIds(Array(PLAYER_COUNT).fill(""));
    setSignaturesReset(false);
    droppedSignatureIdsRef.current = [];
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
      setSignaturesReset(false);
    }
  }, [existingResult]);

  useFocusEffect(
    useCallback(() => {
      if (existingResult && acknowledgedAtRef.current !== null && !signaturesReset) {
        setSignatureIds(
          padArray(existingResult.signatureIds ?? [], PLAYER_COUNT, ""),
        );
      }
    }, [existingResult, signaturesReset]),
  );

  const selfHref = `/(pages)/(user)/results?gameId=${gameId}`;
  const tableLabel =
    tableNumber !== null
      ? t("tableHeader").replace("{n}", String(tableNumber))
      : null;

  const openMenu = useCallback(
    () => navigation.dispatch(DrawerActions.openDrawer()),
    [navigation],
  );

  const handleBack = useCallback(() => {
    goBackTo(from ?? (gameId ? `/game?gameId=${gameId}` : "/"));
  }, [from, gameId]);

  const isSubmitted = existingResult?.submitted ?? false;
  const signatureCount = signatureIds.filter(Boolean).length;
  const disabled = isSubmitted;

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

  const canSubmit = !isSubmitted && isActiveGame && signatureCount === PLAYER_COUNT;

  const canSign = canSave;

  const tiedPlaces = useMemo(() => {
    if (!allPlacementsSet || !placementComboValid) {
      return [];
    }
    const counts = new Map<string, number>();
    placements.forEach((p) => counts.set(p, (counts.get(p) ?? 0) + 1));
    return [...counts.entries()]
      .filter(([, count]) => count > 1)
      .map(([p]) => Number(p))
      .sort((a, b) => a - b);
  }, [placements, allPlacementsSet, placementComboValid]);

  const resultReady = allPlacementsSet && allScoresValid && placementComboValid && !scoreConflict && signatureCount === PLAYER_COUNT;

  const gateMessage = useMemo(() => {
    if (isSubmitted) {
      return t("gateSubmitted");
    }
    if (!isActiveGame) {
      return t("notActiveGame");
    }
    if (resultReady) {
      return t("gateReady");
    }
    const missing: string[] = [];
    if (!allScoresValid) {
      missing.push(t("gateMissingScores"));
    }
    if (!allPlacementsSet || !placementComboValid || scoreConflict) {
      missing.push(t("gateMissingPlacements"));
    }
    const messages = missing.length
      ? [t("gateMissingPrefix").replace("{items}", missing.join(", "))]
      : [];
    if (signatureCount < PLAYER_COUNT) {
      messages.push(t(`gateMissingSignatures${PLAYER_COUNT - signatureCount}`));
    }
    return messages.join(" ");
  }, [isSubmitted, isActiveGame, resultReady, allScoresValid, allPlacementsSet, placementComboValid, scoreConflict, signatureCount, t]);

  const gateReady = isSubmitted || resultReady;

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

  const purgeDroppedSignatures = useCallback(async () => {
    const fileIds = droppedSignatureIdsRef.current;
    if (fileIds.length === 0) {
      return;
    }
    droppedSignatureIdsRef.current = [];
    await Promise.allSettled(
      fileIds.map((fileId) =>
        storage.deleteFile({ bucketId: SIGNATURES_BUCKET_ID, fileId }),
      ),
    );
  }, []);

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
      await purgeDroppedSignatures();
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  }, [canSave, saving, existingResult, placements, scores, note, confirm, t, buildPayload, purgeDroppedSignatures, resultStore]);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;

    if (canSave) {
      const saved = await handleSave();
      if (!saved) return;
    }

    if (!canSubmit) {
      if (signatureCount < PLAYER_COUNT) {
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
    signatureCount,
    handleSave,
    confirm,
    t,
    buildPayload,
    existingResult,
    resultStore,
  ]);

  const invalidateSignatures = useCallback(() => {
    if (!signatureIds.some(Boolean)) {
      return;
    }
    droppedSignatureIdsRef.current = [
      ...droppedSignatureIdsRef.current,
      ...signatureIds.filter(Boolean),
    ];
    setSignatureIds(Array(PLAYER_COUNT).fill(""));
    setSignaturesReset(true);
  }, [signatureIds]);

  const handleSetPlacement = useCallback(
    (i: number, v: string) => {
      if (placements[i] === v) {
        return;
      }
      setPlacements((prev) => {
        const next = [...prev];
        next[i] = v;
        return next;
      });
      invalidateSignatures();
    },
    [placements, invalidateSignatures],
  );

  const handleSetScore = useCallback(
    (i: number, v: string) => {
      if (scores[i] === v) {
        return;
      }
      setScores((prev) => {
        const next = [...prev];
        next[i] = v;
        return next;
      });
      invalidateSignatures();
    },
    [scores, invalidateSignatures],
  );

  const handleOpenSignature = useCallback(
    async (seat: number) => {
      if (canSave) {
        const saved = await handleSave();
        if (!saved) return;
      }
      const sigsParam = signatureIds.map((id) => id || NO_SIGNATURE).join(",");
      goTo(
        selfHref,
        `/(pages)/(user)/signature?gameId=${gameId}&place=${seat}&sigs=${sigsParam}`,
      );
    },
    [canSave, handleSave, gameId, selfHref, signatureIds],
  );

  if (loading || !user) return null;

  return (
    <View style={styles.container}>
      <GameHeader
        title={game.title || t("title")}
        round={null}
        tableNumber={null}
        subtitle={[t("title"), tableLabel].filter(Boolean).join(" · ")}
        onMenuPress={openMenu}
      />

      <View style={styles.body}>
        <View style={styles.backButton}>
          <BackButton onPress={handleBack} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.card}>
          <PlayerResultColumnHeaders
            playerLabel={t("colPlayer")}
            scoreLabel={t("colScore")}
            placementLabel={t("colPlace")}
            signatureLabel={t("colSignature")}
            hidePlacementColumn
          />

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
                stackPlacement
                placementRowLabel={t("colPlace")}
                signatureSlot={
                  <TouchableOpacity
                    style={[
                      styles.sigBtn,
                      !!sigId && styles.sigBtnSigned,
                      !canSign && !sigId && styles.sigBtnDisabled,
                    ]}
                    onPress={() => handleOpenSignature(i)}
                    disabled={!canSign}
                    activeOpacity={0.7}
                    // @ts-expect-error — web-only: remove sig from tab order
                    tabIndex={Platform.OS === "web" ? -1 : undefined}
                  >
                    {sigId ? (
                      <Check size={20} color={colors.success} />
                    ) : (
                      <Signature
                        size={20}
                        color={canSign ? colors.primary : colors.textMuted}
                      />
                    )}
                  </TouchableOpacity>
                }
              />
            );
          })}

          {tiedPlaces.length > 0 && (
            <Text style={styles.tieHint}>
              {t("tieDetected").replace("{places}", tiedPlaces.join(", "))}
            </Text>
          )}

          {}
          {(scoreConflict || !placementComboValid || signaturesReset) && (
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
              {signaturesReset && (
                <View style={styles.cardErrorRow}>
                  <Ionicons name="pencil-outline" size={14} color={colors.error} />
                  <Text style={styles.cardErrorText}>{t("hintSignaturesReset")}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{t("note")}</Text>
          <TextInput
            ref={noteRef}
            style={[styles.input, styles.noteInput]}
            value={note}
            onChangeText={setNote}
            placeholder={t("notePlaceholder")}
            placeholderTextColor={colors.textPlaceholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!isSubmitted}
          />
        </View>
        </ScrollView>

        <View style={styles.footer}>
          <Text style={[styles.gateHint, gateReady && styles.gateHintReady]}>
            {gateMessage}
          </Text>
          <TouchableOpacity
            style={[
              styles.submitBtn,
              (!canSubmit || submitting || saving) && styles.btnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit || submitting || saving}
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
        </View>
      </View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    body: {
      flex: 1,
      paddingHorizontal: inset.card,
      paddingTop: inset.card,
    },
    backButton: {
      paddingBottom: inset.card,
    },
    scrollView: {
      flex: 1,
    },
    scroll: {
      paddingBottom: inset.card,
      gap: inset.group,
    },
    tieHint: {
      ...type.caption,
      color: colors.textSecondary,
      marginTop: space[2],
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
      width: SIGNATURE_COLUMN_WIDTH,
      height: SIGNATURE_COLUMN_WIDTH,
      borderRadius: ui.inputRadius,
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
    footer: {
      gap: space[2],
      paddingTop: space[3],
      paddingBottom: inset.screenBottom,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
    },
    gateHint: {
      ...type.caption,
      color: colors.textMuted,
    },
    gateHintReady: {
      color: colors.success,
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
