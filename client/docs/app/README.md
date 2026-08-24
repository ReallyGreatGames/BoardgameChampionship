# `app`

[← docs](../README.md)

File-based routes ([Expo Router](https://docs.expo.dev/router/introduction/)).
Every file here is a thin screen — it wires together hooks/stores/components
from [`lib/`](../lib/README.md) and renders layout; almost no business logic
lives in this folder. Routes are registered by file path, not by import, so
none of these files import each other — `app/_layout.tsx`'s `<Drawer.Screen
name="...">` entries reference sibling routes by their path string instead.

## Files

| File | Route | Purpose |
|---|---|---|
| [_layout.md](_layout.md) | (root layout) | Fonts, i18n, gesture-handler root, the drawer navigator itself |
| [index.md](index.md) | `/` | Home screen — welcome (logged out) or active/upcoming schedule |

## `(pages)/`

| File | Route | Purpose |
|---|---|---|
| [(pages)/login.md]((pages)/login.md) | `/login` | PIN login (participants) / email+password login (admins, via a hidden gesture) |
| [(pages)/settings.md]((pages)/settings.md) | `/settings` | Color scheme, language, account, legal, debug reset |
| [(pages)/info.md]((pages)/info.md) | `/info` | FAQ accordion |
| [(pages)/legal.md]((pages)/legal.md) | `/legal` | Imprint & privacy |

### `(pages)/(admin)/`

| File | Route | Purpose |
|---|---|---|
| [(pages)/(admin)/active-bells.md]((pages)/(admin)/active-bells.md) | `/active-bells` | Admin-only list of all table bells |
| [(pages)/(admin)/admin/_layout.md]((pages)/(admin)/admin/_layout.md) | (layout) | Admin-only route guard for the dashboard |
| [(pages)/(admin)/admin/index.md]((pages)/(admin)/admin/index.md) | `/admin` | The admin dashboard — tab switcher |

### `(pages)/(team-player)/`

| File | Route | Purpose |
|---|---|---|
| [(pages)/(team-player)/choose-your-character.md]((pages)/(team-player)/choose-your-character.md) | `/choose-your-character` | Team/player picker; doubles as first-run setup |

### `(pages)/(user)/`

| File | Route | Purpose |
|---|---|---|
| [(pages)/(user)/game.md]((pages)/(user)/game.md) | `/game` | Per-game hub: table, lottery/rules/timer/results actions, table bell |
| [(pages)/(user)/lottery.md]((pages)/(user)/lottery.md) | `/lottery` | Sectioned lottery list: photo gallery + per-table options-lottery results |
| [(pages)/(user)/lottery-add.md]((pages)/(user)/lottery-add.md) | `/lottery-add` | Admin type picker: photos or options |
| [(pages)/(user)/lottery-options-edit.md]((pages)/(user)/lottery-options-edit.md) | `/lottery-options-edit` | Admin: create/edit/pull/delete an options lottery |
| [(pages)/(user)/lottery-results.md]((pages)/(user)/lottery-results.md) | `/lottery-results` | Admin: full-screen per-table results board for one options lottery |
| [(pages)/(user)/results.md]((pages)/(user)/results.md) | `/results` | Participant self-service result entry + signatures |
| [(pages)/(user)/rules.md]((pages)/(user)/rules.md) | `/rules` | Per-game rules screen wrapper |
| [(pages)/(user)/schedule.md]((pages)/(user)/schedule.md) | `/schedule` | Schedule screen wrapper |
| [(pages)/(user)/signature.md]((pages)/(user)/signature.md) | `/signature` | Draw-a-signature canvas |
| [(pages)/(user)/timer.md]((pages)/(user)/timer.md) | `/timer` | The interactive timer screen |
