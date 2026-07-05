import { File } from "expo-file-system";
import { Platform } from "react-native";

const UTF8_BOM = [0xef, 0xbb, 0xbf];

// WHATWG windows-1252 index for bytes 0x80-0x9F. Bytes 0x00-0x7F are plain
// ASCII and 0xA0-0xFF map 1:1 to the same Unicode code point (as in Latin-1).
const WINDOWS_1252_HIGH: number[] = [
  0x20ac, 0x0081, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6,
  0x2030, 0x0160, 0x2039, 0x0152, 0x008d, 0x017d, 0x008f, 0x0090, 0x2018,
  0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x02dc, 0x2122, 0x0161,
  0x203a, 0x0153, 0x009d, 0x017e, 0x0178,
];

function decodeWindows1252(bytes: Uint8Array): string {
  let out = "";
  for (const byte of bytes) {
    out += String.fromCharCode(
      byte >= 0x80 && byte <= 0x9f ? WINDOWS_1252_HIGH[byte - 0x80] : byte,
    );
  }
  return out;
}

function stripUtf8Bom(bytes: Uint8Array): Uint8Array {
  if (
    bytes.length >= 3 &&
    bytes[0] === UTF8_BOM[0] &&
    bytes[1] === UTF8_BOM[1] &&
    bytes[2] === UTF8_BOM[2]
  ) {
    return bytes.subarray(3);
  }
  return bytes;
}

// U+00C2/U+00C3 ("Â"/"Ã") followed by a UTF-8 continuation byte, read back as
// Latin-1 (U+0080-U+00BF), is the fingerprint of UTF-8 text that was
// mis-decoded as Windows-1252/Latin-1 and saved that way.
const MOJIBAKE_PATTERN = /[\u00C2\u00C3][\u0080-\u00BF]/;

/**
 * Reverses UTF-8 text that was previously mis-decoded as Windows-1252/Latin-1
 * and saved that way — a common spreadsheet round-trip mistake where a real
 * "o-umlaut" (UTF-8 bytes 0xC3 0xB6) ends up stored as two separate mangled
 * characters. Only applies the reversal when it produces valid UTF-8;
 * otherwise the text is left untouched.
 */
function fixMojibake(text: string): string {
  if (!MOJIBAKE_PATTERN.test(text)) {
    return text;
  }
  const codes = Array.from(text, (ch) => ch.charCodeAt(0));
  if (codes.some((c) => c > 0xff)) {
    return text;
  }
  const reversed = new TextDecoder("utf-8").decode(Uint8Array.from(codes));
  return reversed.includes(String.fromCharCode(0xfffd)) ? text : reversed;
}

async function readBytes(uri: string): Promise<Uint8Array> {
  if (Platform.OS === "web") {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return new Uint8Array(await response.arrayBuffer());
  }
  return await new File(uri).bytes();
}

/**
 * Reads a text file picked via expo-document-picker, tolerating encoding
 * quirks common in spreadsheet exports: a UTF-8 BOM, legacy Windows-1252
 * encoding (the default for German-locale Excel "Save As CSV"), and UTF-8
 * text that was already mangled through an earlier Latin-1 round-trip.
 */
export async function readTextFile(uri: string): Promise<string> {
  const bytes = stripUtf8Bom(await readBytes(uri));

  const utf8Text = new TextDecoder("utf-8").decode(bytes);
  if (utf8Text.includes(String.fromCharCode(0xfffd))) {
    // Not valid UTF-8 — most likely a legacy single-byte encoding.
    return decodeWindows1252(bytes);
  }
  return fixMojibake(utf8Text);
}
