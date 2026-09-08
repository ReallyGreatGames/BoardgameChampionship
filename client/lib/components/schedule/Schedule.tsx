import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LayoutAnimation,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { Schedule } from "@/lib/models/schedule";
import { useResultStore } from "@/lib/stores/appwrite/result-store";
import { useScheduleStore } from "@/lib/stores/appwrite/schedule-store";
import { useTableStore } from "@/lib/stores/appwrite/table-store";
import { inset, space } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";
import { ui } from "@/lib/theme/ui";
import { computeTableElapsedSeconds, deepClone } from "@/lib/utils";
import { useDialog } from "@/lib/components/ui/Dialog";
import { RunningNowCard } from "@/lib/components/schedule/RunningNowCard";
import { ScheduleRow } from "@/lib/components/schedule/ScheduleRow";
import {
  ScheduleFormData,
  ScheduleItemModal,
} from "@/lib/components/schedule/ScheduleItemModal";
import { TimerSettingsModal } from "@/lib/components/schedule/TimerSettingsModal";
import { goTo } from "@/lib/utils/navigation";

function initialActiveResumedAt(item: Schedule): string | null {
  return item.gameId ? null : new Date().toISOString();
}

export function ScheduleList() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["components"]);
  const { isAdmin } = useAuth();
  const { confirm } = useDialog();
  const { collection, add, update, delete: deleteItem } = useScheduleStore();
  const resultCollection = useResultStore((s) => s.collection);
  const tableCollection = useTableStore((s) => s.collection);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Schedule | undefined>(
    undefined,
  );
  const [timerModalVisible, setTimerModalVisible] = useState(false);
  const [timerGameId, setTimerGameId] = useState<string | null>(null);
  const [doneOpen, setDoneOpen] = useState(true);
  const sortedScheduleItems = useMemo(
    () => [...collection].sort((a, b) => a.sortIndex - b.sortIndex),
    [collection],
  );
  const debounceTimeOut = 2000;
  const nextSortIndex = useMemo(
    () =>
      sortedScheduleItems.length === 0
        ? 0
        : Math.max(...sortedScheduleItems.map((s) => s.sortIndex ?? 0)) + 1,
    [sortedScheduleItems],
  );

  async function handleMoveUp(index: number) {
    const items = deepClone(sortedScheduleItems);
    const item = items[index];
    const prev = items[index - 1];
    const itemOrder = item.sortIndex ?? index;
    const prevOrder = prev.sortIndex ?? index - 1;
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
    const nextOrder = next.sortIndex ?? index + 1;
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

  /**
   * The two confirmation prompts every activation goes through. Returns
   * whether the admin confirmed all of them.
   */
  async function confirmActiveChange() {
    const currentActive = sortedScheduleItems.find((s) => s.isActive);
    const gameTables = tableCollection.filter((t) => {
      const tGameId = typeof t.game === "string" ? t.game : t.game.$id;
      return !!currentActive?.gameId && tGameId === currentActive.gameId;
    });
    const hasSigned =
      !!currentActive?.gameId &&
      (gameTables.length === 0
        ? resultCollection.some(
            (r) =>
              r.gameId === currentActive.gameId && r.signatureIds?.some(Boolean),
          )
        : !gameTables.every((table) =>
            resultCollection.some(
              (r) =>
                r.gameId === currentActive.gameId &&
                r.table === table.tableNumber &&
                r.submitted,
            ),
          ));

    const confirmKey = "confirmSetActive";
    const ok = await confirm({
      title: t(`schedule.${confirmKey}.title`),
      message: t(`schedule.${confirmKey}.message`),
      confirmLabel: t(`schedule.${confirmKey}.confirm`),
      cancelLabel: t(`schedule.${confirmKey}.cancel`),
      destructive: hasSigned,
    });
    if (!ok) {
      return false;
    }

    if (hasSigned) {
      const confirmKey = "confirmSetActiveWithSignatures";

      const ok = await confirm({
        title: t(`schedule.${confirmKey}.title`),
        message: t(`schedule.${confirmKey}.message`),
        confirmLabel: t(`schedule.${confirmKey}.confirm`),
        cancelLabel: t(`schedule.${confirmKey}.cancel`),
        destructive: hasSigned,
      });
      if (!ok) {
        return false;
      }
    }

    return true;
  }

  async function handleSetActive(storeIndex: number) {
    if (!(await confirmActiveChange())) {
      return;
    }

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
          return update({
            ...s,
            isActive: shouldBeActive,
            isFinished: shouldBeActive ? false : s.isFinished,
            activeAccumulatedMs: shouldBeActive ? 0 : s.activeAccumulatedMs,
            activeResumedAt: shouldBeActive
              ? initialActiveResumedAt(s)
              : s.activeResumedAt,
          });
        }),
      );
    } finally {
      setTimeout(() => setIsLoading(false), debounceTimeOut);
    }
  }

  /**
   * Restarts a finished item: it becomes the running one, and everything after
   * it is un-finished, so the whole rest of the day moves back to "up next".
   * Items before it stay done.
   */
  async function handleRestart(storeIndex: number) {
    if (!(await confirmActiveChange())) {
      return;
    }

    setIsLoading(true);
    try {
      await Promise.all(
        sortedScheduleItems.map((s, i) =>
          i < storeIndex
            ? update({ ...s, isActive: false })
            : update({
                ...s,
                isActive: i === storeIndex,
                isFinished: false,
                activeAccumulatedMs: i === storeIndex ? 0 : s.activeAccumulatedMs,
                activeResumedAt:
                  i === storeIndex ? initialActiveResumedAt(s) : s.activeResumedAt,
              }),
        ),
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
    if (!ok) {
      return;
    }

    setIsLoading(true);
    try {
      await deleteItem(sortedScheduleItems[storeIndex]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePause(storeIndex: number) {
    const item = sortedScheduleItems[storeIndex];
    const elapsedMs =
      computeTableElapsedSeconds(
        item.activeAccumulatedMs ?? 0,
        item.activeResumedAt,
        Date.now(),
      ) * 1000;
    setIsLoading(true);
    try {
      await update({
        ...item,
        activeAccumulatedMs: elapsedMs,
        activeResumedAt: null,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResume(storeIndex: number) {
    const item = sortedScheduleItems[storeIndex];
    setIsLoading(true);
    try {
      await update({ ...item, activeResumedAt: new Date().toISOString() });
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
      if (!ok) {
        throw new Error();
      }
    } else {
      const result = await add(data);
      if (!result) {
        throw new Error();
      }
    }
  }

  const lastIndex = sortedScheduleItems.length - 1;
  const activeIndex = sortedScheduleItems.findIndex((s) => s.isActive);
  const activeItem = activeIndex === -1 ? null : sortedScheduleItems[activeIndex];

  // Both groups keep the item's index in `sortedScheduleItems`, because every
  // admin handler addresses items by that index.
  const { upcoming, done } = useMemo(() => {
    const upcomingItems: { item: Schedule; index: number }[] = [];
    const doneItems: { item: Schedule; index: number }[] = [];
    sortedScheduleItems.forEach((item, index) => {
      if (item.isActive) {
        return;
      }
      (item.isFinished ? doneItems : upcomingItems).push({ item, index });
    });
    return { upcoming: upcomingItems, done: doneItems };
  }, [sortedScheduleItems]);

  /**
   * Mirrors the old timeline's rule for starting an *upcoming* item: only the
   * one directly after the active item (or the very first item when nothing is
   * active) may be started, so the day can't skip ahead. Finished items are not
   * bound by it — they all offer "restart".
   */
  const canSetActive = (index: number) =>
    activeIndex === -1
      ? index === 0
      : index === activeIndex + 1 || index === activeIndex - 1;

  const adminActions = (index: number, variant: "upcoming" | "done") => ({
    onMoveUp: variant === "upcoming" ? () => handleMoveUp(index) : undefined,
    onMoveDown: variant === "upcoming" ? () => handleMoveDown(index) : undefined,
    onSetActive:
      variant === "done"
        ? () => handleRestart(index)
        : canSetActive(index)
          ? () => handleSetActive(index)
          : undefined,
    onEdit: () => handleEdit(index),
    onDelete: () => handleDelete(index),
    isFirst: index === 0,
    isLast: index === lastIndex,
    disabled: isLoading,
  });

  function toggleDone() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDoneOpen((prev) => !prev);
  }

  return (
    <>
      <ScheduleItemModal
        visible={modalVisible}
        item={editingItem}
        nextSortIndex={nextSortIndex}
        onClose={() => setModalVisible(false)}
        onSave={handleModalSave}
        onRules={(gameId) => {
          goTo(
            "/(pages)/(user)/schedule",
            `/rules?gameId=${gameId}&from=/(pages)/(user)/schedule`,
          );
          setModalVisible(false);
        }}
        onLotteries={(gameId) => {
          goTo(
            "/(pages)/(user)/schedule",
            `/(pages)/(user)/lottery-add?gameId=${gameId}&from=/(pages)/(user)/schedule`,
          );
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
          if (editingItem) {
            await update({ ...editingItem, gameId: newId });
          }
        }}
      />
      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {activeItem && (
          <RunningNowCard
            key={`${activeItem.$id}-${activeItem.$updatedAt ?? ""}`}
            item={activeItem}
            admin={
              isAdmin
                ? {
                    onEdit: () => handleEdit(activeIndex),
                    onStartNext:
                      activeIndex < lastIndex
                        ? () => handleSetActive(activeIndex + 1)
                        : null,
                    onTogglePause: activeItem.activeResumedAt
                      ? () => handlePause(activeIndex)
                      : () => handleResume(activeIndex),
                    isPaused: !activeItem.activeResumedAt,
                    disabled: isLoading,
                  }
                : undefined
            }
          />
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t("schedule.upcoming")}</Text>
          <View style={styles.group}>
            {upcoming.map(({ item, index }) => (
              <ScheduleRow
                key={`${item.$id}-${item.$updatedAt ?? ""}`}
                schedule={item}
                variant="upcoming"
                admin={isAdmin ? adminActions(index, "upcoming") : undefined}
              />
            ))}

            {upcoming.length === 0 && !isAdmin && (
              <Text style={styles.emptyText}>
                {t("schedule.noUpcomingItems")}
              </Text>
            )}

            {isAdmin && (
              <TouchableOpacity
                style={[styles.addItem, isLoading && styles.addItemDisabled]}
                onPress={addSchedule}
                disabled={isLoading}
                accessibilityRole="button"
              >
                <Ionicons
                  name="add-circle-outline"
                  size={19}
                  color={colors.textSecondary}
                />
                <Text style={styles.addItemText}>{t("schedule.addItem")}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {done.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.doneHeader}
              onPress={toggleDone}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ expanded: doneOpen }}
            >
              <Text style={styles.sectionLabel}>
                {t("schedule.doneSection", { count: done.length })}
              </Text>
              <Ionicons
                name={doneOpen ? "chevron-up" : "chevron-down"}
                size={16}
                color={colors.textMuted}
              />
            </TouchableOpacity>
            {doneOpen && (
              <View style={styles.groupTight}>
                {done.map(({ item, index }) => (
                  <ScheduleRow
                    key={`${item.$id}-${item.$updatedAt ?? ""}`}
                    schedule={item}
                    variant="done"
                    admin={isAdmin ? adminActions(index, "done") : undefined}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    list: {
      // Horizontal padding is the embedding screen's job — the admin dashboard
      // wraps this list in its own, wider gutter.
      paddingBottom: inset.screenBottom,
      gap: space[6],
    },
    section: {
      gap: space[3],
    },
    sectionLabel: {
      ...type.eyebrow,
      color: colors.textMuted,
    },
    group: {
      gap: space[2],
    },
    groupTight: {
      gap: space[1] + 2,
    },
    doneHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: space[2],
      minHeight: 32,
    },
    emptyText: {
      ...type.bodySmall,
      color: colors.textMuted,
    },
    addItem: {
      minHeight: 48,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: colors.border,
      borderRadius: ui.cardRadius,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: space[2],
    },
    addItemDisabled: {
      opacity: ui.disabledOpacity,
    },
    addItemText: {
      ...type.bodySmall,
      fontFamily: type.eyebrow.fontFamily,
      color: colors.textSecondary,
    },
  });
}
