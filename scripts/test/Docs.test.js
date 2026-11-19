import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
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

test('every element of the manifest has its page in docs/components, and every page there belongs to an element', () => {
  const files = readdirSync(join(ROOT, 'docs', 'components')).filter(name => name.endsWith('.md')).sort();
  const wanted = elementsOf(manifest).map(element => `${element.tagName.replace(/^wax-/, '')}.md`).sort();
  assert.deepEqual(files, wanted);
  for (const element of elementsOf(manifest)) {
    const text = readFileSync(pageOf(element), 'utf8');
    assert.ok(text.includes(START) && text.includes(END), `${pageOf(element)} needs the markers of its reference`);
  }
});

test('docs/pages.json lists every Markdown page of docs/ once, and only those', () => {
  const listed = JSON.parse(readFileSync(join(ROOT, 'docs', 'pages.json'), 'utf8')).flatMap(section => section.pages.map(page => page.path)).sort();
  const found = [...readdirSync(join(ROOT, 'docs')).filter(name => name.endsWith('.md')), ...readdirSync(join(ROOT, 'docs', 'components')).map(name => `components/${name}`).filter(name => name.endsWith('.md'))].sort();
  assert.deepEqual(listed, found);
});

test('the links between pages point at pages and anchors that exist', () => {
  const pages = JSON.parse(readFileSync(join(ROOT, 'docs', 'pages.json'), 'utf8')).flatMap(section => section.pages.map(page => page.path));
  const slug = heading => heading.toLowerCase().replace(/[^a-z0-9 -]/g, '').trim().replace(/ /g, '-');
  const anchorsOf = path => [...readFileSync(join(ROOT, 'docs', path), 'utf8').matchAll(/^#{1,6}\s+(.+)$/gm)].map(match => slug(match[1]));
  for (const page of pages) {
    const text = readFileSync(join(ROOT, 'docs', page), 'utf8').replace(/```[\s\S]*?```/g, '');
    for (const [, target, anchor] of text.matchAll(/\]\(((?!https?:)[^)#\s]*)(?:#([^)\s]*))?\)/g)) {
      const path = target ? join(dirname(page), target).replace(/\\/g, '/') : page;
      assert.ok(pages.includes(path), `${page} links to ${target}, which is not a page`);
      if (anchor) assert.ok(anchorsOf(path).includes(anchor), `${page} links to #${anchor}, which is not a heading of ${path}`);
    }
  }
});

test('the events page lists every event of the manifest and every typed event class, and the theming page every custom property', () => {
  const events = readFileSync(join(ROOT, 'docs', 'events.md'), 'utf8');
  const theming = readFileSync(join(ROOT, 'docs', 'theming.md'), 'utf8');
  for (const element of elementsOf(manifest)) {
    for (const event of element.events ?? []) assert.ok(events.includes(`\`${event.name}\``), `docs/events.md does not mention ${event.name}`);
    for (const property of element.cssProperties ?? []) assert.ok(theming.includes(`\`${property.name}\``), `docs/theming.md does not mention ${property.name}`);
  }
  for (const [, name] of readFileSync(join(ROOT, 'src', 'events', 'events.js'), 'utf8').matchAll(/export \{ (\w+) \}/g)) assert.ok(events.includes(`\`${name}\``), `docs/events.md does not mention ${name}`);
});
