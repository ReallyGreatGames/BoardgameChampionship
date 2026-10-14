# `lib/utils/timerColors.ts`

[← lib/utils](README.md)

## Purpose

Player-color palettes for the timer display (active/dimmed/elapsed).

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `PLAYER_COLORS` | `const` array (4 entries) | Default color palettes for the 4 seats, each `{ active, muted, elapsed, elapsedMuted }` |
| `PLAYER_COLOR_OPTIONS` | `const` array (6 entries) | Selectable player-color hex strings offered as the fallback swatch palette; the 4 `PLAYER_COLORS` actives followed by 2 extra colors (purple `#9c27b0`, orange `#ff9800`) |
| `MIN_PLAYER_COLOR_COUNT` | `4` | Fewest colors a game may configure (one per timer seat) |
| `MAX_PLAYER_COLOR_COUNT` | `6` | Most colors a game may configure |
| `buildPlayerColor(hex)` | `(string) => { active, muted, elapsed, elapsedMuted }` | Derives a full color palette from a single hex color (for custom player colors) |

Shape returned by every palette entry / `buildPlayerColor`:

| Property | Type | Meaning |
|---|---|---|
| `active` | `string` (hex) | Color shown for this seat while its timer is running |
| `muted` | `string` (hex) | Dimmed color shown for this seat when it's not running and time hasn't elapsed |
| `elapsed` | `string` (hex) | Color shown for this seat once its time has run out while it's the running/current seat |
| `elapsedMuted` | `string` (hex) | Dimmed color shown for this seat once its time has run out and it isn't the running seat |

## How it works

`buildPlayerColor` first lifts very dark/near-black colors
(`liftNearBlack`, brightness threshold 64) so they remain visible on a dark
background, then derives `muted`/`elapsed`/`elapsedMuted` by progressively
darkening (`darkenHex`, factors 0.65/0.3/0.15) the (possibly lifted) base color.

## Used by

- [`lib/components/onboarding/PlayerColorSetupModal.tsx`](../components/onboarding/PlayerColorSetupModal.md)
- [`lib/components/schedule/TimerSettingsModal.tsx`](../components/schedule/TimerSettingsModal.md)
- [`lib/components/timer/TimerCell.tsx`](../components/timer/TimerCell.md)
- [`lib/hooks/useTimerState.ts`](../hooks/useTimerState.md)
