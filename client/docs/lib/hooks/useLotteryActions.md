# `lib/hooks/useLotteryActions.ts`

[← lib/hooks](README.md)

## Purpose

Take/pick/upload/delete lottery photos against the Appwrite `lottery`
storage bucket.

## Exports

### `useLotteryActions()`

Returns `{ isAdmin, uploading, takePhoto(gameId), pickFromLibrary(gameId),
remove(fileId, confirmOpts?), isDeleting(fileId) }`.

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
