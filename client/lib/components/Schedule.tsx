import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../auth";
import { useTheme } from "../bootstrap/ThemeProvider";
import { Schedule } from "../models/schedule";
import { useScheduleStore } from "../stores/appwrite/schedule-store";
import { inset } from "../theme/spacing";
import { type } from "../theme/typography";
import { useDialog } from "./Dialog";

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}


type AdminActions = {
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSetActive: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
};

export function ScheduleItem({
  schedule,
  previous,
  admin,
}: {
  schedule: Schedule;
  previous?: Schedule;
  admin?: AdminActions;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [expanded, setExpanded] = useState(schedule.isActive);
  const { t } = useTranslation(["components"]);
  const endTime = addMinutesToTime(schedule.startTimePlanned, schedule.durationPlanned);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.itemHeader}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.7}
      >
        <View style={styles.itemLeft}>
          {schedule.icon ? (
            <Ionicons name={schedule.icon as any} size={20} color={schedule.isActive ? colors.success : schedule.isFinished ? colors.textMuted : colors.text} />
          ) : null}
          <Text style={[styles.itemTitle, { fontWeight: schedule.isActive ? "bold" : "normal", color: schedule.isActive ? colors.text : schedule.isFinished ? colors.textMuted : colors.text }]}>{schedule.title}</Text>
        </View>
        <View style={styles.itemRight}>
          <Text style={styles.itemTime}>{schedule.startTimePlanned}</Text>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={colors.textMuted}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <>
          <View style={styles.divider} />
          <View style={styles.expandedContent}>
            <View style={styles.expandedTimeSection}>
              <View style={styles.expandedTimeSectionInfo}>
                <View style={styles.timeRow}>
                  <Ionicons name="time" size={16} color={colors.primary} />
                  <Text style={styles.timeValue}>
                    {schedule.startTimePlanned} – {endTime}
                  </Text>
                </View>
                <View style={styles.timeRow}>
                  <Ionicons name="hourglass" size={16} color={colors.primary} />
                  <Text style={styles.timeValue}>
                    {schedule.durationPlanned} min
                  </Text>
                </View>
              </View>
              {schedule.gameId ? (
                <TouchableOpacity style={styles.goToGameButton}>
                  <Text style={styles.goToGameButtonText}>{t("schedule.goToGameButton")}</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </TouchableOpacity>
              ) : null}
            </View>

            {schedule.gameId ? (
              <View style={styles.gameSection}>
                {/* TODO: Load Data from Games - requires data import */}
                <Text style={styles.gameSectionHeader}>Tisch 14 // TODO</Text>
                <View style={styles.gameTable}>
                  {[
                    { team: "Team 1", player: "Spieler 1" },
                    { team: "Team 2", player: "Spieler 2" },
                    { team: "Team 3", player: "Spieler 3" },
                    { team: "Team 4", player: "Spieler 4" },
                  ].map((entry, i) => (
                    <View key={i} style={styles.gameRow}>
                      <Text style={styles.gameTeam}>{entry.team}</Text>
                      <Text style={styles.gamePlayer}>{entry.player}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {schedule.description ? (
              <Text style={styles.description}>{schedule.description}</Text>
            ) : null}
          </View>
        </>
      )}
      {admin && (
        <View style={styles.adminBar}>
          <TouchableOpacity
            style={[styles.adminBtn, (admin.isFirst || admin.disabled) && styles.adminBtnDisabled]}
            onPress={admin.onMoveUp}
            disabled={admin.isFirst || admin.disabled}
          >
            <Ionicons name="arrow-up" size={16} color={(admin.isFirst || admin.disabled) ? colors.textMuted : colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.adminBtn, (admin.isLast || admin.disabled) && styles.adminBtnDisabled]}
            onPress={admin.onMoveDown}
            disabled={admin.isLast || admin.disabled}
          >
            <Ionicons name="arrow-down" size={16} color={(admin.isLast || admin.disabled) ? colors.textMuted : colors.text} />
          </TouchableOpacity>

          {schedule.isActive ? null : (
            <TouchableOpacity
              style={[styles.adminBtn, admin.disabled && styles.adminBtnDisabled]}
              onPress={admin.onSetActive}
              disabled={admin.disabled}
            >
              <Ionicons name="play-circle-outline" size={16} color={admin.disabled ? colors.textMuted : colors.success} />
            </TouchableOpacity>
          )}

          <View style={styles.adminBarSpacer} />
          {admin.disabled && (
            <ActivityIndicator size="small" color={colors.textMuted} />
          )}
          <TouchableOpacity
            style={[styles.adminBtn, admin.disabled && styles.adminBtnDisabled]}
            onPress={admin.onEdit}
            disabled={admin.disabled}
          >
            <Ionicons name="create-outline" size={16} color={admin.disabled ? colors.textMuted : colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.adminBtn, admin.disabled && styles.adminBtnDisabled]}
            onPress={admin.onDelete}
            disabled={admin.disabled}
          >
            <Ionicons name="trash-outline" size={16} color={admin.disabled ? colors.textMuted : colors.error} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export function ScheduleList() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["components"]);
  const { isAdmin } = useAuth();
  const { confirm } = useDialog();
  const { collection, update, delete: deleteItem } = useScheduleStore();
  const [isLoading, setIsLoading] = useState(false);
  const sortedScheduleItems = useMemo(
    () => [...collection].sort((a, b) => a.sortIndex - b.sortIndex),
    [collection],
  );

  async function handleMoveUp(index: number) {
    const item = sortedScheduleItems[index];
    const prev = sortedScheduleItems[index - 1];
    const itemOrder = item.sortIndex ?? index;
    const prevOrder = prev.sortIndex ?? (index - 1);
    setIsLoading(true);
    try {
      await Promise.all([
        update({ ...item, sortIndex: prevOrder }),
        update({ ...prev, sortIndex: itemOrder }),
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleMoveDown(index: number) {
    const item = sortedScheduleItems[index];
    const next = sortedScheduleItems[index + 1];
    const itemOrder = item.sortIndex ?? index;
    const nextOrder = next.sortIndex ?? (index + 1);
    setIsLoading(true);
    try {
      await Promise.all([
        update({ ...item, sortIndex: nextOrder }),
        update({ ...next, sortIndex: itemOrder }),
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSetActive(index: number) {
    const ok = await confirm({
      title: t("schedule.confirmSetActive.title"),
      message: t("schedule.confirmSetActive.message"),
      confirmLabel: t("schedule.confirmSetActive.confirm"),
      cancelLabel: t("schedule.confirmSetActive.cancel"),
    });
    if (!ok) return;

    setIsLoading(true);
    try {
      const currentActiveItem = sortedScheduleItems.findIndex((s) => s.isActive);
      if (currentActiveItem !== -1) {
        sortedScheduleItems[currentActiveItem].isFinished = currentActiveItem <= index;
        sortedScheduleItems[currentActiveItem].isActive = false;
      }
      await Promise.all(
        sortedScheduleItems.map((s, i) => {
          const shouldBeActive = i === index;
          return update({ ...s, isActive: shouldBeActive, isFinished: shouldBeActive ? false : s.isFinished });
        })
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(index: number) {
    const ok = await confirm({
      title: t("schedule.confirmDelete.title"),
      message: t("schedule.confirmDelete.message"),
      confirmLabel: t("schedule.confirmDelete.confirm"),
      cancelLabel: t("schedule.confirmDelete.cancel"),
      destructive: true,
    });
    if (!ok) return;

    setIsLoading(true);
    try {
      await deleteItem(sortedScheduleItems[index]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleEdit(index: number) {
    // TODO: Open Edit Modal
  }

  function addSchedule() {
    // TODO: Open Add Modal (same as Edit Modal, but empty)
  }

  const lastIndex = sortedScheduleItems.length - 1;

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>{t("schedule.title")}</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {sortedScheduleItems.map((schedule, index) => {
          const isFirst = index === 0;
          const isLast = index === lastIndex;
          return (
            <View key={schedule.$id} style={styles.timelineRow}>
              <View style={styles.timelineTrack}>
                <View style={[styles.timelineLine, isFirst && styles.timelineLineHidden]} />
                <View style={schedule.isFinished ? [styles.timelineDot, { backgroundColor: colors.text }] : schedule.isActive ? [styles.timelineDot, { backgroundColor: colors.success }] : styles.timelineDot} />
                <View style={[styles.timelineLine, (isLast && !isAdmin) && styles.timelineLineHidden]} />
              </View>
              <View style={[styles.timelineCard, (!isLast || isAdmin) && styles.timelineCardGap]}>
                <ScheduleItem
                  key={`${schedule.$id}-${schedule.$updatedAt ?? ""}`}
                  schedule={schedule}
                  previous={sortedScheduleItems[index - 1]}
                  admin={isAdmin ? {
                    isFirst,
                    isLast,
                    disabled: isLoading,
                    onMoveUp: () => handleMoveUp(index),
                    onMoveDown: () => handleMoveDown(index),
                    onSetActive: () => handleSetActive(index),
                    onEdit: () => handleEdit(index),
                    onDelete: () => handleDelete(index),
                  } : undefined}
                />
              </View>
            </View>
          );
        })}
        {isAdmin && (
          <View style={styles.timelineRow}>
            <View style={styles.timelineTrack}>
              <View style={styles.timelineLine} />
              <View style={[styles.timelineDot, { backgroundColor: colors.border }]} />
              <View style={styles.timelineLineHidden} />
            </View>
            <View style={styles.timelineCard}>
              <TouchableOpacity
                style={[styles.addItemCard, isLoading && styles.addItemCardDisabled]}
                onPress={addSchedule}
                disabled={isLoading}
              >
                <Ionicons name="add-circle-outline" size={18} color={colors.textMuted} />
                <Text style={styles.addItemText}>{t("schedule.addItem")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    header: {
      marginBottom: inset.group,
    },
    title: {
      ...type.h1,
      color: colors.text,
    },
    list: {
      paddingBottom: inset.screenBottom,
    },
    // Timeline
    timelineRow: {
      flexDirection: "row",
      alignItems: "stretch",
    },
    timelineTrack: {
      width: 32,
      alignItems: "center",
    },
    timelineLine: {
      flex: 1,
      width: 2,
      backgroundColor: colors.border,
    },
    timelineLineHidden: {
      opacity: 0,
    },
    timelineDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.accent,
      marginVertical: 4,
    },
    timelineCard: {
      flex: 1,
    },
    timelineCardGap: {
      paddingBottom: inset.list,
    },
    // Card
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      overflow: "hidden",
    },
    itemHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: inset.card,
    },
    itemLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
    },
    itemTitle: {
      ...type.body,
      color: colors.text,
      flex: 1,
    },
    itemRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    itemTime: {
      ...type.bodySmall,
      color: colors.textSecondary,
    },
    itemTimeDelay: {
      ...type.bodySmall,
      color: colors.error,
    },
    divider: {
      height: 1,
      backgroundColor: colors.divider,
    },
    expandedContent: {
      padding: inset.card,
      gap: inset.tight,
    },
    timeRow: {
      flexDirection: "row",
      gap: 8,
      alignItems: "flex-start",
    },
    timeLabel: {
      ...type.caption,
      color: colors.textMuted,
      width: 40,
    },
    timeValue: {
      ...type.bodySmall,
      color: colors.textSecondary,
      flex: 1,
    },
    description: {
      ...type.bodySmall,
      color: colors.textSecondary,
      marginTop: inset.tight,
    },
    expandedTimeSection: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: inset.group,
    },
    expandedTimeSectionInfo: {
      flex: 1,
      gap: inset.tight,
    },
    goToGameButton: {
      backgroundColor: colors.accent,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    goToGameButtonText: {
      ...type.bodySmall,
      color: "#fff",
      fontWeight: "600",
    },
    // Game section
    gameSection: {
      marginTop: inset.tight,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      overflow: "hidden",
    },
    gameSectionHeader: {
      color: colors.text,
      fontWeight: "bold",
      backgroundColor: colors.surfaceHigh,
      paddingHorizontal: inset.card,
      paddingVertical: 6,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    gameTable: {
      gap: 0,
    },
    gameRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: inset.card,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    gameTeam: {
      ...type.bodySmall,
      color: colors.text,
    },
    gamePlayer: {
      ...type.bodySmall,
      color: colors.textSecondary,
    },
    // Admin bar
    adminBar: {
      flexDirection: "row",
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: colors.divider,
      paddingHorizontal: inset.card,
      paddingVertical: 6,
      gap: 4,
    },
    adminBtn: {
      padding: 6,
      borderRadius: 6,
    },
    adminBtnDisabled: {
      opacity: 0.3,
    },
    adminBarSpacer: {
      flex: 1,
    },
    // Add item button
    addItemCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: "dashed",
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: inset.card,
      paddingHorizontal: inset.card,
    },
    addItemCardDisabled: {
      opacity: 0.4,
    },
    addItemText: {
      ...type.bodySmall,
      color: colors.textMuted,
    },
  });
}
