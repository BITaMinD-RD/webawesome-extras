// @ts-check

/**
 * Los si o no de las pantallas: un interruptor (`wa-switch`) para un ajuste y una casilla (`wa-checkbox`) para marcar algo de una lista, de Web Awesome (lib/webawesome).
 * Esto los crea desde el codigo. El texto es lo que lleva dentro, y se leen y escriben con `checked` y avisan con `change`, como una casilla del navegador. Se usan los
 * atributos y las propiedades a la vez porque el componente puede no haberse cargado todavia.
 *
 *   const doble = Toggle.make(document, { text: 'Ida y vuelta', checked: true });
 *   doble.addEventListener('change', () => usar(doble.checked));
 */
export class Toggle {
  /**
   * @param {Document} document
   * @param {object} [options]
   * @param {string} [options.text] Lo que dice, al lado
   * @param {boolean} [options.checked]
   * @param {boolean} [options.checkbox] Una casilla y no un interruptor
   * @param {string} [options.title] Lo que dice al dejar el raton encima
   * @param {string} [options.name] El nombre con el que lo lee un formulario
   * @param {string} [options.className]
   * @returns {HTMLElement}
   */
  static make(document, { text = '', checked = false, checkbox = false, title, name, className } = {}) {
    const toggle = document.createElement(checkbox ? 'wa-checkbox' : 'wa-switch');
    toggle.textContent = text;
    if (checked) toggle.setAttribute('checked', '');
    /** @type {any} */ (toggle).checked = checked;
    if (title) toggle.setAttribute('title', title);
    if (name) toggle.setAttribute('name', name);
    if (className) toggle.setAttribute('class', className);
    return toggle;
  }
}
