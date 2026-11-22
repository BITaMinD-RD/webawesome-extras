import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { END, START, elementsOf, referenceOf, withReference } from '../DocsTables.js';
import { extractExamples, tagsOf } from '../../docs/site/examples.js';
import { cardsOf } from '../../docs/site/gallery.js';

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

test('every element of the manifest has its page in docs/components, and every page there belongs to an element (but the gallery, index.md)', () => {
  const files = readdirSync(join(ROOT, 'docs', 'components')).filter(name => name.endsWith('.md') && name !== 'index.md').sort();
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

const sections = () => JSON.parse(readFileSync(join(ROOT, 'docs', 'pages.json'), 'utf8'));

test('cardsOf: a card per element with the name of its page, its tag, summary, version and preview, in the order of the pages', () => {
  const manifest = { modules: [{ declarations: [
    { kind: 'class', name: 'Helper' },
    { kind: 'class', name: 'WaxB', tagName: 'wax-b', customElement: true, summary: 'Second.', since: '0.2.0' },
    { kind: 'class', name: 'WaxA', tagName: 'wax-a', customElement: true, summary: 'First.', since: '0.1.0' }
  ] }] };
  const pages = [{ title: 'Things', pages: [{ title: 'All', path: 'components/index.md' }, { title: 'A', path: 'components/a.md', preview: '<wax-a></wax-a>' }, { title: 'B', path: 'components/b.md', preview: '<wax-b></wax-b>' }] }];
  assert.deepEqual(cardsOf(pages, manifest), [
    { name: 'A', tag: 'wax-a', summary: 'First.', since: '0.1.0', path: 'components/a.md', preview: '<wax-a></wax-a>' },
    { name: 'B', tag: 'wax-b', summary: 'Second.', since: '0.2.0', path: 'components/b.md', preview: '<wax-b></wax-b>' }
  ]);
  const without = field => {
    const copy = structuredClone(manifest);
    delete copy.modules[0].declarations.find(item => item.tagName === 'wax-a')[field];
    return copy;
  };
  assert.throws(() => cardsOf(pages, without('summary')), /no @summary/);
  assert.throws(() => cardsOf(pages, without('since')), /no @since/);
  assert.throws(() => cardsOf([{ title: 'Things', pages: [{ title: 'A', path: 'components/a.md' }, { title: 'B', path: 'components/b.md', preview: '<wax-b></wax-b>' }] }], manifest), /no "preview"/);
  assert.throws(() => cardsOf([{ title: 'Things', pages: [{ title: 'B', path: 'components/b.md', preview: '<wax-b></wax-b>' }] }], manifest), /no page/);
});

test('the gallery has a card for every element of the manifest: each with its sentence (@summary), its version (@since) and its preview in docs/pages.json', () => {
  const cards = cardsOf(sections(), manifest);
  assert.deepEqual(cards.map(card => card.tag).sort(), elementsOf(manifest).map(element => element.tagName).sort());
  for (const card of cards) {
    assert.match(card.since, /^\d+\.\d+\.\d+$/);
    assert.ok(card.preview.includes(`<${card.tag}`), `the preview of ${card.tag} does not use it`);
  }
});

test('docs/components/index.md, the gallery page, is the first one of the components in docs/pages.json and has the place for the cards', () => {
  assert.equal(sections().find(section => section.title === 'Components').pages[0].path, 'components/index.md');
  assert.ok(readFileSync(join(ROOT, 'docs', 'components', 'index.md'), 'utf8').includes('<div data-gallery></div>'));
});
