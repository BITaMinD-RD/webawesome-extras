// @ts-check

/**
 * El bloque que se repite en las pantallas de editar: los filtros (si los hay), la caja de busqueda, el boton de «Nuevo» y, debajo, la lista de
 * lo que hay, donde se elige una entrada (volver a pulsar la elegida no la quita). El boton va siempre encima de la lista, por si es larga. No sabe
 * que son las entradas ni como se filtran: quien lo usa le da lo que hay que enseñar (`setItems`) cuando cambia lo escrito (`onQuery`).
 *
 *   const manager = new ListManager({ document, searchPlaceholder: 'Buscar...', newLabel: 'Nuevo', emptyText: 'Nada.',
 *     onSelect: key => abrir(key), onNew: () => abrirNueva(), onQuery: () => pintar() });
 *   parent.append(manager.element);
 *   manager.setItems([{ key: 'a', name: 'Uno', icon: '🏆', note: 'nota' }]);
 *
 * Usa `<wax-item-list>`, de esta misma libreria: la pagina importa `WaxItemList.js` (aqui no se importa, para que esto se pueda cargar en Node). Los estilos son `.list-manager` de controls.css.
 */
export class ListManager {
  /** @type {HTMLElement} */
  element;

  /** @type {import('./WaxItemList.js').WaxItemList} */
  list;

  /** @type {HTMLInputElement} */
  search;

  /** La entrada elegida; `null`, ninguna
   * @type {string | null} */
  #current = null;

  /** @param {ListManager.Options} options */
  constructor({ document = globalThis.document, searchPlaceholder = '', newLabel, emptyText = '', filters = [], onSelect, onNew, onQuery }) {
    // Los atributos y no las propiedades: el componente puede no haberse cargado todavia. El valor, tambien como propiedad, y nunca sin valor: vacia da `null` y no `''`
    this.search = /** @type {HTMLInputElement} */ (/** @type {unknown} */ (document.createElement('wa-input')));
    this.search.setAttribute('type', 'search');
    this.search.setAttribute('value', '');
    this.search.value = '';
    this.search.setAttribute('placeholder', searchPlaceholder);
    this.search.setAttribute('with-clear', '');
    this.search.addEventListener('input', () => onQuery?.());

    const button = document.createElement('wa-button');
    button.setAttribute('appearance', 'outlined');
    button.textContent = newLabel;
    button.addEventListener('click', () => onNew?.());
    const row = document.createElement('div');
    row.className = 'row';
    row.append(button);

    const list = /** @type {import('./WaxItemList.js').WaxItemList} */ (document.createElement('wax-item-list'));
    list.empty = emptyText;
    this.element = document.createElement('div');
    this.element.className = 'list-manager';
    this.element.append(...filters, this.search, row, list);

    this.list = list;
    list.addEventListener('wax-select', event => {
      const { key } = /** @type {CustomEvent<{key: string | null}>} */ (event).detail;
      if (key) { this.#current = key; onSelect?.(key); }
      else this.list.select(this.#current);   // volver a pulsar la elegida no la quita
    });
  }

  /** @returns {string} Lo escrito en la caja de busqueda */
  get query() {
    return this.search.value;
  }

  /** @param {import('./WaxItemList.js').ListItem[]} items Lo que se enseña; la elegida sigue marcada si sigue estando */
  setItems(items) {
    this.list.items = items;
    this.list.select(this.#current);
  }

  /** @param {string | null} key La entrada elegida; `null`, ninguna */
  select(key) {
    this.#current = key;
    this.list.select(key);
  }
}

/**
 * @typedef {object} ListManager.Options
 * @property {Document} [document]
 * @property {string} [searchPlaceholder]
 * @property {string} newLabel El boton de nuevo
 * @property {string} [emptyText] Lo que se dice si no hay nada que enseñar
 * @property {HTMLElement[]} [filters] Lo que va encima de la caja de busqueda (combos)
 * @property {(key: string) => void} [onSelect]
 * @property {() => void} [onNew]
 * @property {() => void} [onQuery] Ha cambiado lo escrito
 */
