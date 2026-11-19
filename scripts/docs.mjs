#!/usr/bin/env node
/**
 * Writes the reference tables of the pages of the components (`docs/components/<name>.md`, between `<!-- api:start -->` and `<!-- api:end -->`) from custom-elements.json
 * (see scripts/DocsTables.js). The page of an element is the one named like its tag without the prefix (`wax-item-list` is `docs/components/item-list.md`).
 * Run `npm run manifest` first if the components changed; `npm run build` does all.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { elementsOf, referenceOf, withReference } from './DocsTables.js';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const manifest = JSON.parse(readFileSync(join(ROOT, 'custom-elements.json'), 'utf8'));
let written = 0;
for (const element of elementsOf(manifest)) {
  const page = join(ROOT, 'docs', 'components', `${element.tagName?.replace(/^wax-/, '')}.md`);
  if (!existsSync(page)) { console.error(`${element.tagName}: no page at ${page}`); process.exitCode = 1; continue; }
  const before = readFileSync(page, 'utf8');
  const after = withReference(before, referenceOf(element));
  if (after !== before) { writeFileSync(page, after); written++; }
}
console.log(`docs: ${written} page(s) changed`);
