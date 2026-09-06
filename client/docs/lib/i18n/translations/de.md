# `lib/i18n/translations/de.ts`

[← lib/i18n](../README.md)

## Purpose

German translation strings, exported as a nested object (default export).
No logic — plain data.

## Structure (top-level namespaces)

Each top-level key is a namespace passed as `useTranslation(["namespace"])`
in a component. Values may contain i18next interpolations (e.g.
`"Beginnt um {{time}}"`) and, in a few nested objects (e.g.
`*.confirmDelete`), a conventional `{ title, message, confirm, cancel }`
shape used to drive a confirmation dialog.

| Namespace | Contents | Used by |
|---|---|---|
| `adminDashboard` | Tab labels for the admin dashboard (`results`, `rankings`, `statistics`, `schedule`, `tournamentSettings`, `import`) | Admin dashboard tab bar |
| `importTab` | The Import tab's three bulk-import wizards: `subTabs` (sub-tab bar labels), `shared` (strings common to all three: pick/cancel/retry/deletion-progress copy), `wipe` (progress-bar labels for [`wipe-service.ts`](../../import/wipe-service.md) group keys), `players`/`tables`/`rules` (per-wizard headings, confirm dialogs, column headers, and — for `rules` only — the delete-existing-first toggle/confirm copy) | [`ImportTab`](../../components/admin/ImportTab.md) and its three child wizards ([`ImportPlayers`](../../components/admin/ImportPlayers.md), [`ImportTables`](../../components/admin/ImportTables.md), [`ImportRules`](../../components/admin/ImportRules.md)) |
| `home` | Welcome text, the "up next" schedule summary (`now`, `upNext`, `goToGame`, `startsAt`, `noSchedule`, `eventNotActive`), and the participant start page: hero (`greeting`, `openMenu`), running match (`nowPlaying`, `live`, `overtime`, `tableAndRound`, `roundOnly`, `leftInRound`, `overRoundTime`, `openMatch`) and own results (`myResults`, `points`, `afterGames`, `playingNow`, `toCome`, `noResult`, `notPlayed`, `round`, `table`, `tableToBeAnnounced`, `placements.1`-`placements.4`) | Home screen |
| `login` | PIN/password entry text, event-inactive messaging | Login screen |
| `menu` | App title, one entry label per app screen (`entries.*`), plus `dmmib`/`europemasters` branding footer strings | Main navigation drawer/menu |
| `settings` | Appearance & color-scheme options, language picker, account (team/player) section, legal links | Settings screen |
| `game` | Action buttons (`lottery`, `rules`, `tableBell`, `timer`, `results`) with nested `confirmRing`/`confirmDismiss` dialogs, plus the player-color-setup sub-screen (`colorSetup.*`: corner labels, duplicate-player validation, fallback label) | Game overview screen, player color setup |
| `navigation` | Small shared strings (e.g. `back`) reused across headers | Various screen headers |
| `activeBells` | Admin "active bells" list: acknowledge/delete confirm dialogs, push-notification `notificationTitle`/`notificationBody(WithReason)` templates | Active bells admin screen; also read outside `useTranslation` for notification content |
| `rules` | Search box, rule `types`, add/edit `form` fields, delete confirmation | Rules screen |
| `timer` | Full-screen game timer: pause/timeout labels, bell ring/ack strings (`confirmRing`/`confirmDismiss`, duplicated from `game`), orientation & pause-mode toggles, `confirmReset`, `customTimerModal` fields | Timer screen |
| `results` | Score/note inputs, submit/save actions, `confirmSubmit`/`confirmOverwrite` dialogs, signature-requirement warnings and validation messages | Result entry screen |
| `scoreOverview` | Admin score-overview screen: table/input/overview view-mode labels, per-table status labels, `confirmReset`/`confirmSave`/`confirmResetOne` dialogs, table navigation | Admin score overview |
| `rankings` | Standings table column headers, completion-status text | Rankings screen |
| `statistics` | Long explanatory info texts (`infoSeatDetails`, `infoTeamPerformance`), per-seat/team table headers | Statistics screen |
| `tableOverview` | Admin table-overview screen: search/filter/sort controls (bell/submission/timer filters, sort options), filter sheet labels, acknowledge/dismiss confirmations | Admin table overview |
| `signature` | Signature-capture screen text | Signature screen |
| `lottery` | Photo-lottery screen: take/add/upload-photo actions, delete confirmation | Photo lottery screen |
| `lotteryOptions` | Options-lottery editor & puller: add/edit lottery form, option list fields, `rePullConfirm`/`deleteConfirm` dialogs, and an `errors` object keyed by validation error code (`no-options`, `invalid-pulls-per-table`, `missing-title`, `invalid-weight`, `invalid-max-per-table`, `insufficient-capacity`) interpolated with `{{title}}`/`{{pullsPerTable}}`/`{{capacity}}` | Options-lottery editor/puller screens |
| `components` | Strings for shared components, namespaced by component: `schedule` (list + add/edit form, used by both the admin dashboard and the home screen's schedule view), `timerSettingsModal` (create/edit default timer settings), `tournamentSettings` (admin tournament & feature-flag settings panel), `playerPicker` (team/player selection modal used at login and team-switch) | Multiple screens, via the corresponding shared component |
| `info` | A single `faq` array of `{ q: string; a: string }` pairs — the only namespace that isn't a flat string map | FAQ screen |
| `legal` | `imprint` and `privacy`, each `{ title, body }`; `body` is a long-form string with literal `\n` line breaks | Legal/imprint screen |

**Must stay structurally identical to [en.ts](en.md)** — i18next does not
automatically fall back to the other language for missing keys.

## Used by

- [`lib/i18n/i18n.ts`](../i18n.md) (as `resources.de`)
