import { File as FSFile, Paths } from "expo-file-system";
import { Platform } from "react-native";

/** Build a signature file that Expo's multipart encoder can read on every platform. */
export function createSignatureFile(
  svgContent: string,
  gameId: string | undefined,
  active: number,
) {
  const name = `signature_${gameId}_${active}.svg`;
  const type = "image/svg+xml";

  if (Platform.OS === "web") {
    return new globalThis.File([svgContent], name, { type });
  }

  const file = new FSFile(Paths.cache, `sig_${gameId}_${active}_${Date.now()}.svg`);
  file.write(svgContent);
  return {
    name,
    type,
    size: file.size,
    uri: file.uri,
    // Expo fetch rejects URI-only FormData parts; preserve access to the file bytes.
    bytes: () => file.bytes(),
  };
}
