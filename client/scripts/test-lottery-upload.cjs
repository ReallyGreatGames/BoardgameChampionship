/* global __dirname */
// Exercise lottery actions through the real Appwrite SDK and Expo multipart encoder.
const assert = require('node:assert/strict');
const { Buffer } = require('node:buffer');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { test } = require('node:test');
const root = path.resolve(__dirname, '..');

function load(relativePath, mocks = {}, globals = {}) {
  const filename = path.join(root, relativePath);
  const source = fs.readFileSync(filename, 'utf8');
  const code = filename.endsWith('.ts')
    ? ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
    : source;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', ...Object.keys(globals), code)(
    (name) => name in mocks ? mocks[name] : require(name),
    module, module.exports, ...Object.values(globals),
  );
  return module.exports;
}

const { blobToArrayBufferAsync } = load('node_modules/expo/src/utils/blobUtils.ts');
const { convertFormDataAsync } = load('node_modules/expo/src/winter/fetch/convertFormData.ts', {
  '../../utils/blobUtils': { blobToArrayBufferAsync },
});
const { installFormDataPatch } = load('node_modules/expo/src/winter/FormData.ts');
const NativeFormData = installFormDataPatch(class { constructor() { this._parts = []; } });

const smallPhotoBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0xff, 0xd9]);
for (const os of ['android', 'ios', 'web']) {
  for (const action of ['takePhoto', 'pickFromLibrary']) {
    for (const size of [smallPhotoBytes.length, 5 * 1024 * 1024, 5 * 1024 * 1024 + 17]) {
      test(`${os}: ${size} bytes, ${action} uploads photo bytes through Expo multipart encoding`, async () => {
        const platform = { Platform: { OS: os } };
        const photoBytes = new Uint8Array(size);
        photoBytes.set(smallPhotoBytes);
        photoBytes[size - 1] = 123;
        let closed = false;
        class LocalFile {
          constructor(uri) { this.uri = uri; }
          get size() { return photoBytes.length; }
          async bytes() { return photoBytes; }
          open() {
            let offset = 0;
            return {
              readBytes(length) {
                const part = photoBytes.slice(offset, offset + length);
                offset += length;
                return part;
              },
              close() { closed = true; },
            };
          }
        }
        const fileSystem = { File: LocalFile };
        const uploadedParts = [];
        let requests = 0;
        let refreshes = 0;
        const errors = [];
        const sdk = load('node_modules/react-native-appwrite/dist/cjs/sdk.js', {
          'react-native': platform, 'expo-file-system': fileSystem,
        }, {
          FormData: os === 'web' ? FormData : NativeFormData,
          fetch: async (url, options) => {
            if (options.method === 'GET') {return new Response('{}', { status: 404, headers: { 'content-type': 'application/json' } });}
            const { body } = await convertFormDataAsync(options.body, 'test-boundary');
            const multipart = new TextDecoder().decode(body);
            const boundary = Buffer.from('\r\n--test-boundary');
            const encoded = Buffer.from(body);
            const fileHeader = encoded.indexOf(Buffer.from('filename='));
            const start = encoded.indexOf(Buffer.from('\r\n\r\n'), fileHeader) + 4;
            uploadedParts.push(encoded.subarray(start, encoded.indexOf(boundary, start)));
            assert.equal(options.credentials, 'include');
            if (size > 5 * 1024 * 1024) {
              const startByte = requests * 5 * 1024 * 1024;
              assert.equal(options.headers['content-range'], `bytes ${startByte}-${Math.min(startByte + 5 * 1024 * 1024, size) - 1}/${size}`);
              if (requests > 0) {assert.equal(options.headers['x-appwrite-id'], 'photo-id');}
            }
            assert.match(multipart, /filename="lottery_game_\d+\.jpg"/);
            assert.ok(multipart.includes('content-type: image/jpeg'));
            assert.ok(multipart.includes('read("any")'));
            requests++;
            return new Response(JSON.stringify({ $id: 'photo-id' }), { headers: { 'content-type': 'application/json' } });
          },
        });
        const client = new sdk.Client().setEndpoint('https://example.test/v1').setProject('test');
        const storage = new sdk.Storage(client);
        const pick = async () => ({ canceled: false, assets: [{ uri: 'file:///photo.jpg', mimeType: 'image/jpeg' }] });
        const { useLotteryActions } = load('lib/hooks/useLotteryActions.ts', {
          'expo-image-picker': {
            requestCameraPermissionsAsync: async () => ({ granted: true }),
            requestMediaLibraryPermissionsAsync: async () => ({ granted: true }),
            launchCameraAsync: pick, launchImageLibraryAsync: pick,
          },
          'expo-file-system': fileSystem,
          react: { useState: (value) => [value, () => {}] },
          'react-native': platform,
          'react-native-appwrite': sdk,
          '../auth': { useAuth: () => ({ isAdmin: true }) },
          '../appwrite': { client, storage, ID: sdk.ID, LOTTERY_BUCKET_ID: 'lottery' },
          '@/lib/components/ui/Dialog': { useDialog: () => ({ confirm: async (error) => errors.push(error.message) }) },
          '../stores/appwrite/lottery-store': { useLotteryStore: { getState: () => ({ init: async () => refreshes++ }) } },
          '../utils/upload-lottery-photo': load('lib/utils/upload-lottery-photo.ts', { 'expo-file-system': fileSystem, 'react-native': platform }, { fetch: async () => new Response(photoBytes) }),
          '../utils/lottery': load('lib/utils/lottery.ts'),
        }, { fetch: async () => new Response(photoBytes) });
        await useLotteryActions()[action]('game');
        assert.deepEqual(errors, [], `Upload failed: ${errors.join(', ')}`);
        assert.equal(requests, Math.ceil(size / (5 * 1024 * 1024)));
        assert.deepEqual(Buffer.concat(uploadedParts), Buffer.from(photoBytes));
        assert.equal(refreshes, 1);
        assert.equal(closed, os !== 'web');
      });
    }
  }
}

test('native photo handle closes and the error propagates when a later chunk fails', async () => {
  let closed = false;
  let requests = 0;
  const failure = new Error('Upload rejected');
  const { uploadLotteryPhoto } = load('lib/utils/upload-lottery-photo.ts', {
    'react-native': { Platform: { OS: 'android' } },
    'expo-file-system': { File: class {
      get size() { return 5 * 1024 * 1024 + 1; }
      open() {
        return {
          readBytes: (length) => new Uint8Array(length),
          close: () => { closed = true; },
        };
      }
    } },
  });
  const client = {
    config: { endpoint: 'https://example.test/v1' },
    call: async () => {
      if (++requests === 2) {throw failure;}
      return { $id: 'photo-id' };
    },
  };
  await assert.rejects(uploadLotteryPhoto(client, 'lottery', 'photo-id', { uri: 'file:///photo.jpg' }, 'photo.jpg', []), failure);
  assert.equal(requests, 2);
  assert.equal(closed, true);
});
