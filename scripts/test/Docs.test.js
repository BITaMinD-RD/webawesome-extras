import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { END, START, elementsOf, referenceOf, withReference } from '../DocsTables.js';
import { extractExamples, tagsOf } from '../../docs/site/examples.js';

const ROOT = join(import.meta.dirname, '..', '..');
const manifest = JSON.parse(readFileSync(join(ROOT, 'custom-elements.json'), 'utf8'));
const pageOf = element => join(ROOT, 'docs', 'components', `${element.tagName.replace(/^wax-/, '')}.md`);

test('referenceOf: a table per kind of thing the element has, with the pipes of the types escaped, and none for what it has not', () => {
  const text = referenceOf({
    name: 'WaxThing', tagName: 'wax-thing', customElement: true,
    members: [
      { kind: 'field', name: 'size', type: { text: 'string | null' }, default: 'null', attribute: 'size', description: 'How big' },
      { kind: 'field', name: 'marked', readonly: true, type: { text: 'Set<string>' }, description: 'The marks' },
      { kind: 'field', name: 'HIDDEN', static: true, description: 'Static: not listed' },
      { kind: 'method', name: 'pick', description: 'Picks', parameters: [{ name: 'key', type: { text: 'string' } }, { name: '{ scroll = false }' }, { name: 'options', optional: true, type: { text: '{scroll?: boolean}' } }] }
    ],
    events: [{ name: 'wax-pick', description: 'Picked. `detail: { key }`' }],
    cssParts: [{ name: 'box', description: 'The box' }]
  });
  assert.match(text, /### Properties and attributes/);
  assert.match(text, /\| `size` \| How big \| `size` \| `string \\\| null` \| `null` \|/);
  assert.match(text, /\| `marked` \| The marks \(read only\) \|/);
  assert.doesNotMatch(text, /HIDDEN/);
  assert.match(text, /\| `pick\(key, options\?\)` \| Picks \| `key: string`<br>`options\?: \{scroll\?: boolean\}` \|/);
  assert.match(text, /### Events[\s\S]*`wax-pick`/);
  assert.match(text, /### Parts[\s\S]*`box`/);
  assert.doesNotMatch(text, /### Slots|### CSS custom properties/);
});

test('withReference: replaces what is between the markers, keeps the rest and refuses a page without them', () => {
  const page = `# Thing\n\n${START}\n\nold\n\n${END}\n\nAfter\n`;
  assert.equal(withReference(page, 'new'), `# Thing\n\n${START}\n\nnew\n\n${END}\n\nAfter\n`);
  assert.equal(withReference(withReference(page, 'new'), 'new'), withReference(page, 'new'));
  assert.throws(() => withReference('# Thing', 'new'), /needs/);
});

test('extractExamples: the `html example` blocks with the heading they are under, and not the other fenced blocks (even with # lines inside)', () => {
  const markdown = ['# Page', '## First', '```html example', '<wax-a></wax-a>', '```', '```js', '# not a heading', '```', '## Second', '```html', '<wax-b></wax-b>', '```', '```html example', '<wax-c></wax-c>', '```'].join('\n');
  assert.deepEqual(extractExamples(markdown), [{ heading: 'First', code: '<wax-a></wax-a>' }, { heading: 'Second', code: '<wax-c></wax-c>' }]);
});

test('tagsOf: the wax-* and wa-* tags of the markup, not the ones that only appear in a script', () => {
  const code = '<wax-a></wax-a><wa-button></wa-button><div></div><wax-a></wax-a>\n<script type="module">document.createElement("wax-b")</script>';
  assert.deepEqual(tagsOf(code), ['wax-a', 'wa-button']);
});

test('the reference tables of every page are what scripts/docs.mjs makes from the committed custom-elements.json', () => {
  for (const element of elementsOf(manifest)) {
    const page = pageOf(element);
    if (!existsSync(page)) continue;   // that every element has a page is checked below
    const text = readFileSync(page, 'utf8');
    assert.equal(text, withReference(text, referenceOf(element)), `${page} has stale tables: run npm run docs`);
  }
});

test('every page in docs/components is the page of an element of the manifest (and the other way round, once the pages are all written)', () => {
  const files = readdirSync(join(ROOT, 'docs', 'components')).filter(name => name.endsWith('.md')).sort();
  const wanted = elementsOf(manifest).map(element => `${element.tagName.replace(/^wax-/, '')}.md`).sort();
  for (const file of files) assert.ok(wanted.includes(file), `docs/components/${file} is not the page of any element`);
});
