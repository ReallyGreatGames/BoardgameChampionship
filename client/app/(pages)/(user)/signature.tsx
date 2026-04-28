import { ID, SIGNATURES_BUCKET_ID, storage } from "@/lib/appwrite";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { BackButton } from "@/lib/components/BackButton";
import { useResultStore } from "@/lib/stores/appwrite/result-store";
import { inset } from "@/lib/theme/spacing";
import { ui } from "@/lib/theme/ui";
import { type } from "@/lib/theme/typography";
import { Ionicons } from "@expo/vector-icons";
import { File as FSFile, Paths } from "expo-file-system";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path, SvgXml } from "react-native-svg";

const TABLE = 1;

type Point = { x: number; y: number };
type Stroke = Point[];

function strokeToD(stroke: Stroke): string {
  if (stroke.length === 0) return "";
  const [first, ...rest] = stroke;
  return `M ${first.x},${first.y} ${rest.map((p) => `L ${p.x},${p.y}`).join(" ")}`;
}

function buildSvgContent(strokes: Stroke[], width: number, height: number): string {
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
  const { gameId, place } = useLocalSearchParams<{ gameId: string; place: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["signature"]);
  const resultStore = useResultStore();

  const placeIdx = parseInt(place ?? "0", 10);

  const existingResult = useMemo(
    () => resultStore.collection.find((r) => r.gameId === gameId && r.table === TABLE),
    [resultStore.collection, gameId],
  );
  const existingFileId = existingResult?.signatureIds?.[placeIdx] ?? "";

  const [existingSvg, setExistingSvg] = useState<string | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const currentStrokeRef = useRef<Point[]>([]);
  const [canvasDims, setCanvasDims] = useState({ width: 300, height: 200 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setExistingSvg(null);
    setStrokes([]);
    setCurrentStroke([]);
    currentStrokeRef.current = [];

    if (!existingFileId) {
      setLoadingExisting(false);
      return;
    }
    setLoadingExisting(true);
    storage
      .getFileView({ bucketId: SIGNATURES_BUCKET_ID, fileId: existingFileId })
      .then((buffer) => {
        const xml = new TextDecoder("utf-8").decode(buffer);
        setExistingSvg(xml);
      })
      .catch(() => setExistingSvg(null))
      .finally(() => setLoadingExisting(false));
  }, [existingFileId]);

  const hasExisting = loadingExisting || existingSvg !== null;
  const isEmpty = strokes.length === 0 && currentStroke.length === 0;

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

  const handleBack = useCallback(() => {
    if (gameId) router.replace(`/(pages)/(user)/results?gameId=${gameId}`);
    else router.back();
  }, [gameId]);

  const handleSave = useCallback(async () => {
    if (isEmpty || saving) return;
    setSaving(true);
    try {
      const { width, height } = canvasDims;
      const svgContent = buildSvgContent(strokes, width, height);

      let fileArg: any;
      if (Platform.OS === "web") {
        const blob = new Blob([svgContent], { type: "image/svg+xml" });
        fileArg = new globalThis.File([blob], `signature_${gameId}_${placeIdx}.svg`, {
          type: "image/svg+xml",
        });
      } else {
        const fsFile = new FSFile(Paths.cache, `sig_${gameId}_${placeIdx}_${Date.now()}.svg`);
        fsFile.write(svgContent);
        fileArg = {
          name: `signature_${gameId}_${placeIdx}.svg`,
          type: "image/svg+xml",
          size: fsFile.size,
          uri: fsFile.uri,
        };
      }

      const uploaded = await storage.createFile({
        bucketId: SIGNATURES_BUCKET_ID,
        fileId: ID.unique(),
        file: fileArg,
      });

      const existingResult = resultStore.collection.find(
        (r) => r.gameId === gameId && r.table === TABLE,
      );
      const sigIds = [...(existingResult?.signatureIds ?? [])];
      while (sigIds.length <= placeIdx) sigIds.push("");
      sigIds[placeIdx] = uploaded.$id;

      if (existingResult) {
        await resultStore.update({ $id: existingResult.$id, signatureIds: sigIds });
      } else {
        await resultStore.add({
          gameId: gameId ?? "",
          table: TABLE,
          signatureIds: sigIds,
          submitted: false,
        });
      }

      router.replace(`/(pages)/(user)/results?gameId=${gameId}`);
    } finally {
      setSaving(false);
    }
  }, [isEmpty, saving, strokes, canvasDims, placeIdx, gameId, resultStore]);

  const allStrokes = [...strokes, ...(currentStroke.length > 0 ? [currentStroke] : [])];

  return (
    <View style={styles.container}>
      <BackButton onPress={handleBack} />

      <Text style={styles.title}>{t("title")}</Text>
      <Text style={styles.subtitle}>
        {t("subtitle").replace("{n}", String(placeIdx + 1))}
      </Text>

      <View
        style={styles.canvasWrapper}
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
                  stroke={colors.text}
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

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.clearBtn, (isEmpty || hasExisting) && styles.btnDisabled]}
          onPress={handleClear}
          disabled={isEmpty || hasExisting}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={18} color={colors.error} />
          <Text style={[styles.clearBtnText, (isEmpty || hasExisting) && { color: colors.textMuted }]}>
            {t("clear")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, (isEmpty || saving || hasExisting) && styles.btnDisabled]}
          onPress={handleSave}
          disabled={isEmpty || saving || hasExisting}
          activeOpacity={0.7}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-outline" size={18} color="#fff" />
              <Text style={styles.saveBtnText}>{t("save")}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
      gap: inset.tight,
    },
    title: {
      ...type.h1,
      color: colors.text,
      marginTop: inset.tight,
    },
    subtitle: {
      ...type.body,
      color: colors.textMuted,
    },
    canvasWrapper: {
      flex: 1,
      marginTop: inset.card,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 12,
      overflow: "hidden",
      justifyContent: "center",
      alignItems: "center",
    },
    placeholder: {
      ...type.body,
      color: colors.textPlaceholder,
      position: "absolute",
    },
    actions: {
      flexDirection: "row",
      gap: inset.tight,
      paddingBottom: inset.screenBottom,
    },
    clearBtn: {
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
    clearBtnText: {
      ...type.button,
      color: colors.error,
    },
    saveBtn: {
      flex: 2,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: colors.accent,
      borderRadius: ui.buttonRadius,
      paddingVertical: 14,
    },
    saveBtnText: {
      ...type.button,
      color: colors.onAccent,
    },
    btnDisabled: {
      opacity: 0.4,
    },
  });
}
