// @ts-check

/**
 * Un aviso corto abajo de la pantalla, con un boton de accion si hace falta («Equipo borrado · DESHACER»): sale, se quita solo a los pocos segundos y no bloquea nada ni pide
 * confirmacion antes. Es el «snackbar» de Material Design, hecho con un `wa-toast` de Web Awesome (lib/webawesome, que la pagina tiene que cargar): el lo coloca, lo anima, lo
 * quita a su hora y lo anuncia a los lectores de pantalla. Solo hay uno a la vez: un aviso nuevo sustituye al que hubiera.
 *
 *   const snackbar = new Snackbar({ document });
 *   snackbar.show('Equipo borrado', { action: { label: 'Deshacer', onClick: () => undo() } });
 */
export class Snackbar {
  /** @type {HTMLElement} El `wa-toast`, que guarda los avisos */
  element;

  /** @type {Document} */
  #document;

  /** @param {{document?: Document}} [options] */
  constructor({ document = globalThis.document } = {}) {
    this.#document = document;
    this.element = document.createElement('wa-toast');
    this.element.setAttribute('placement', 'bottom-center');
    document.body.append(this.element);
  }

  /**
   * @param {string} message
   * @param {{action?: {label: string, onClick: () => void}, duration?: number}} [options] `duration`: milisegundos que se ve; 0, hasta que se quite
   */
  show(message, { action, duration = 6000 } = {}) {
    this.element.replaceChildren();
    const item = this.#document.createElement('wa-toast-item');
    item.setAttribute('size', 'small');
    item.setAttribute('duration', String(duration));

    const text = this.#document.createElement('span');
    text.textContent = message;
    item.append(text);

    if (action) {
      const button = this.#document.createElement('wa-button');
      button.setAttribute('size', 'small');
      button.setAttribute('appearance', 'plain');
      button.setAttribute('variant', 'brand');
      button.textContent = action.label;
      button.addEventListener('click', () => { this.hide(); action.onClick(); });
      item.append(button);
    }

    this.element.append(item);
  }

  /** Lo quita */
  hide() {
    this.element.querySelectorAll('wa-toast-item').forEach(item => /** @type {any} */ (item).hide?.());
  }
}
