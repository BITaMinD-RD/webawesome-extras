import test from 'node:test';
import assert from 'node:assert/strict';
import { FloatingCardState } from '../FloatingCardState.js';

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

test('FloatingCardState.position: under the thing; above if it does not fit below; inside the window sideways', () => {
  const view = { width: 1000, height: 800 };
  const card = { width: 300, height: 200 };
  assert.deepEqual(FloatingCardState.position({ top: 100, bottom: 120, left: 50 }, card, view), { top: 126, left: 50 });
  assert.deepEqual(FloatingCardState.position({ top: 700, bottom: 720, left: 50 }, card, view), { top: 494, left: 50 }, 'above');
  assert.deepEqual(FloatingCardState.position({ top: 100, bottom: 120, left: 900 }, card, view), { top: 126, left: 692 }, 'not out on the right');
  assert.deepEqual(FloatingCardState.position({ top: 100, bottom: 120, left: -40 }, card, view), { top: 126, left: 8 }, 'nor on the left');
  assert.deepEqual(FloatingCardState.position({ top: 20, bottom: 780, left: 50 }, card, view), { top: 8, left: 50 }, 'not above the window');
});
