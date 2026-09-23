import { readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { renderPortfolio, heroWork, escapeHTML, validateManifest } from '../portfolio-view.mjs';

const root = new URL('../', import.meta.url);
const manifest = validateManifest(JSON.parse(await readFile(new URL('portfolio-manifest.json', root), 'utf8')));
const paths = [...manifest.works.map(work => work.audio), ...manifest.before_after.flatMap(pair => [pair.before, pair.after]), ...Object.values(manifest.harmony_demo)];
for (const path of new Set(paths)) await access(new URL(path, root));
const index = new URL('index.html', root);
let html = await readFile(index, 'utf8');
const newline = html.includes('\r\n') ? '\r\n' : '\n';
const marker = /<!-- PORTFOLIO:START -->[\s\S]*?<!-- PORTFOLIO:END -->/;
if (!marker.test(html) || !html.includes('data-portfolio-hero-title') || !html.includes('data-portfolio-hero-audio')) throw new Error('Missing portfolio integration markers');
const work = heroWork(manifest);
html = html.replace(marker, () => '<!-- PORTFOLIO:START -->' + newline + renderPortfolio(manifest).replace(/\n/g, newline) + newline + '<!-- PORTFOLIO:END -->');
html = html.replace(/(<h2 data-portfolio-hero-title>)[\s\S]*?(<\/h2>)/, (_, start, end) => start + escapeHTML(work.title) + end);
html = html.replace(/<audio data-portfolio-hero-audio[^>]*><\/audio>/, () => `<audio data-portfolio-hero-audio controls preload="none" src="${escapeHTML(work.audio)}" aria-label="${escapeHTML(work.title)} · LIAN’S SOUND"></audio>`);
await writeFile(index, html, 'utf8');
console.log(`Generated ${manifest.portfolio_count} works from portfolio-manifest.json in ${fileURLToPath(index)}`);
