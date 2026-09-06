# design-sync notes — Boardgame Championship client

- **Repo shape**: Expo React Native app, not a library — no dist. Shape is
  `package` with `cfg.entry` pointing at `.design-sync/entry.ts` (committed
  re-export surface of `lib/components/ui` + ThemeProvider + theme tokens).
  The only Storybook is `@storybook/react-native` (`.rnstorybook/`, on-device,
  renders inside the Expo app) — not driveable by the web harness, so the
  storybook shape does not apply.
- **Types**: no library build → `.design-sync/gen-types.mjs` (`cfg.buildCmd`)
  emits a `.d.ts` tree into gitignored `types/` via tsc, rewrites `@/…` alias
  specifiers to relative, and writes `types/index.d.ts`. `package.json` got a
  `"types": "types/index.d.ts"` field (inert for the Expo app) so the
  converter's checker finds the tree. Keep `types/` gitignored; regenerate
  before every converter run.
- **react-native → react-native-web**: `cfg.tsconfig` points at
  `.design-sync/tsconfig.sync.json` whose `paths` alias `react-native` to
  `react-native-web/dist/index.js` — the converter's paths plugin applies to
  all importers. The repo's `jsx: "react-native"` tsconfig makes esbuild emit
  classic `React.createElement` calls, which bind to the vendored
  `window.React` at runtime (verified — no tsconfig change needed).
- **Shims** (`.design-sync/shims/`, wired via the same `paths`):
  - `@expo/vector-icons` → renders glyphs from the package's own Ionicons
    glyphmap + real `Ionicons.ttf` (shipped via `.design-sync/fonts.css`);
    the real package imports `.ttf` through Metro's asset system, which
    esbuild can't load.
  - `expo-screen-orientation`, `expo-secure-store` → no-op stubs (native-only
    codepaths; the components' web paths never call them).
- **Fonts**: DM Sans + Barlow Condensed family names in
  `lib/theme/typography.ts` are the literal RN fontFamily strings
  (`DMSans_400Regular` …); `.design-sync/fonts.css` maps each to its TTF in
  `@expo-google-fonts/*`. Ionicons family name is lowercase `ionicons`.
- **Excluded components**: `PlayerSelectionCard` (imports Appwrite auth,
  PlayerProvider, schedule store, i18n, expo-router — an app component, not a
  DS primitive; bundling it would drag the whole data layer in).
  `ThemeProvider` is exported in the bundle (it's `cfg.provider`) but null'd
  in `componentSrcMap` so it doesn't get a component card.
- `Dialog.tsx` exports `DialogProvider`/`useDialog` — the card is
  `DialogProvider`; the dialog itself only renders after `confirm()` is
  called (preview must trigger it via an effect).
- **Layout primitives are part of the synced surface**: `entry.ts` re-exports
  `View`/`Text`/`ScrollView`/`Pressable`/`TextInput`/`Image`/`StyleSheet`/
  `ActivityIndicator` from react-native(-web), nulled in `componentSrcMap` so
  they get no cards. Reason: an RN component library is unusable without them,
  and it keeps each compiled preview ~5 KB instead of re-bundling
  react-native-web per preview.
- **i18n**: `entry.ts` side-effect-imports `lib/i18n/i18n.ts` so components
  calling `t()` render real copy (`BackButton` was showing the raw key `back`).
  Needs the `expo-localization` shim; language resolves from the browser locale
  (en in the harness), matching the English preview copy.

## Re-sync risks — what to watch next time

- **`types/` is generated, gitignored, and required.** Always run
  `node .design-sync/gen-types.mjs` (that IS `cfg.buildCmd`) before the
  converter; it also emits the two esbuild pre-bundles under
  `.design-sync/.cache/` that `tsconfig.sync.json` aliases point at
  (`markdown-display.mjs`, `rnsvg-web.mjs`). A fresh clone has neither — the
  build fails with unresolved imports until it runs.
- **`entry.ts` and `gen-types.mjs`'s inlined `types/index.d.ts` are two
  hand-maintained copies of the same export list.** Adding or removing a
  component means editing BOTH, or the component silently won't sync.
- **The shims are pinned to upstream internals** and can break on upgrade:
  `rnw-stylesheet-id.ts` imports
  `react-native-web/dist/exports/StyleSheet/dom` (deep path, and depends on
  `createSheet`'s `sheets.length === 0` first-wins behaviour);
  `vector-icons.tsx` reads `@expo/vector-icons`' vendored Ionicons glyphmap
  JSON by path; `fit-image.tsx` replaces a CJS transitive dep of
  react-native-markdown-display. Re-check these after bumping expo, RN,
  react-native-web, or react-native-markdown-display.
- **Why `rnw-stylesheet-id.ts` exists**: RN-web injects
  `<style id="react-native-stylesheet">` as `<head>`'s first child and fills
  it via CSSOM, so its `innerHTML` is empty. `package-validate.mjs` locates
  mount roots with `#root, [id^="r"]`, matched that style element first (head
  precedes body) and reported `[RENDER] root empty` for EVERY card. It only
  surfaced once previews were authored: floor-card pages have a
  `<template id="ds-fallback">` body child that satisfied the validator's
  `portals` escape hatch, which masked the collision. If a future converter
  version changes that selector, this shim becomes unnecessary — but it is
  harmless to keep.
- **i18n language is forced to English** (`entry.ts` calls
  `i18n.changeLanguage("en")`, and the `expo-localization` shim reports a
  fixed `en-US`). This is deliberate determinism: reading the real navigator
  locale made `BackButton` render "Zurück" or "Back" depending on the machine
  and raced the screenshot, which churns render hashes. If the DS should ever
  ship German cards, change both places together and re-grade BackButton.
- **Only partially verified**: interaction states are unreachable statically
  (see the list above) — the open dropdowns of `Combobox`/`SelectPicker` and
  `ResizableTextInput`'s drag-resize have never been visually verified.
- **Build assumptions**: node 22, `npm ci` from `package-lock.json`,
  playwright **1.61.0** (pinned to the cached chromium build 1228; the repo
  itself has no playwright dependency), converter deps installed in
  `.ds-sync/`.
- `PlayerSelectionCard` stays excluded by choice, not by failure — it needs
  Appwrite auth, PlayerProvider, the schedule store and expo-router. Syncing
  it would mean shimming the whole data layer.
- Three components (`Badge`, `Button`, `DataTable`) had no `docs/` entry when
  this sync ran, so their `.prompt.md` is synthesized from the `.d.ts` plus
  the authored preview rather than from a real doc. Writing those docs would
  improve what the design agent reads.

## Preview authoring findings (waves A–C)

- Previews import EVERYTHING from the package specifier
  `"boardgame-championship"` — components, primitives and tokens alike. Never
  `from "react-native"` and never a relative import.
- `useTheme()` works inside preview cells and is the right way to theme the
  surrounding chrome. Careful: the bare `colors` export is the **dark** palette
  while the default rendered theme is **light** — use `useTheme().colors`.
- Import typography as `import { type as typography }` — a bare
  `import { type }` reads like TS's type-only import modifier.
- Sheet cells sort **alphabetically by export name**, not in file order, so the
  canonical cell is not necessarily first.
- Overlays (`BottomSheet`, `DialogProvider`) render through react-native-web's
  `ModalPortal`, which appends to `document.body` with `position: fixed` and so
  escapes the card's containing block. Both carry
  `cfg.overrides.<Name> = {cardMode: "single", primaryStory: …}`.
  **Do not add `viewport` to those overrides** — `lib/sync-hashes.mjs` strips
  only `cardMode`/`primaryStory` from the source key, so a `viewport` re-keys
  the component and clears its grades.

### States that cannot render statically (deliberately not previewed)
- `SelectPicker` / `Combobox` open dropdowns — `open` is private `useState`
  inside an RN `Modal`, with no `open`/`defaultOpen` prop. Only the closed
  trigger is capturable; showing the list would require a controlled prop.
- `ResizableTextInput` drag-resize — `PanResponder`, screenshot shows the
  `MIN_HEIGHT` (96) resting state. `resetOn` is required; pass `false`.
- `InfoButton`'s opened dialog — deliberately left to `DialogProvider`'s
  `InfoOnly` cell so InfoButton's own card stays portal-free.

### Component quirks worth knowing
- `EmptyState` is `flex: 1` with no intrinsic height — collapses unless given a
  bounded parent or a `minHeight` via its `style` prop.
- `FormField`'s `error` renders a caption below children but does **not**
  restyle the input; `icon` is required (no icon-less variant).
- `ChipGroup` `mode="cycle"` renders ONE chip and hard-codes `idx === 0` as the
  untinted state; cycle chips and `Combobox` triggers stretch to container
  width unless given `alignSelf`/`alignItems: "flex-start"`.
- `Badge`'s `warning` tone is a hard-coded `#B45309`, not a theme token.
- `SelectPicker`'s trigger has no `justifyContent` — label and chevron hug the
  left in a wide parent. As designed, not a preview bug.
- `PieChart` with `total <= 0` renders a plain `colors.border` circle (the
  documented fallback) — that was the original "thin" render, not a bug.
