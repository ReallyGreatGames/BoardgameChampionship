import { LOTTERY_BUCKET_ID, storage } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { BackButton } from "@/lib/components/ui/BackButton";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import { useLotteryActions } from "@/lib/hooks/useLotteryActions";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { useLotteryStore } from "@/lib/stores/appwrite/lottery-store";
import { inset, space } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";
import { ui } from "@/lib/theme/ui";
import { getLotteryPhotosForGame } from "@/lib/utils/lottery";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

function fileUrl(fileId: string): string {
  return storage.getFileViewURL(LOTTERY_BUCKET_ID, fileId).toString();
}

export default function LotteryScreen() {
  useRequireAuth();
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const { isAdmin } = useAuth();
  const { colors } = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isCompact = screenWidth < ui.breakpointTablet;
  const numColumns = isCompact ? 2 : 3;
  const styles = useMemo(() => makeStyles(colors, numColumns), [colors, numColumns]);
  const { t } = useTranslation(["lottery"]);

  const collection = useLotteryStore((s) => s.collection);
  const actions = useLotteryActions();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const photos = useMemo(
    () => getLotteryPhotosForGame(collection, gameId),
    [collection, gameId],
  );

  const handleDelete = async (fileId: string) => {
    await actions.remove(fileId, {
      title: t("confirmDelete.title"),
      message: t("confirmDelete.message"),
      confirmLabel: t("confirmDelete.confirm"),
      cancelLabel: t("confirmDelete.cancel"),
      destructive: true,
    });
  };

  return (
    <View style={styles.container}>
      <BackButton onPress={() => router.back()} />
      <Text style={styles.title}>{t("title")}</Text>

      {isAdmin && (
        <View style={styles.adminActions}>
          {/* Desktop browsers have no camera-capture affordance — launchCameraAsync
              falls back to the same file picker as the library, so showing both
              buttons there is just confusing. Native (iOS/Android) gets both. */}
          {Platform.OS === "web" ? (
            <Pressable
              style={styles.adminActionBtn}
              onPress={() => actions.pickFromLibrary(gameId)}
              disabled={actions.uploading}
            >
              <Ionicons name="images-outline" size={20} color={colors.onAccent} />
              <Text style={styles.adminActionText}>{t("addPhoto")}</Text>
            </Pressable>
          ) : (
            <>
              <Pressable
                style={styles.adminActionBtn}
                onPress={() => actions.takePhoto(gameId)}
                disabled={actions.uploading}
              >
                <Ionicons name="camera-outline" size={20} color={colors.onAccent} />
                <Text style={styles.adminActionText}>{t("takePhoto")}</Text>
              </Pressable>
              <Pressable
                style={[styles.adminActionBtn, styles.adminActionBtnSecondary]}
                onPress={() => actions.pickFromLibrary(gameId)}
                disabled={actions.uploading}
              >
                <Ionicons name="images-outline" size={20} color={colors.primary} />
                <Text style={[styles.adminActionText, { color: colors.primary }]}>
                  {t("chooseFromLibrary")}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      )}

      {actions.uploading && (
        <View style={styles.uploadingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.uploadingText}>{t("uploading")}</Text>
        </View>
      )}

      {photos.length === 0 ? (
        <EmptyState message={t("empty")} />
      ) : (
        <FlatList
          key={numColumns}
          data={photos}
          numColumns={numColumns}
          keyExtractor={(item) => item.fileId}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={numColumns > 1 ? styles.gridRow : undefined}
          showsVerticalScrollIndicator={false}
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
    title: {
      ...type.h1,
      color: colors.text,
      marginTop: inset.tight,
      marginBottom: inset.card,
    },
    adminActions: {
      flexDirection: "row",
      gap: inset.tight,
      marginBottom: inset.card,
    },
    adminActionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: colors.accent,
      borderRadius: ui.buttonRadius,
      paddingVertical: 12,
    },
    adminActionBtnSecondary: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    adminActionText: {
      ...type.button,
      color: colors.onAccent,
    },
    uploadingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: inset.card,
    },
    uploadingText: {
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
