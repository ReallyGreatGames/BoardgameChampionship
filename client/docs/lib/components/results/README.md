# `lib/components/results`

[← lib/components](../README.md)

Everything around entering, reviewing, and signing off game results.
[`ResultsAdminTab.tsx`](ResultsAdminTab.md) is the centerpiece — the admin
dashboard for all tables of a game — built from the smaller pieces below.
[`PlayerResultRow.tsx`](PlayerResultRow.md) is also reused directly by the
participant-facing self-entry screen.

## Files

| File | Purpose |
|---|---|
| [types.md](types.md) | Shared `TableEntry` type — one table's combined, resolved state |
| [ResultsAdminTab.md](ResultsAdminTab.md) | Admin dashboard: overview grid + per-table input mode |
| [PlayerResultRow.md](PlayerResultRow.md) | One player's placement/score/signature input row |
| [ResultsFilterDialog.md](ResultsFilterDialog.md) | Filter/sort sheet for the overview grid |
| [ScoreNavBar.md](ScoreNavBar.md) | Prev/next/jump-to-table navigation bar for input mode |
| [ScoreSignatureModal.md](ScoreSignatureModal.md) | Full-size signature viewer + reset confirmation |
| [SignatureSlot.md](SignatureSlot.md) | Small signature thumbnail/placeholder |
| [SignatureStatusIcon.md](SignatureStatusIcon.md) | Tiny signed/unsigned/missing icon |
| [StateBadge.md](StateBadge.md) | Result status badge (none/saved/signed/submitted) |
| [TableCard.md](TableCard.md) | One table's card in the overview grid |
