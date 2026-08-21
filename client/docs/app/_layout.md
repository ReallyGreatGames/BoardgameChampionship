# `app/_layout.tsx`

[← app](README.md)

## Purpose

The app's root layout: loads fonts, initializes i18next, wraps everything
in the gesture-handler root view and [`BootstrapProvider`](../lib/bootstrap/BootstrapProvider.md),
and defines the drawer navigator with every route's title/visibility.

## Exports

| Export | Signature | Purpose |
| --- | --- | --- |
| `RootLayout` (default) | `(): JSX.Element \| null` | The app's root component. Loads custom fonts via `useFonts()`, returns `null` until they're ready, then hides the splash screen and renders `GestureHandlerRootView` → `BootstrapProvider` → `AppNavigator`. |

### Internal: `AppNavigator(): JSX.Element`

Renders the `Drawer` navigator with `AppDrawer` as its custom drawer content and one `<Drawer.Screen>` per route, each with a translated `title`/`drawerLabel` and, for deep-link-only screens, `drawerItemStyle: { display: "none" }` to hide them from the drawer menu. Builds `screenOptions` (header styling, drawer tint colors) via `useMemo` keyed on `colors`.

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

`screenOptions` is memoized (`useMemo`, deps `[colors]`) because it's passed as a single object to `<Drawer>` on every render; recomputing it only when the theme's colors change avoids handing the navigator a new options object (and triggering its internal re-render machinery) on every unrelated re-render of `AppNavigator`.

## Registers

Every route under [`app/(pages)/`](README.md) and [`app/index.tsx`](index.md).

## Related

- [`lib/bootstrap/BootstrapProvider.tsx`](../lib/bootstrap/BootstrapProvider.md)
- [`lib/i18n/i18n.ts`](../lib/i18n/i18n.md)
