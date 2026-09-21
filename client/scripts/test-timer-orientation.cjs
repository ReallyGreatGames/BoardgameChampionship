/* global __dirname */
// Run the real timer, orientation provider, sheets and Expo focus hook with a
// controllable native orientation boundary; no device or backend is required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');
const React = require('react');
const { act, create } = require('react-test-renderer');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const root = path.resolve(__dirname, '..');
const { OrientationLock } = load('node_modules/expo-screen-orientation/src/ScreenOrientation.types.ts', {});

function load(relativePath, mocks) {
  const filename = path.join(root, relativePath);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
    fileName: filename,
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(
    (name) => name in mocks ? mocks[name] : require(name), module, module.exports,
  );
  return module.exports;
}

async function setup(t, { timer = false, sheet = false, delayLocks = false } = {}) {
  let appliedLock = OrientationLock.PORTRAIT_UP;
  let focused = timer;
  const listeners = new Map();
  const appStateListeners = new Set();
  const pendingLocks = [];
  const locks = [];
  const navigation = {
    isFocused: () => focused,
    addListener(event, callback) {
      const callbacks = listeners.get(event) ?? new Set();
      listeners.set(event, callbacks);
      callbacks.add(callback);
      return () => callbacks.delete(callback);
    },
  };
  const nativeOrientation = {
    OrientationLock,
    getOrientationLockAsync: async () => appliedLock,
    lockAsync(lock) {
      locks.push(lock);
      return new Promise((resolve) => {
        const apply = () => { appliedLock = lock; resolve(); };
        if (delayLocks) {
          pendingLocks.push(apply);
        } else {
          apply();
        }
      });
    },
  };
  const native = {
    StyleSheet: { create: (styles) => styles, absoluteFill: {} },
    Platform: { OS: 'android' },
    AppState: {
      addEventListener(event, callback) {
        assert.equal(event, 'change');
        appStateListeners.add(callback);
        return { remove: () => appStateListeners.delete(callback) };
      },
    },
    ...Object.fromEntries([
      'KeyboardAvoidingView', 'Modal', 'Pressable', 'ScrollView', 'StatusBar',
      'Text', 'TouchableOpacity', 'View',
    ].map((name) => [name, name])),
  };
  const provider = load('lib/bootstrap/ScreenOrientationProvider.tsx', {
    'expo-screen-orientation': nativeOrientation,
    'react-native': native,
  });
  const { useOptionalNavigation } = load('node_modules/expo-router/build/link/useLoadedNavigation.js', {
    '../global-state/router-store': { store: { navigationRef: { current: navigation } } },
    '../react-navigation/native': { useNavigation: () => navigation },
  });
  const { useFocusEffect } = load('node_modules/expo-router/build/useFocusEffect.js', {
    './link/useLoadedNavigation': { useOptionalNavigation },
    './useNavigation': { useNavigation: () => navigation },
  });
  const theme = { useTheme: () => ({ colors: {} }) };
  const commonMocks = {
    'react-native': native,
    'expo-screen-orientation': nativeOrientation,
    '@/lib/bootstrap/ThemeProvider': theme,
    '@/lib/bootstrap/ScreenOrientationProvider': provider,
  };
  const { BottomSheet } = load('lib/components/ui/BottomSheet.tsx', {
    ...commonMocks,
    '@expo/vector-icons': { Ionicons: 'Ionicons' },
    '@/lib/theme/spacing': { inset: {} },
    '@/lib/theme/ui': { ui: {} },
    '@/lib/theme/typography': { type: {} },
  });
  const { default: TimerPage } = load('app/(pages)/(user)/timer.tsx', {
    ...commonMocks,
    'expo-router': { useFocusEffect, useLocalSearchParams: () => ({ gameId: 'game' }) },
    'expo-keep-awake': { activateKeepAwakeAsync: async () => {}, deactivateKeepAwake() {} },
    'react-i18next': { useTranslation: () => ({ t: (key) => key }) },
    '@/lib/components/timer/TimerCell': { TimerCell: () => null },
    '@/lib/components/timer/TimerControlPanel': { TimerControlPanel: () => null },
    '@/lib/components/timer/TimerMenu': { TimerMenu: () => null },
    '@/lib/hooks/usePlayerTable': { usePlayerTable: () => 1 },
    '@/lib/hooks/useRequireAuth': { useRequireAuth() {} },
    '@/lib/hooks/useRoundCountdown': { useRoundCountdown: () => null },
    '@/lib/hooks/useTableBellActions': { useTableBellActions: () => ({}) },
    '@/lib/hooks/useTimerLocalSettings': { useTimerLocalSettings: () => ({}) },
    '@/lib/hooks/useTimerState': { useTimerState: () => ({
      times: [], roundTimesLeft: [], roundExpired: [], playersInOvertime: [], playersPaused: [],
      playerColors: [], depleteAnims: { current: [] }, graceAnims: { current: [] },
    }) },
    '@/lib/stores/appwrite/schedule-store': { useScheduleStore: (select) => select({ collection: [] }) },
    '@/lib/stores/appwrite/table-bell-store': { useTableBellStore: () => ({ collection: [] }) },
    '@/lib/utils': { formatElapsedSeconds: String },
    '@/lib/utils/navigation': { goBackTo() {} },
  });
  let context;
  function ObserveOrientation() {
    context = provider.useScreenOrientation();
    return null;
  }
  const tree = () => React.createElement(provider.ScreenOrientationProvider, null,
    React.createElement(ObserveOrientation),
    timer && React.createElement(TimerPage),
    React.createElement(BottomSheet, { visible: sheet, title: 'Settings', footer: null, onClose() {} }),
  );
  let renderer;
  await act(async () => { renderer = create(tree()); });
  t.after(async () => { await act(async () => { renderer.unmount(); }); });
  return {
    get appliedLock() { return appliedLock; },
    get requestedLock() { return context.orientation; },
    locks,
    async showTimer() {
      timer = true;
      focused = true;
      await act(async () => { renderer.update(tree()); });
    },
    async closeSheet() {
      sheet = false;
      await act(async () => { renderer.update(tree()); });
    },
    async openSheet() {
      sheet = true;
      await act(async () => { renderer.update(tree()); });
    },
    async resumeWithPortrait() {
      await act(async () => {
        for (const callback of appStateListeners) {
          callback('background');
        }
        appliedLock = OrientationLock.PORTRAIT_UP;
        for (const callback of appStateListeners) {
          callback('active');
        }
      });
    },
    async focus(next) {
      focused = next;
      await act(async () => {
        for (const callback of listeners.get(next ? 'focus' : 'blur') ?? []) {
          callback();
        }
      });
    },
    async settleLocks() {
      // Complete newer requests first to expose overlapping native operations.
      while (pendingLocks.length) {
        await act(async () => { pendingLocks.pop()(); });
      }
    },
  };
}

test('opening the timer requests landscape and leaving restores portrait', async (t) => {
  const app = await setup(t);
  await app.showTimer();
  assert.equal(app.appliedLock, OrientationLock.LANDSCAPE_RIGHT);
  await app.focus(false);
  assert.equal(app.appliedLock, OrientationLock.PORTRAIT_UP);
  await app.focus(true);
  assert.equal(app.appliedLock, OrientationLock.LANDSCAPE_RIGHT);
});

test('closing a schedule sheet after timer focus keeps landscape', async (t) => {
  const app = await setup(t, { sheet: true });
  await app.showTimer();
  assert.equal(app.appliedLock, OrientationLock.LANDSCAPE_RIGHT);
  await app.closeSheet();
  assert.equal(app.requestedLock, OrientationLock.LANDSCAPE_RIGHT);
  assert.equal(app.appliedLock, OrientationLock.LANDSCAPE_RIGHT,
    'closing the previous screen\'s sheet must not leave the focused timer in portrait');
});

test('a delayed startup portrait request cannot override timer landscape', async (t) => {
  const app = await setup(t, { timer: true, delayLocks: true });
  await app.settleLocks();
  assert.equal(app.appliedLock, OrientationLock.LANDSCAPE_RIGHT,
    'the last focused screen must win even if native lock requests take time');
});

test('quickly leaving and returning to the timer keeps the latest lock', async (t) => {
  const app = await setup(t, { timer: true, delayLocks: true });
  await app.settleLocks();
  await app.focus(false);
  await app.focus(true);
  await app.settleLocks();
  assert.equal(app.appliedLock, OrientationLock.LANDSCAPE_RIGHT);
});

test('timer settings keep the focused screen in landscape', async (t) => {
  const app = await setup(t, { timer: true });
  await app.openSheet();
  assert.equal(app.appliedLock, OrientationLock.LANDSCAPE_RIGHT);
  await app.closeSheet();
  assert.equal(app.appliedLock, OrientationLock.LANDSCAPE_RIGHT);
});

test('resuming the app reapplies landscape only while the timer is focused', async (t) => {
  const app = await setup(t, { timer: true });
  await app.resumeWithPortrait();
  assert.equal(app.appliedLock, OrientationLock.LANDSCAPE_RIGHT);
  await app.focus(false);
  await app.resumeWithPortrait();
  assert.equal(app.appliedLock, OrientationLock.PORTRAIT_UP);
});
