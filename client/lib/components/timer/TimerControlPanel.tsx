import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { RoundCountdown } from "@/lib/hooks/useRoundCountdown";
import { fonts, type } from "@/lib/theme/typography";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

type Props = {
  onOpenMenu: () => void;
  allPaused: boolean;
  onToggleAllPause: () => void;
  roundCountdown: RoundCountdown;
  spamProtectionActive: boolean;
};

export function TimerControlPanel({
  onOpenMenu,
  allPaused,
  onToggleAllPause,
  roundCountdown,
  spamProtectionActive,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation(["timer"]);

  return (
    <View style={styles.root} pointerEvents="box-none">
      {spamProtectionActive && (
        <View
          style={[
            styles.spamBanner,
            { backgroundColor: colors.error + "22", borderColor: colors.error },
          ]}
        >
          <Ionicons name="hourglass-outline" size={16} color={colors.error} />
          <Text style={[type.bodySmall, { color: colors.error }]} numberOfLines={2}>
            {t("spamProtectionActive")}
          </Text>
        </View>
      )}

      {/* Fixed-size anchor box: its own center is the true dead-center point.
          The disc sits exactly on that point; the gear and pill are offset
          satellites around it, so adding/removing them never moves the disc. */}
      <View style={styles.anchor}>
        <Pressable
          style={({ pressed }) => [
            styles.disc,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && !spamProtectionActive && { backgroundColor: colors.surfaceHigh },
            spamProtectionActive && styles.disabled,
          ]}
          onPress={onToggleAllPause}
          disabled={spamProtectionActive}
          accessibilityLabel={allPaused ? t("resumeAll") : t("pauseAll")}
        >
          <Ionicons name={allPaused ? "play" : "pause"} size={36} color={colors.accent} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.gear,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && { backgroundColor: colors.surfaceHigh },
          ]}
          onPress={onOpenMenu}
          accessibilityLabel={t("openMenu")}
        >
          <Ionicons name="settings-outline" size={18} color={colors.textSecondary} />
        </Pressable>

        <View style={styles.pillRow}>
          <View style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[type.eyebrow, { color: colors.textSecondary }]}>
              {t("timeRemaining")}
            </Text>
            <Text
              style={[
                styles.pillValue,
                {
                  color: roundCountdown.isOvertime
                    ? colors.error
                    : roundCountdown.isPaused
                      ? colors.textMuted
                      : colors.text,
                },
              ]}
            >
              {roundCountdown.label}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const DISC_SIZE = 84;
const GEAR_SIZE = 40;
const GAP = 10;
// Wide enough for "MM:SS" (and the "--:--" placeholder) at the pillValue
// font/size, so the pill never resizes as the countdown's digits change.
const PILL_VALUE_WIDTH = 52;

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
  },
  spamBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    maxWidth: 260,
    marginBottom: 10,
  },
  anchor: {
    width: DISC_SIZE,
    height: DISC_SIZE,
  },
  disc: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -DISC_SIZE / 2,
    marginLeft: -DISC_SIZE / 2,
    width: DISC_SIZE,
    height: DISC_SIZE,
    borderRadius: DISC_SIZE / 2,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
  gear: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -GEAR_SIZE / 2,
    marginLeft: DISC_SIZE / 2 + GAP,
    width: GEAR_SIZE,
    height: GEAR_SIZE,
    borderRadius: GEAR_SIZE / 2,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  disabled: {
    opacity: 0.4,
  },
  pillRow: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    marginTop: DISC_SIZE / 2 + GAP,
    alignItems: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 11,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  pillValue: {
    fontFamily: fonts.displayExtraBold,
    fontSize: 15,
    letterSpacing: 0.5,
    width: PILL_VALUE_WIDTH,
    textAlign: "right",
  },
});
