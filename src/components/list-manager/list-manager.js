// @ts-check
import { LitElement, html } from 'lit';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import { LocalizeController, term } from '../../utilities/localize.js';
import { ListManagerState } from './list-manager.state.js';
import styles from './list-manager.styles.js';
import { WaxNewEvent } from '../../events/new.js';
import { WaxQueryEvent } from '../../events/query.js';
import { WaxSelectEvent } from '../../events/select.js';
import '../item-list/item-list.js';

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
 * @attr {string} search-placeholder - What the search box says while it is empty (the term `waxSearch` of the language of the page when empty)
 * @attr {string} search-label - What the search box is called for who does not see it (the placeholder if it is not given)
 * @attr {string} new-label - The text of the button (the term `waxNew` when empty)
 * @attr {string} empty - What it says with nothing to show
 *
 * @prop {import('../item-list/item-list.js').ListItem[]} items - What is shown, each one a `ListItem` of `<wax-item-list>` (without `html`: the markup of a line goes to the light DOM of the list, which here is its shadow). The chosen entry stays chosen if it is still there
 * @prop {string} searchPlaceholder - What the search box says while it is empty (attribute `search-placeholder`)
 * @prop {string} searchLabel - What the search box is called for who does not see it (attribute `search-label`)
 * @prop {string} newLabel - The text of the button (attribute `new-label`)
 * @prop {string} empty - What it says with nothing to show
 * @prop {string} query - What is typed in the search box
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
    searchLabel: { type: String, attribute: 'search-label' },
    newLabel: { type: String, attribute: 'new-label' },
    empty: { type: String }
  };

  static styles = styles;

  #state = new ListManagerState();

  #localize = new LocalizeController(this);

  constructor() {
    super();
    /** @type {import('../item-list/item-list.js').ListItem[]} */
    this.items = [];
    this.searchPlaceholder = '';
    this.searchLabel = '';
    this.newLabel = '';
    this.empty = '';
  }

  /** @returns {any} */
  get #search() {
    return this.renderRoot.querySelector('wa-input');
  }

  /** @returns {import('../item-list/item-list.js').WaxItemList | null} */
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
    const search = this.searchPlaceholder || term(this.#localize, 'waxSearch');
    return html`<slot name="filters"></slot>
      <wa-input part="search" type="search" value="" with-clear label=${this.searchLabel || search} placeholder=${search}
        @input=${(/** @type {Event} */ event) => this.#typed(event)} @change=${(/** @type {Event} */ event) => event.stopPropagation()}></wa-input>
      <div part="actions"><wa-button part="new-button" appearance="outlined" @click=${() => this.dispatchEvent(new WaxNewEvent())}>${this.newLabel || term(this.#localize, 'waxNew')}</wa-button></div>
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
    this.dispatchEvent(new WaxQueryEvent({ query: this.query }));
  }

  /** @param {CustomEvent} event A line of the list was clicked: the list clears the chosen one when it is clicked again, and here it stays */
  #chosen(event) {
    event.stopPropagation();
    const key = this.#state.chosen(event.detail.key);
    if (key === null) this.#list?.select(this.#state.current);
    else this.dispatchEvent(new WaxSelectEvent({ key }));
  }
}

if (!customElements.get('wax-list-manager')) customElements.define('wax-list-manager', WaxListManager);
