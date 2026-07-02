import { forwardRef, ReactNode, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../bootstrap/ThemeProvider";
import { space } from "../theme/spacing";
import { type } from "../theme/typography";

const PLACEMENTS = ["1", "2", "3", "4"] as const;

export type PlayerResultRowHandle = {
  focusScore: () => void;
  /** Web-only: focuses the chip row so keyboard input activates chips. */
  focusChips: () => void;
};

type Props = {
  playerName: string;
  playerTeam?: string;
  placement: string;
  score: string;
  onSetPlacement: (value: string) => void;
  onSetScore: (value: string) => void;
  /** Called when the mobile Return key is pressed on the score input. */
  onScoreSubmitEditing?: () => void;
  /**
   * Web-only: called when Tab is pressed in the score input.
   * Use to advance focus to the next score input or first chip row.
   */
  onScoreTabForward?: () => void;
  /**
   * Web-only: called when Shift+Tab is pressed in the score input.
   * When undefined, the browser handles it naturally (exits the form).
   */
  onScoreTabBackward?: () => void;
  /**
   * Web-only: called when Tab is pressed in the chip row, or when a
   * placement key (1-4) is pressed. Use to advance focus to the next chip
   * row or the note field.
   */
  onChipTabForward?: () => void;
  /**
   * Web-only: called when Shift+Tab is pressed in the chip row.
   * Use to go back to the previous chip row or last score input.
   */
  onChipTabBackward?: () => void;
  /** Rendered to the right of the placement chips. Caller owns signature UI. */
  signatureSlot: ReactNode;
  disabled?: boolean;
  /** Highlight the row's placement chips in error colour (score/placement conflict). */
  placementError?: boolean;
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
    },
    ref,
  ) {
    const { colors } = useTheme();
    const styles = useMemo(() => makeStyles(colors), [colors]);

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

    // Keep latest callbacks in refs so the native listener (empty-dep useEffect) always
    // calls the current version without needing to re-attach the listener.
    const scoreTabForwardRef = useRef(onScoreTabForward);
    const scoreTabBackwardRef = useRef(onScoreTabBackward);
    scoreTabForwardRef.current = onScoreTabForward;
    scoreTabBackwardRef.current = onScoreTabBackward;

    // Native DOM addEventListener — the only approach that reliably prevents default
    // Tab movement in RN Web. React's event delegation fires after the browser has
    // already committed to moving focus, so synthetic onKeyDown + preventDefault fails.
    // In RN Web, scoreInputRef.current IS the underlying HTMLInputElement.
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
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

    // Chip row is focusable on web when tab callbacks are wired up.
    const chipRowIsInteractive = Platform.OS === "web" && (onChipTabForward != null || onChipTabBackward != null);
    const chipRowWebProps = chipRowIsInteractive
      ? ({
          focusable: true,
          onKeyDown: handleChipKeyDown,
        } as any)
      : {};

    return (
      <View style={[styles.row, disabled && styles.rowDisabled]}>
        {/* Player info */}
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

        {/* Score input */}
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

        {/* Placement chips — focusable container on web; individual chips excluded from tab */}
        <View ref={chipRowRef} style={styles.chipsRow} {...chipRowWebProps}>
          {PLACEMENTS.map((p) => {
            const active = placement === p;
            return (
              <TouchableOpacity
                key={p}
                style={[
                  styles.chip,
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
                    styles.chipLabel,
                    active && styles.chipLabelActive,
                    placementError && active && styles.chipLabelError,
                  ]}
                >
                  {p}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Signature slot — caller owns this */}
        {signatureSlot}
      </View>
    );
  },
);

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: space[2],
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
      gap: space[2],
    },
    rowDisabled: {
      opacity: 0.55,
    },
    playerInfo: {
      flex: 1,
      minWidth: 0,
    },
    playerName: {
      ...type.bodySmall,
      color: colors.text,
      fontWeight: "600",
    },
    playerTeam: {
      ...type.caption,
      color: colors.textMuted,
    },
    scoreInput: {
      width: 64,
      height: 40,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: space[2],
      ...type.body,
      color: colors.text,
      backgroundColor: colors.surface,
      textAlign: "center",
    },
    inputDisabled: {
      opacity: 0.6,
    },
    chipsRow: {
      flexDirection: "row",
      gap: 4,
    },
    chip: {
      width: 40,
      height: 40,
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
      color: "#ffffff",
    },
  });
}
