// @ts-check
import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import '@awesome.me/webawesome/dist/components/select/select.js';
import '@awesome.me/webawesome/dist/components/option/option.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import { LocalizeController, term } from '../../utilities/localize.js';
import { ComboboxState } from './combobox.state.js';
import styles from './combobox.styles.js';
import { WaxQueryEvent } from '../../events/query.js';

/**
 * A box to choose from a list with a search box to filter it by typing: what a `<select>` with many options should be. It is a Web Awesome `wa-select` whose first child is a
 * search box (a `wa-input`): when it opens the focus goes to the box, typing hides the options that do not match, and the arrows pass from the box to the options that are seen. It is
 * used where a `<select>` would go: it has `value`, `disabled`, `name` and `required`, takes part in a form, and fires `change` when something is chosen. It chooses only among what it
 * has: what is typed is for searching, it is not kept. It knows nothing of what the choices are or of any language: everything comes by property. It imports the Web Awesome components it uses (`wa-select`, `wa-option`, `wa-input`).
 *
 * ```html
 * <wax-combobox placeholder="Pick one..." empty-text="Nothing matches"></wax-combobox>
 * ```
 * ```js
 * combo.choices = [{ value: 'es', label: 'España' }, { value: 'fr', label: 'Francia' }];   // before the value: a value that is not among the choices is dropped
 * combo.value = 'es';
 * combo.addEventListener('change', () => use(combo.value));
 * ```
 *
 * If the choices are not all there and have to be fetched as the user types, listen to `wax-query` and give the new `choices`.
 *
 * @element wax-combobox
 *
 * @attr {string} label - What the box is called, written above it (like the `label` of a `wa-select`); a box with no visible label needs its `<label>` or an `aria-label` around it
 * @attr {string} placeholder - The title, grey while nothing is chosen
 * @attr {string} search-placeholder - What the search box says while it is empty (the term `waxSearch` of the language of the page when empty)
 * @attr {string} empty-label - If set, a first option «choose nothing» with this name (and it is the title if there is no `placeholder`)
 * @attr {string} empty-text - What it says if what was typed matches nothing (the term `waxNoMatches` when empty)
 * @attr {string} name - The name of the field in a form
 * @attr {boolean} required - The form is not sent without a choice
 * @attr {boolean} disabled - It cannot be used yet (another one has to be chosen first)
 * @attr {number} query-delay - Milliseconds without typing before `wax-query` (300)
 *
 * @prop {{value: string, label: string}[]} choices - What is offered. What was chosen stays if it is still there
 * @prop {string} value - What is chosen, empty for nothing. Only one of the choices: anything else leaves nothing chosen. Set `choices` first
 * @prop {string} label - What the box is called, written above it
 * @prop {string} placeholder - The title, grey while nothing is chosen
 * @prop {string} searchPlaceholder - What the search box says while it is empty, the term `waxSearch` when empty (attribute `search-placeholder`)
 * @prop {string | undefined} emptyLabel - If set, a first option «choose nothing» with this name (attribute `empty-label`)
 * @prop {string} emptyText - What it says if what was typed matches nothing (the term `waxNoMatches` when empty) (attribute `empty-text`)
 * @prop {string} name - The name of the field in a form
 * @prop {boolean} required - The form is not sent without a choice
 * @prop {boolean} disabled - It cannot be used yet
 * @prop {number} queryDelay - Milliseconds without typing before `wax-query` (attribute `query-delay`)
 *
 * @fires change - Something was chosen, with the mouse, the keys or Enter in the search box (like the `change` of a `wa-select`; the typing in the search box is not announced)
 * @fires wax-query - The user typed in the search box and stopped (`query-delay`), or the search was forgotten (`query` is empty): for whoever has to fetch the choices that match. `detail: { query }`
 *
 * @csspart select - The `wa-select`
 * @csspart search - The search box
 * @csspart option - One option. Also `empty`, for the «choose nothing» one, and `none`, for the notice that nothing matches
 *
 * @cssprop [--combobox-gap] - The space below it (`--wa-space-m`: the usual one between a control and what goes below it)
 */
export class WaxCombobox extends LitElement {
  static formAssociated = true;

  static shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static properties = {
    choices: { attribute: false },
    value: { attribute: false },   // after `choices`: what is set before the element is defined is given back in this order, and a value that is not among the choices is dropped
    label: { type: String },
    placeholder: { type: String },
    searchPlaceholder: { type: String, attribute: 'search-placeholder' },
    emptyLabel: { type: String, attribute: 'empty-label' },
    emptyText: { type: String, attribute: 'empty-text' },
    name: { type: String, noAccessor: true },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    queryDelay: { type: Number, attribute: 'query-delay' },
    _query: { state: true }
  };

  static styles = styles;

  #internals = this.attachInternals();

  #localize = new LocalizeController(this);

  /** @type {{value: string, label: string}[]} */
  #choices = [];

  #value = '';

  /** What was last asked of whoever gives the choices (`wax-query`), so as not to ask the same twice */
  #asked = '';

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  #timer;

  constructor() {
    super();
    this.label = '';
    this.placeholder = '';
    this.searchPlaceholder = '';
    /** @type {string | undefined} */
    this.emptyLabel = undefined;
    this.emptyText = '';
    this.required = false;
    this.disabled = false;
    this.queryDelay = 300;
    /** @internal @type {string} What is typed in the search box */
    this._query = '';
  }

  /** @returns {string} */
  get name() {
    return this.getAttribute('name') ?? '';
  }

  /** @param {string} name The attribute at once, not when the element is next drawn: a form looks for its fields by `[name]` as soon as they are made */
  set name(name) {
    if (this.getAttribute('name') !== name) this.setAttribute('name', name);
  }

  /** @returns {{value: string, label: string}[]} */
  get choices() {
    return this.#choices;
  }

  set choices(choices) {
    const old = this.#choices;
    this.#choices = choices;
    this.#value = ComboboxState.valid(choices, this.#value);
    this.requestUpdate('choices', old);
  }

  /** @returns {string} */
  get value() {
    return this.#value;
  }

  set value(value) {
    this.#value = ComboboxState.valid(this.#choices, String(value ?? ''));
    this.requestUpdate();
  }

  /** @returns {HTMLElement | null} The `wa-select` inside */
  get #select() {
    return /** @type {HTMLElement | null} */ (this.renderRoot.querySelector('wa-select'));
  }

  /** @returns {any} The search box inside */
  get #search() {
    return this.renderRoot.querySelector('wa-input');
  }

  render() {
    const arranged = ComboboxState.arrange(this.#choices, this._query);
    const anyShown = arranged.some(item => item.shown);
    return html`<wa-select part="select" label=${this.label} placeholder=${this.placeholder || this.emptyLabel || ''} ?required=${this.required} ?disabled=${this.disabled}
        @change=${(/** @type {Event} */ event) => this.#changed(event)} @wa-show=${(/** @type {Event} */ event) => this.#opened(event)}
        @wa-after-show=${(/** @type {Event} */ event) => { if (event.target === this.#select) this.#search?.focus?.(); }}
        @wa-after-hide=${(/** @type {Event} */ event) => { if (event.target === this.#select) this.#forget(); }}>
      <wa-input part="search" type="search" value="" with-clear autocomplete="off" placeholder=${this.searchPlaceholder || term(this.#localize, 'waxSearch')} .value=${this._query}
        @input=${(/** @type {Event} */ event) => this.#typed(event)} @change=${(/** @type {Event} */ event) => event.stopPropagation()}
        @keydown=${(/** @type {KeyboardEvent} */ event) => this.#searchKey(event)}></wa-input>
      ${this.emptyLabel === undefined ? nothing : html`<wa-option part="option empty" value="" ?hidden=${this._query.trim() !== ''}>${this.emptyLabel}</wa-option>`}
      ${repeat(arranged, item => item.choice.value, item => html`<wa-option part="option" value=${item.choice.value} ?hidden=${!item.shown}>${item.choice.label}</wa-option>`)}
      <wa-option part="option none" disabled ?hidden=${anyShown}>${this.emptyText || term(this.#localize, 'waxNoMatches')}</wa-option>
    </wa-select>`;
  }

  /** @param {import('lit').PropertyValues} changed */
  updated(changed) {
    // The value goes after the options are in: a `wa-select` takes the value of the options it has
    const select = /** @type {any} */ (this.#select);
    if (select && select.value !== this.#value) select.value = this.#value;
    this.#syncForm();
    if (changed.has('disabled')) this.toggleAttribute('aria-disabled', this.disabled);
  }

  /** What the form sees: the value and whether it is valid (a required one with nothing chosen is not). The one place that says it, for when the value is set from code and for when the user chooses */
  #syncForm() {
    this.#internals.setFormValue(this.#value);
    const select = /** @type {any} */ (this.#select);
    if (this.required && !this.#value && select) this.#internals.setValidity({ valueMissing: true }, this.placeholder || this.emptyLabel || ' ', select);
    else this.#internals.setValidity({});
  }

  /** @param {Event} event A `change` of the `wa-select`: what the user chose is the value now (the one of the search box does not get here) */
  #changed(event) {
    if (event.target !== this.#select) return;
    const value = String(/** @type {any} */ (this.#select).value ?? '');
    if (value === this.#value) { event.stopPropagation(); return; }
    this.#value = value;
    this.#syncForm();
  }

  /** @param {Event} event The `wa-select` begins to open: all choices, and the focus goes to the search box at once, or the first letters are lost */
  #opened(event) {
    if (event.target !== this.#select) return;
    this.#forget();
    requestAnimationFrame(() => this.#search?.focus?.());
  }

  /** The search is forgotten, and whoever gives the choices is told */
  #forget() {
    this._query = '';
    if (this.#asked !== '') this.#ask('');
  }

  /** @param {Event} event */
  #typed(event) {
    event.stopPropagation();   // what happens in the search box is the box's: the `input` of a `wa-input` would make whoever listens here believe something was chosen
    this._query = this.#search?.value ?? '';
    this.#ask(this._query);
  }

  /**
   * Tells whoever gives the choices what was typed, a moment after it stops.
   *
   * @param {string} query
   */
  #ask(query) {
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      const wanted = query.trim();
      if (wanted === this.#asked) return;
      this.#asked = wanted;
      this.dispatchEvent(new WaxQueryEvent({ query: wanted }));
    }, this.queryDelay);
  }

  /** @param {KeyboardEvent} event Enter in the search box chooses the first option that is seen */
  #searchKey(event) {
    // Typing is the box's: if the key reached the select, it would take it as a search for an option and move the focus to the first one that starts with that letter
    if (event.key.length === 1 || ['Backspace', 'Delete', 'Home', 'End', 'ArrowLeft', 'ArrowRight'].includes(event.key)) event.stopPropagation();
    if (event.key !== 'Enter') return;
    event.preventDefault();   // it does not send the form: it only chooses
    const select = /** @type {any} */ (this.#select);
    const first = [...select.querySelectorAll('wa-option')].find(item => !item.hidden && !item.hasAttribute('disabled'));
    if (!first) return;
    select.value = first.getAttribute('value') ?? '';
    // Setting the value from code does not announce it: it is announced here, as when it is chosen with the mouse
    select.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    select.open = false;
  }

  /**
   * Called by the form when it (or its fieldset) is disabled.
   *
   * @internal
   * @param {boolean} disabled
   */
  formDisabledCallback(disabled) {
    this.disabled = disabled;
  }

  /**
   * Called by the form when it is reset: nothing is chosen.
   *
   * @internal
   */
  formResetCallback() {
    this.value = '';
  }
}

if (!customElements.get('wax-combobox')) customElements.define('wax-combobox', WaxCombobox);
