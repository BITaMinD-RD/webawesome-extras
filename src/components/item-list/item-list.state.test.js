import test from 'node:test';
import assert from 'node:assert/strict';
import { ItemListState } from './item-list.state.js';

test('ItemListState.click: a plain click selects, the same one again clears; with a modifier it marks and unmarks, in the order marked', () => {
  const state = new ItemListState();
  assert.deepEqual(state.click('a', null, false), { type: 'select', key: 'a' });
  assert.deepEqual(state.click('a', 'a', false), { type: 'select', key: null });
  assert.deepEqual(state.click('b', 'a', false), { type: 'select', key: 'b' });
  assert.deepEqual(state.click('b', null, true), { type: 'mark', keys: ['b'] });
  assert.deepEqual(state.click('a', null, true), { type: 'mark', keys: ['b', 'a'] });
  assert.deepEqual(state.click('b', null, true), { type: 'mark', keys: ['a'] });
  assert.deepEqual([...state.marked], ['a']);
});

test('ItemListState.keep: the marks of lines that are no longer there go, the others stay', () => {
  const state = new ItemListState();
  for (const key of ['a', 'b', 'c']) state.click(key, null, true);
  state.keep(['c', 'a', 'z']);
  assert.deepEqual([...state.marked], ['a', 'c']);
});

test('ItemListState.dragged: the dragged key goes before the one it is over, or after it in its lower half; over itself nothing changes', () => {
  const order = ['a', 'b', 'c', 'd'];
  assert.deepEqual(ItemListState.dragged(order, 'd', 'b', false), ['a', 'd', 'b', 'c']);
  assert.deepEqual(ItemListState.dragged(order, 'a', 'c', true), ['b', 'c', 'a', 'd']);
  assert.deepEqual(ItemListState.dragged(order, 'a', 'b', false), order);
  assert.equal(ItemListState.dragged(order, 'a', 'a', true), order);
  assert.equal(ItemListState.dragged(order, 'x', 'a', true), order);
});

test('ItemListState.stepped: one place up or down, and nothing at the ends', () => {
  const order = ['a', 'b', 'c'];
  assert.deepEqual(ItemListState.stepped(order, 'b', -1), ['b', 'a', 'c']);
  assert.deepEqual(ItemListState.stepped(order, 'b', 1), ['a', 'c', 'b']);
  assert.equal(ItemListState.stepped(order, 'a', -1), null);
  assert.equal(ItemListState.stepped(order, 'c', 1), null);
  assert.equal(ItemListState.stepped(order, 'x', 1), null);
  assert.deepEqual(order, ['a', 'b', 'c']);
});

test('ItemListState.gesture and uncovers: a mostly sideways movement is a slide, a mostly vertical one is the list scrolling, and 48 px to the left uncovers', () => {
  assert.equal(ItemListState.gesture(-30, 5), 'slide');
  assert.equal(ItemListState.gesture(5, 30), 'scroll');
  assert.equal(ItemListState.gesture(3, 4), 'wait');
  assert.equal(ItemListState.uncovers(-49), true);
  assert.equal(ItemListState.uncovers(-48), false);
  assert.equal(ItemListState.uncovers(20), false);
});
