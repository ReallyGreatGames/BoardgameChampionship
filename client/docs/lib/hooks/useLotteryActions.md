# `lib/hooks/useLotteryActions.ts`

[← lib/hooks](README.md)

## Purpose

Take/pick/upload/delete lottery photos against the Appwrite `lottery`
storage bucket.

## Exports

### `useLotteryActions()`

Takes no parameters. Combines [`useAuth`](../auth.md) (`isAdmin`),
[`useDialog`](../components/ui/Dialog.md) (error alerts + optional confirm),
and two local loading flags (`uploading`, `deletingId`). Returns:

| Property | Signature | Meaning |
|---|---|---|
| `isAdmin` | `boolean` | Passthrough from `useAuth` — gates `remove`. |
| `uploading` | `boolean` | `true` while an `uploadAsset` call (triggered by `takePhoto`/`pickFromLibrary`) is in flight. |
| `takePhoto` | `(gameId: string) => Promise<void>` | Requests camera permission; if denied, resolves without doing anything. If granted, launches the native camera (`quality: 0.6`, no editing) and, unless the user cancels, uploads the captured photo via the internal `uploadAsset`. |
| `pickFromLibrary` | `(gameId: string) => Promise<void>` | Same as `takePhoto` but requests media-library permission and launches the image library picker instead of the camera. |
| `remove` | `(fileId: string, confirmOpts?: DialogOptions) => Promise<boolean>` | No-op returning `false` if the caller isn't admin. Otherwise optionally confirms, deletes the file from the `lottery` bucket, refreshes the store, and returns `true`; on any error shows an error dialog and returns `false`. Tracks `deletingId` for the duration. |
| `isDeleting` | `(fileId: string) => boolean` | `true` if `fileId` is the specific file currently being deleted. |

The internal (unexported) `uploadAsset(gameId: string, asset: ImagePicker.ImagePickerAsset): Promise<void>` helper drives both `takePhoto` and `pickFromLibrary`: it sets `uploading`, builds the filename, converts the asset, uploads it, refreshes the lottery store, and shows an error dialog on failure — see How it works below for the upload/permission/race-condition details.

## How it works

`takePhoto`/`pickFromLibrary` request the relevant `expo-image-picker`
permission, launch the camera/library picker, and on success hand the
result to `uploadAsset`.

`uploadAsset` builds the filename via
[`buildLotteryFileName`](../utils/lottery.md), converts the picked asset
into an uploadable `File`/blob (`toUploadableFile` — web builds an actual
`File` from a `fetch`+`blob()` round-trip; native passes the asset's `uri`
directly, since Appwrite's SDK accepts that shape there), and uploads it
with `Permission.read(Role.any())` — **not** scoped to logged-in users,
because native image loading (`expo-image` on iOS/Android) fetches the
file URL directly with no Appwrite session attached, so a `Role.users()`
restriction would break loading the photo back. Update/delete permissions
stay restricted to the `admin` label.

After a successful upload or delete, it explicitly calls
`useLotteryStore.getState().init()` to refetch the bucket listing. This is
needed because launching the camera/library picker backgrounds the app,
which triggers the app's own "app foregrounded" reconnect+refetch as soon
as the picker closes — that refetch can resolve *before* this upload
finishes, missing both the fresh list entry and the realtime `create`
event for it (there's no replay for events missed while the socket was
down). Refreshing here, strictly after the upload is confirmed, closes
that race.

`remove` is a no-op for non-admins (returns `false` immediately).

## Used by

- [`app/(pages)/(user)/lottery.tsx`](../../app/(pages)/(user)/lottery.md)

## Related

- [`lib/stores/appwrite/lottery-store.ts`](../stores/appwrite/lottery-store.md)
- [`lib/utils/lottery.ts`](../utils/lottery.md)
