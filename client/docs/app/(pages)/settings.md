# `app/(pages)/settings.tsx`

[← app](../README.md)

## Route

`/settings`.

## Purpose

Color scheme, language, account (change team/player), legal notice link,
and (dev builds only) a destructive local-data reset.

## How it works

`__DEV__ &&` gates the "Ultimate Debug Reset" section entirely out of
production builds — it clears the stored player, deletes the stored PIN
([`PIN_STORE_KEY`](../../lib/auth.md)), and logs out if a session exists,
behind a native `Alert.alert` confirmation (not the app's own
[`Dialog`](../../lib/components/ui/Dialog.md), unusually — this one predates
or intentionally bypasses that convention).

The account section (change team/player via
[`PlayerSelectionCard`](../../lib/components/ui/PlayerSelectionCard.md))
only shows when `user` is set.

## Related

- [`lib/bootstrap/ThemeProvider.tsx`](../../lib/bootstrap/ThemeProvider.md), [`lib/i18n/i18n.ts`](../../lib/i18n/i18n.md)
- [`lib/bootstrap/PlayerProvider.tsx`](../../lib/bootstrap/PlayerProvider.md)
