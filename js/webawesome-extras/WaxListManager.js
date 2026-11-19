// @ts-check
import { LitElement, html, css } from 'lit';
import { ListManagerState } from './ListManagerState.js';
import './WaxItemList.js';

/**
 * The block that repeats in the screens that edit things: the filters (if any), the search box, the «New» button and, below, the list of what there is, where one entry is chosen (clicking
 * the chosen one again does not clear it). The button is always above the list, in case it is long. It knows nothing of what the entries are or how they are filtered: whoever uses it gives
 * what is to be shown (`items`) when what is typed changes (`wax-query`). The list is a `<wax-item-list>`, whose parts are exported.
 *
 * ```html
 * <wax-list-manager search-placeholder="Search..." new-label="New" empty="Nothing here">
 *   <div slot="filters">...</div>
 * </wax-list-manager>
 * ```
 * ```js
 * manager.items = [{ key: 'a', name: 'One', icon: '🏆', note: 'a note' }];
 * manager.addEventListener('wax-select', event => open(event.detail.key));
 * manager.addEventListener('wax-new', () => openNew());
 * manager.addEventListener('wax-query', () => manager.items = filter(manager.query));
 * ```
 *
 * @element wax-list-manager
 *
 * @attr {string} search-placeholder - What the search box says while it is empty
 * @attr {string} new-label - The text of the button
 * @attr {string} empty - What it says with nothing to show
 *
 * @prop {import('./WaxItemList.js').ListItem[]} items - What is shown (without `html`: the markup of a line goes to the light DOM of the list, which here is its shadow). The chosen entry stays chosen if it is still there
 * @prop {string} searchPlaceholder - What the search box says while it is empty
 * @prop {string} newLabel - The text of the button
 * @prop {string} empty - What it says with nothing to show
 * @prop {string} query - What is typed in the search box (read only)
 *
 * @fires wax-select - An entry was chosen by the user. `detail: { key }`. Not fired by `select()`
 * @fires wax-new - The «New» button was pressed
 * @fires wax-query - What is typed in the search box changed. `detail: { query }`
 *
 * @slot filters - What goes above the search box (comboboxes that filter)
 *
 * @csspart search - The search box
 * @csspart actions - The row of the «New» button
 * @csspart new-button - The «New» button
 * @csspart items - The list (a `<wax-item-list>`), which does not grow more than what fits
 * @csspart line - A line of the list. Also `selected`, `marked`, `faded`, `icon`, `name`, `note` and `empty`, those of `<wax-item-list>`
 */
export class WaxListManager extends LitElement {
  static properties = {
    items: { attribute: false },
    searchPlaceholder: { type: String, attribute: 'search-placeholder' },
    newLabel: { type: String, attribute: 'new-label' },
    empty: { type: String }
  };

  static styles = css`
    :host { display: block; }
    :host([hidden]) { display: none; }
    [part~="actions"] { display: flex; flex-wrap: wrap; align-items: center; gap: var(--wa-space-m); margin-bottom: var(--wa-space-m); }
    [part~="new-button"] { margin: 0; }
    [part~="items"] { margin: 0; max-height: 70vh; overflow-y: auto; font-size: var(--wa-font-size-xs); }
    @media (max-width: 640px) {
      [part~="items"] { max-height: 30vh; }
    }
  `;

  #state = new ListManagerState();

  constructor() {
    super();
    /** @type {import('./WaxItemList.js').ListItem[]} */
    this.items = [];
    this.searchPlaceholder = '';
    this.newLabel = '';
    this.empty = '';
  }

  /** @returns {any} */
  get #search() {
    return this.renderRoot.querySelector('wa-input');
  }

  /** @returns {import('./WaxItemList.js').WaxItemList | null} */
  get #list() {
    return this.renderRoot.querySelector('wax-item-list');
  }

  /** @returns {string} What is typed in the search box */
  get query() {
    return this.#search?.value ?? '';
  }

  /**
   * Chooses an entry without telling anybody (the application chose it).
   *
   * @param {string | null} key `null`, none
   */
  select(key) {
    this.#state.current = key;
    this.#list?.select(key);
  }

  render() {
    return html`<slot name="filters"></slot>
      <wa-input part="search" type="search" value="" with-clear placeholder=${this.searchPlaceholder}
        @input=${(/** @type {Event} */ event) => this.#typed(event)} @change=${(/** @type {Event} */ event) => event.stopPropagation()}></wa-input>
      <div part="actions"><wa-button part="new-button" appearance="outlined" @click=${() => this.#emit('wax-new', {})}>${this.newLabel}</wa-button></div>
      <wax-item-list part="items" exportparts="line, selected, marked, faded, icon, name, note, empty" .items=${this.items} empty=${this.empty}
        @wax-select=${(/** @type {CustomEvent} */ event) => this.#chosen(event)}></wax-item-list>`;
  }

  firstUpdated() {
    // An empty `wa-input` gives `null`, not `''`, unless it was born with a value
    this.#search.value = '';
  }

  updated() {
    this.#list?.select(this.#state.current);   // the chosen one stays so while it is there
  }

  /** @param {Event} event */
  #typed(event) {
    event.stopPropagation();   // what is typed is the box's: whoever listens here hears `wax-query`
    this.#emit('wax-query', { query: this.query });
  }

  /** @param {CustomEvent} event A line of the list was clicked: the list clears the chosen one when it is clicked again, and here it stays */
  #chosen(event) {
    event.stopPropagation();
    const key = this.#state.chosen(event.detail.key);
    if (key === null) this.#list?.select(this.#state.current);
    else this.#emit('wax-select', { key });
  }

  /** @param {string} name @param {object} detail */
  #emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }
}

if (!customElements.get('wax-list-manager')) customElements.define('wax-list-manager', WaxListManager);
