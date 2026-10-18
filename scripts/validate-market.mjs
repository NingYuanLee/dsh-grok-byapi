import { readFile } from 'node:fs/promises';
import { parseMarketIndex } from '@deepseek-ai/dsh-plugin-market-index';

const file = process.argv[2] ?? 'market/index.json';
const indexUrl = process.argv[3] ?? 'https://raw.githubusercontent.com/NingYuanLee/dsh-grok-byapi/main/market/index.json';
const text = await readFile(file, 'utf8');
const parsed = parseMarketIndex(JSON.parse(text), indexUrl);
console.log('market index ok: ' + parsed.plugins.length + ' plugin(s), format ' + parsed.format);
for (const plugin of parsed.plugins) {
  console.log('- ' + plugin.name + ' versions: ' + plugin.versions.map(v => v.version).join(', '));
}
