import { ID } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { BackButton } from "@/lib/components/ui/BackButton";
import { useLotteryActions } from "@/lib/hooks/useLotteryActions";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { inset } from "@/lib/theme/spacing";
import { type } from "@/lib/theme/typography";
import { ui } from "@/lib/theme/ui";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";

type LotteryType = "photo" | "options";

export default function LotteryAddScreen() {
  useRequireAuth();
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const { isAdmin } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation(["lotteryOptions"]);
  const { t: tLottery } = useTranslation(["lottery"]);
  const photoActions = useLotteryActions();
  const [selectedType, setSelectedType] = useState<LotteryType | null>(null);

  const backToLottery = () => router.replace(`/(pages)/(user)/lottery?gameId=${gameId}`);

  const handleBack = () => {
    if (selectedType) {
      setSelectedType(null);
      return;
    }
    backToLottery();
  };

  if (!isAdmin) {
    backToLottery();
    return null;
  }

  async function handleTakePhoto() {
    await photoActions.takePhoto(gameId);
    backToLottery();
  }

  async function handlePickFromLibrary() {
    await photoActions.pickFromLibrary(gameId);
    backToLottery();
  }

  return (
    <View style={styles.container}>
      <BackButton onPress={handleBack} />
      <Text style={styles.title}>{t("addTitle")}</Text>

      {selectedType === null && (
        <View style={styles.tiles}>
          <Pressable style={styles.tile} onPress={() => setSelectedType("photo")}>
            <Ionicons name="images-outline" size={28} color={colors.primary} />
            <Text style={styles.tileTitle}>{t("typePhoto")}</Text>
            <Text style={styles.tileDescription}>{t("typePhotoDescription")}</Text>
          </Pressable>
          <Pressable
            style={styles.tile}
            onPress={() =>
              router.push(
                `/(pages)/(user)/lottery-options-edit?gameId=${gameId}&draft=${ID.unique()}`,
              )
            }
          >
            <Ionicons name="list-outline" size={28} color={colors.primary} />
            <Text style={styles.tileTitle}>{t("typeOptions")}</Text>
            <Text style={styles.tileDescription}>{t("typeOptionsDescription")}</Text>
          </Pressable>
        </View>
      )}

      {selectedType === "photo" && (
        <View style={styles.adminActions}>
          {Platform.OS === "web" ? (
            <Pressable
              style={styles.actionBtn}
              onPress={handlePickFromLibrary}
              disabled={photoActions.uploading}
            >
              {photoActions.uploading ? (
                <ActivityIndicator size="small" color={colors.onAccent} />
              ) : (
                <Ionicons name="images-outline" size={20} color={colors.onAccent} />
              )}
              <Text style={styles.actionText}>{tLottery("chooseFromLibrary")}</Text>
            </Pressable>
          ) : (
            <>
              <Pressable
                style={styles.actionBtn}
                onPress={handleTakePhoto}
                disabled={photoActions.uploading}
              >
                {photoActions.uploading ? (
                  <ActivityIndicator size="small" color={colors.onAccent} />
                ) : (
                  <Ionicons name="camera-outline" size={20} color={colors.onAccent} />
                )}
                <Text style={styles.actionText}>{tLottery("takePhoto")}</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, styles.actionBtnSecondary]}
                onPress={handlePickFromLibrary}
                disabled={photoActions.uploading}
              >
                <Ionicons name="images-outline" size={20} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.primary }]}>
                  {tLottery("chooseFromLibrary")}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      )}
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
    },
    title: {
      ...type.h1,
      color: colors.text,
      marginTop: inset.tight,
      marginBottom: inset.card,
    },
    tiles: {
      gap: inset.tight,
    },
    tile: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: ui.cardRadius,
      padding: inset.card,
      gap: 4,
    },
    tileTitle: {
      ...type.h3,
      color: colors.text,
    },
    tileDescription: {
      ...type.bodySmall,
      color: colors.textSecondary,
    },
    adminActions: {
      flexDirection: "row",
      gap: inset.tight,
    },
    actionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: colors.accent,
      borderRadius: ui.buttonRadius,
      paddingVertical: 12,
    },
    actionBtnSecondary: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionText: {
      ...type.button,
      color: colors.onAccent,
    },
  });
}
