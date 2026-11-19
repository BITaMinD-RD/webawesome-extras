import test from 'node:test';
import assert from 'node:assert/strict';
import { ComboboxState } from '../ComboboxState.js';

const choices = [
  { value: 'es', label: 'España' }, { value: 'fr', label: 'Francia' }, { value: 'de', label: 'Alemania' }, { value: 'ar', label: 'Arabia Saudí' }
];

test('ComboboxState.normalize: sin mayusculas ni acentos', () => {
  assert.equal(ComboboxState.normalize('  ESPAÑA Saudí '), 'espana saudi');
});

test('ComboboxState.filter: todas las palabras, sin acentos, y las que empiezan por lo escrito primero', () => {
  assert.deepEqual(ComboboxState.filter(choices, '').map(c => c.value), ['es', 'fr', 'de', 'ar']);
  assert.deepEqual(ComboboxState.filter(choices, 'ESP').map(c => c.value), ['es']);
  assert.deepEqual(ComboboxState.filter(choices, 'a').map(c => c.value), ['de', 'ar', 'es', 'fr']);   // Alemania y Arabia empiezan por «a»
  assert.deepEqual(ComboboxState.filter(choices, 'arabia saudi').map(c => c.value), ['ar']);
  assert.deepEqual(ComboboxState.filter(choices, 'zzz'), []);
});

test('ComboboxState.arrange: las que encajan primero y a la vista, las otras detras y escondidas', () => {
  assert.deepEqual(ComboboxState.arrange(choices, 'ar').map(a => [a.choice.value, a.shown]), [['ar', true], ['es', false], ['fr', false], ['de', false]]);
  assert.deepEqual(ComboboxState.arrange(choices, '').every(a => a.shown), true);
  assert.deepEqual(ComboboxState.arrange(choices, 'zzz').map(a => a.shown), [false, false, false, false]);
});

test('ComboboxState.valid: un valor que no esta entre las opciones es nada', () => {
  assert.equal(ComboboxState.valid(choices, 'fr'), 'fr');
  assert.equal(ComboboxState.valid(choices, 'it'), '');
  assert.equal(ComboboxState.valid([], 'fr'), '');
});
