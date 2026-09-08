import { ID, SIGNATURES_BUCKET_ID, storage } from "@/lib/appwrite";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { GameHeader } from "@/lib/components/game/GameHeader";
import { BackButton } from "@/lib/components/ui/BackButton";
import { Button } from "@/lib/components/ui/Button";
import { usePlayerTable } from "@/lib/hooks/usePlayerTable";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { NO_SIGNATURE } from "@/lib/models/result";
import { useResultStore } from "@/lib/stores/appwrite/result-store";
import { useTableStore } from "@/lib/stores/appwrite/table-store";
import { inset } from "@/lib/theme/spacing";
import { fonts, type } from "@/lib/theme/typography";
import { goBackTo } from "@/lib/utils/navigation";
import { createSignatureFile } from "@/lib/utils/signature-file";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useNavigation } from "expo-router";
import { DrawerActions } from "expo-router/react-navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path, SvgXml } from "react-native-svg";

const PLAYER_COUNT = 4;

type Point = { x: number; y: number };
type Stroke = Point[];

function padArray<T>(arr: T[], length: number, fill: T): T[] {
  const copy = [...arr];
  while (copy.length < length) {
    copy.push(fill);
  }
  return copy.slice(0, length);
}

function strokeToD(stroke: Stroke): string {
  if (stroke.length === 0) {
    return "";
  }
  const [first, ...rest] = stroke;
  return `M ${first.x},${first.y} ${rest.map((p) => `L ${p.x},${p.y}`).join(" ")}`;
}

function buildSvgContent(
  strokes: Stroke[],
  width: number,
  height: number,
): string {
  const paths = strokes
    .filter((s) => s.length > 0)
    .map(
      (s) =>
        `<path d="${strokeToD(s)}" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    )
    .join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">\n${paths}\n</svg>`;
}

export default function SignaturePage() {
  useRequireAuth();
  const { gameId, place, from, sigs } = useLocalSearchParams<{
    gameId: string;
    from?: string;
    place: string;
    sigs?: string;
  }>();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const { t } = useTranslation(["signature"]);
  const resultStore = useResultStore();
  const tableNumber = usePlayerTable(gameId);
  const tables = useTableStore((s) => s.collection);

  const playerData = useMemo(() => {
    if (!gameId || tableNumber === null) {
      return [];
    }
    const entry = tables.find((tbl) => {
      const tGameId = typeof tbl.game === "string" ? tbl.game : tbl.game.$id;
      return tGameId === gameId && tbl.tableNumber === tableNumber;
    });
    return entry?.players ?? [];
  }, [tables, gameId, tableNumber]);

  const existingResult = useMemo(
    () =>
      tableNumber === null
        ? undefined
        : resultStore.collection.find(
            (r) => r.gameId === gameId && r.table === tableNumber,
          ),
    [resultStore.collection, gameId, tableNumber],
  );

  const [active, setActive] = useState(() => parseInt(place ?? "0", 10));

  const [sigIds, setSigIds] = useState<string[]>(() =>
    sigs
      ? padArray(
          sigs.split(",").map((s) => (s === NO_SIGNATURE ? "" : s)),
          PLAYER_COUNT,
          "",
        )
      : padArray(existingResult?.signatureIds ?? [], PLAYER_COUNT, ""),
  );

  const [existingSvg, setExistingSvg] = useState<string | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const currentStrokeRef = useRef<Point[]>([]);
  const [canvasDims, setCanvasDims] = useState({ width: 300, height: 200 });
  const [saving, setSaving] = useState(false);

  const clearDrawing = useCallback(() => {
    setStrokes([]);
    setCurrentStroke([]);
    currentStrokeRef.current = [];
  }, []);

  useFocusEffect(clearDrawing);

  const activeFileId = sigIds[active];

  useEffect(() => {
    setExistingSvg(null);
    clearDrawing();

    if (!activeFileId) {
      setLoadingExisting(false);
      return;
    }
    setLoadingExisting(true);
    storage
      .getFileView({ bucketId: SIGNATURES_BUCKET_ID, fileId: activeFileId })
      .then((buffer) => {
        const xml = new TextDecoder("utf-8").decode(buffer);
        setExistingSvg(xml);
      })
      .catch(() => setExistingSvg(null))
      .finally(() => setLoadingExisting(false));
  }, [active, activeFileId, clearDrawing]);

  const hasExisting = loadingExisting || existingSvg !== null;
  const isEmpty = strokes.length === 0 && currentStroke.length === 0;
  const signedCount = sigIds.filter(Boolean).length;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentStrokeRef.current = [{ x: locationX, y: locationY }];
        setCurrentStroke([{ x: locationX, y: locationY }]);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentStrokeRef.current = [
          ...currentStrokeRef.current,
          { x: locationX, y: locationY },
        ];
        setCurrentStroke([...currentStrokeRef.current]);
      },
      onPanResponderRelease: () => {
        const completed = currentStrokeRef.current;
        currentStrokeRef.current = [];
        setCurrentStroke([]);
        if (completed.length > 0) {
          setStrokes((prev) => [...prev, completed]);
        }
      },
    }),
  ).current;

  const handleClear = useCallback(() => {
    setStrokes([]);
    setCurrentStroke([]);
    currentStrokeRef.current = [];
  }, []);

  const openMenu = useCallback(
    () => navigation.dispatch(DrawerActions.openDrawer()),
    [navigation],
  );

  const handleBack = useCallback(() => {
    goBackTo(from ?? (gameId ? `/(pages)/(user)/results?gameId=${gameId}` : "/"));
  }, [from, gameId]);

  const handleSelectSeat = useCallback(
    (i: number) => {
      if (i === active) {
        return;
      }
      setActive(i);
    },
    [active],
  );

  const handleConfirm = useCallback(async () => {
    if (isEmpty || saving || tableNumber === null) {
      return;
    }
    setSaving(true);
    try {
      const { width, height } = canvasDims;
      const svgContent = buildSvgContent(strokes, width, height);

      const fileArg = createSignatureFile(svgContent, gameId, active);

      const uploaded = await storage.createFile({
        bucketId: SIGNATURES_BUCKET_ID,
        fileId: ID.unique(),
        // The native SDK types require a URI, while web uploads accept a browser File.
        file: fileArg as Parameters<typeof storage.createFile>[2],
      });

      const freshResult = resultStore.collection.find(
        (r) => r.gameId === gameId && r.table === tableNumber,
      );
      const nextSigIds = padArray(freshResult?.signatureIds ?? [], PLAYER_COUNT, "");
      nextSigIds[active] = uploaded.$id;

      if (freshResult) {
        await resultStore.update({
          $id: freshResult.$id,
          signatureIds: nextSigIds,
        });
      } else {
        await resultStore.add({
          gameId: gameId ?? "",
          table: tableNumber,
          signatureIds: nextSigIds,
          submitted: false,
        });
      }

      setSigIds(nextSigIds);
      const nextUnsigned = nextSigIds.findIndex((id) => !id);
      setActive(nextUnsigned === -1 ? active : nextUnsigned);
    } finally {
      setSaving(false);
    }
  }, [isEmpty, saving, tableNumber, strokes, canvasDims, active, gameId, resultStore]);

  const allStrokes = [
    ...strokes,
    ...(currentStroke.length > 0 ? [currentStroke] : []),
  ];

  const activePlayer = playerData[active];
  const activeName = activePlayer?.name ?? `P${active + 1}`;
  const activeScore = existingResult?.scores?.[active];
  const activePlacement = existingResult?.placements?.[active];
  const activeTied =
    activePlacement != null &&
    (existingResult?.placements ?? []).filter((p) => p === activePlacement).length > 1;

  const activeSummary =
    activeScore != null && activePlacement != null
      ? t(activeTied ? "summaryTie" : "summary")
          .replace("{score}", String(activeScore))
          .replace("{place}", String(activePlacement))
      : t("summaryEmpty");

  const foreground = isDark ? colors.text : colors.onAccent;

  return (
    <View style={styles.container}>
      <GameHeader
        title={t("title")}
        round={null}
        tableNumber={tableNumber}
        subtitle={t("progress")
          .replace("{current}", String(active + 1))
          .replace("{total}", String(PLAYER_COUNT))
          .replace("{signed}", String(signedCount))}
        onMenuPress={openMenu}
      />

      <View style={styles.body}>
        <BackButton onPress={handleBack} />
        <View style={styles.tabsRow}>
          {Array.from({ length: PLAYER_COUNT }, (_, i) => {
            const isActive = i === active;
            const signed = !!sigIds[i];
            const label = (playerData[i]?.name ?? `P${i + 1}`).split(" ")[0];
            return (
              <TouchableOpacity
                key={i}
                onPress={() => handleSelectSeat(i)}
                style={[styles.tab, isActive && styles.tabActive]}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.tabLabel, isActive && styles.tabLabelActive]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
                <Ionicons
                  name={signed ? "checkmark-circle" : "pencil-outline"}
                  size={14}
                  color={signed ? colors.success : isActive ? foreground : colors.textMuted}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.activeInfo}>
          <Text style={styles.activeName} numberOfLines={1}>
            {activeName}
          </Text>
          <Text style={styles.activeSummary} numberOfLines={1}>
            {activeSummary}
          </Text>
        </View>

        <View
          style={[styles.canvasWrapper, !isEmpty && styles.canvasWrapperActive]}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setCanvasDims({ width, height });
          }}
          {...(!hasExisting ? panResponder.panHandlers : {})}
        >
          {hasExisting ? (
            loadingExisting ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <SvgXml
                xml={existingSvg}
                width={canvasDims.width}
                height={canvasDims.height}
                style={StyleSheet.absoluteFill}
              />
            )
          ) : (
            <>
              <Svg
                width={canvasDims.width}
                height={canvasDims.height}
                style={StyleSheet.absoluteFill}
              >
                {allStrokes.map((stroke, idx) => (
                  <Path
                    key={idx}
                    d={strokeToD(stroke)}
                    stroke="#000000"
                    strokeWidth={2.5}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </Svg>

              {isEmpty && (
                <Text style={styles.placeholder} pointerEvents="none">
                  {t("placeholder")}
                </Text>
              )}
            </>
          )}
        </View>

        {!hasExisting && (
          <Text style={styles.confirmHint}>
            {t("confirmHint").replace("{name}", activeName)}
          </Text>
        )}

        <View style={styles.actions}>
          <Button
            label={t("clear")}
            variant="secondary"
            icon="trash-outline"
            onPress={handleClear}
            disabled={isEmpty || hasExisting}
            style={styles.clearBtn}
          />
          <Button
            label={t("confirm")}
            icon="checkmark-outline"
            onPress={handleConfirm}
            disabled={isEmpty || saving || hasExisting}
            loading={saving}
            style={styles.saveBtn}
          />
        </View>

        {hasExisting && !loadingExisting && (
          <Text style={styles.footerHint}>{t("alreadySigned")}</Text>
        )}
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
      padding: inset.card,
      gap: inset.tight,
    },
    tabsRow: {
      flexDirection: "row",
      gap: 6,
    },
    tab: {
      flex: 1,
      minWidth: 0,
      paddingVertical: 8,
      paddingHorizontal: 4,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: "center",
      gap: 3,
    },
    tabActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    tabLabel: {
      ...type.caption,
      fontWeight: "700",
      color: colors.textSecondary,
    },
    tabLabelActive: {
      color: colors.onAccent,
    },
    activeInfo: {
      gap: 2,
      marginTop: inset.tight,
    },
    activeName: {
      fontFamily: fonts.displayBold,
      fontSize: 24,
      lineHeight: 26,
      color: colors.text,
    },
    activeSummary: {
      ...type.body,
      color: colors.textSecondary,
    },
    canvasWrapper: {
      flex: 1,
      marginTop: inset.tight,
      backgroundColor: "#ffffff",
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: "dashed",
      borderRadius: 14,
      overflow: "hidden",
      justifyContent: "center",
      alignItems: "center",
    },
    canvasWrapperActive: {
      borderColor: colors.primary,
      borderStyle: "solid",
    },
    placeholder: {
      ...type.body,
      color: colors.textPlaceholder,
      position: "absolute",
    },
    confirmHint: {
      ...type.caption,
      color: colors.textMuted,
    },
    actions: {
      flexDirection: "row",
      gap: inset.tight,
      paddingBottom: inset.screenBottom,
    },
    clearBtn: {
      flex: 1,
    },
    saveBtn: {
      flex: 2,
    },
    footerHint: {
      ...type.caption,
      color: colors.textMuted,
      textAlign: "center",
      paddingBottom: inset.tight,
    },
  });
}
