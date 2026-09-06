# BoardgameChampionship — Code Documentation

This is the code documentation for the `client` app, mirroring the folder
structure of [`app/`](app/README.md) and [`lib/`](lib/README.md). One
markdown file per source file (`Foo.tsx` → `Foo.md`, right next to where
`Foo.tsx` lives under `docs/`), plus a `README.md` per folder indexing its
contents.

## What this app is

An [Expo](https://expo.dev) / React Native app (web + iOS + Android) for
running a board-game tournament: schedule, per-table seating, a
synchronized chess-clock-style timer, result entry with signatures,
statistics/rankings, and an admin dashboard — all backed by
[Appwrite](https://appwrite.io) (database + realtime + storage + auth).

## How to navigate

- **[`app/`](app/README.md)** — the screens (Expo Router file-based
  routes). Thin; almost all logic lives in `lib/`.
- **[`lib/`](lib/README.md)** — everything else: data models, Appwrite
  stores, hooks, components, utilities. Start here for anything
  behavior-related.

Each file's doc follows the same shape: **Purpose** (what it's for),
**Exports** (types/functions/props — the public surface), **How it
works** (only for non-trivial logic — the reasoning behind non-obvious
decisions), **Used by** (which other files depend on this one, so you can
trace impact before changing something), and **Related** (siblings worth
knowing about).

## Where to start for common tasks

| If you're working on... | Start at |
|---|---|
| The participant start page (home) | [`app/index.tsx`](app/index.md), then [`lib/components/home/`](lib/components/home/README.md) and [`useParticipantOverview`](lib/hooks/useParticipantOverview.md) |
| The interactive timer | [`useTimerState`](lib/hooks/useTimerState.md), then [`app/(pages)/(user)/timer.tsx`](app/(pages)/(user)/timer.md) |
| Realtime data sync | [`lib/stores/real-time-store.ts`](lib/stores/real-time-store.md) |
| Result entry / signatures | [`lib/components/results/`](lib/components/results/README.md) |
| The admin dashboard | [`app/(pages)/(admin)/admin/index.tsx`](app/(pages)/(admin)/admin/index.md) |
| Bulk data import | [`lib/import/`](lib/import/README.md) |
| Theming / design tokens | [`lib/theme/`](lib/theme/README.md), [`lib/bootstrap/ThemeProvider.tsx`](lib/bootstrap/ThemeProvider.md) |
| Auth (PIN / admin login) | [`lib/auth.tsx`](lib/auth.md) |

## Keeping this in sync

See the `docs-first` skill (`.claude/skills/docs-first/`) — when code here
changes, its matching `docs/` file should be updated in the same change.
