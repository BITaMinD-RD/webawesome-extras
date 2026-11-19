// @ts-check
import { LitElement, html, css, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { ItemListState } from './ItemListState.js';

/**
 * @typedef {Object} ListItem
 * @property {string} key Identifies the item: what `wax-select` and `wax-mark` give back
 * @property {string} name Plain text
 * @property {string} [icon] Plain text: an emoji
 * @property {string} [note] Plain text, smaller, after the name
 * @property {boolean} [faded] Struck through and paler (a site that has been vetoed, say)
 * @property {string} [html] Markup the application wrote, at the end of the line (a checkbox, a button): it goes into the page, not into the shadow of the list, so the page styles it
 *   and listens to it as to anything else
 */

/**
 * The usual list to choose from: icon, name and a note per line. One line is selected at a time (click it again to clear), and with Ctrl, Cmd or Shift + click
 * lines are marked, any number, for the application to do something with them (join them). It knows nothing about what the items are.
 *
 * ```html
 * <wax-item-list empty="Nothing here"></wax-item-list>
 * ```
 * ```js
 * list.items = sites.map(s => ({ key: s.id, icon: '🍺', name: s.name, note: `${s.meters} m`, faded: s.hidden }));
 * list.addEventListener('wax-select', event => open(event.detail.key));   // key is null when the selection is cleared
 * list.addEventListener('wax-mark', event => join(event.detail.keys));
 * ```
 *
 * Two things a list can also do, if asked:
 * - **Move** (`movable`): each line has a handle, dragged with mouse or finger, or moved with the arrow keys when it has the focus; the list gives back the keys in their
 *   new order (`wax-move`).
 * - **Swipe** (`swipe-label`): sliding a line sideways with the finger uncovers one action (Remove, Seen) instead of doing it straight away (`wax-swipe`).
 *
 * @element wax-item-list
 *
 * @attr {string} selected - The key of the selected line
 * @attr {string} empty - What it says with no items
 * @attr {boolean} movable - Lines have a handle to reorder them
 * @attr {string} swipe-label - The text of the action that a slid line uncovers; with it, lines can be slid
 *
 * @prop {ListItem[]} items - The lines. What was selected or marked stays so if its key is still there
 *
 * @fires wax-select - A line was clicked (or Enter or Space on it). `detail: { key }`, `key` null when the selection was cleared. Not fired by `select()`
 * @fires wax-mark - A line was marked or unmarked with Ctrl, Cmd or Shift + click. `detail: { keys }`, all the marked ones
 * @fires wax-move - A line was moved (`movable`). `detail: { keys }`, all of them in their new order
 * @fires wax-swipe - The action of a slid line was pressed (`swipe-label`). `detail: { key }`
 *
 * @slot {key} - Own controls at the end of a line: a child with `slot="<key of the item>"`. (An item's `html` is put there for you.) One with class `item-risky` shows only when the line is under the mouse or has the focus
 *
 * @csspart list - The `ul`
 * @csspart line - One line. Also `selected`, `marked`, `faded` and `dragging` while they are so
 * @csspart handle - What moves a line
 * @csspart icon - The icon
 * @csspart name - The name
 * @csspart note - The note
 * @csspart empty - The text of an empty list
 * @csspart swipe - The action a slid line uncovers
 *
 * @cssprop [--item-border] - The line between lines (default `--wa-color-neutral-border-quiet`)
 * @cssprop [--item-hover] - A line under the pointer (`--wa-color-neutral-fill-quiet`)
 * @cssprop [--item-selected] - The selected line (`--wa-color-brand-fill-quiet`)
 * @cssprop [--item-accent] - The mark of the selected and marked lines (`--wa-color-brand-fill-loud`)
 * @cssprop [--item-muted] - Notes and the empty text (`--wa-color-text-quiet`)
 * @cssprop [--item-danger] - The swipe action (`--wa-color-danger-fill-loud`)
 */
export class WaxItemList extends LitElement {
  /** Clicks on these inside a line belong to them, not to the list */
  static OWN = 'a, button, input, label, select, textarea, wa-button, wa-input, wa-select, [part~="handle"]';

  static properties = {
    selected: { type: String, reflect: true },
    empty: { type: String },
    movable: { type: Boolean },
    swipeLabel: { type: String, attribute: 'swipe-label' },
    _swiped: { state: true },
    _dragging: { state: true }
  };

  static styles = css`
    :host { display: block; overflow-y: auto; }
    :host([hidden]) { display: none; }
    ul { list-style: none; margin: 0; padding: 0; }
    li {
      display: flex; flex-wrap: wrap; gap: var(--wa-space-3xs) var(--wa-space-xs); align-items: baseline;
      padding: var(--wa-space-2xs); border-bottom: var(--wa-border-width-s) var(--wa-border-style) var(--item-border, var(--wa-color-neutral-border-quiet));
      cursor: pointer;
    }
    li:hover { background: var(--item-hover, var(--wa-color-neutral-fill-quiet)); }
    li:focus-visible { outline: var(--wa-focus-ring); outline-offset: calc(-1 * var(--wa-border-width-m)); }
    [part~="icon"] { font-size: var(--wa-font-size-m); }
    /* The name takes what is left of the line next to the icon, and breaks inside itself; the note and the rest go below if they do not fit */
    [part~="name"] { flex: 1 1 8em; min-width: 0; overflow-wrap: anywhere; }
    [part~="note"] { color: var(--item-muted, var(--wa-color-text-quiet)); font-size: var(--wa-font-size-xs); }
    [part~="empty"] { padding: var(--wa-space-2xs); color: var(--item-muted, var(--wa-color-text-quiet)); cursor: default; }
    [part~="empty"]:hover { background: none; }
    /* Chosen: the one lit on the map */
    li.selected { background: var(--item-selected, var(--wa-color-brand-fill-quiet)); box-shadow: inset 3px 0 0 var(--item-accent, var(--wa-color-brand-fill-loud)); }
    /* Marked with Ctrl + click */
    li.marked { outline: 2px dashed var(--item-accent, var(--wa-color-brand-fill-loud)); outline-offset: -2px; }
    li.faded [part~="name"] { text-decoration: line-through; opacity: .6; }
    /* Moving a line: its handle, and the line while it is dragged */
    [part~="handle"] { cursor: grab; touch-action: none; padding: 0 var(--wa-space-2xs); color: var(--item-muted, var(--wa-color-text-quiet)); user-select: none; }
    li.dragging { opacity: .6; background: var(--item-selected, var(--wa-color-brand-fill-quiet)); }
    /* Swiping a line: it follows the finger, and once slid its action shows at the end */
    :host([swipe-label]) li { touch-action: pan-y; transition: transform .15s; }
    [part~="swipe"] {
      display: none; margin-left: auto; border: 0; border-radius: var(--wa-border-radius-s); padding: var(--wa-space-2xs) var(--wa-space-s);
      background: var(--item-danger, var(--wa-color-danger-fill-loud)); color: var(--wa-color-danger-on-loud); font: inherit;
    }
    li.swiped [part~="swipe"] { display: inline-block; }
    /* What can go wrong with one tap (removing: a control with class item-risky, see controls.css) shows only when the line is under the mouse or has the focus;
       on a touch screen with swiping, not at all. The slot says it through custom properties, which the slotted controls inherit */
    slot { --item-risky-visibility: hidden; }
    li:hover slot, li:focus-within slot { --item-risky-visibility: visible; }
    @media (hover: none) { :host([swipe-label]) slot { --item-risky-visibility: hidden; --item-risky-width: 0; } }
  `;

  /** @type {ListItem[]} */
  #items = [];

  #state = new ItemListState();

  /** The keys in the order they are shown: the one of `items` until a line is moved */
  #order = /** @type {string[]} */ ([]);

  constructor() {
    super();
    this.selected = null;
    this.empty = '';
    this.movable = false;
    this.swipeLabel = '';
    this._swiped = null;
    this._dragging = null;
    this.addEventListener('keydown', event => this.#keydown(event));
  }

  /** @returns {ListItem[]} */
  get items() {
    return this.#items;
  }

  /** @param {ListItem[]} value */
  set items(value) {
    const old = this.#items;
    this.#items = value;
    const keys = value.map(item => item.key);
    this.#order = keys;
    if (this.selected !== null && !keys.includes(this.selected)) this.selected = null;
    this.#state.keep(keys);
    // The markup of the items goes into the page right now, not when the list is next drawn: whoever sets the items can look for its controls straight away
    this.#putMarkup();
    this.requestUpdate('items', old);
  }

  /** @returns {Set<string>} The keys marked with Ctrl, Cmd or Shift + click */
  get marked() {
    return this.#state.marked;
  }

  /**
   * Selects an item without telling anybody (the map chose it): `scroll` brings it into view.
   *
   * @param {string | null} key
   * @param {{scroll?: boolean}} [options]
   */
  select(key, { scroll = false } = {}) {
    this.selected = key;
    if (scroll && key !== null) this.updateComplete.then(() => this.#line(key)?.scrollIntoView({ block: 'nearest' }));
  }

  /** Clears the marks, without telling anybody */
  clearMarks() {
    this.#state.marked.clear();
    this.requestUpdate();
  }

  /** The `html` of the items goes into the light DOM, in a span that is slotted into its line, so the page styles it and listens to it */
  #putMarkup() {
    for (const old of this.querySelectorAll(':scope > [data-wax-markup]')) old.remove();
    for (const item of this.#items) {
      if (!item.html) continue;
      const span = document.createElement('span');
      span.slot = item.key;
      span.dataset.waxMarkup = '';
      span.style.display = 'contents';
      span.innerHTML = item.html;
      this.append(span);
    }
  }

  render() {
    const byKey = new Map(this.#items.map(item => [item.key, item]));
    const items = this.#order.map(key => /** @type {ListItem} */ (byKey.get(key)));
    if (!items.length) return this.empty ? html`<ul part="list"><li part="empty">${this.empty}</li></ul>` : nothing;
    return html`<ul part="list" @click=${(/** @type {MouseEvent} */ event) => this.#click(event)}
        @pointerdown=${(/** @type {PointerEvent} */ event) => this.#pointerdown(event)} @pointermove=${(/** @type {PointerEvent} */ event) => this.#pointermove(event)}
        @pointerup=${(/** @type {PointerEvent} */ event) => this.#pointerup(event)} @pointercancel=${(/** @type {PointerEvent} */ event) => this.#pointerup(event)}>
      ${repeat(items, item => item.key, item => this.#renderLine(item))}
    </ul>`;
  }

  /** @param {ListItem} item */
  #renderLine(item) {
    const states = [item.faded && 'faded', item.key === this.selected && 'selected', this.#state.marked.has(item.key) && 'marked', item.key === this._dragging && 'dragging',
      item.key === this._swiped && 'swiped'].filter(Boolean);
    return html`<li part="line ${states.join(' ')}" class=${states.join(' ')} data-key=${item.key} tabindex="0">
      ${this.movable ? html`<span part="handle" tabindex="0" role="button" aria-label="Mover (flechas arriba y abajo)" title="Arrastrar para ordenar">⋮⋮</span>` : nothing}
      ${item.icon ? html`<span part="icon">${item.icon}</span>` : nothing}
      <strong part="name">${item.name}</strong>
      ${item.note ? html`<span part="note">${item.note}</span>` : nothing}
      <slot name=${item.key}></slot>
      ${this.swipeLabel ? html`<button type="button" part="swipe">${this.swipeLabel}</button>` : nothing}
    </li>`;
  }

  /** @param {string} key @returns {HTMLElement | null} */
  #line(key) {
    return /** @type {HTMLElement | null} */ ([...this.renderRoot.querySelectorAll('li[data-key]')].find(line => /** @type {HTMLElement} */ (line).dataset.key === key) ?? null);
  }

  /** @returns {HTMLElement[]} */
  #lines() {
    return /** @type {HTMLElement[]} */ ([...this.renderRoot.querySelectorAll('li[data-key]')]);
  }

  /**
   * @param {Event} event
   * @param {HTMLElement} line
   * @returns {boolean} The event comes from something inside the line that has its own job (a button, a link, a box, the handle)
   */
  #fromOwn(event, line) {
    for (const element of event.composedPath()) {
      if (element === line) return false;
      if (element instanceof Element && element.matches(WaxItemList.OWN)) return true;
    }
    return false;
  }

  /** @param {Event} event @returns {HTMLElement | null} The line the event is in */
  #lineOf(event) {
    return /** @type {HTMLElement | null} */ (event.composedPath().find(element => element instanceof HTMLElement && element.matches('li[data-key]')) ?? null);
  }

  /** @param {string} name @param {object} detail */
  #emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  /** @param {Event} event */
  #click(event) {
    const line = this.#lineOf(event);
    if (!line) return;
    const key = /** @type {string} */ (line.dataset.key);
    if (event.composedPath().some(element => element instanceof Element && element.matches('[part~="swipe"]'))) {
      this.#emit('wax-swipe', { key });
      return;
    }
    if (this.#fromOwn(event, line)) return;
    const mouse = /** @type {MouseEvent} */ (event);
    const outcome = this.#state.click(key, this.selected, mouse.ctrlKey || mouse.metaKey || mouse.shiftKey);
    if (outcome.type === 'mark') {
      this.requestUpdate();
      this.#emit('wax-mark', { keys: outcome.keys });
    } else {
      this.select(outcome.key);
      this.#emit('wax-select', { key: outcome.key });
    }
  }

  /** @param {KeyboardEvent} event */
  #keydown(event) {
    const handle = event.composedPath().find(element => element instanceof Element && element.matches('[part~="handle"]'));
    if (handle && this.movable && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault();
      const key = /** @type {string} */ (this.#lineOf(event)?.dataset.key);
      const order = ItemListState.stepped(this.#order, key, event.key === 'ArrowUp' ? -1 : 1);
      if (!order) return;
      this.#order = order;
      this.requestUpdate();
      this.updateComplete.then(() => /** @type {HTMLElement | null} */ (this.#line(key)?.querySelector('[part~="handle"]'))?.focus());
      this.#emit('wax-move', { keys: order });
      return;
    }
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const line = this.#lineOf(event);
    if (!line || this.#fromOwn(event, line)) return;
    event.preventDefault();
    this.#click(event);
  }

  // ---- Moving: the handle drags its line among the others ----

  /** @type {{key: string} | null} */
  #drag = null;

  /** @type {{key: string, x: number, y: number, moved: boolean} | null} */
  #slide = null;

  /** @param {PointerEvent} event */
  #pointerdown(event) {
    const line = this.#lineOf(event);
    const onHandle = event.composedPath().some(element => element instanceof Element && element.matches('[part~="handle"]'));
    if (this.movable && onHandle && line) {
      event.preventDefault();
      this.#drag = { key: /** @type {string} */ (line.dataset.key) };
      this._dragging = this.#drag.key;
      /** @type {Element} */ (event.currentTarget).setPointerCapture?.(event.pointerId);
      return;
    }
    if (this.swipeLabel && event.pointerType === 'touch') {
      const key = line?.dataset.key ?? null;
      if (this._swiped !== key) this._swiped = null;
      this.#slide = key ? { key, x: event.clientX, y: event.clientY, moved: false } : null;
    }
  }

  /** @param {PointerEvent} event */
  #pointermove(event) {
    if (this.#drag) {
      const over = this.#lines().find(line => line.dataset.key !== this.#drag?.key && event.clientY >= line.getBoundingClientRect().top && event.clientY <= line.getBoundingClientRect().bottom);
      if (!over) return;
      const box = over.getBoundingClientRect();
      const order = ItemListState.dragged(this.#order, this.#drag.key, /** @type {string} */ (over.dataset.key), event.clientY > box.top + box.height / 2);
      if (order !== this.#order) { this.#order = order; this.requestUpdate(); }
      return;
    }
    const slide = this.#slide;
    if (!slide) return;
    const dx = event.clientX - slide.x;
    if (!slide.moved) {
      const gesture = ItemListState.gesture(dx, event.clientY - slide.y);
      if (gesture === 'scroll') this.#slide = null;
      if (gesture !== 'slide') return;
    }
    slide.moved = true;
    const line = this.#line(slide.key);
    if (line) line.style.transform = `translateX(${Math.min(0, dx)}px)`;
  }

  /** @param {PointerEvent} event */
  #pointerup(event) {
    if (this.#drag) {
      this.#drag = null;
      this._dragging = null;
      this.#emit('wax-move', { keys: this.#order });
      return;
    }
    const slide = this.#slide;
    if (!slide) return;
    this.#slide = null;
    const line = this.#line(slide.key);
    if (line) line.style.transform = '';
    if (slide.moved) this._swiped = ItemListState.uncovers(event.clientX - slide.x) ? slide.key : null;
  }
}

if (!customElements.get('wax-item-list')) customElements.define('wax-item-list', WaxItemList);
