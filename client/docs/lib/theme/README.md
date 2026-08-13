# `lib/theme`

Design-token layer of the app: colors, spacing, typography, and other UI
constants as plain, static objects (no React, no runtime logic). Components
should always use these tokens instead of raw values.

Dynamic theming (which color scheme is currently active) does **not** live
here — that's [`lib/bootstrap/ThemeProvider.tsx`](../bootstrap/ThemeProvider.md),
which consumes `colors.ts`'s `palettes` among other things.

## Files

| File | Purpose |
|---|---|
| [colors.md](colors.md) | Color palettes (`dark`, `oled`, `light`, `highContrast`) |
| [spacing.md](spacing.md) | 4pt spacing scale + semantic aliases |
| [typography.md](typography.md) | Font families and type scale |
| [ui.md](ui.md) | Other UI constants (radii, opacity, breakpoint) |
