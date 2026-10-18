import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const run = promisify(exec);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const specifiers = [
  'dsh-grok-byapi/locale/en.json',
  'dsh-grok-byapi/locale/zh.json',
  'dsh-grok-byapi/imagine/locale/en.json',
  'dsh-grok-byapi/imagine/locale/zh.json',
  'dsh-grok-byapi/icon',
  'dsh-grok-byapi/imagine/icon',
];
const packed = [
  'locale/en.json',
  'locale/zh.json',
  'locale/imagine/en.json',
  'locale/imagine/zh.json',
  'assets/imagine.svg',
  'icon.svg',
  'lib/client.js',
  'cordis.patch.yml',
  'screenshots.json',
  'docs/assets/banner.svg',
  'docs/assets/screenshot-plugins.jpg',
  'docs/assets/screenshot-settings.jpg',
];

test('every published specifier resolves to a readable file', async () => {
  for (const specifier of specifiers) {
    // Self-reference resolution exercises the package exports map the same way DSH does.
    const url = import.meta.resolve(specifier);
    assert.ok(url.startsWith('file:'), specifier + ' resolves inside the package');
    const text = await readFile(fileURLToPath(url), 'utf8');
    assert.ok(text.length > 0, specifier + ' is not empty');
    if (specifier.endsWith('.json')) JSON.parse(text);
  }
});

test('locale files carry the English display metadata', async () => {
  const rootLocale = JSON.parse(await readFile(resolve(root, 'locale/en.json'), 'utf8'));
  assert.ok(rootLocale.meta.title.trim().length > 0);
  assert.ok(/^[\x20-\x7e]+$/.test(rootLocale.meta.description), 'root en description stays ASCII like the manifest');
  const imagine = JSON.parse(await readFile(resolve(root, 'locale/imagine/en.json'), 'utf8'));
  assert.ok(imagine.meta.title.trim().length > 0);
  assert.ok(imagine.meta.description.trim().length > 0);
});

test('the bundle patch points at real package specifiers', async () => {
  const patch = await readFile(resolve(root, 'cordis.patch.yml'), 'utf8');
  assert.match(patch, /name: dsh-grok-byapi\n/);
  assert.match(patch, /name: dsh-grok-byapi\/imagine/);
  const manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
  assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml');
  assert.ok(manifest.engines.dsh, 'engines.dsh gates installation');
});

test('the manifest follows the unified dsh baseline', async () => {
  const manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
  assert.equal(manifest.dsh.manifestVersion, 1);
  assert.equal(manifest.engines.dsh, '>=0.2.1-rc.2 <0.3.0-0');
  assert.equal(manifest.engines.node, '>=22.19.0');
  for (const name of ['@deepseek-ai/dsh-credentials', '@deepseek-ai/dsh-llm-pi-ai', '@deepseek-ai/dsh-tools']) {
    assert.equal(manifest.peerDependencies[name], '>=0.2.1-0 <0.3.0', name);
  }
  await assert.rejects(access(resolve(root, 'market/index.json')), { code: 'ENOENT' });
});

test('npm pack ships every runtime and display resource and nothing private', async () => {
  const { stdout } = await run('npm pack --dry-run --ignore-scripts --json', { cwd: root, maxBuffer: 8 * 1024 * 1024 });
  const start = stdout.indexOf('[');
  const end = stdout.lastIndexOf(']');
  assert.ok(start >= 0 && end > start, 'npm pack printed a JSON array');
  const result = JSON.parse(stdout.slice(start, end + 1));
  const files = new Set(result[0].files.map(file => file.path));
  for (const path of packed) assert.ok(files.has(path), 'packed: ' + path);
  const manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
  assert.equal(manifest.exports['./build/locale/*.json'], undefined, 'the retired build locale export stays removed');
  for (const path of files) assert.ok(!path.startsWith('locale/build/'), 'retired locale/build resource must not be packed: ' + path);
  for (const path of files) {
    assert.ok(!path.startsWith('node_modules/'), 'node_modules leaked: ' + path);
    assert.ok(!path.startsWith('.local/'), '.local leaked: ' + path);
    assert.ok(!path.startsWith('.env'), 'env file leaked: ' + path);
    assert.ok(!path.endsWith('.log'), 'log leaked: ' + path);
    assert.ok(!path.endsWith('.tgz'), 'tarball leaked: ' + path);
  }
});