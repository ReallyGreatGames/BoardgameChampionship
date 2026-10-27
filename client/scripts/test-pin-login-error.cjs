/* global __dirname */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

const filename = path.resolve(__dirname, "../lib/utils/pin-login-error.ts");
const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  fileName: filename,
}).outputText;
const loadedModule = { exports: {} };
new Function("module", "exports", code)(loadedModule, loadedModule.exports);
const { InvalidPinError, getPinLoginErrorPresentation } = loadedModule.exports;

test("a Java network exception during PIN verification is presented as a network error", () => {
  const presentation = getPinLoginErrorPresentation(
    new Error("java.net.UnknownHostException: Unable to resolve host"),
  );

  assert.deepEqual(presentation, {
    title: "Network error",
    message: "Please check your internet connection and try again.",
  });
});

test("an explicitly rejected PIN remains an invalid-PIN error", () => {
  assert.deepEqual(getPinLoginErrorPresentation(new InvalidPinError()), {
    title: "Invalid PIN",
    message: "Invalid PIN",
  });
});
