// @ts-check

/**
 * Sabe si un formulario ha cambiado desde que se abrio: el boton de guardar solo esta activo mientras haya algo que guardar. No mira los controles uno a uno: quien lo usa le da
 * una funcion que dice como esta el formulario ahora (`snapshot`, un texto) y se compara con como estaba al principio. Se repasa cada vez que algo del formulario avisa (`input`
 * o `change`, que suben hasta `element`); lo que cambia sin avisar (una lista que se edita en una ventana) tiene que mandar un `change` al acabar.
 *
 *   const dirty = new Dirty({ element: form, button: saveButton, snapshot: () => JSON.stringify(leerFormulario()) });
 *   // al guardar, o al abrir otra cosa en el mismo formulario:
 *   dirty.rebase();
 */
export class Dirty {
  /** @type {HTMLButtonElement} */
  #button;

  /** @type {() => string} */
  #snapshot;

  /** @type {string} */
  #initial = '';

  /** @type {HTMLElement} */
  #element;

  /** @type {() => void} */
  #listener = () => this.check();

  /** @param {{element: HTMLElement, button: HTMLButtonElement, snapshot: () => string}} options */
  constructor({ element, button, snapshot }) {
    this.#element = element;
    this.#button = button;
    this.#snapshot = snapshot;
    element.addEventListener('input', this.#listener);
    element.addEventListener('change', this.#listener);
    this.rebase();
  }

  /** Deja de mirar el formulario: para cuando se dibuja otro en el mismo elemento */
  dispose() {
    this.#element.removeEventListener('input', this.#listener);
    this.#element.removeEventListener('change', this.#listener);
  }

  /** Lo que hay ahora pasa a ser lo de partida: el boton se apaga hasta el proximo cambio */
  rebase() {
    this.#initial = this.#snapshot();
    this.check();
  }

  /** @returns {boolean} Si el formulario es distinto de como estaba al principio */
  get changed() {
    return this.#snapshot() !== this.#initial;
  }

  /** Repasa si hay algo que guardar y enciende o apaga el boton */
  check() {
    this.#button.disabled = !this.changed;
  }
}
