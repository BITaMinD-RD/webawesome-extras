
import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.js';

const { Input } = await load();

/** Un documento de pega: lo justo para crear un elemento con atributos */
const fakeDocument = () => ({
  createElement: tag => {
    const attributes = new Map();
    return {
      tag, attributes,
      setAttribute: (name, value) => attributes.set(name, String(value)),
      getAttribute: name => attributes.get(name) ?? null,
      hasAttribute: name => attributes.has(name)
    };
  }
});

test('Input.make: una caja de texto es un wa-input de tipo text, vacia y sin nada mas', () => {
  const box = Input.make(fakeDocument());
  assert.equal(box.tag, 'wa-input');
  assert.equal(box.getAttribute('type'), 'text');
  assert.equal(box.getAttribute('value'), '', 'vacia, y no sin valor: asi se lee como un texto vacio');
  assert.equal(box.value, '');
  for (const name of ['placeholder', 'label', 'inputmode', 'class', 'with-clear']) assert.equal(box.hasAttribute(name), false, name);
});

test('Input.make: tipo, valor, texto de ayuda, etiqueta y teclado se ponen como atributos; el 0 es un valor', () => {
  const box = Input.make(fakeDocument(), { type: 'number', value: 0, placeholder: 'Minutos', label: 'Duracion', inputmode: 'numeric', className: 'small' });
  assert.deepEqual(['type', 'value', 'placeholder', 'label', 'inputmode', 'class'].map(n => box.getAttribute(n)), ['number', '0', 'Minutos', 'Duracion', 'numeric', 'small']);
});

test('Input.make: textarea es un wa-textarea con sus lineas y sin tipo, y solo las cajas de una linea llevan el aspa de vaciar', () => {
  const area = Input.make(fakeDocument(), { type: 'textarea', rows: 2, clearable: true });
  assert.equal(area.tag, 'wa-textarea');
  assert.equal(area.getAttribute('rows'), '2');
  assert.equal(area.hasAttribute('type'), false);
  assert.equal(area.hasAttribute('with-clear'), false);
  assert.equal(Input.make(fakeDocument(), { type: 'search', clearable: true }).hasAttribute('with-clear'), true);
});

test('Input.make: una hora es un wa-time-input de 24 horas, sin tipo, con su salto si se da', () => {
  const box = Input.make(fakeDocument(), { type: 'time', value: '10:00', label: 'De', step: 300 });
  assert.equal(box.tag, 'wa-time-input');
  assert.equal(box.hasAttribute('type'), false);
  assert.deepEqual(['hour-format', 'step', 'value', 'label'].map(n => box.getAttribute(n)), ['24', '300', '10:00', 'De']);
  assert.equal(Input.make(fakeDocument(), { type: 'time' }).hasAttribute('step'), false);
});

test('Input.isTyping: una tecla dentro de un wa-input sale de su caja de dentro, aunque fuera parezca salir del componente', () => {
  const element = matches => ({ closest: selector => (selector === Input.TYPING && matches ? {} : null) });
  const inner = element(true);
  const host = element(false);
  assert.equal(Input.isTyping({ target: host, composedPath: () => [inner, host] }), true, 'dentro de un wa-input');
  assert.equal(Input.isTyping({ target: host, composedPath: () => [host] }), false, 'en un boton, o en la pagina');
  assert.equal(Input.isTyping({ target: inner }), true, 'sin camino, lo que diga de donde sale');
  assert.equal(Input.isTyping({ target: {}, composedPath: () => [] }), false);
});
