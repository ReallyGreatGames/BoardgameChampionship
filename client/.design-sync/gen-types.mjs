#!/usr/bin/env node
// Generates the .d.ts tree (types/) the design-sync converter extracts prop
// contracts from — this app has no library build, so declarations are emitted
// on demand. Run from anywhere; paths are anchored to this file's location.
import { execSync } from "node:child_process";
import { readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// react-native-markdown-display ships raw JSX in .js files (Metro tolerates,
// esbuild's fixed loaders don't) — pre-bundle it to one ESM file with react
// and react-native left external, so the converter's alias in
// tsconfig.sync.json can point at it. Uses the staged converter's esbuild.
{
  const { build } = await import(
    pathToFileURL(join(root, ".ds-sync", "node_modules", "esbuild", "lib", "main.js")).href
  );
  await build({
    entryPoints: [join(root, "node_modules", "react-native-markdown-display", "src", "index.js")],
    bundle: true,
    format: "esm",
    jsx: "automatic",
    loader: { ".js": "jsx" },
    external: ["react", "react/jsx-runtime", "react-native"],
    alias: { "react-native-fit-image": join(root, ".design-sync", "shims", "fit-image.tsx") },
    outfile: join(root, ".design-sync", ".cache", "markdown-display.mjs"),
  });
  console.log("markdown-display pre-bundle written");

  // react-native-svg's web entry relies on Metro's platform-extension
  // resolution (./elements → elements.web.js); esbuild would pick the native
  // files (Flow syntax, RN codegen imports). Pre-bundle with .web.js-first
  // resolution so the converter gets a browser-clean single file.
  await build({
    entryPoints: [join(root, "node_modules", "react-native-svg", "lib", "module", "ReactNativeSVG.web.js")],
    bundle: true,
    format: "esm",
    jsx: "automatic",
    resolveExtensions: [".web.js", ".web.ts", ".web.tsx", ".js", ".ts", ".tsx", ".json"],
    external: ["react", "react/jsx-runtime", "react-native"],
    outfile: join(root, ".design-sync", ".cache", "rnsvg-web.mjs"),
  });
  console.log("react-native-svg web pre-bundle written");
}

rmSync(join(root, "types"), { recursive: true, force: true });
execSync("npx tsc -p .design-sync/tsconfig.dts.json", { cwd: root, stdio: "inherit", shell: true });

// tsc keeps "@/…" alias specifiers verbatim in emitted .d.ts; rewrite them to
// relative paths so the extractor's checker (which has no paths config) resolves them.
const walk = (d) =>
  readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".d.ts") ? [p] : [];
  });
for (const f of walk(join(root, "types"))) {
  const src = readFileSync(f, "utf8");
  const out = src.replace(/(["'])@\/([^"']+)\1/g, (_, q, spec) => {
    let rel = relative(dirname(f), join(root, "types", spec)).replace(/\\/g, "/");
    if (!rel.startsWith(".")) rel = "./" + rel;
    return q + rel + q;
  });
  if (out !== src) writeFileSync(f, out);
}

// Entry the converter reads exported names from — mirrors .design-sync/entry.ts.
writeFileSync(
  join(root, "types", "index.d.ts"),
  `export { BackButton } from "./lib/components/ui/BackButton";
export { Badge } from "./lib/components/ui/Badge";
export { BottomSheet } from "./lib/components/ui/BottomSheet";
export { Button } from "./lib/components/ui/Button";
export { ChipGroup } from "./lib/components/ui/ChipGroup";
export type { ChipOption, ChipGroupProps } from "./lib/components/ui/ChipGroup";
export { Combobox } from "./lib/components/ui/Combobox";
export type { ComboboxOption } from "./lib/components/ui/Combobox";
export { DataTable } from "./lib/components/ui/DataTable";
export { DialogProvider, useDialog } from "./lib/components/ui/Dialog";
export type { DialogOptions } from "./lib/components/ui/Dialog";
export { DirectionPicker } from "./lib/components/ui/DirectionPicker";
export { EmptyState } from "./lib/components/ui/EmptyState";
export { FormField } from "./lib/components/ui/FormField";
export { InfoButton } from "./lib/components/ui/InfoButton";
export { Markdown } from "./lib/components/ui/Markdown";
export { PieChart } from "./lib/components/ui/PieChart";
export type { PieSlice } from "./lib/components/ui/PieChart";
export { ResizableTextInput } from "./lib/components/ui/ResizableTextInput";
export { SearchInput } from "./lib/components/ui/SearchInput";
export { SelectPicker } from "./lib/components/ui/SelectPicker";
export type { SelectOption } from "./lib/components/ui/SelectPicker";
export { ThemeProvider, useTheme } from "./lib/bootstrap/ThemeProvider";
export {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
export { dark, oled, light, highContrast, palettes, colors } from "./lib/theme/colors";
export type { ColorScheme, Palette } from "./lib/theme/colors";
export { space, inset } from "./lib/theme/spacing";
export { fonts, type } from "./lib/theme/typography";
export { ui } from "./lib/theme/ui";
`,
);
console.log("types/ generated");
