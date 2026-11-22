import test from 'node:test';
import assert from 'node:assert/strict';
import { FloatingCardState } from './floating-card.state.js';

test('FloatingCardState.hasMouse: asks the window each time', () => {
  let mouse = true;
  const window = { matchMedia: query => ({ matches: query.includes('hover: hover') && mouse }) };
  assert.equal(FloatingCardState.hasMouse(window), true);
  mouse = false;
  assert.equal(FloatingCardState.hasMouse(window), false);
});

test('FloatingCardState.closesOnShow: only a pinned card, shown again next to the same thing', () => {
  const day = {};
  assert.equal(FloatingCardState.closesOnShow(true, true, day, day), true);
  assert.equal(FloatingCardState.closesOnShow(true, true, day, {}), false, 'another thing');
  assert.equal(FloatingCardState.closesOnShow(true, false, day, day), false, 'it only peeks');
  assert.equal(FloatingCardState.closesOnShow(false, true, day, day), false, 'it is closed');
});
