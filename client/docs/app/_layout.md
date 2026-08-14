# `app/_layout.tsx`

[← app](README.md)

## Purpose

The app's root layout: loads fonts, initializes i18next, wraps everything
in the gesture-handler root view and [`BootstrapProvider`](../lib/bootstrap/BootstrapProvider.md),
and defines the drawer navigator with every route's title/visibility.

## How it works

### Startup gate

`SplashScreen.preventAutoHideAsync()` is called at module scope (before the
component even renders) so the splash screen stays up while fonts load via
`useFonts()`. `RootLayout` returns `null` until `fontsLoaded`, then hides
the splash screen — the drawer navigator (and everything under it) never
mounts before the app's custom fonts are ready, avoiding a flash of
fallback-font text.

### `GestureHandlerRootView`

Wraps the entire app (not just the timer screen) because
`react-native-gesture-handler` requires its root view to wrap everything
that uses its gestures — used directly by
[`TimerCell`](../lib/components/timer/TimerCell.md) to get real
independent multi-touch instead of React Native's legacy single-responder
`Touchable`/`Pressable` system.

### Drawer screens

`AppNavigator` declares every route as a `<Drawer.Screen>`, with
per-screen `title`/`drawerLabel` (translated via `useTranslation`) and
visibility (`drawerItemStyle: { display: "none" }` for screens reached by
deep-linking rather than the drawer menu itself, e.g. timer/results/
signature/lottery/legal). The drawer's own content is rendered by
[`AppDrawer`](../lib/components/shell/AppDrawer.md).

## Registers

Every route under [`app/(pages)/`](README.md) and [`app/index.tsx`](index.md).

## Related

- [`lib/bootstrap/BootstrapProvider.tsx`](../lib/bootstrap/BootstrapProvider.md)
- [`lib/i18n/i18n.ts`](../lib/i18n/i18n.md)
