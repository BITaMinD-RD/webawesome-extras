import test from 'node:test';
import assert from 'node:assert/strict';
import { AskEachState } from '../AskEachState.js';

test('AskEachState: cada contestacion avanza una pregunta y al final da lo contestado en orden', () => {
  const run = new AskEachState(3);
  assert.deepEqual([run.index, run.total, run.done], [0, 3, false]);
  assert.equal(run.answer('yes'), false);
  assert.equal(run.index, 1);
  run.answer('no');
  assert.equal(run.answer('yes'), true);
  assert.deepEqual(run.result, [true, false, true]);
  assert.equal(run.all, false);
});

test('AskEachState: «a todos» contesta el resto igual y termina; lo anterior se queda como estaba', () => {
  const run = new AskEachState(5);
  run.answer('no');
  run.answer('yes');
  assert.equal(run.answer('noAll'), true);
  assert.deepEqual(run.result, [false, true, false, false, false]);
  assert.equal(run.all, true);
  const yes = new AskEachState(2);
  yes.answer('yesAll');
  assert.deepEqual(yes.result, [true, true]);
});

test('AskEachState: cancelar no da nada, ni siquiera lo ya contestado, y despues nada cambia', () => {
  const run = new AskEachState(4);
  run.answer('yes');
  assert.equal(run.answer('cancel'), true);
  assert.equal(run.cancelled, true);
  assert.equal(run.result, null);
  run.answer('yes');
  assert.equal(run.result, null);
});

test('AskEachState: con una contestacion previa para todos no queda nada que preguntar', () => {
  assert.deepEqual(new AskEachState(2, false).result, [false, false]);
  assert.equal(new AskEachState(2, true).done, true);
  assert.deepEqual(new AskEachState(0).result, []);
});
