import { File as FSFile } from "expo-file-system";
import type { ImagePickerAsset } from "expo-image-picker";
import { Platform } from "react-native";
import type { Client, Models } from "react-native-appwrite";

const CHUNK_SIZE = 5 * 1024 * 1024;

/** Keep every multipart chunk readable by Expo; the SDK rebuilds URI-only parts. */
export async function uploadLotteryPhoto(
  client: Client,
  bucketId: string,
  fileId: string,
  asset: ImagePickerAsset,
  name: string,
  permissions: string[],
): Promise<Models.File> {
  const type = asset.mimeType ?? "image/jpeg";
  const webBlob = Platform.OS === "web"
    ? await (await fetch(asset.uri)).blob()
    : null;
  const nativeFile = webBlob ? null : new FSFile(asset.uri);
  const size = webBlob ? webBlob.size : nativeFile!.size;
  const handle = nativeFile?.open();
  const url = new URL(`${client.config.endpoint}/storage/buckets/${encodeURIComponent(bucketId)}/files`);
  let uploaded: Models.File | undefined;

  try {
    for (let start = 0; start < size || start === 0; start += CHUNK_SIZE) {
      const end = Math.min(start + CHUNK_SIZE, size);
      const bytes = handle?.readBytes(end - start);
      const file = webBlob
        ? new globalThis.File([webBlob.slice(start, end)], name, { type })
        : { name, type, bytes: async () => bytes! };
      const headers: Record<string, string> = { "content-type": "multipart/form-data" };
      if (size > CHUNK_SIZE) {
        headers["content-range"] = `bytes ${start}-${end - 1}/${size}`;
        if (uploaded) {headers["x-appwrite-id"] = uploaded.$id;}
      }
      // Client.call preserves session credentials, project headers, and Appwrite errors.
      uploaded = await client.call("post", url, headers, { fileId, file, permissions });
    }
    return uploaded!;
  } finally {
    handle?.close();
  }
}
