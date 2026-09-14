/* global __dirname */
// Exercise the real Appwrite multipart path and Expo encoder without a device/server.
const assert = require('node:assert/strict');
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

class LocalFile {
  constructor(directory, name) { this.uri = `${directory}/${name}`; }
  write(text) { this.content = new TextEncoder().encode(text); }
  get size() { return this.content.length; }
  async bytes() { return this.content; }
}

for (const os of ['android', 'ios', 'web']) {
  test(`${os}: signature reaches multipart request with SVG bytes and metadata`, async () => {
    const platform = { Platform: { OS: os } };
    const fileSystem = { File: LocalFile, Paths: { cache: 'file:///cache' } };
    const { createSignatureFile } = load('lib/utils/signature-file.ts', {
      'expo-file-system': fileSystem, 'react-native': platform,
    });
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><path d="M 1,2 L 3,4"/></svg>';
    let requests = 0;
    const { Client, Storage } = load('node_modules/react-native-appwrite/dist/cjs/sdk.js', {
      'react-native': platform, 'expo-file-system': fileSystem,
    }, {
      FormData: os === 'web' ? FormData : NativeFormData,
      fetch: async (url, options) => {
        const { body } = await convertFormDataAsync(options.body, 'test-boundary');
        const multipart = new TextDecoder().decode(body);
        assert.ok(multipart.includes(svg), 'SVG bytes must be in the upload');
        assert.ok(multipart.includes('filename="signature_game_0.svg"'));
        assert.ok(multipart.includes('content-type: image/svg+xml'));
        assert.ok(multipart.includes('name="fileId"\r\n\r\nsignature-id'));
        assert.equal(options.credentials, 'include');
        requests++;
        return new Response(JSON.stringify({ $id: 'signature-id' }), { headers: { 'content-type': 'application/json' } });
      },
    });
    const storage = new Storage(new Client().setEndpoint('https://example.test/v1').setProject('test'));
    const uploaded = await storage.createFile({ bucketId: 'signatures', fileId: 'signature-id', file: createSignatureFile(svg, 'game', 0) });
    assert.equal(uploaded.$id, 'signature-id');
    assert.equal(requests, 1);
  });
}
