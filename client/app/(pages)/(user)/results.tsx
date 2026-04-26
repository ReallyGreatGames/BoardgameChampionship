import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { BackButton } from "@/lib/components/BackButton";
import { useDialog } from "@/lib/components/Dialog";
import { useResultStore } from "@/lib/stores/appwrite/result-store";
import { inset } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const TABLE = 1; // TODO: pass via route params when table selection is implemented
const PLAYER_COUNT = 4;
const PLAYER_OPTIONS = ["1", "2", "3", "4"] as const;

function padArray<T>(arr: T[], length: number, fill: T): T[] {
  const copy = [...arr];
  while (copy.length < length) copy.push(fill);
  return copy.slice(0, length);
}

type PlayerPickerProps = {
  value: string;
  onChange: (v: string) => void;
  takenValues: string[];
  disabled?: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
  t: (key: string) => string;
};

function PlayerPicker({ value, onChange, takenValues, disabled, colors, t }: PlayerPickerProps) {
  const [open, setOpen] = useState(false);
  const styles = useMemo(() => makePickerStyles(colors), [colors]);

  const handleSelect = (opt: string) => {
    onChange(opt);
    setOpen(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.btn, disabled && styles.btnDisabled]}
        onPress={() => !disabled && setOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={value ? styles.btnValue : styles.btnPlaceholder}>
          {value ? t("playerValue").replace("{n}", value) : t("playerPlaceholder")}
        </Text>
        {!disabled && (
          <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
        )}
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            {PLAYER_OPTIONS.map((opt) => {
              const taken = takenValues.includes(opt);
              const selected = value === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.option,
                    selected && styles.optionSelected,
                    taken && !selected && styles.optionTaken,
                  ]}
                  onPress={() => handleSelect(opt)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selected && styles.optionTextSelected,
                      taken && !selected && styles.optionTextTaken,
                    ]}
                  >
                    {t("playerValue").replace("{n}", opt)}
                  </Text>
                  {selected && (
                    <Ionicons name="checkmark" size={16} color={colors.accent} />
                  )}
                  {taken && !selected && (
                    <Ionicons name="swap-horizontal-outline" size={14} color={colors.textMuted} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function makePickerStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    btn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.surfaceHigh,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingVertical: 9,
      paddingHorizontal: 10,
      gap: 4,
    },
    btnDisabled: {
      opacity: 0.5,
    },
    btnValue: {
      ...type.body,
      color: colors.text,
      flex: 1,
    },
    btnPlaceholder: {
      ...type.body,
      color: colors.textPlaceholder,
      flex: 1,
    },
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "center",
      alignItems: "center",
      padding: inset.screen,
    },
    sheet: {
      width: "100%",
      maxWidth: 320,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      overflow: "hidden",
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 16,
      paddingHorizontal: inset.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    optionSelected: {
      backgroundColor: colors.accent + "18",
    },
    optionTaken: {
      backgroundColor: colors.surfaceHigh,
    },
    optionText: {
      ...type.body,
      color: colors.text,
    },
    optionTextSelected: {
      color: colors.accent,
      fontWeight: "600",
    },
    optionTextTaken: {
      color: colors.textMuted,
    },
  });
}

export default function ResultsPage() {
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const { user, loading } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["results"]);
  const { confirm } = useDialog();
  const resultStore = useResultStore();

  const existingResult = useMemo(
    () => resultStore.collection.find((r) => r.gameId === gameId && r.table === TABLE),
    [resultStore.collection, gameId],
  );

  const [players, setPlayers] = useState<string[]>(() => Array(PLAYER_COUNT).fill(""));
  const [scores, setScores] = useState<string[]>(() => Array(PLAYER_COUNT).fill(""));
  const [note, setNote] = useState("");
  const [signatureIds, setSignatureIds] = useState<string[]>(() => Array(PLAYER_COUNT).fill(""));
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // $updatedAt of the last DB state we acknowledged (null = form not yet populated).
  const acknowledgedAtRef = useRef<string | null>(null);
  // True after our own save, until the real-time echo arrives and advances the ref.
  const ownSaveRef = useRef(false);

  useEffect(() => {
    if (!existingResult) return;
    if (acknowledgedAtRef.current === null) {
      acknowledgedAtRef.current = existingResult.$updatedAt;
      setPlayers(padArray(existingResult.placements ?? [], PLAYER_COUNT, ""));
      setScores(padArray((existingResult.scores ?? []).map(String), PLAYER_COUNT, ""));
      setNote(existingResult.note ?? "");
      setSignatureIds(padArray(existingResult.signatureIds ?? [], PLAYER_COUNT, ""));
    } else if (ownSaveRef.current) {
      ownSaveRef.current = false;
      acknowledgedAtRef.current = existingResult.$updatedAt;
    }
  }, [existingResult]);

  // Refresh signature IDs each time we return from the signature page.
  useFocusEffect(useCallback(() => {
    if (existingResult && acknowledgedAtRef.current !== null) {
      setSignatureIds(padArray(existingResult.signatureIds ?? [], PLAYER_COUNT, ""));
    }
  }, [existingResult]));

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/(pages)/login");
  }, [user, loading]);

  const handleBack = useCallback(() => {
    if (gameId) router.replace(`/game?gameId=${gameId}`);
    else router.replace("/");
  }, [gameId]);

  const isSubmitted = existingResult?.submitted ?? false;
  const anySigned = signatureIds.some(Boolean);
  const signatureCount = signatureIds.filter(Boolean).length;
  const hasNote = note.trim().length > 0;

  const allPlayersSet = players.every((p) => p !== "");
  const allScoresValid = scores.every((s) => {
    const n = parseFloat(s);
    return s.trim() !== "" && !isNaN(n) && n >= 0;
  });
  const canSave = allPlayersSet && allScoresValid && !isSubmitted;

  const canSubmit = !isSubmitted && (signatureCount === PLAYER_COUNT || (signatureCount === 3 && hasNote));
  const showNoteHint = !isSubmitted && signatureCount === 3 && !hasNote;

  const buildPayload = useCallback(
    (submitted: boolean) => ({
      gameId: gameId ?? "",
      table: TABLE,
      placements: players,
      scores: scores.map((s) => parseFloat(s) || 0),
      note: note.trim(),
      signatureIds,
      submitted,
    }),
    [gameId, players, scores, note, signatureIds],
  );

  const handleSave = useCallback(async (): Promise<boolean> => {
    if (!canSave || saving) return false;

    if (existingResult) {
      const timestampDrifted = existingResult.$updatedAt !== acknowledgedAtRef.current;
      const dbPlayers = padArray(existingResult.placements ?? [], PLAYER_COUNT, "");
      const dbScores = padArray((existingResult.scores ?? []).map(String), PLAYER_COUNT, "");
      const dbNote = existingResult.note ?? "";
      const valuesDiffer =
        players.some((p, i) => p !== dbPlayers[i]) ||
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
          setPlayers(dbPlayers);
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
  }, [canSave, saving, existingResult, players, scores, note, confirm, t, buildPayload, resultStore]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || submitting) return;
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
  }, [canSubmit, submitting, confirm, t, buildPayload, existingResult, resultStore]);

  const setPlayer = useCallback((i: number, v: string) => {
    const conflictIdx = players.findIndex((p, j) => j !== i && p === v);
    setPlayers((prev) => {
      const next = [...prev];
      if (conflictIdx !== -1) next[conflictIdx] = prev[i];
      next[i] = v;
      return next;
    });
    if (conflictIdx !== -1) {
      setSignatureIds((prev) => {
        const next = [...prev];
        [next[i], next[conflictIdx]] = [next[conflictIdx], next[i]];
        return next;
      });
    }
  }, [players]);

  const setScore = useCallback((i: number, v: string) => {
    setScores((prev) => { const next = [...prev]; next[i] = v; return next; });
  }, []);

  const handleOpenSignature = useCallback(async (place: number) => {
    if (canSave) {
      const saved = await handleSave();
      if (!saved) return;
    }
    router.push(`/(pages)/(user)/signature?gameId=${gameId}&place=${place}`);
  }, [canSave, handleSave, gameId]);

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
          {isSubmitted && (
            <View style={styles.submittedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={styles.submittedBadgeText}>{t("submitted")}</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          {Array.from({ length: PLAYER_COUNT }, (_, i) => {
            const takenByOthers = players.filter((p, j) => j !== i && p !== "");
            return (
              <View
                key={i}
                style={[styles.row, i < PLAYER_COUNT - 1 && styles.rowBorder]}
              >
                <View style={styles.placeCircle}>
                  <Text style={styles.placeNumber}>{i + 1}</Text>
                </View>

                <PlayerPicker
                  value={players[i]}
                  onChange={(v) => setPlayer(i, v)}
                  takenValues={takenByOthers}
                  disabled={isSubmitted || anySigned}
                  colors={colors}
                  t={t}
                />

                <View
                  style={[styles.scoreInputWrapper, (isSubmitted || anySigned) && styles.inputDisabled]}
                  pointerEvents={isSubmitted || anySigned ? "none" : "auto"}
                >
                  <TextInput
                    style={[styles.input, styles.scoreInput]}
                    value={scores[i]}
                    onChangeText={(v) => setScore(i, v)}
                    placeholder={t("scorePlaceholder")}
                    placeholderTextColor={colors.textPlaceholder}
                    keyboardType="decimal-pad"
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.sigBtn,
                    !!signatureIds[i] && styles.sigBtnSigned,
                    !signatureIds[i] && !anySigned && (!allPlayersSet || !allScoresValid || isSubmitted) && styles.sigBtnDisabled,
                  ]}
                  onPress={() => handleOpenSignature(i)}
                  disabled={!signatureIds[i] && !anySigned && (!allPlayersSet || !allScoresValid || isSubmitted)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={signatureIds[i] ? "checkmark-circle" : "pencil-outline"}
                    size={18}
                    color={
                      signatureIds[i]
                        ? colors.success
                        : !allPlayersSet || !allScoresValid
                          ? colors.textMuted
                          : colors.primary
                    }
                  />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{t("note")}</Text>
          <TextInput
            style={[styles.input, styles.noteInput, showNoteHint && styles.inputError]}
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
          {signatureCount < 3 && !isSubmitted && (
            <View style={styles.hint}>
              <Ionicons name="create-outline" size={13} color={colors.textMuted} />
              <Text style={styles.hintMuted}>{t("hintSignatures")}</Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.saveBtn, (!canSave || saving) && styles.btnDisabled]}
            onPress={handleSave}
            disabled={!canSave || saving}
            activeOpacity={0.7}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color={colors.text} />
                <Text style={styles.saveBtnText}>{t("save")}</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitBtn, !canSubmit && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || submitting}
            activeOpacity={0.7}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons
                  name="checkmark-done-outline"
                  size={18}
                  color={canSubmit ? "#fff" : colors.textMuted}
                />
                <Text style={[styles.submitBtnText, !canSubmit && styles.submitBtnTextMuted]}>
                  {t("submit")}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
    title: {
      ...type.h1,
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
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: inset.card,
      paddingVertical: 10,
      gap: inset.tight,
    },
    rowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    placeCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary + "20",
      justifyContent: "center",
      alignItems: "center",
    },
    placeNumber: {
      ...type.caption,
      color: colors.primary,
      fontWeight: "700",
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
    scoreInput: {
      width: 68,
    },
    scoreInputWrapper: {
      width: 68,
    },
    inputDisabled: {
      opacity: 0.5,
    },
    sigBtn: {
      width: 36,
      height: 36,
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
    actions: {
      flexDirection: "row",
      gap: inset.tight,
    },
    saveBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingVertical: 14,
    },
    saveBtnText: {
      ...type.button,
      color: colors.text,
    },
    submitBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 14,
    },
    submitBtnText: {
      ...type.button,
      color: "#fff",
    },
    submitBtnTextMuted: {
      color: colors.textMuted,
    },
    btnDisabled: {
      opacity: 0.4,
    },
  });
}
