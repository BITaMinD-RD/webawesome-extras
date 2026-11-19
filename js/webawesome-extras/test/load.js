// Loads the library classes in Node: it imports their modules and gives back what they export, by name.

import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.join(import.meta.dirname, '..');
const ORDER = ['AskEach'];

let loaded = null;

/** @returns {Promise<Record<string, any>>} The classes, by name */
export async function load() {
  if (loaded) return loaded;
  loaded = {};
  for (const file of ORDER.map(name => path.join(ROOT, `${name}.js`))) {
    Object.assign(loaded, await import(pathToFileURL(file).href));
  }
  return loaded;
}
