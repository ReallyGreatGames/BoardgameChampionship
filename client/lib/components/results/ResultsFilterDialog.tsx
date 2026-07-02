import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { type } from "@/lib/theme/typography";
import type {
  BellFilter,
  SortOrder,
  SubmitFilter,
  TimerFilter,
} from "@/lib/components/results/ResultsAdminTab";
import { BottomSheet, makeSheetStyles } from "@/lib/components/ui/BottomSheet";
import { ChipGroup } from "@/lib/components/ui/ChipGroup";

type ResultsFilterDialogProps = {
  visible: boolean;
  onClose: () => void;
  bellFilter: BellFilter;
  onBellFilterChange: (v: BellFilter) => void;
  submitFilter: SubmitFilter;
  onSubmitFilterChange: (v: SubmitFilter) => void;
  timerFilter: TimerFilter;
  onTimerFilterChange: (v: TimerFilter) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (v: SortOrder) => void;
  onReset: () => void;
};

export function ResultsFilterDialog({
  visible,
  onClose,
  bellFilter,
  onBellFilterChange,
  submitFilter,
  onSubmitFilterChange,
  timerFilter,
  onTimerFilterChange,
  sortOrder,
  onSortOrderChange,
  onReset,
}: ResultsFilterDialogProps) {
  const { colors } = useTheme();
  const sheetStyles = useMemo(() => makeSheetStyles(colors), [colors]);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["tableOverview"]);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t("filtersTitle")}
      footer={
        <View style={styles.footerRow}>
          <Pressable style={styles.resetBtn} onPress={onReset}>
            <Text style={styles.resetBtnText}>{t("filtersReset")}</Text>
          </Pressable>
          <Pressable
            style={[sheetStyles.saveBtn, styles.doneBtn]}
            onPress={onClose}
          >
            <Text style={sheetStyles.saveBtnText}>{t("filtersDone")}</Text>
          </Pressable>
        </View>
      }
    >
      <View style={styles.filterGroup}>
        <Text style={styles.filterGroupLabel}>{t("filterLabelBell")}</Text>
        <ChipGroup<BellFilter>
          mode="select"
          options={[
            { value: "any", icon: "notifications-outline", color: colors.textMuted, label: t("filterBellAny") },
            { value: "active", icon: "notifications-outline", color: colors.accent, label: t("filterBellActive") },
            { value: "acknowledged", icon: "notifications-off-outline", color: colors.success, label: t("filterBellAck") },
          ]}
          value={bellFilter}
          onChange={onBellFilterChange}
        />
      </View>

      <View style={styles.filterGroup}>
        <Text style={styles.filterGroupLabel}>{t("filterLabelSubmit")}</Text>
        <ChipGroup<SubmitFilter>
          mode="select"
          options={[
            { value: "all", icon: "document-outline", color: colors.textMuted, label: t("filterSubmitAll") },
            { value: "submitted", icon: "checkmark-circle-outline", color: colors.success, label: t("filterSubmitYes") },
            { value: "notSubmitted", icon: "hourglass-outline", color: colors.accent, label: t("filterSubmitNo") },
          ]}
          value={submitFilter}
          onChange={onSubmitFilterChange}
        />
      </View>

      <View style={styles.filterGroup}>
        <Text style={styles.filterGroupLabel}>{t("filterLabelTimer")}</Text>
        <ChipGroup<TimerFilter>
          mode="select"
          options={[
            { value: "any", icon: "timer-outline", color: colors.textMuted, label: t("filterTimerAny") },
            { value: "running", icon: "play-circle-outline", color: colors.primary, label: t("filterTimerRunning") },
            { value: "noTimer", icon: "ban-outline", color: colors.textSecondary, label: t("filterTimerNone") },
          ]}
          value={timerFilter}
          onChange={onTimerFilterChange}
        />
      </View>

      <View style={styles.filterGroup}>
        <Text style={styles.filterGroupLabel}>{t("filterLabelSort")}</Text>
        <ChipGroup<SortOrder>
          mode="select"
          options={[
            { value: "table", icon: "list-outline", color: colors.textMuted, label: t("sortTable") },
            { value: "totalTimer", icon: "timer-outline", color: colors.primary, label: t("sortTotalTimer") },
            { value: "minTimer", icon: "person-outline", color: colors.primary, label: t("sortMinTimer") },
            { value: "resultStatus", icon: "document-text-outline", color: colors.primary, label: t("sortResultStatus") },
            { value: "bellFirst", icon: "notifications-outline", color: colors.accent, label: t("sortBellFirst") },
            { value: "sigsFirst", icon: "pencil-outline", color: colors.primary, label: t("sortSigsFirst") },
          ]}
          value={sortOrder}
          onChange={onSortOrderChange}
        />
      </View>
    </BottomSheet>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    filterGroup: {
      gap: 8,
    },
    filterGroupLabel: {
      ...type.caption,
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    footerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    resetBtn: {
      paddingVertical: 14,
      paddingHorizontal: 8,
    },
    resetBtnText: {
      ...type.button,
      color: colors.textMuted,
    },
    doneBtn: {
      paddingHorizontal: 24,
    },
  });
}
