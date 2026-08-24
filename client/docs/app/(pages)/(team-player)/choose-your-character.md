# `app/(pages)/(team-player)/choose-your-character.tsx`

[← app](../../README.md)

## Route

`/choose-your-character` — team/player picker, and first-run setup wizard.

## Purpose

Two distinct flows share this one screen, distinguished by the `from`
query param:

1. **No `from` param** (first-run setup): shows the picker first
   ([`PlayerPickerForm`](../../../lib/components/onboarding/PlayerPickerForm.md)),
   then a small settings step (color scheme, language, account) with a
   "continue" button into the schedule.
2. **`from=settings` or `from=game`**: goes straight to the picker; on
   confirm, returns to settings (`router.back()`) or to the game screen
   with `gameId` re-attached, respectively.

## Exports

| Export | Signature | Purpose |
| --- | --- | --- |
| `ChooseYourCharacter` (default) | `(): JSX.Element` | Screen component for `/choose-your-character`. Renders either `PlayerPickerForm` (picker step) or a settings step (color scheme, language, account, continue), depending on `pickerVisible` and the `from` query param. Also sets `Drawer.Screen` options to suppress swipe/back navigation while active. |

### Types

| Type | Definition | Meaning |
| --- | --- | --- |
| `Language` | `"en" \| "de"` | Supported UI language codes, used to type `LANGUAGES` and the language `SelectPicker`'s value. |

### Module constants

| Constant | Type | Meaning |
| --- | --- | --- |
| `LANGUAGES` | `Language[]` | `["en", "de"]` — options offered in the language picker. |
| `SCHEMES` | `ColorScheme[]` | `["light", "dark", "oled", "highContrast"]` — options offered in the color-scheme picker. |

### `handleConfirm(selectedPlayer: Player): Promise<void>`

Calls `assignPlayer(selectedPlayer)` to persist the chosen player, then routes based on `from`: `"game"` with a `gameId` present replaces to `/(pages)/(user)/game?gameId=...`; `"settings"` calls `router.back()`; otherwise (setup flow) sets `pickerVisible` to `false` to advance to the settings step in-place.

## How it works

`canContinue` (setup flow's continue button) is gated on either the player
store not yet being initialized, having zero players at all (nothing to
pick, so don't block), or a player already being assigned — it does *not*
require re-confirming an already-set player.

`Drawer.Screen` options (`swipeEnabled: false, headerLeft: () => null`) are
set from *within* the screen component itself (both the picker and the
settings-step branches) to disable the drawer swipe gesture and hide the
default back arrow while on this screen — this is expo-router's pattern
for a screen overriding its own navigation options dynamically.

## Related

- [`lib/bootstrap/PlayerProvider.tsx`](../../../lib/bootstrap/PlayerProvider.md) — `assignPlayer`
- [`lib/components/onboarding/PlayerPickerForm.tsx`](../../../lib/components/onboarding/PlayerPickerForm.md)
- [`lib/components/ui/PlayerSelectionCard.tsx`](../../../lib/components/ui/PlayerSelectionCard.md) — the entry point that navigates here
