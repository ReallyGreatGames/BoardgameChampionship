import { forwardRef, ReactNode, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { space } from "@/lib/theme/spacing";
import { fonts, type } from "@/lib/theme/typography";
import { ui } from "@/lib/theme/ui";

const PLACEMENTS = ["1", "2", "3", "4"] as const;

const SCORE_WIDTH = 64;
const CHIP_SIZE = 40;
const CHIP_GAP = 4;
const PLACEMENT_WIDTH = PLACEMENTS.length * CHIP_SIZE + (PLACEMENTS.length - 1) * CHIP_GAP;

export const SIGNATURE_COLUMN_WIDTH = 44;

type ColumnHeaderProps = {
  playerLabel?: string;
  scoreLabel: string;
  placementLabel: string;
  signatureLabel: string;
  hidePlacementColumn?: boolean;
};

export function PlayerResultColumnHeaders({
  playerLabel,
  scoreLabel,
  placementLabel,
  signatureLabel,
  hidePlacementColumn = false,
}: ColumnHeaderProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { width: screenWidth } = useWindowDimensions();
  const isCompact = screenWidth < ui.breakpointTablet;

  return (
    <View style={styles.headerRow}>
      {playerLabel ? (
        <Text style={[styles.columnHeader, styles.playerColumn]} numberOfLines={1}>
          {playerLabel}
        </Text>
      ) : (
        !isCompact && <View style={styles.playerInfo} />
      )}
      <Text style={[styles.columnHeader, styles.scoreColumn]} numberOfLines={1}>
        {scoreLabel}
      </Text>
      {!hidePlacementColumn && (
        <Text style={[styles.columnHeader, styles.placementColumn]} numberOfLines={1}>
          {placementLabel}
        </Text>
      )}
      <Text style={[styles.columnHeader, styles.signatureColumn]} numberOfLines={1}>
        {signatureLabel}
      </Text>
    </View>
  );
}

export type PlayerResultRowHandle = {
  focusScore: () => void;
  focusChips: () => void;
};

type Props = {
  playerName: string;
  playerTeam?: string;
  placement: string;
  score: string;
  onSetPlacement: (value: string) => void;
  onSetScore: (value: string) => void;
  onScoreSubmitEditing?: () => void;
  onScoreTabForward?: () => void;
  onScoreTabBackward?: () => void;
  onChipTabForward?: () => void;
  onChipTabBackward?: () => void;
  signatureSlot: ReactNode;
  disabled?: boolean;
  placementError?: boolean;
  stackPlacement?: boolean;
  placementRowLabel?: string;
};

export const PlayerResultRow = forwardRef<PlayerResultRowHandle, Props>(
  function PlayerResultRow(
    {
      playerName,
      playerTeam,
      placement,
      score,
      onSetPlacement,
      onSetScore,
      onScoreSubmitEditing,
      onScoreTabForward,
      onScoreTabBackward,
      onChipTabForward,
      onChipTabBackward,
      signatureSlot,
      disabled = false,
      placementError = false,
      stackPlacement = false,
      placementRowLabel,
    },
    ref,
  ) {
    const { colors } = useTheme();
    const styles = useMemo(() => makeStyles(colors), [colors]);
    const { width: screenWidth } = useWindowDimensions();
    const isCompact = screenWidth < ui.breakpointTablet;

    const scoreInputRef = useRef<TextInput>(null);
    const chipRowRef = useRef<View>(null);

    useImperativeHandle(ref, () => ({
      focusScore: () => scoreInputRef.current?.focus(),
      focusChips: () => {
        if (Platform.OS !== "web") return;
        const node = chipRowRef.current as any;
        if (typeof node?.focus === "function") node.focus();
        else node?._nativeTag?.focus?.();
      },
    }));

    const scoreTabForwardRef = useRef(onScoreTabForward);
    const scoreTabBackwardRef = useRef(onScoreTabBackward);
    scoreTabForwardRef.current = onScoreTabForward;
    scoreTabBackwardRef.current = onScoreTabBackward;

    useEffect(() => {
      if (Platform.OS !== "web") return;
      const el = scoreInputRef.current as any;
      if (!el?.addEventListener) return;
      const handler = (e: KeyboardEvent) => {
        if (e.key !== "Tab") return;
        if (!e.shiftKey && scoreTabForwardRef.current) {
          e.preventDefault();
          scoreTabForwardRef.current();
        } else if (e.shiftKey && scoreTabBackwardRef.current) {
          e.preventDefault();
          scoreTabBackwardRef.current();
        }
      };
      el.addEventListener("keydown", handler);
      return () => el.removeEventListener("keydown", handler);
    }, []);

    const handleChipKeyDown = useCallback(
      (e: any) => {
        if (["1", "2", "3", "4"].includes(e.key)) {
          e.preventDefault();
          onSetPlacement(placement === e.key ? "" : e.key);
          onChipTabForward?.();
        } else if (e.key === "Tab") {
          e.preventDefault();
          if (e.shiftKey) {
            onChipTabBackward?.();
          } else {
            onChipTabForward?.();
          }
        }
      },
      [placement, onSetPlacement, onChipTabForward, onChipTabBackward],
    );

    const chipRowIsInteractive = Platform.OS === "web" && (onChipTabForward != null || onChipTabBackward != null);
    const chipRowWebProps = chipRowIsInteractive
      ? ({
          focusable: true,
          onKeyDown: handleChipKeyDown,
        } as any)
      : {};

    const renderChips = (chipStyle: any, chipLabelStyle: any) =>
      PLACEMENTS.map((p) => {
        const active = placement === p;
        return (
          <TouchableOpacity
            key={p}
            style={[
              chipStyle,
              active && styles.chipActive,
              placementError && active && styles.chipError,
              disabled && styles.chipDisabled,
            ]}
            onPress={() => !disabled && onSetPlacement(active ? "" : p)}
            activeOpacity={disabled ? 1 : 0.7}
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            // @ts-expect-error — tabIndex is web-only; -1 removes chips from natural tab order
            tabIndex={Platform.OS === "web" ? -1 : undefined}
          >
            <Text
              style={[
                chipLabelStyle,
                active && styles.chipLabelActive,
                placementError && active && styles.chipLabelError,
              ]}
            >
              {p}
            </Text>
          </TouchableOpacity>
        );
      });

    const showInlineName = stackPlacement || !isCompact;
    const showSeparateNameRow = !stackPlacement && isCompact;

    return (
      <View style={[styles.container, disabled && styles.rowDisabled]}>
        {}
        {showSeparateNameRow && (
          <View style={styles.nameRow}>
            <Text style={styles.playerName} numberOfLines={1}>
              {playerName}
            </Text>
            {playerTeam ? (
              <Text style={styles.playerTeam} numberOfLines={1}>
                {playerTeam}
              </Text>
            ) : null}
          </View>
        )}

        <View style={styles.row}>
          {}
          {showInlineName && (
            <View style={styles.playerInfo}>
              <Text style={styles.playerName} numberOfLines={1}>
                {playerName}
              </Text>
              {playerTeam ? (
                <Text style={styles.playerTeam} numberOfLines={1}>
                  {playerTeam}
                </Text>
              ) : null}
            </View>
          )}

          {}
          <TextInput
            ref={scoreInputRef}
            style={[styles.scoreInput, disabled && styles.inputDisabled]}
            value={score}
            onChangeText={(v) => {
              const filtered = v.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
              onSetScore(filtered);
            }}
            placeholder="–"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={onScoreSubmitEditing}
            editable={!disabled}
            selectTextOnFocus
          />

          {}
          {!stackPlacement && (
            <View ref={chipRowRef} style={styles.chipsRow} {...chipRowWebProps}>
              {renderChips(styles.chip, styles.chipLabel)}
            </View>
          )}

          {}
          {signatureSlot}
        </View>

        {stackPlacement && (
          <View style={styles.placementRow}>
            {placementRowLabel ? (
              <Text style={styles.placementRowLabel} numberOfLines={1}>
                {placementRowLabel}
              </Text>
            ) : null}
            <View
              ref={chipRowRef}
              style={styles.placementRowChips}
              {...chipRowWebProps}
            >
              {renderChips(styles.wideChip, styles.wideChipLabel)}
            </View>
          </View>
        )}
      </View>
    );
  },
);

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      paddingVertical: space[2],
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
      gap: 4,
    },
    rowDisabled: {
      opacity: 0.55,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: space[2],
      paddingTop: space[2],
      paddingBottom: space[1],
    },
    columnHeader: {
      ...type.caption,
      color: colors.textMuted,
      fontWeight: "600",
      textAlign: "center",
    },
    playerColumn: {
      flex: 1,
      minWidth: 0,
      textAlign: "left",
    },
    scoreColumn: {
      width: SCORE_WIDTH,
    },
    placementColumn: {
      width: PLACEMENT_WIDTH,
    },
    signatureColumn: {
      width: SIGNATURE_COLUMN_WIDTH,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[2],
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: space[2],
    },
    playerInfo: {
      flex: 1,
      minWidth: 0,
    },
    playerName: {
      ...type.bodySmall,
      color: colors.text,
      fontWeight: "600",
      flexShrink: 1,
    },
    playerTeam: {
      ...type.caption,
      color: colors.textMuted,
    },
    scoreInput: {
      width: SCORE_WIDTH,
      height: 44,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: ui.inputRadius,
      paddingHorizontal: space[2],
      fontFamily: fonts.displayExtraBold,
      fontSize: 20,
      color: colors.text,
      backgroundColor: colors.surface,
      textAlign: "center",
    },
    inputDisabled: {
      opacity: 0.6,
    },
    chipsRow: {
      flexDirection: "row",
      gap: CHIP_GAP,
    },
    chip: {
      width: CHIP_SIZE,
      height: CHIP_SIZE,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipError: {
      backgroundColor: colors.error,
      borderColor: colors.error,
    },
    chipDisabled: {
      opacity: 0.5,
    },
    chipLabel: {
      ...type.body,
      fontWeight: "700",
      color: colors.textSecondary,
    },
    chipLabelActive: {
      color: colors.onAccent,
    },
    chipLabelError: {
      color: colors.onAccent,
    },
    placementRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[2],
      marginTop: 2,
    },
    placementRowLabel: {
      ...type.caption,
      width: 34,
      flexShrink: 0,
      color: colors.textMuted,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    placementRowChips: {
      flex: 1,
      flexDirection: "row",
      gap: CHIP_GAP,
    },
    wideChip: {
      flex: 1,
      minWidth: 0,
      height: 38,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    wideChipLabel: {
      fontFamily: fonts.displayBold,
      fontSize: 20,
      lineHeight: 20,
      color: colors.textSecondary,
    },
  });
}
