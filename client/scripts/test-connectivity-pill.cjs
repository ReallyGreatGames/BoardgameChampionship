/* global __dirname */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");
const React = require("react");
const { act, create } = require("react-test-renderer");

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const root = path.resolve(__dirname, "..");

function loadConnectivityPill(mocks) {
  const filename = path.join(root, "lib/components/shell/ConnectivityPill.tsx");
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
    fileName: filename,
  }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", code)((name) => mocks[name] ?? require(name), module, module.exports);
  return module.exports.ConnectivityPill;
}

test("a brief offline report does not show a connectivity notification", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"] });
  let state = { isOnline: true, timerActive: false };
  const transitions = [];
  class AnimatedValue {
    interpolate() { return 0; }
  }
  const ConnectivityPill = loadConnectivityPill({
    "react-native": {
      Animated: {
        Value: AnimatedValue,
        View: "AnimatedView",
        timing: (_, config) => {
          transitions.push(config.toValue);
          return { start() {} };
        },
      },
      StyleSheet: { create: (styles) => styles },
      Text: "Text",
      View: "View",
    },
    "@expo/vector-icons": { Ionicons: "Ionicons" },
    "react-i18next": { useTranslation: () => ({ t: (key) => key }) },
    "react-native-safe-area-context": { useSafeAreaInsets: () => ({ top: 0 }) },
    "@/lib/bootstrap/ThemeProvider": { useTheme: () => ({ colors: { success: "green", error: "red", surfaceHigh: "white" } }) },
    "@/lib/stores/connectivity-store": { useConnectivityStore: (select) => select(state) },
    "@/lib/theme/spacing": { space: [0, 1, 2, 3, 4] },
    "@/lib/theme/typography": { type: { caption: {} } },
  });

  let renderer;
  await act(async () => { renderer = create(React.createElement(ConnectivityPill)); });
  transitions.length = 0;
  state = { ...state, isOnline: false };
  await act(async () => { renderer.update(React.createElement(ConnectivityPill)); });
  await act(async () => { t.mock.timers.tick(1000); });
  state = { ...state, isOnline: true };
  await act(async () => { renderer.update(React.createElement(ConnectivityPill)); });
  await act(async () => { t.mock.timers.tick(2000); });

  assert.deepEqual(transitions, []);
  await act(async () => { renderer.unmount(); });
});
