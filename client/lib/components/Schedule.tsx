import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { useAuth } from "../auth";
import { usePlayer } from "../bootstrap/PlayerProvider";
import { useTheme } from "../bootstrap/ThemeProvider";
import { Schedule } from "../models/schedule";
import { useScheduleStore } from "../stores/appwrite/schedule-store";
import { inset } from "../theme/spacing";
import { type } from "../theme/typography";
import { deepClone } from "../utils";
import { useDialog } from "./Dialog";
import { ScheduleFormData, ScheduleItemModal } from "./ScheduleItemModal";
import { Table } from "./Table";
import { TimerSettingsModal } from "./TimerSettingsModal";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

// Animated.loop doesn't reset values between iterations, so we use a recursive
// callback that explicitly resets scale/opacity before each cycle.
function PulsingDot({
  isActive,
  isFinished,
  colors,
}: {
  isActive: boolean;
  isFinished: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const pingScale = useRef(new Animated.Value(1)).current;
  const pingOpacity = useRef(new Animated.Value(0)).current;
  const activeRef = useRef(false);

  useEffect(() => {
    if (!isActive) {
      activeRef.current = false;
      pingScale.stopAnimation();
      pingOpacity.stopAnimation();
      pingScale.setValue(1);
      pingOpacity.setValue(0);
      return;
    }

    activeRef.current = true;

    const pulse = () => {
      if (!activeRef.current) return;
      pingScale.setValue(1);
      pingOpacity.setValue(0.7);
      Animated.parallel([
        Animated.timing(pingScale, {
          toValue: 2.5,
          duration: 1200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pingOpacity, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) pulse();
      });
    };

    pulse();

    return () => {
      activeRef.current = false;
    };
  }, [isActive]);

  const dotColor = isFinished
    ? colors.text
    : isActive
      ? colors.success
      : colors.accent;

  return (
    <View style={{ alignItems: "center", justifyContent: "center", marginVertical: 4 }}>
      {isActive && (
        <Animated.View
          style={{
            position: "absolute",
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: colors.success,
            transform: [{ scale: pingScale }],
            opacity: pingOpacity,
          }}
        />
      )}
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: dotColor }} />
    </View>
  );
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
  canSetActive: boolean;
};

export function ScheduleItem({
  schedule,
  admin,
}: {
  schedule: Schedule;
  admin?: AdminActions;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [expanded, setExpanded] = useState(schedule.isActive);
  const { t } = useTranslation(["components"]);
  const { player } = usePlayer();
  const endTime = addMinutesToTime(schedule.startTimePlanned, schedule.durationPlanned);

  const chevronRotation = useRef(new Animated.Value(schedule.isActive ? 1 : 0)).current;
  const chevronStyle = {
    transform: [
      {
        rotate: chevronRotation.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "180deg"],
        }),
      },
    ],
  };

  useEffect(() => {
    if (schedule.isActive && !expanded) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpanded(true);
      Animated.timing(chevronRotation, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  }, [schedule.isActive]);

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const next = !expanded;
    setExpanded(next);
    Animated.timing(chevronRotation, { toValue: next ? 1 : 0, duration: 200, useNativeDriver: true }).start();
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.itemHeader}
        onPress={handleToggle}
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
          <Animated.View style={chevronStyle}>
            <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
          </Animated.View>
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
                <TouchableOpacity
                  style={styles.goToGameButton}
                  onPress={() => {
                    if (player?.team && player?.playerId) router.push(`/game?gameId=${schedule.gameId}`);
                    else router.push({ pathname: "/(pages)/(team-player)/choose-your-character", params: { gameId: schedule.gameId } });
                  }}
                >
                  <Text style={styles.goToGameButtonText}>{t("schedule.goToGameButton")}</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </TouchableOpacity>
              ) : null}
            </View>

            {schedule.gameId ? (
              <Table gameId={schedule.gameId} />
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

          {!schedule.isActive && admin.canSetActive && (
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
  const { collection, add, update, delete: deleteItem } = useScheduleStore();
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Schedule | undefined>(undefined);
  const [timerModalVisible, setTimerModalVisible] = useState(false);
  const [timerGameId, setTimerGameId] = useState<string | null>(null);
  const sortedScheduleItems = useMemo(
    () => [...collection].sort((a, b) => a.sortIndex - b.sortIndex),
    [collection],
  );
  // If update buttons are clicked within 2 seconds of each other, the dedupe logic in the store causes only one update to be processed, which results in the sortIndex getting out of sync with the actual order. To mitigate this, we disable all buttons for 2 seconds after any update.
  const debounceTimeOut = 2000;
  const nextSortIndex = useMemo(
    () => sortedScheduleItems.length === 0
      ? 0
      : Math.max(...sortedScheduleItems.map((s) => s.sortIndex ?? 0)) + 1,
    [sortedScheduleItems],
  );

  async function handleMoveUp(index: number) {
    const items = deepClone(sortedScheduleItems);
    const item = items[index];
    const prev = items[index - 1];
    const itemOrder = item.sortIndex ?? index;
    const prevOrder = prev.sortIndex ?? (index - 1);
    setIsLoading(true);
    try {
      await Promise.all([
        update({ ...item, sortIndex: prevOrder }),
        update({ ...prev, sortIndex: itemOrder }),
      ]);
    } finally {
      setTimeout(() => setIsLoading(false), debounceTimeOut);
    }
  }

  async function handleMoveDown(index: number) {
    const items = deepClone(sortedScheduleItems);
    const item = items[index];
    const next = items[index + 1];
    const itemOrder = item.sortIndex ?? index;
    const nextOrder = next.sortIndex ?? (index + 1);
    setIsLoading(true);
    try {
      await Promise.all([
        update({ ...item, sortIndex: nextOrder }),
        update({ ...next, sortIndex: itemOrder }),
      ]);
    } finally {
      setTimeout(() => setIsLoading(false), debounceTimeOut);
    }
  }

  async function handleSetActive(storeIndex: number) {
    const ok = await confirm({
      title: t("schedule.confirmSetActive.title"),
      message: t("schedule.confirmSetActive.message"),
      confirmLabel: t("schedule.confirmSetActive.confirm"),
      cancelLabel: t("schedule.confirmSetActive.cancel"),
    });
    if (!ok) return;

    setIsLoading(true);
    try {
      const items = deepClone(sortedScheduleItems);
      const currentActiveItem = items.findIndex((s) => s.isActive);
      if (currentActiveItem !== -1) {
        items[currentActiveItem].isFinished = currentActiveItem <= storeIndex;
        items[currentActiveItem].isActive = false;
      }
      await Promise.all(
        items.map((s, i) => {
          const shouldBeActive = i === storeIndex;
          return update({ ...s, isActive: shouldBeActive, isFinished: shouldBeActive ? false : s.isFinished });
        })
      );
    } finally {
      setTimeout(() => setIsLoading(false), debounceTimeOut);
    }
  }

  async function handleDelete(storeIndex: number) {
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
      await deleteItem(sortedScheduleItems[storeIndex]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleEdit(storeIndex: number) {
    setEditingItem({ ...sortedScheduleItems[storeIndex] });
    setModalVisible(true);
  }

  function addSchedule() {
    setEditingItem(undefined);
    setModalVisible(true);
  }

  async function handleModalSave(data: ScheduleFormData) {
    if (editingItem) {
      const ok = await update({ ...editingItem, ...data });
      if (!ok) throw new Error();
    } else {
      const result = await add(data);
      if (!result) throw new Error();
    }
  }

  const lastIndex = sortedScheduleItems.length - 1;
  const activeIndex = sortedScheduleItems.findIndex((s) => s.isActive);

  return (
    <>
      <ScheduleItemModal
        visible={modalVisible}
        item={editingItem}
        nextSortIndex={nextSortIndex}
        onClose={() => setModalVisible(false)}
        onSave={handleModalSave}
        onRules={(gameId) => {
          router.push(`/rules?gameId=${gameId}`);
          setModalVisible(false);
        }}
        onTimer={(gameId) => {
          setTimerGameId(gameId ?? null);
          setTimerModalVisible(true);
          setModalVisible(false);
        }}
      />
      <TimerSettingsModal
        visible={timerModalVisible}
        gameId={timerGameId}
        onClose={() => setTimerModalVisible(false)}
        onCreated={async (newId) => {
          if (editingItem) await update({ ...editingItem, gameId: newId });
        }}
      />
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
                <PulsingDot
                  isActive={schedule.isActive ?? false}
                  isFinished={schedule.isFinished ?? false}
                  colors={colors}
                />
                <View style={isLast && isAdmin ? styles.timelineLineDashed : [styles.timelineLine, isLast && styles.timelineLineHidden]} />
              </View>
              <View style={[styles.timelineCard, (!isLast || isAdmin) && styles.timelineCardGap]}>
                <ScheduleItem
                  key={`${schedule.$id}-${schedule.$updatedAt ?? ""}`}
                  schedule={schedule}
                  admin={isAdmin ? {
                    isFirst,
                    isLast,
                    disabled: isLoading,
                    canSetActive: activeIndex === -1 ? index === 0 : (index === activeIndex + 1 || index === activeIndex - 1),
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
              <View style={styles.timelineLineDashed} />
              <View style={[styles.timelineDot, { backgroundColor: colors.border }]} />
              <View style={[styles.timelineLine, styles.timelineLineHidden]} />
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
    timelineLineDashed: {
      flex: 1,
      width: 2,
      borderLeftWidth: 2,
      borderStyle: "dashed",
      borderColor: colors.border,
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
