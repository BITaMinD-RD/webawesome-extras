
import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.js';

const { Toggle } = await load();

/** Un documento de pega: lo justo para crear un elemento con atributos y texto */
const fakeDocument = () => ({
  createElement: tag => {
    const attributes = new Map();
    return {
      tag, textContent: '', attributes,
      setAttribute: (name, value) => attributes.set(name, String(value)),
      getAttribute: name => attributes.get(name) ?? null,
      hasAttribute: name => attributes.has(name)
    };
  }
});

test('Toggle.make: por defecto es un wa-switch apagado con su texto', () => {
  const toggle = Toggle.make(fakeDocument(), { text: 'Ida y vuelta' });
  assert.equal(toggle.tag, 'wa-switch');
  assert.equal(toggle.textContent, 'Ida y vuelta');
  assert.equal(toggle.checked, false);
  assert.equal(toggle.hasAttribute('checked'), false);
});

test('Toggle.make: marcado, titulo, nombre y clase se ponen como atributos, y `checked` se lee igual aunque el componente no este cargado', () => {
  const toggle = Toggle.make(fakeDocument(), { text: 'Con clasificacion', checked: true, title: 'Ayuda', name: 'tabla', className: 'campos-interruptor' });
  assert.equal(toggle.hasAttribute('checked'), true);
  assert.equal(toggle.checked, true);
  assert.deepEqual(['title', 'name', 'class'].map(n => toggle.getAttribute(n)), ['Ayuda', 'tabla', 'campos-interruptor']);
});

test('Toggle.make: con `checkbox` es un wa-checkbox', () => {
  assert.equal(Toggle.make(fakeDocument(), { checkbox: true }).tag, 'wa-checkbox');
});
