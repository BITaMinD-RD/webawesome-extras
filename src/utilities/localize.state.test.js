import { test } from 'node:test';
import assert from 'node:assert/strict';
import en from '../translations/en.js';
import es from '../translations/es.js';

test('every language of the package has exactly the terms of English', () => {
  assert.deepEqual(Object.keys(es).sort(), Object.keys(en).sort());
});

test('the terms start with wax so they do not collide with the ones of Web Awesome', () => {
  for (const key of Object.keys(en)) assert.ok(key.startsWith('$') || key.startsWith('wax'), key);
});

test('a term that is a function is a function in every language and gives text', () => {
  for (const [key, value] of Object.entries(en)) {
    if (typeof value === 'function') {
      assert.equal(typeof /** @type {any} */ (es)[key], 'function', key);
      assert.equal(typeof /** @type {any} */ (es)[key](2, 5), 'string');
    }
  }
});

test('every term the elements ask for exists in English', async () => {
  const { readdirSync, readFileSync } = await import('node:fs');
  const folder = new URL('../components/', import.meta.url);
  for (const name of readdirSync(folder)) {
    const file = readdirSync(new URL(`${name}/`, folder)).find(f => f === `${name}.js`);
    if (!file) continue;
    const source = readFileSync(new URL(`${name}/${file}`, folder), 'utf8');
    for (const [, key] of source.matchAll(/term\([^,)]+, '(wax\w+)'/g)) assert.ok(key in en, `${name}: ${key}`);
  }
});
