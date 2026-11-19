#!/usr/bin/env node
/**
 * Writes the React wrappers (`dist/react/<tag>.js`) of the components from custom-elements.json (see scripts/ReactWrappers.js), and removes the ones of elements that
 * are not there any more. Run `npm run manifest` first if the components changed; `npm run build` does both.
 */
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { reactWrappers } from './ReactWrappers.js';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const OUT = join(ROOT, 'dist', 'react');

const manifest = JSON.parse(readFileSync(join(ROOT, 'custom-elements.json'), 'utf8'));
const files = reactWrappers(manifest);
mkdirSync(OUT, { recursive: true });
for (const name of readdirSync(OUT)) if (!files.has(name)) rmSync(join(OUT, name));
for (const [name, text] of files) writeFileSync(join(OUT, name), text);
console.log(`dist/react: ${files.size} files`);
