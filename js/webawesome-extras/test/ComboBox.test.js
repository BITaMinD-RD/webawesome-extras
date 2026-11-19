
import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.js';

const { ComboBox } = await load();

const choices = [
  { value: 'es', label: 'España' }, { value: 'fr', label: 'Francia' }, { value: 'de', label: 'Alemania' }, { value: 'ar', label: 'Arabia Saudí' }
];

test('ComboBox.normalize: sin mayusculas ni acentos', () => {
  assert.equal(ComboBox.normalize('  ESPAÑA Saudí '), 'espana saudi');
});

test('ComboBox.filter: todas las palabras, sin acentos, y las que empiezan por lo escrito primero', () => {
  assert.deepEqual(ComboBox.filter(choices, '').map(c => c.value), ['es', 'fr', 'de', 'ar']);
  assert.deepEqual(ComboBox.filter(choices, 'ESP').map(c => c.value), ['es']);
  assert.deepEqual(ComboBox.filter(choices, 'a').map(c => c.value), ['de', 'ar', 'es', 'fr']);   // Alemania y Arabia empiezan por «a»
  assert.deepEqual(ComboBox.filter(choices, 'arabia saudi').map(c => c.value), ['ar']);
  assert.deepEqual(ComboBox.filter(choices, 'zzz'), []);
});

test('ComboBox.step: da la vuelta por los dos lados y sin lista no hay posicion', () => {
  assert.equal(ComboBox.step(-1, 1, 3), 0);
  assert.equal(ComboBox.step(-1, -1, 3), 2);
  assert.equal(ComboBox.step(2, 1, 3), 0);
  assert.equal(ComboBox.step(0, -1, 3), 2);
  assert.equal(ComboBox.step(1, 1, 0), -1);
});
