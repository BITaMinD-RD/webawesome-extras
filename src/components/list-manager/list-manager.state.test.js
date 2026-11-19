import test from 'node:test';
import assert from 'node:assert/strict';
import { ListManagerState } from './list-manager.state.js';

test('ListManagerState.chosen: a line chosen is announced and remembered; the list clearing it announces nothing and the chosen one stays', () => {
  const state = new ListManagerState();
  assert.equal(state.current, null);
  assert.equal(state.chosen('a'), 'a');
  assert.equal(state.current, 'a');
  assert.equal(state.chosen(null), null, 'the same line again: nothing to announce');
  assert.equal(state.current, 'a', 'and it stays chosen');
  assert.equal(state.chosen('b'), 'b');
  assert.equal(state.current, 'b');
});
