# `lib`

[← docs](../README.md)

Everything the app is built from, outside of the file-based routes in
[`app/`](../app/README.md). Screens in `app/` are thin — nearly all actual
logic lives here.

## Top-level files

| File | Purpose |
|---|---|
| [appwrite.md](appwrite.md) | Appwrite client configuration |
| [auth.md](auth.md) | Authentication context (PIN + email/password) |
| [secureStorage.md](secureStorage.md) | Cross-platform key-value storage |
| [utils.md](utils.md) | General-purpose helpers |

## Folders

| Folder | Purpose |
|---|---|
| [bootstrap/](bootstrap/README.md) | App-wide context providers, composed into one tree |
| [components/](components/README.md) | All reusable UI components |
| [feature-flags/](feature-flags/README.md) | Feature-flag registry + hook |
| [hooks/](hooks/README.md) | Reusable hooks not tied to one component |
| [i18n/](i18n/README.md) | Internationalization (German/English) |
| [import/](import/README.md) | Bulk-import pipelines (teams/players, table seatings) |
| [models/](models/README.md) | Appwrite document type definitions |
| [notifications/](notifications/README.md) | Local device notifications |
| [routing/](routing/README.md) | Navigation helper |
| [stores/](stores/README.md) | Zustand + Appwrite-realtime data layer |
| [theme/](theme/README.md) | Design tokens (colors, spacing, typography) |
| [utils/](utils/README.md) | Specialized utility modules |
