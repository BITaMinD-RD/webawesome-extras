import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { classNameOf, propOfEvent, reactWrappers } from '../ReactWrappers.js';

const ROOT = join(import.meta.dirname, '..', '..');
const CEM = join(ROOT, 'node_modules', '.bin', 'cem');

test('classNameOf and propOfEvent: wax-item-list is WaxItemList and the event wax-select is the prop onWaxSelect', () => {
  assert.equal(classNameOf('wax-item-list'), 'WaxItemList');
  assert.equal(propOfEvent('wax-select'), 'onWaxSelect');
});

test('reactWrappers: a file per custom element that maps its events to props, and an index; classes that are not elements get none', () => {
  const files = reactWrappers({
    modules: [{
      path: 'src/components/thing/thing.js',
      declarations: [
        { kind: 'class', name: 'WaxThing', tagName: 'wax-thing', customElement: true, events: [{ name: 'wax-open' }, { name: 'wax-close' }] },
        { kind: 'class', name: 'Helper' }
      ]
    }]
  });
  assert.deepEqual([...files.keys()].sort(), ['index.js', 'wax-thing.js']);
  const wrapper = files.get('wax-thing.js');
  assert.match(wrapper, /import \{ WaxThing as Element \} from '\.\.\/\.\.\/src\/components\/thing\/thing\.js';/);
  assert.match(wrapper, /tagName: 'wax-thing'/);
  assert.match(wrapper, /onWaxOpen: 'wax-open'/);
  assert.match(wrapper, /onWaxClose: 'wax-close'/);
  assert.match(files.get('index.js'), /export \* from '\.\/wax-thing\.js';/);
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
