// @ts-check

import { ItemList } from './ItemList.js';
import { Button } from './Button.js';
import { Input } from './Input.js';

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
 * Importa `ItemList`, de esta misma libreria. Los estilos son `.list-manager` e `.item-list` de controls.css.
 */
export class ListManager {
  /** @type {HTMLElement} */
  element;

  /** @type {ItemList} */
  list;

  /** @type {HTMLInputElement} */
  search;

  /** La entrada elegida; `null`, ninguna
   * @type {string | null} */
  #current = null;

  /** @param {ListManager.Options} options */
  constructor({ document = globalThis.document, searchPlaceholder = '', newLabel, emptyText = '', filters = [], onSelect, onNew, onQuery }) {
    this.search = /** @type {HTMLInputElement} */ (/** @type {unknown} */ (Input.make(document, { type: 'search', placeholder: searchPlaceholder, clearable: true })));
    this.search.addEventListener('input', () => onQuery?.());

    const button = Button.make(document, { text: newLabel });
    button.addEventListener('click', () => onNew?.());
    const row = document.createElement('div');
    row.className = 'row';
    row.append(button);

    const ul = document.createElement('ul');
    this.element = document.createElement('div');
    this.element.className = 'list-manager';
    this.element.append(...filters, this.search, row, ul);

    this.list = new ItemList({
      element: ul, empty: emptyText,
      onSelect: key => {
        if (key) { this.#current = key; onSelect?.(key); }
        else this.list.select(this.#current);   // volver a pulsar la elegida no la quita
      }
    });
  }

  /** @returns {string} Lo escrito en la caja de busqueda */
  get query() {
    return this.search.value;
  }

  /** @param {ListItem[]} items Lo que se enseña; la elegida sigue marcada si sigue estando */
  setItems(items) {
    this.list.setItems(items);
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
