
import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.js';
import { BackClose } from '../../history/BackClose.js';

const { FloatingCard } = await load();

/** Lo poco del DOM que usa: elementos con clases, hijos y escuchas, un body, y una ventana con o sin raton */
const fakeDocument = ({ mouse = true } = {}) => {
  const listeners = {};
  const make = tag => {
    const el = {
      tagName: tag.toUpperCase(), className: '', innerHTML: '', textContent: '', style: {}, children: [], parent: null, attributes: {}, events: {},
      classList: {
        add: (...names) => { el.className = [...new Set([...el.className.split(' ').filter(Boolean), ...names])].join(' '); },
        contains: name => el.className.split(' ').includes(name)
      },
      setAttribute(name, value) { el.attributes[name] = value; },
      addEventListener(type, fn) { (el.events[type] ??= []).push(fn); },
      append(...children) { children.forEach(child => { child.parent = el; el.children.push(child); }); },
      appendChild(child) { el.append(child); return child; },
      insertAdjacentHTML(_where, html) { el.innerHTML += html; },
      remove() { if (el.parent) el.parent.children = el.parent.children.filter(c => c !== el); el.parent = null; },
      contains(other) { for (let x = other; x; x = x.parent) if (x === el) return true; return false; },
      getBoundingClientRect: () => ({ top: 100, bottom: 120, left: 50, width: 300, height: 200 }),
      fire(type) { (el.events[type] ?? []).forEach(fn => fn({ target: el })); }
    };
    Object.defineProperty(el, 'innerHTML', {
      get() { return el._html ?? ''; },
      set(value) { el._html = value; if (value === '') el.children = []; }
    });
    return el;
  };
  const body = make('body');
  const doc = {
    body,
    createElement: make,
    addEventListener(type, fn) { (listeners[type] ??= []).push(fn); },
    removeEventListener(type, fn) { listeners[type] = (listeners[type] ?? []).filter(f => f !== fn); },
    /** Lo que llega al documento: un clic en `target`, una tecla */
    fire(type, event) { (listeners[type] ?? []).slice().forEach(fn => fn(event)); },
    defaultView: { matchMedia: () => ({ matches: mouse }), innerHeight: 800, innerWidth: 1000, scrollY: 0 }
  };
  return doc;
};

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const cards = doc => doc.body.children.filter(c => c.classList.contains('floating-card'));

test('FloatingCard.show: next to what was clicked, with its close button; the same click again, Escape or a click outside close it', async () => {
  const doc = fakeDocument();
  const shown = [];
  const card = new FloatingCard({ document: doc, className: 'ficha', closeLabel: 'Cerrar', onShow: el => shown.push(el.innerHTML) });
  const near = doc.createElement('button');

  const el = card.show('<p>Sábado</p>', near);
  assert.deepEqual(cards(doc), [el]);
  assert.equal(el.className, 'floating-card ficha');
  assert.equal(el.children[0].className, 'floating-card-close');
  assert.equal(el.children[0].attributes['aria-label'], 'Cerrar');
  assert.deepEqual(shown, ['<p>Sábado</p>']);
  assert.equal(el.style.top, '126px', 'under it');

  assert.equal(card.show('<p>Sábado</p>', near), null, 'again: it closes');
  assert.equal(cards(doc).length, 0);

  card.show('<p>Sábado</p>', near);
  doc.fire('keydown', { key: 'Escape' });
  assert.equal(card.element, null);

  const other = card.show('<p>Domingo</p>', near);
  await wait(0);
  doc.fire('click', { target: other.children[0] });
  assert.equal(card.element, other, 'a click inside does not close it');
  other.children[0].fire('click');
  assert.equal(card.element, null, 'its own close button');
  card.show('<p>Domingo</p>', near);
  await wait(0);
  doc.fire('click', { target: doc.createElement('div') });
  assert.equal(card.element, null, 'a click outside');
  assert.equal(card.show('', near), null, 'with nothing to say, nothing');
});

test('FloatingCard.peek: with a mouse it shows a moment later, unpinned, and goes when the pointer leaves; inside the card it stays', async () => {
  const doc = fakeDocument();
  const card = new FloatingCard({ document: doc, delay: 5 });
  const near = doc.createElement('li');
  let asked = 0;

  card.peek(() => { asked++; return '<p>Martes</p>'; }, near);
  assert.equal(card.element, null);
  await wait(15);
  assert.equal(asked, 1, 'the content is asked when it shows');
  assert.ok(card.element.classList.contains('peeking'));

  card.leave();
  card.element.fire('mouseenter');
  await wait(FloatingCard.GRACE + 20);
  assert.ok(card.element, 'the pointer went into the card');

  card.leave();
  await wait(FloatingCard.GRACE + 20);
  assert.equal(card.element, null);

  // Pinned, leaving does not close it
  card.show('<p>Martes</p>', near);
  card.leave();
  await wait(FloatingCard.GRACE + 20);
  assert.ok(card.element);
});

test('FloatingCard without a mouse: in the middle, the rest dimmed, and Back closes it; peeking does nothing', async () => {
  const doc = fakeDocument({ mouse: false });
  const entries = [];
  const listeners = [];
  BackClose.use({
    history: { get state() { return entries.at(-1) ?? null; }, pushState(state) { entries.push(state); }, back() { entries.pop(); listeners.forEach(f => f()); } },
    addEventListener(type, f) { if (type === 'popstate') listeners.push(f); }
  });
  const card = new FloatingCard({ document: doc, delay: 1 });
  const near = doc.createElement('button');

  card.peek(() => '<p>Lunes</p>', near);
  await wait(10);
  assert.equal(card.element, null);

  const el = card.show('<p>Lunes</p>', near);
  assert.ok(el.classList.contains('centered'));
  assert.equal(el.style.top, undefined, 'the CSS places it');
  assert.equal(doc.body.children.filter(c => c.className === 'floating-card-backdrop').length, 1);
  assert.equal(entries.length, 1);

  card.close();
  assert.equal(doc.body.children.length, 0, 'card and backdrop gone');
  assert.equal(entries.length, 0, 'the step of the history given back');
});

test('FloatingCard.replace: another content in the same card, with onShow again', () => {
  const doc = fakeDocument();
  let shown = 0;
  const card = new FloatingCard({ document: doc, onShow: () => { shown++; } });
  const el = card.show('<p>Uno</p>', doc.createElement('button'));
  card.replace('<table class="clasificacion"></table>');
  assert.equal(card.element, el);
  assert.equal(el.innerHTML, '<table class="clasificacion"></table>');
  assert.equal(el.children.length, 1, 'one close button');
  assert.equal(shown, 2);
});

test('FloatingCard content: a function paints into a container it is given, a node goes in as it is, and one that comes to nothing shows nothing', () => {
  const doc = fakeDocument();
  const shown = [];
  const card = new FloatingCard({ document: doc, onShow: el => shown.push(el.children.length) });
  const near = doc.createElement('button');

  const el = card.show(body => {
    assert.equal(body.className, 'floating-card-body');
    const p = doc.createElement('p');
    body.append(p);
  }, near);
  assert.equal(el.children.length, 2, 'the close button and the container');
  assert.equal(el.children[1].className, 'floating-card-body');
  assert.equal(el.children[1].children.length, 1, 'what it painted');
  assert.deepEqual(shown, [2], 'onShow after it is in');
  card.close();

  assert.equal(card.show(body => '<p>Sábado</p>', near).innerHTML, '<p>Sábado</p>', 'a function can give back HTML, like a thunk');
  card.close();

  const node = doc.createElement('section');
  assert.equal(card.show(() => node, near).children[1], node, 'or a node');
  card.close();
  assert.equal(card.show(node, near).children[1], node, 'a node without a function');
  card.close();

  assert.equal(card.show(() => {}, near), null, 'painted nothing: nothing is shown');
  assert.equal(card.show(() => '', near), null);
  assert.equal(card.element, null);
  assert.equal(doc.body.children.length, 0, 'nor leaves anything behind');
});

test('FloatingCard.replace: the same card with other content, of any kind, keeping the close button', () => {
  const doc = fakeDocument();
  const card = new FloatingCard({ document: doc });
  const el = card.show('<p>Uno</p>', doc.createElement('button'));

  card.replace(body => { body.append(doc.createElement('table')); });
  assert.equal(card.element, el);
  assert.equal(el.children[0].className, 'floating-card-close');
  assert.equal(el.children[1].className, 'floating-card-body');

  card.replace('<p>Tres</p>');
  assert.equal(el.children.length, 1, 'only the close button is left as a child; the text is HTML');
  assert.equal(el.innerHTML, '<p>Tres</p>');
});
