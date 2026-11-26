import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { classNameOf, eventClassOf, propOfEvent, reactWrappers } from '../ReactWrappers.js';

const ROOT = join(import.meta.dirname, '..', '..');
const CEM = join(ROOT, 'node_modules', '.bin', 'cem');
const TSC = join(ROOT, 'node_modules', '.bin', 'tsc');

test('classNameOf and propOfEvent: wax-item-list is WaxItemList and the event wax-select is the prop onWaxSelect', () => {
  assert.equal(classNameOf('wax-item-list'), 'WaxItemList');
  assert.equal(propOfEvent('wax-select'), 'onWaxSelect');
});

test('reactWrappers: a file per custom element that maps its events to props, and an index; classes that are not elements get none', () => {
  const files = reactWrappers({
    modules: [{
      path: 'src/components/thing/thing.js',
      declarations: [
        { kind: 'class', name: 'WaxThing', tagName: 'wax-thing', customElement: true, events: [{ name: 'wax-open' }, { name: 'wax-close' }, { name: 'wa-show' }, { name: 'change' }] },
        { kind: 'class', name: 'Helper' }
      ]
    }]
  });
  assert.deepEqual([...files.keys()].sort(), ['index.d.ts', 'index.js', 'wax-thing.d.ts', 'wax-thing.js']);
  const wrapper = files.get('wax-thing.js');
  assert.match(wrapper, /import \{ WaxThing as Element \} from '\.\.\/\.\.\/src\/components\/thing\/thing\.js';/);
  assert.match(wrapper, /tagName: 'wax-thing'/);
  assert.match(wrapper, /onWaxOpen: 'wax-open'/);
  assert.match(wrapper, /onWaxClose: 'wax-close'/);
  assert.match(files.get('index.js'), /export \* from '\.\/wax-thing\.js';/);
  const types = files.get('wax-thing.d.ts');
  assert.match(types, /import type \{ WaxThing as Element \} from '\.\.\/types\/components\/thing\/thing\.js';/);
  assert.match(types, /import type \{ WaxCloseEvent, WaxOpenEvent \} from '\.\.\/types\/events\/events\.js';/);
  assert.match(types, /export declare const WaxThing: ReactWebComponent<Element, \{/);
  assert.match(types, /onWaxOpen: EventName<WaxOpenEvent>;/);
  assert.match(types, /onWaShow: EventName<WaShowEvent>;/);
  assert.match(types, /onChange: EventName<Event>;/);
});

test('eventClassOf: a wax-* event is its class of src/events, a wa-* one the class of Web Awesome, and one of the DOM has none', () => {
  assert.deepEqual(eventClassOf('wax-site-click'), { name: 'WaxSiteClickEvent', from: '../types/events/events.js' });
  assert.deepEqual(eventClassOf('wa-after-hide'), { name: 'WaAfterHideEvent', from: '@awesome.me/webawesome/dist/events/after-hide.js' });
  assert.equal(eventClassOf('change'), null);
});

test('dist/react is what scripts/react.mjs makes from the committed custom-elements.json: every file the same and none missing or extra', () => {
  const manifest = JSON.parse(readFileSync(join(ROOT, 'custom-elements.json'), 'utf8'));
  const files = reactWrappers(manifest);
  const dir = join(ROOT, 'dist', 'react');
  const present = existsSync(dir) ? readdirSync(dir).sort() : [];
  assert.deepEqual(present, [...files.keys()].sort(), 'run npm run react');
  for (const [name, text] of files) assert.equal(readFileSync(join(dir, name), 'utf8'), text, `dist/react/${name} is stale: run npm run react`);
});

test('custom-elements.json is what the analyzer makes from the components now', { skip: existsSync(CEM) ? false : 'the analyzer is not installed: run npm install' }, () => {
  // The analyzer takes the output folder relative to where it runs: inside node_modules, which is not committed
  const relative = join('node_modules', '.cache', 'cem-check');
  const out = join(ROOT, relative);
  try {
    execFileSync(CEM, ['analyze', '--config', 'custom-elements-manifest.config.mjs', '--outdir', relative], { cwd: ROOT, stdio: 'pipe' });
    assert.equal(readFileSync(join(out, 'custom-elements.json'), 'utf8'), readFileSync(join(ROOT, 'custom-elements.json'), 'utf8'), 'custom-elements.json is stale: run npm run manifest');
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

/** @param {string} dir @returns {string[]} The files under `dir`, relative to it */
const filesUnder = dir => readdirSync(dir, { recursive: true, withFileTypes: true }).filter(entry => entry.isFile()).map(entry => join(entry.parentPath, entry.name).slice(dir.length + 1)).sort();

test('dist/types is what tsc makes from src now: every declaration the same and none missing or extra', { skip: existsSync(TSC) ? false : 'TypeScript is not installed: run npm install' }, () => {
  const out = join(ROOT, 'node_modules', '.cache', 'types-check');
  try {
    execFileSync(TSC, ['-p', 'tsconfig.json', '--outDir', out], { cwd: ROOT, stdio: 'pipe' });
    const dir = join(ROOT, 'dist', 'types');
    assert.deepEqual(filesUnder(dir), filesUnder(out), 'run npm run types');
    for (const name of filesUnder(out)) assert.equal(readFileSync(join(dir, name), 'utf8'), readFileSync(join(out, name), 'utf8'), `dist/types/${name} is stale: run npm run types`);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});
