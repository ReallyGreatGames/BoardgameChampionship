import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Platform } from "react-native";
import { Permission, Role } from "react-native-appwrite";
import { useAuth } from "../auth";
import { ID, LOTTERY_BUCKET_ID, storage } from "../appwrite";
import { DialogOptions, useDialog } from "@/lib/components/ui/Dialog";
import { useLotteryStore } from "../stores/appwrite/lottery-store";
import { buildLotteryFileName } from "../utils/lottery";

const IMAGE_QUALITY = 0.6;

function extensionFor(mimeType: string | null | undefined): string {
  if (mimeType === "image/png") {
    return "png";
  }
  return "jpg";
}

async function toUploadableFile(
  asset: ImagePicker.ImagePickerAsset,
  name: string,
): Promise<any> {
  const type = asset.mimeType ?? "image/jpeg";

  if (Platform.OS === "web") {
    const response = await fetch(asset.uri);
    const blob = await response.blob();
    return new globalThis.File([blob], name, { type });
  }

  return {
    name,
    type,
    size: asset.fileSize ?? 0,
    uri: asset.uri,
  };
}

export function useLotteryActions() {
  const { isAdmin } = useAuth();
  const { confirm } = useDialog();
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function uploadAsset(gameId: string, asset: ImagePicker.ImagePickerAsset) {
    setUploading(true);
    try {
      const name = buildLotteryFileName(gameId, extensionFor(asset.mimeType));
      const file = await toUploadableFile(asset, name);
      await storage.createFile({
        bucketId: LOTTERY_BUCKET_ID,
        fileId: ID.unique(),
        file,
        permissions: [
          // Native image loading (expo-image on iOS/Android) fetches the file
          // URL directly, with no Appwrite session attached — Role.users()
          // would reject that request, so read must be open to everyone.
          Permission.read(Role.any()),
          Permission.update(Role.label("admin")),
          Permission.delete(Role.label("admin")),
        ],
      });
      // The camera/library picker backgrounds the app, which triggers its own
      // "app foregrounded" reconnect+refetch as soon as the picker closes —
      // that refetch can resolve before this upload finishes, missing both
      // the fresh list entry and the realtime `create` event for it (no
      // replay for events missed while the socket was down). Refresh here,
      // strictly after the upload is confirmed, to close that race.
      await useLotteryStore.getState().init();
    } catch (e: any) {
      await confirm({
        title: "Upload failed",
        message: e?.message ?? "Unknown error",
        cancelLabel: null,
      });
    } finally {
      setUploading(false);
    }
  }

  async function takePhoto(gameId: string) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: IMAGE_QUALITY,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets?.[0]) {
      return;
    }
    await uploadAsset(gameId, result.assets[0]);
  }

  async function pickFromLibrary(gameId: string) {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: IMAGE_QUALITY,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets?.[0]) {
      return;
    }
    await uploadAsset(gameId, result.assets[0]);
  }

  async function remove(fileId: string, confirmOpts?: DialogOptions): Promise<boolean> {
    if (!isAdmin) {
      return false;
    }
    if (confirmOpts) {
      const ok = await confirm(confirmOpts);
      if (!ok) {
        return false;
      }
    }
    setDeletingId(fileId);
    try {
      await storage.deleteFile({ bucketId: LOTTERY_BUCKET_ID, fileId });
      await useLotteryStore.getState().init();
      return true;
    } catch (e: any) {
      await confirm({
        title: "Delete failed",
        message: e?.message ?? "Unknown error",
        cancelLabel: null,
      });
      return false;
    } finally {
      setDeletingId(null);
    }
  }

  return {
    isAdmin,
    uploading,
    takePhoto,
    pickFromLibrary,
    remove,
    isDeleting: (fileId: string) => deletingId === fileId,
  };
}
