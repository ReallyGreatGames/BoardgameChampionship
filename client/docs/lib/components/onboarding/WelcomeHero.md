# `lib/components/onboarding/WelcomeHero.tsx`

[← lib/components/onboarding](README.md)

## Purpose

The dark-blue branded header band shown to logged-out users — on the
welcome screen and on the login screen. Menu button, tournament logo, the
tournament name as an eyebrow, and a large title ("Willkommen" by default).
The logged-in counterpart is
[`ParticipantHero`](../home/ParticipantHero.md), which shows the player's
name and team in the same slot.

## Exports

### `WelcomeHero({ onMenuPress, title, onTitlePress, children }: Props): JSX.Element`

| Prop | Type | Meaning |
|---|---|---|
| `onMenuPress` | `() => void` | Called by the [`MenuButton`](../shell/MenuButton.md) — typically dispatches `DrawerActions.openDrawer()`. |
| `title` | `string?` | Headline text. Defaults to `home:welcome`. |
| `onTitlePress` | `(() => void)?` | Optional press handler on the title. The `Pressable` is disabled when omitted, so the title is inert on the welcome screen and only the login screen's secret admin gesture uses it. |
| `children` | `ReactNode?` | Rendered under the title inside the text column — the login screen puts its animated "ADMIN MODE" badge here. |

## How it works

Same structure and theme handling as `ParticipantHero`: the band is
`colors.primary` in light themes and `colors.surface` in dark ones, with
`onAccent` / `text` foreground and `surfaceHigh` / `textSecondary` muted
text. Top padding is `insets.top + space[2]` so the band runs under the
status bar (both routes hide the navigator header, see
[`app/_layout.tsx`](../../../app/_layout.md)). The logo is looked up from
the same `LOGOS` map keyed by `useTournament().type`.

The title is 48px `BarlowCondensed_800ExtraBold` with `adjustsFontSizeToFit`
so a longer admin-mode title still fits on one line next to the logo.

## Used by

- [`WelcomeScreen`](WelcomeScreen.md)
- [`app/(pages)/login.tsx`](../../../app/(pages)/login.md)
