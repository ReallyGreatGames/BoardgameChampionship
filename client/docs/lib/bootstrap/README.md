# `lib/bootstrap`

[← lib](../README.md)

App-wide React context providers, all wired together by
[`BootstrapProvider`](BootstrapProvider.md) and mounted once near the app root
(see [`app/_layout.tsx`](../../app/_layout.md)).

## Files

| File | Purpose |
|---|---|
| [BootstrapProvider.md](BootstrapProvider.md) | Composes every provider below into one tree, in the correct nesting order |
| [PlayerProvider.md](PlayerProvider.md) | Which player this device is currently signed in as |
| [RealTimeStoreProvider.md](RealTimeStoreProvider.md) | Initializes every Appwrite store + realtime subscription, tiered by auth level |
| [ScreenOrientationProvider.md](ScreenOrientationProvider.md) | Screen-orientation lock, overridable per screen |
| [ThemeProvider.md](ThemeProvider.md) | Active color scheme (light/dark/oled/high-contrast) |
| [TournamentProvider.md](TournamentProvider.md) | Derived "is there an active tournament, and its locale/type" info |
