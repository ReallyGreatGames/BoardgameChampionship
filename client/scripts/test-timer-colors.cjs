/* global __dirname */
// Exercise the real timer screen, menu, color sheet, timer hook and preference
// storage hook, with native UI and the backend replaced at their boundaries.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');
const React = require('react');
const { act, create } = require('react-test-renderer');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const root = path.resolve(__dirname, '..');

function makeLoader(mocks) {
  const cache = new Map();
  function load(relativePath) {
    const filename = path.join(root, relativePath);
    if (cache.has(filename)) { return cache.get(filename); }
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
    new Function('require', 'module', 'exports', code)((name) => {
      if (name in mocks) { return mocks[name]; }
      if (name.startsWith('@/') || name.startsWith('.')) {
        const base = name.startsWith('@/') ? name.slice(2) : path.join(path.dirname(relativePath), name);
        const extension = ['.ts', '.tsx'].find((ext) => fs.existsSync(path.join(root, base + ext)));
        return load(base + extension);
      }
      return require(name);
    }, module, module.exports);
    cache.set(filename, module.exports);
    return module.exports;
  }
  return load;
}

async function setup(t, { savedColors, gameColors } = {}) {
  t.mock.timers.enable({ apis: ['setInterval', 'Date'], now: new Date('2026-09-21T12:00:00Z') });
  const storageKey = 'playerColors_game_1';
  const storage = new Map(savedColors ? [[storageKey, JSON.stringify(savedColors)]] : []);
  const writes = [];
  const unexpectedWrite = async () => assert.fail('Changing colors must not write timer state');
  const players = [0, 1, 2, 3].map((i) => ({ $id: `player-${i}`, name: `Player ${i + 1}` }));
  const timerStore = {
    collection: [{ $id: 'timer', table: 1, games: 'game', playerPositions: players,
      $updatedAt: new Date().toISOString() }],
    add: unexpectedWrite, update: unexpectedWrite,
  };
  const seatStore = {
    collection: players.map((_, seat) => ({
      $id: `seat-${seat}`, table: 1, games: 'game', seat, playerTime: 120 + seat,
      paused: seat !== 0, inOvertime: false, roundTimeLeft: 0,
      roundExpired: false, roundLastPausedAt: null, $updatedAt: new Date().toISOString(),
    })),
    add: unexpectedWrite, update: unexpectedWrite,
  };
  const settingsStore = { collection: [{ $id: 'game', colors: gameColors }] };
  const bellStore = { collection: [], add: unexpectedWrite, update: unexpectedWrite };
  const orientation = { forceOrientation() {}, unlockOrientation: async () => {} };
  class AnimatedValue {
    setValue() {}
    stopAnimation() {}
  }
  const native = {
    StyleSheet: { create: (styles) => styles, absoluteFill: {} },
    Platform: { OS: 'android' },
    useWindowDimensions: () => ({ width: 800, height: 400 }),
    Animated: { Value: AnimatedValue, timing: () => ({ start() {} }) },
    Easing: { linear: (x) => x },
    ...Object.fromEntries(['View', 'Text', 'Pressable', 'TouchableOpacity', 'ActivityIndicator',
      'KeyboardAvoidingView', 'ScrollView', 'StatusBar'].map((name) => [name, name])),
    Modal: ({ visible, children }) => visible ? children : null,
  };
  const load = makeLoader({
    'react-native': native,
    '@expo/vector-icons': { Ionicons: 'Ionicons' },
    'react-i18next': { useTranslation: () => ({ t: (key, values) => values?.color ? `${values.player}: ${values.color}` : key }) },
    'expo-screen-orientation': { OrientationLock: { LANDSCAPE_RIGHT: 1 } },
    'expo-keep-awake': { activateKeepAwakeAsync: async () => {}, deactivateKeepAwake() {} },
    'expo-router': { useFocusEffect: (fn) => React.useEffect(fn, [fn]), useLocalSearchParams: () => ({ gameId: 'game' }) },
    '@/lib/bootstrap/ScreenOrientationProvider': { useScreenOrientation: () => orientation },
    '@/lib/bootstrap/ThemeProvider': { useTheme: () => ({ colors: {} }) },
    '@/lib/hooks/usePlayerTable': { usePlayerTable: () => 1 },
    '@/lib/hooks/useRequireAuth': { useRequireAuth() {} },
    '@/lib/hooks/useRoundCountdown': { useRoundCountdown: () => null },
    '@/lib/hooks/useTableBellActions': { useTableBellActions: () => ({}) },
    '@/lib/components/ui/Dialog': { useDialog: () => ({ confirm: unexpectedWrite }) },
    '@/lib/components/timer/TimerCell': { TimerCell: 'TimerCell' },
    '@/lib/components/timer/TimerControlPanel': { TimerControlPanel: 'TimerControlPanel' },
    '@/lib/components/timer/CustomTimerModal': { CustomTimerModal: () => null },
    '@/lib/stores/appwrite/timer-store': { useTimerStore: () => timerStore },
    '@/lib/stores/appwrite/timer-seat-store': { useTimerSeatStore: () => seatStore },
    '@/lib/stores/appwrite/timer-settings-store': { useTimerSettingsStore: () => settingsStore },
    '@/lib/stores/appwrite/table-bell-store': { useTableBellStore: () => bellStore },
    '@/lib/stores/appwrite/schedule-store': { useScheduleStore: (select) => select({ collection: [] }) },
    '@/lib/utils/navigation': { goBackTo() { assert.fail('Changing colors must keep the timer open'); } },
    '@/lib/secureStorage': {
      getItemAsync: async (key) => storage.get(key) ?? null,
      setItemAsync: async (key, value) => { writes.push(key); storage.set(key, value); },
    },
  });
  const { default: TimerPage } = load('app/(pages)/(user)/timer.tsx');
  let renderer;
  await act(async () => { renderer = create(React.createElement(TimerPage)); });
  t.after(async () => { await act(async () => { renderer.unmount(); }); });
  const textButton = (label) => renderer.root.findAllByType('Pressable').find((node) =>
    node.findAllByType('Pressable').length === 1 &&
    node.findAllByType('Text').some((text) => text.props.children === label));
  return {
    storage, storageKey, writes,
    get cells() { return renderer.root.findAllByType('TimerCell').sort((a, b) => a.props.idx - b.props.idx).map((cell) => cell.props); },
    get choices() { return renderer.root.findAllByType('Pressable').filter((node) => node.props.accessibilityRole === 'radio'); },
    async open() {
      await act(async () => { renderer.root.findByType('TimerControlPanel').props.onOpenMenu(); });
      await act(async () => { textButton('timerSettingsTitle').props.onPress(); });
      await act(async () => { textButton('reassignColors').props.onPress(); });
    },
    async choose(player, color) {
      await act(async () => { renderer.root.findByProps({ accessibilityLabel: `${player}: ${color}` }).props.onPress(); });
    },
    async save() { await act(async () => { await textButton('saveColors').props.onPress(); }); },
    async close() { await act(async () => { renderer.root.findByType(native.Modal).props.onRequestClose(); }); },
    async tick() { await act(async () => { t.mock.timers.tick(1000); }); },
    async remount() {
      await act(async () => { renderer.unmount(); });
      await act(async () => { renderer = create(React.createElement(TimerPage)); });
    },
  };
}

test('reassigning colors from timer settings preserves active clocks and persists on reopening', async (t) => {
  const palette = ['#aa2222', '#2255bb', '#22bb55', '#bbaa22'];
  const saved = [palette[1], palette[0], palette[3], palette[2]];
  const app = await setup(t, { savedColors: saved, gameColors: palette });
  const selectedColors = () => app.choices.filter((choice) => choice.props.accessibilityState.checked)
    .map((choice) => choice.props.accessibilityLabel);
  await app.open();
  assert.deepEqual(selectedColors(), [1, 2, 4, 3].map((n) => `Player ${n}: ${saved[n - 1]}`));
  await app.choose('Player 1', palette[2]);
  await app.tick();
  assert.equal(app.cells[0].timeLeft, 119, 'the active timer keeps ticking with the sheet open');
  const beforeSave = app.cells.map(({ timeLeft, isPaused, roundTimeLeft, roundExpired, playerName }) =>
    ({ timeLeft, isPaused, roundTimeLeft, roundExpired, playerName }));
  await app.save();
  assert.equal(app.choices.length, 0, 'saving dismisses the sheet');
  assert.deepEqual(app.cells.map(({ timeLeft, isPaused, roundTimeLeft, roundExpired, playerName }) =>
    ({ timeLeft, isPaused, roundTimeLeft, roundExpired, playerName })), beforeSave);
  assert.deepEqual(app.cells.map((cell) => cell.playerColor.active), [palette[2], ...saved.slice(1)]);
  assert.deepEqual(JSON.parse(app.storage.get(app.storageKey)), [palette[2], ...saved.slice(1)]);
  assert.deepEqual(app.writes, [app.storageKey]);
  await app.tick();
  assert.equal(app.cells[0].timeLeft, 118);
  await app.remount();
  await app.open();
  assert.ok(selectedColors().includes(`Player 1: ${palette[2]}`));
  assert.equal(app.choices.length, 16, 'duplicate assignments do not remove colors from the palette');
});

test('closing the sheet discards draft colors and default colors are available without setup', async (t) => {
  const app = await setup(t);
  const original = app.cells.map((cell) => cell.playerColor.active);
  await app.open();
  await app.choose('Player 1', original[1]);
  await app.close();
  assert.deepEqual(app.cells.map((cell) => cell.playerColor.active), original);
  assert.deepEqual(app.writes, []);
  await app.open();
  assert.equal(app.choices.find((choice) => choice.props.accessibilityLabel === `Player 1: ${original[0]}`)
    .props.accessibilityState.checked, true);
});
