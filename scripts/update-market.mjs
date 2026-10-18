import { readFile, writeFile } from 'node:fs/promises';
import { parseMarketIndex } from '@deepseek-ai/dsh-plugin-market-index';

// Refresh market/index.json for the current package version and commit.
// Usage: node scripts/update-market.mjs <40-hex-commit>
const commit = process.argv[2];
if (!commit || !/^[0-9a-f]{40}$/.test(commit)) {
  console.error('usage: node scripts/update-market.mjs <40-hex-commit>');
  process.exit(2);
}
const file = 'market/index.json';
const indexUrl = 'https://raw.githubusercontent.com/NingYuanLee/dsh-grok-byapi/main/market/index.json';
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const en = JSON.parse(await readFile('locale/en.json', 'utf8')).meta;
const zh = JSON.parse(await readFile('locale/zh.json', 'utf8')).meta;
const icon = 'data:image/svg+xml;base64,' + (await readFile('icon.svg')).toString('base64');
const existing = JSON.parse(await readFile(file, 'utf8'));
const entry = existing.plugins.find(plugin => plugin.name === pkg.name);
if (!entry) throw new Error('market/index.json has no entry for ' + pkg.name);
entry.title = { en: en.title, zh: zh.title };
entry.description = { en: en.description, zh: zh.description };
entry.icon = icon;
entry.author = pkg.author;
entry.homepage = pkg.homepage;
entry.repository = { url: 'https://github.com/NingYuanLee/dsh-grok-byapi' };
entry.metadata = { ...(entry.metadata || {}), category: 'model', keywords: pkg.keywords };
entry['dist-tags'] = { ...(entry['dist-tags'] || {}), latest: pkg.version };
entry.versions = (entry.versions || []).filter(version => version.version !== pkg.version);
entry.versions.push({
  version: pkg.version,
  publishTimestamp: Math.floor(Date.now() / 1000),
  source: { type: 'git', url: 'https://github.com/NingYuanLee/dsh-grok-byapi', commit },
  engines: { dsh: pkg.engines.dsh },
});
const parsed = parseMarketIndex(existing, indexUrl);
await writeFile(file, JSON.stringify(existing, null, 2) + '\n');
console.log('market index updated: ' + pkg.name + '@' + pkg.version + ' (' + parsed.plugins[0].versions.length + ' versions)');
