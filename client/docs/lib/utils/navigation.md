# `lib/utils/navigation.ts`

[← lib/utils](README.md)

## Purpose

The back-navigation primitives for the app. Every in-app back button goes
through these — they keep an explicit list of where the user came from,
because the navigator this app uses cannot answer that question itself.

## Exports

| Export | Signature | Purpose |
|---|---|---|
| `goTo` | `(origin: string, href: string): void` | Records `origin` (the href of the screen doing the navigating, params included) on the back history, then pushes `href`. No return value. |
| `goBackTo` | `(fallback: string): void` | Pops the most recent origin and replaces the route with it; uses `fallback` when the history is empty. No return value. |
| `redirectTo` | `(href: string): void` | Plain `router.replace`, leaving the back history untouched. For render-phase bounces (a non-admin landing on an admin screen), which are redirects rather than backs. No return value. |
| `resetBackHistory` | `(): void` | Clears the recorded origins. Called when the user jumps somewhere from the drawer menu, which starts a new path rather than continuing one. No return value. |

## How it works

### Why the navigator can't do this itself

The app is a single **Drawer** navigator — see
[`app/_layout.tsx`](../../app/_layout.md); there is no `Stack` anywhere.
`DrawerRouter` delegates to `TabRouter`, whose default `backBehavior` is
`'firstRoute'`, so `router.back()` jumps to the *first registered route*
(home) regardless of where the user came from. `canGoBack()` returns `true`
in that situation too, so it can't even be used to detect it. Popping a
stack is simply not available here.

### Why not put the origin in the URL

The obvious alternative is a `from=<url-encoded origin>` query param that
each screen forwards to the next. It was tried and it does not hold up:
each level has to url-encode the level above it, so a three-deep flow ends
up with a doubly-encoded URL inside a URL, and getting back out depends on
`getStateFromPath` round-tripping that correctly *and* on the drawer's
`JUMP_TO` reapplying params to an already-mounted screen. Deep flows
(home → game → lottery → add lottery) broke on the way back.

A module-level array sidesteps all of it. Nothing is encoded, nothing has to
survive a URL round-trip, and the screen being returned to gets its params
from the plain href that was recorded.

### The contract

A screen passes **its own href, with its own params** as `origin` when it
opens another screen:

```ts
const selfHref = `/(pages)/(user)/lottery?gameId=${gameId}`;
goTo(selfHref, `/(pages)/(user)/lottery-add?gameId=${gameId}`);
```

and its back button pops:

```ts
goBackTo(from ?? `/game?gameId=${gameId}`);
```

so `home → game → lottery → add lottery` unwinds one step per press, each
screen arriving with the params it had.

### The `from` param is now only a fallback

`from` still exists on some routes and is still honored, but only when the
history is empty — a deep link, a notification, a drawer jump, or a reload
in the middle of a flow. Each screen also keeps a hardcoded final fallback
(usually its parent hub or the schedule), so a back button is never dead.

### Known limits

- The history lives in module state, so a reload drops it and back falls
  through to `from`/the hardcoded default.
- Navigation that doesn't go through `goTo` doesn't record anything.
  Drawer-menu jumps call `resetBackHistory` so the stale trail can't send a
  later back press somewhere unrelated; a screen reached by a plain
  `router.replace` (for example `choose-your-character` → game) records
  nothing and falls back.

## Used by

- [`app/(pages)/(user)/game.tsx`](../../app/(pages)/(user)/game.md) — the hub; passes `selfHref` to rules, lottery, results and timer
- [`app/(pages)/(user)/rules.tsx`](../../app/(pages)/(user)/rules.md)
- [`app/(pages)/(user)/lottery.tsx`](../../app/(pages)/(user)/lottery.md)
- [`app/(pages)/(user)/lottery-add.tsx`](../../app/(pages)/(user)/lottery-add.md)
- [`app/(pages)/(user)/lottery-options-edit.tsx`](../../app/(pages)/(user)/lottery-options-edit.md)
- [`app/(pages)/(user)/lottery-results.tsx`](../../app/(pages)/(user)/lottery-results.md)
- [`app/(pages)/(user)/results.tsx`](../../app/(pages)/(user)/results.md)
- [`app/(pages)/(user)/signature.tsx`](../../app/(pages)/(user)/signature.md)
- [`app/(pages)/(user)/timer.tsx`](../../app/(pages)/(user)/timer.md)
- [`lib/components/schedule/ActiveScheduleCard.tsx`](../components/schedule/ActiveScheduleCard.md) — records home as the origin
- [`lib/components/schedule/Schedule.tsx`](../components/schedule/Schedule.md) — records the schedule as the origin
- [`lib/components/shell/AppDrawer.tsx`](../components/shell/AppDrawer.md) — resets the history on a drawer jump

## Related

- [`lib/components/ui/BackButton.tsx`](../components/ui/BackButton.md) — the shared button these screens wire to `goBackTo`
