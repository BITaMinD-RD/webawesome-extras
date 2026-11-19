// @ts-check

/**
 * Las cajas de las pantallas son `wa-input` (y `wa-textarea` para varias lineas) de Web Awesome (lib/webawesome). Esto las crea desde el codigo con lo que se
 * usa aqui: el tipo, el valor, lo que dice mientras esta vacia, su etiqueta y el teclado que se le ofrece en el movil. Se usan los atributos y no las
 * propiedades porque el componente puede no haberse cargado todavia; despues se leen y se escriben con `value`, y avisan con `input` y `change`.
 *
 *   const nombre = Input.make(document, { label: 'Nombre', placeholder: 'Como lo llamas' });
 *   const notas = Input.make(document, { type: 'textarea', label: 'Notas', rows: 2 });
 *
 * Una hora (`type: 'time'`) es un `wa-time-input`: hora y minutos por separado, con su lista para elegir, siempre de 24 horas, y el valor
 * como el de la caja del navegador (`HH:mm`).
 */
export class Input {
  /**
   * @param {Document} document
   * @param {object} [options]
   * @param {string} [options.type] `text`, `number`, `date`, `time`, `search`...; `textarea` es una caja de varias lineas
   * @param {string | number} [options.value]
   * @param {string} [options.placeholder]
   * @param {string} [options.label] Encima de la caja
   * @param {string} [options.inputmode] El teclado del movil: `numeric`, `decimal`...
   * @param {number} [options.rows] Las lineas de un `textarea`
   * @param {string} [options.className]
   * @param {boolean} [options.clearable] Con el aspa para vaciarla
   * @param {number} [options.step] De una hora: cuantos segundos van de una a la siguiente en su lista (300, de cinco en cinco minutos)
   * @returns {HTMLElement}
   */
  static make(document, { type = 'text', value = '', placeholder = '', label = '', inputmode, rows, className, clearable = false, step } = {}) {
    const textarea = type === 'textarea';
    const time = type === 'time';
    const box = document.createElement(textarea ? 'wa-textarea' : time ? 'wa-time-input' : 'wa-input');
    if (time) box.setAttribute('hour-format', '24');
    else if (!textarea) box.setAttribute('type', type);
    if (time && step) box.setAttribute('step', String(step));
    // El valor, como atributo y como propiedad: si el componente aun no esta cargado, `value` se lee igual. Y nunca sin valor: una caja vacia de Web Awesome
    // da `null` y no `''`, como la daria una caja del navegador
    box.setAttribute('value', String(value));
    /** @type {any} */ (box).value = String(value);
    if (placeholder) box.setAttribute('placeholder', placeholder);
    if (label) box.setAttribute('label', label);
    if (inputmode) box.setAttribute('inputmode', inputmode);
    if (textarea && rows) box.setAttribute('rows', String(rows));
    if (className) box.setAttribute('class', className);
    if (clearable && !textarea) box.setAttribute('with-clear', '');
    return box;
  }

  /** Donde se escribe: las cajas del navegador, que son tambien las que llevan dentro las de Web Awesome */
  static TYPING = 'input, textarea, select, [contenteditable]';

  /**
   * Si un evento del teclado sale de donde se escribe, para no quitarle sus atajos (Ctrl+Z es alli deshacer lo escrito). Fuera de un `wa-input` el
   * evento parece salir del propio componente, que no es una caja: la de verdad esta dentro, y es la primera de su camino.
   *
   * @param {Event} event
   * @returns {boolean}
   */
  static isTyping(event) {
    const origin = /** @type {any} */ (event.composedPath?.()[0] ?? event.target);
    return Boolean(origin?.closest?.(Input.TYPING));
  }
}
