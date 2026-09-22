# `lib/utils/upload-lottery-photo.ts`

[← lib/utils](README.md)

## Purpose

Uploads a lottery photo to Appwrite Storage in fixed-size chunks over
`Client.call` directly, instead of going through the Appwrite SDK's own
`Storage.createFile`. The SDK's `createFile` expects either a real `File`/
`Blob` or an object shape it recognizes internally; it doesn't accept the
plain `{ name, type, size, uri }` object native platforms need to hand it
(no `File`/`Blob` constructor takes a bare content URI), and separately
mishandles files over 5MB on web. Both cases are exercised and asserted
against by `scripts/test-lottery-upload.cjs` against the real Appwrite SDK
and Expo's own multipart/`FormData` encoding.

## Exports

### `uploadLotteryPhoto(client: Client, bucketId: string, fileId: string, asset: ImagePickerAsset, name: string, permissions: string[]): Promise<Models.File>`

| Param | Type | Meaning |
|---|---|---|
| `client` | `Client` (react-native-appwrite) | The configured Appwrite client; used for its `config.endpoint` and to call `client.call(...)` directly. |
| `bucketId` | `string` | Target storage bucket id. |
| `fileId` | `string` | Id to create the file under (typically `ID.unique()`). |
| `asset` | `ImagePickerAsset` (expo-image-picker) | The picked/captured photo; only `.uri` and `.mimeType` are read. |
| `name` | `string` | Filename to store the upload under (from [`buildLotteryFileName`](lottery.md)). |
| `permissions` | `string[]` | Appwrite permission strings (e.g. `Permission.read(Role.any())`) applied to the created file. |

Reads the asset's bytes in `CHUNK_SIZE` (5MB) pieces and `POST`s each as its
own `multipart/form-data` request straight to
`${endpoint}/storage/buckets/${bucketId}/files`, resolving with the final
`Models.File` once the last chunk lands.

## How it works

On web, the whole asset is fetched once up front into a `Blob`
(`fetch(asset.uri)`), and each chunk is `blob.slice(start, end)` wrapped in
a `File`. On native, `expo-file-system`'s `File` is opened once
(`nativeFile.open()`) and each chunk is read via `handle.readBytes(...)`,
wrapped as `{ name, type, bytes: async () => bytes }` — the shape
`react-native-appwrite`'s own multipart encoder expects for a native, non-`Blob`
part; the `finally` block always closes the native handle, even if a chunk
request throws.

For a single-chunk upload (`size <= CHUNK_SIZE`), no `content-range`/
`x-appwrite-id` headers are sent — Appwrite treats a request with no
`content-range` as a complete, one-shot upload. For a multi-chunk upload,
every request after the first carries `x-appwrite-id` set to the previous
chunk's returned file id, which is how Appwrite's chunked-upload protocol
threads consecutive chunks together into one file. Requests are sent
strictly in order (`for` loop with `await` per iteration, not
`Promise.all`) since each chunk after the first depends on the previous
one's response id.

`client.call(...)` (not raw `fetch`) is used for each request specifically
because it's the same method the Appwrite SDK's own `createFile` uses
internally — it attaches session credentials, project headers, and
Appwrite's own error parsing, none of which this function has to
reimplement.

## Used by

- [`lib/hooks/useLotteryActions.ts`](../hooks/useLotteryActions.md) — the only caller, via `uploadAsset`

## Related

- [`lib/utils/lottery.ts`](lottery.md) — `buildLotteryFileName`
- `scripts/test-lottery-upload.cjs` — exercises this against the real Appwrite SDK and Expo's multipart encoding across android/ios/web and single/multi-chunk sizes
