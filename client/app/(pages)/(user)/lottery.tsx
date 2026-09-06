import { LOTTERY_BUCKET_ID, storage } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { BackButton } from "@/lib/components/ui/BackButton";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import { useLotteryActions } from "@/lib/hooks/useLotteryActions";
import { usePlayerTable } from "@/lib/hooks/usePlayerTable";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { OptionsLottery } from "@/lib/models/options-lottery";
import { useLotteryStore } from "@/lib/stores/appwrite/lottery-store";
import { useOptionsLotteryStore } from "@/lib/stores/appwrite/options-lottery-store";
import { inset, space } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";
import { ui } from "@/lib/theme/ui";
import { getLotteryPhotosForGame } from "@/lib/utils/lottery";
import { getOptionsLotteriesForGame, getResultForTable } from "@/lib/utils/options-lottery";
import { goBackTo, goTo } from "@/lib/utils/navigation";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

function fileUrl(fileId: string): string {
  return storage.getFileViewURL(LOTTERY_BUCKET_ID, fileId).toString();
}

function OptionsLotterySection({
  instance,
  playerTable,
  isAdmin,
  gameId,
  origin,
  styles,
  colors,
  t,
}: {
  instance: OptionsLottery;
  playerTable: number | null;
  isAdmin: boolean;
  gameId: string;
  origin: string;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useTheme>["colors"];
  t: (key: string, opts?: any) => string;
}) {
  const result = playerTable !== null ? getResultForTable(instance, playerTable) : null;
  const pulledOptions = result
    ? result.optionIds.map((id) => instance.options.find((o) => o.id === id))
    : [];

  const content = (
    <View style={styles.optionsSection}>
      <View style={styles.optionsSectionHeader}>
        <Text style={styles.sectionTitle}>{instance.name}</Text>
        {isAdmin && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
      </View>
      {instance.results.length === 0 ? (
        <Text style={styles.optionsPending}>{t("notPulledYet")}</Text>
      ) : playerTable === null ? (
        <Text style={styles.optionsPending}>{t("notAssignedToTable")}</Text>
      ) : (
        pulledOptions.map((option, i) => (
          <View key={`${option?.id ?? "?"}-${i}`} style={styles.optionsResultItem}>
            <Text style={styles.optionsResultTitle}>{option?.title ?? "?"}</Text>
            {option?.description ? (
              <Text style={styles.optionsResultDescription}>{option.description}</Text>
            ) : null}
          </View>
        ))
      )}
    </View>
  );

  if (!isAdmin) {
    return content;
  }

  return (
    <Pressable
      onPress={() =>
        goTo(
          origin,
          `/(pages)/(user)/lottery-options-edit?gameId=${gameId}&instanceId=${instance.$id}`,
        )
      }
    >
      {content}
    </Pressable>
  );
}

export default function LotteryScreen() {
  useRequireAuth();
  const { gameId, from } = useLocalSearchParams<{ gameId: string; from?: string }>();
  const { isAdmin } = useAuth();
  const { colors } = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isCompact = screenWidth < ui.breakpointTablet;
  const numColumns = isCompact ? 2 : 3;
  const styles = useMemo(() => makeStyles(colors, numColumns), [colors, numColumns]);
  const { t } = useTranslation(["lottery"]);
  const { t: tOptions } = useTranslation(["lotteryOptions"]);

  const collection = useLotteryStore((s) => s.collection);
  const optionsLotteryRows = useOptionsLotteryStore((s) => s.collection);
  const actions = useLotteryActions();
  const playerTable = usePlayerTable(gameId);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const photos = useMemo(
    () => getLotteryPhotosForGame(collection, gameId),
    [collection, gameId],
  );

  const visibleOptionsLotteries = useMemo(() => {
    const instances = getOptionsLotteriesForGame(optionsLotteryRows, gameId);
    // Players only ever see a lottery once it's been pulled; admins also
    // need to see not-yet-pulled instances so they can find their way back
    // to pull or delete them (there's no other list of drafts anywhere).
    return isAdmin ? instances : instances.filter((instance) => instance.results.length > 0);
  }, [optionsLotteryRows, gameId, isAdmin]);

  const selfHref = `/(pages)/(user)/lottery?gameId=${gameId}`;

  const handleBack = () => {
    goBackTo(from ?? (gameId ? `/game?gameId=${gameId}` : "/"));
  };

  const handleDelete = async (fileId: string) => {
    await actions.remove(fileId, {
      title: t("confirmDelete.title"),
      message: t("confirmDelete.message"),
      confirmLabel: t("confirmDelete.confirm"),
      cancelLabel: t("confirmDelete.cancel"),
      destructive: true,
    });
  };

  const hasAnyContent = photos.length > 0 || visibleOptionsLotteries.length > 0;
  const showSectionHeaders = visibleOptionsLotteries.length > 0;

  const optionsSections = visibleOptionsLotteries.length > 0 && (
    <View style={styles.optionsSections}>
      <Text style={styles.sectionTitle}>{tOptions("typeOptions")}</Text>
      {visibleOptionsLotteries.map((instance) => (
        <OptionsLotterySection
          key={instance.$id}
          instance={instance}
          origin={selfHref}
          playerTable={playerTable}
          isAdmin={isAdmin}
          gameId={gameId}
          styles={styles}
          colors={colors}
          t={tOptions}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={handleBack} />
        {isAdmin && (
          <Pressable
            style={styles.addBtn}
            onPress={() =>
              goTo(selfHref, `/(pages)/(user)/lottery-add?gameId=${gameId}`)
            }
            hitSlop={8}
          >
            <Ionicons name="add" size={22} color={colors.primary} />
          </Pressable>
        )}
      </View>
      <Text style={styles.title}>{t("title")}</Text>

      {!hasAnyContent ? (
        <EmptyState message={t("empty")} />
      ) : photos.length === 0 ? (
        <View style={styles.gridContent}>{optionsSections}</View>
      ) : (
        <FlatList
          key={numColumns}
          data={photos}
          numColumns={numColumns}
          keyExtractor={(item) => item.fileId}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={numColumns > 1 ? styles.gridRow : undefined}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            showSectionHeaders ? (
              <Text style={styles.sectionTitle}>{tOptions("typePhoto")}</Text>
            ) : null
          }
          ListFooterComponent={optionsSections || null}
          renderItem={({ item, index }) => (
            <Pressable style={styles.tile} onPress={() => setViewerIndex(index)}>
              <Image source={{ uri: fileUrl(item.fileId) }} style={styles.thumbnail} contentFit="cover" />
              {isAdmin && (
                <Pressable
                  style={styles.deleteBadge}
                  onPress={() => handleDelete(item.fileId)}
                  disabled={actions.isDeleting(item.fileId)}
                  hitSlop={8}
                >
                  {actions.isDeleting(item.fileId) ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="trash" size={14} color="#fff" />
                  )}
                </Pressable>
              )}
            </Pressable>
          )}
        />
      )}

      <Modal
        visible={viewerIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerIndex(null)}
      >
        <View style={styles.viewerBackdrop}>
          <Pressable style={styles.viewerClose} onPress={() => setViewerIndex(null)} hitSlop={12}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
          {viewerIndex !== null && (
            <FlatList
              style={styles.viewerList}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              data={photos}
              initialScrollIndex={viewerIndex}
              getItemLayout={(_, i) => ({ length: screenWidth, offset: screenWidth * i, index: i })}
              keyExtractor={(item) => item.fileId}
              renderItem={({ item }) => (
                <View style={[styles.viewerPage, { width: screenWidth, height: screenHeight }]}>
                  <Image
                    source={{ uri: fileUrl(item.fileId) }}
                    style={{ width: screenWidth, height: screenHeight * 0.8 }}
                    contentFit="contain"
                  />
                </View>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"], numColumns: number) {
  const tileWidth = numColumns === 2 ? "48%" : "31%";
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: inset.screen,
      paddingTop: inset.group,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    addBtn: {
      padding: 4,
    },
    title: {
      ...type.h1,
      color: colors.text,
      marginTop: inset.tight,
      marginBottom: inset.card,
    },
    sectionTitle: {
      ...type.h3,
      color: colors.text,
    },
    optionsSections: {
      gap: inset.list,
      marginTop: inset.card,
    },
    optionsSection: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: ui.cardRadius,
      padding: inset.card,
      gap: 6,
    },
    optionsSectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    optionsPending: {
      ...type.bodySmall,
      color: colors.textMuted,
    },
    optionsResultItem: {
      gap: 2,
    },
    optionsResultTitle: {
      ...type.body,
      fontFamily: type.button.fontFamily,
      color: colors.text,
    },
    optionsResultDescription: {
      ...type.bodySmall,
      color: colors.textSecondary,
    },
    gridContent: {
      paddingBottom: inset.screenBottom,
    },
    gridRow: {
      justifyContent: "space-between",
    },
    tile: {
      width: tileWidth,
      marginBottom: space[3],
    },
    thumbnail: {
      width: "100%",
      aspectRatio: 1,
      borderRadius: 10,
      backgroundColor: colors.surfaceHigh,
    },
    tileLabel: {
      ...type.caption,
      color: colors.textMuted,
      marginTop: 4,
      textAlign: "center",
    },
    deleteBadge: {
      position: "absolute",
      top: 6,
      right: 6,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: "rgba(0,0,0,0.55)",
      alignItems: "center",
      justifyContent: "center",
    },
    viewerBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.92)",
      justifyContent: "center",
    },
    viewerClose: {
      position: "absolute",
      top: 48,
      right: 20,
      zIndex: 1,
      padding: 8,
    },
    viewerList: {
      flex: 1,
    },
    viewerPage: {
      alignItems: "center",
      justifyContent: "center",
      gap: space[3],
    },
    viewerLabel: {
      ...type.bodySmall,
      color: "#ffffff",
    },
  });
}
