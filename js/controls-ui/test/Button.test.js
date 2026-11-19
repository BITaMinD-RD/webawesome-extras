
import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.js';

const { Button } = await load();

/** Un documento de pega: lo justo para crear un elemento con atributos y texto */
const fakeDocument = () => ({
  createElement: tag => {
    const attributes = new Map();
    return {
      tag, textContent: '', attributes,
      setAttribute: (name, value) => attributes.set(name, String(value)),
      getAttribute: name => attributes.get(name) ?? null,
      removeAttribute: name => attributes.delete(name),
      hasAttribute: name => attributes.has(name)
    };
  }
});

test('Button.make: un wa-button normal es de solo borde, de tipo button y con su texto', () => {
  const button = Button.make(fakeDocument(), { text: 'Guardar' });
  assert.equal(button.tag, 'wa-button');
  assert.equal(button.textContent, 'Guardar');
  assert.equal(button.getAttribute('type'), 'button');
  assert.equal(button.getAttribute('appearance'), 'outlined');
  assert.equal(button.hasAttribute('variant'), false);
  assert.equal(button.hasAttribute('pill'), false);
  assert.equal(button.hasAttribute('disabled'), false);
});

test('Button.make: el principal es de la variante brand y lleva el relleno; submit, pildora, titulo y desactivado se ponen como atributos', () => {
  const button = Button.make(fakeDocument(), { text: 'Crear', type: 'submit', primary: true, pill: true, title: 'Crea', disabled: true });
  assert.equal(button.getAttribute('variant'), 'brand');
  assert.equal(button.hasAttribute('appearance'), false);
  assert.equal(button.getAttribute('type'), 'submit');
  assert.equal(button.hasAttribute('pill'), true);
  assert.equal(button.getAttribute('title'), 'Crea');
  assert.equal(button.hasAttribute('disabled'), true);
});

test('Button.setPrimary: cambia de uno a otro las veces que haga falta', () => {
  const button = Button.make(fakeDocument(), { text: 'Verde' });
  Button.setPrimary(button, true);
  assert.deepEqual([button.getAttribute('variant'), button.getAttribute('appearance')], ['brand', null]);
  Button.setPrimary(button, false);
  assert.deepEqual([button.getAttribute('variant'), button.getAttribute('appearance')], [null, 'outlined']);
});

test('Button.make: el nombre de un boton que solo dibuja un icono queda en aria-label', () => {
  const button = Button.make(fakeDocument(), { text: '×', title: 'Quitar', label: 'Quitar equipo' });
  assert.equal(button.getAttribute('aria-label'), 'Quitar equipo');
});
