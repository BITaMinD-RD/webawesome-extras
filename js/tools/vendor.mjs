#!/usr/bin/env node
/**
 * Generates the copies in js/ that come from webutils, which lives next to this repository (`../../webutils`): what the components import without being
 * components themselves (`BackClose`, in `history/`), at the same relative path it has in every application (`../history/`), and the generator itself (`vendor/`).
 *
 * A copy is not edited by hand: it is changed in its repository, committed there and generated again with this. Each one has a MANIFEST.json
 * with the commit it comes from and the hash of every file; tools/test/Manifest.test.js fails if anything differs.
 * The work (copy, write the manifest, refuse to copy from a repository with uncommitted changes) is in vendor/Vendor.js, which is
 * itself a generated copy of webutils; here there is only the list of what is taken.
 *
 * Usage: node tools/vendor.mjs                      (all)
 *        node tools/vendor.mjs history              (only that one)
 *        node tools/vendor.mjs webutils=/other/path (a repository somewhere else; or the variable VENDOR_WEBUTILS)
 */
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { run } from '../vendor/Vendor.js';

/** The root of what is generated: the `js/` folder */
export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** @type {import('../vendor/Vendor.js').Copy[]} */
export const COPIES = [
  { repo: 'webutils', path: 'js/vendor', out: 'vendor' },
  { repo: 'webutils', path: 'js/history', out: 'history' },
];

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) run(COPIES, ROOT, process.argv.slice(2), join(ROOT, '..', '..'));
