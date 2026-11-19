
import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.js';

const { Dirty } = await load();

/** Un elemento con lo justo para avisar de cambios */
const fakeElement = () => {
  const listeners = {};
  return { listeners, addEventListener(type, f) { listeners[type] = f; }, removeEventListener(type, f) { if (listeners[type] === f) delete listeners[type]; }, fire(type) { listeners[type]?.(); } };
};

test('Dirty: the button is off at the start, on with a change, and off again when it goes back to how it was', () => {
  const element = fakeElement();
  const button = { disabled: false };
  let value = 'a';
  const dirty = new Dirty({ element, button, snapshot: () => value });
  assert.equal(button.disabled, true);
  assert.equal(dirty.changed, false);

  value = 'b';
  element.fire('input');
  assert.deepEqual([button.disabled, dirty.changed], [false, true]);
  value = 'a';
  element.fire('change');
  assert.equal(button.disabled, true);
});

test('Dirty.rebase: what there is now becomes the starting point (after saving, or when another thing is opened in the same form)', () => {
  const element = fakeElement();
  const button = { disabled: false };
  let value = 'a';
  const dirty = new Dirty({ element, button, snapshot: () => value });
  value = 'b';
  element.fire('input');
  assert.equal(button.disabled, false);
  dirty.rebase();
  assert.equal(button.disabled, true);
  value = 'a';
  element.fire('change');
  assert.equal(button.disabled, false);
});

test('Dirty.dispose: it stops watching the form', () => {
  const element = fakeElement();
  const button = { disabled: false };
  let value = 'a';
  const dirty = new Dirty({ element, button, snapshot: () => value });
  dirty.dispose();
  value = 'b';
  element.fire('input');
  assert.equal(button.disabled, true, 'it no longer repaints the button');
});
