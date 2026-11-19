// @ts-check

/**
 * Los botones de las pantallas son `wa-button` de Web Awesome (lib/webawesome). Esto los crea desde el codigo con lo que se usa aqui: el texto, si es
 * el principal (`variant="brand"`, relleno con el acento) o uno normal (`appearance="outlined"`), la forma de pildora, si envia un formulario y un
 * nombre para quien no ve el dibujo (un aspa, una flecha). Se usan los atributos y no las propiedades porque el componente puede no haberse
 * cargado todavia.
 *
 *   const guardar = Button.make(document, { text: 'Guardar', type: 'submit', primary: true });
 *   Button.setPrimary(guardar, false);
 */
export class Button {
  /**
   * @param {Document} document
   * @param {object} [options]
   * @param {string} [options.text] Lo que dice
   * @param {'button' | 'submit'} [options.type] `submit` envia el formulario que lo contiene
   * @param {string} [options.title] Lo que dice al dejar el raton encima
   * @param {string} [options.label] Su nombre para quien no ve lo que dibuja (si es un icono); si no, lo que dice
   * @param {boolean} [options.primary] El principal de la pantalla
   * @param {boolean} [options.pill] Redondeado del todo
   * @param {boolean} [options.disabled]
   * @returns {HTMLElement}
   */
  static make(document, { text = '', type = 'button', title, label, primary = false, pill = false, disabled = false } = {}) {
    const button = document.createElement('wa-button');
    button.setAttribute('type', type);
    button.textContent = text;
    if (title) button.setAttribute('title', title);
    if (pill) button.setAttribute('pill', '');
    if (disabled) button.setAttribute('disabled', '');
    Button.setPrimary(button, primary);
    if (label) button.setAttribute('aria-label', label);
    Button.forwardLabel(button);
    return button;
  }

  /**
   * El principal se rellena con el acento; los demas, solo el borde.
   *
   * @param {Element} button
   * @param {boolean} primary
   */
  static setPrimary(button, primary) {
    if (primary) {
      button.setAttribute('variant', 'brand');
      button.removeAttribute('appearance');
    } else {
      button.removeAttribute('variant');
      button.setAttribute('appearance', 'outlined');
    }
  }

  /**
   * `aria-label` puesto en el `wa-button` no llega al boton de dentro, que es el que leen los lectores de pantalla: se le pasa cuando el componente esta
   * listo.
   *
   * @param {Element} button
   */
  static forwardLabel(button) {
    const label = button.getAttribute('aria-label');
    if (!label) return;
    const ready = /** @type {any} */ (button).updateComplete ?? globalThis.customElements?.whenDefined('wa-button').then(() => /** @type {any} */ (button).updateComplete);
    Promise.resolve(ready).then(() => button.shadowRoot?.querySelector('[part~="base"]')?.setAttribute('aria-label', label));
  }

  /**
   * Los `wa-button` que ya estan en la pagina y llevan `aria-label`.
   *
   * @param {ParentNode} [root]
   */
  static forwardLabels(root = globalThis.document) {
    root.querySelectorAll('wa-button[aria-label]').forEach(button => Button.forwardLabel(button));
  }
}
