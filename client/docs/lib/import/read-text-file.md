# `lib/import/read-text-file.ts`

[← lib/import](README.md)

## Purpose

Reads a text file picked via `expo-document-picker`, tolerating encoding
quirks common in spreadsheet exports.

## Exports

### `readTextFile(uri: string): Promise<string>`

| Parameter | Type | Description |
|---|---|---|
| `uri` | `string` | File URI to read — a `blob:`/`http(s):` URL on web, a native file path/`content://` URI elsewhere (as returned by `expo-document-picker`) |

Reads the file at `uri` in full and returns its contents decoded to a
plain JS string, transparently handling the BOM-stripping, UTF-8 validity
check, Windows-1252 fallback, and mojibake-repair steps described below.
Returns a rejected promise if the underlying `fetch` (web) fails with a
non-OK HTTP status; native reads propagate whatever `expo-file-system`
throws.

## How it works

1. Reads the raw bytes (`fetch` + `arrayBuffer` on web, `expo-file-system`'s
   `File(uri).bytes()` on native).
2. Strips a UTF-8 BOM if present (`stripUtf8Bom`).
3. Tries decoding as UTF-8. If the result contains the replacement
   character (U+FFFD), the bytes aren't valid UTF-8 — most likely a legacy
   single-byte encoding — so it falls back to `decodeWindows1252`, which
   implements the WHATWG windows-1252 mapping for bytes `0x80`-`0x9F`
   (bytes `0x00`-`0x7F` are plain ASCII, `0xA0`-`0xFF` map 1:1 to the same
   Unicode code point as in Latin-1). Windows-1252 is the default encoding
   for German-locale Excel's "Save As CSV".
4. If the UTF-8 decode *did* succeed, runs `fixMojibake` to reverse a
   different, more subtle problem: UTF-8 text that was previously
   mis-decoded as Windows-1252/Latin-1 and saved that way — a common
   spreadsheet round-trip mistake where a real "ö" (UTF-8 bytes `0xC3 0xB6`)
   ends up stored as two separate mangled characters ("Â¶"-style).
   `MOJIBAKE_PATTERN` detects the fingerprint of this (`Â`/`Ã` followed by a
   UTF-8 continuation byte); the fix only applies if reversing it produces
   valid UTF-8, otherwise the text is left untouched.

## Used by

- [`lib/components/admin/ImportPlayers.tsx`](../components/admin/ImportPlayers.md)
- [`lib/components/admin/ImportTables.tsx`](../components/admin/ImportTables.md)
