// @ts-check

/**
 * @typedef {Object} ListItem
 * @property {string} key Identifies the item: what `onSelect` and `onMark` give back
 * @property {string} name Plain text
 * @property {string} [icon] Plain text: an emoji
 * @property {string} [note] Plain text, smaller, after the name
 * @property {boolean} [faded] Struck through and paler (a site that has been vetoed, say)
 * @property {string} [html] Markup the application wrote, at the end of the line (a checkbox, a button): the one place where markup goes in
 */

/**
 * The usual list to choose from: icon, name and a note per line. One line is selected at a time (click it again to clear),
 * and with Ctrl, Cmd or Shift + click lines are marked, any number, for the application to do something with them (join them).
 * It knows nothing about what the items are: `controls.css` gives it a look, and `MapPicker` (`lib/osm-ui`) can show the same keys on a map.
 *
 * Two things a list can also do, if asked:
 * - **Move** (`onMove`): each line has a handle, dragged with mouse or finger, or moved with the arrow keys when it has the focus; the list
 *   gives back the keys in their new order.
 * - **Swipe** (`swipe`): sliding a line sideways with the finger uncovers one action (Remove, Seen) instead of doing it straight away.
 */
export class ItemList {
  /** Clicks on these inside a line belong to them, not to the list */
  static OWN = 'a, button, input, label, select, textarea, wa-button, wa-input, wa-select, .item-handle';

  /** @type {HTMLElement} */
  element;

  /** @type {string | null} */
  selected = null;

  /** @type {Set<string>} */
  marked = new Set();

  /** @type {string} Shown when there are no items */
  empty;

  /** @type {(key: string | null, event: Event | null) => void} */
  #onSelect;

  /** @type {(keys: string[], event: Event | null) => void} */
  #onMark;

  /** @type {((keys: string[]) => void) | undefined} */
  #onMove;

  /** @type {{label: string, action: (key: string) => void} | undefined} */
  #swipe;

  /**
   * @param {{element: HTMLElement, empty?: string, onSelect?: (key: string | null, event: Event | null) => void, onMark?: (keys: string[], event: Event | null) => void,
   *   onMove?: (keys: string[]) => void, swipe?: {label: string, action: (key: string) => void}}} options
   * `element` is the list (a `<ul>`); `empty`, what it says with no items; `onSelect`, `key` null when the selection is cleared;
   * `onMark`, the keys that are marked now; `onMove`, the keys in their new order after moving one; `swipe`, the action a slid line uncovers
   */
  constructor({ element, empty = '', onSelect = () => {}, onMark = () => {}, onMove, swipe }) {
    this.element = element;
    this.empty = empty;
    this.#onSelect = onSelect;
    this.#onMark = onMark;
    this.#onMove = onMove;
    this.#swipe = swipe;
    element.classList.add('item-list');
    if (onMove) this.#movable();
    if (swipe) this.#swipeable();
    element.addEventListener('click', event => this.#click(event));
    element.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (event.target instanceof Element && event.target.closest(ItemList.OWN)) return;
      event.preventDefault();
      this.#click(event);
    });
  }

  /**
   * @param {string} text
   * @returns {string}
   */
  static escape(text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /**
   * The lines, as markup; text is escaped, `html` is not.
   *
   * @param {ListItem[]} items
   * @param {{selected?: string | null, marked?: Set<string>, empty?: string}} [options]
   * @returns {string}
   */
  static html(items, { selected = null, marked = new Set(), empty = '', movable = false, swipe = '' } = {}) {
    if (!items.length) return empty ? `<li class="item-empty">${ItemList.escape(empty)}</li>` : '';
    return items.map(item => {
      const classes = ['item-line', item.faded ? 'item-faded' : '', item.key === selected ? 'item-selected' : '', marked.has(item.key) ? 'item-marked' : '']
        .filter(Boolean).join(' ');
      return `<li class="${classes}" data-key="${ItemList.escape(item.key)}" tabindex="0">`
        + (movable ? '<span class="item-handle" tabindex="0" role="button" aria-label="Mover (flechas arriba y abajo)" title="Arrastrar para ordenar">⋮⋮</span>' : '')
        + (item.icon ? `<span class="item-icon">${ItemList.escape(item.icon)}</span>` : '')
        + `<strong class="item-name">${ItemList.escape(item.name)}</strong>`
        + (item.note ? `<span class="item-note">${ItemList.escape(item.note)}</span>` : '')
        + (item.html ?? '')
        + (swipe ? `<button type="button" class="item-swipe">${ItemList.escape(swipe)}</button>` : '')
        + '</li>';
    }).join('');
  }

  /**
   * Draws the items. What was selected or marked stays so if it is still there.
   *
   * @param {ListItem[]} items
   */
  setItems(items) {
    const keys = new Set(items.map(item => item.key));
    if (this.selected !== null && !keys.has(this.selected)) this.selected = null;
    for (const key of [...this.marked]) if (!keys.has(key)) this.marked.delete(key);
    this.element.innerHTML = ItemList.html(items, { selected: this.selected, marked: this.marked, empty: this.empty, movable: Boolean(this.#onMove), swipe: this.#swipe?.label });
  }

  /**
   * Selects an item without asking the application (the map chose it): `scroll` brings it into view.
   *
   * @param {string | null} key
   * @param {{scroll?: boolean}} [options]
   */
  select(key, { scroll = false } = {}) {
    this.selected = key;
    for (const line of this.#lines()) {
      const on = line.dataset.key === key;
      line.classList.toggle('item-selected', on);
      if (on && scroll) line.scrollIntoView({ block: 'nearest' });
    }
  }

  /** Clears the marks, without telling the application */
  clearMarks() {
    this.marked.clear();
    for (const line of this.#lines()) line.classList.remove('item-marked');
  }

  /** @returns {string[]} The keys, as the lines are now */
  #order() {
    return this.#lines().map(line => /** @type {string} */ (line.dataset.key));
  }

  /** The handle drags its line among the others, with mouse or finger; with the focus on it, the arrow keys move it one place */
  #movable() {
    const element = this.element;
    /** @type {HTMLElement | null} */
    let dragged = null;
    element.addEventListener('pointerdown', event => {
      const handle = event.target instanceof Element ? event.target.closest('.item-handle') : null;
      if (!handle) return;
      event.preventDefault();
      dragged = /** @type {HTMLElement} */ (handle.closest('li[data-key]'));
      dragged.classList.add('item-dragging');
      element.setPointerCapture?.(event.pointerId);
    });
    element.addEventListener('pointermove', event => {
      if (!dragged) return;
      const over = /** @type {HTMLElement | null} */ (this.#lines().find(line => line !== dragged && ItemList.#within(line, event.clientY)) ?? null);
      if (!over) return;
      const below = event.clientY > over.getBoundingClientRect().top + over.offsetHeight / 2;
      over.parentNode?.insertBefore(dragged, below ? over.nextSibling : over);
    });
    const drop = () => {
      if (!dragged) return;
      dragged.classList.remove('item-dragging');
      dragged = null;
      this.#onMove?.(this.#order());
    };
    element.addEventListener('pointerup', drop);
    element.addEventListener('pointercancel', drop);
    element.addEventListener('keydown', event => {
      const handle = event.target instanceof Element ? event.target.closest('.item-handle') : null;
      if (!handle || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
      event.preventDefault();
      const line = /** @type {HTMLElement} */ (handle.closest('li[data-key]'));
      const next = event.key === 'ArrowUp' ? line.previousElementSibling : line.nextElementSibling?.nextElementSibling ?? null;
      if (event.key === 'ArrowUp' && !next) return;
      if (event.key === 'ArrowDown' && !line.nextElementSibling) return;
      line.parentNode?.insertBefore(line, next);
      /** @type {HTMLElement} */ (handle).focus();
      this.#onMove?.(this.#order());
    });
  }

  /** @param {HTMLElement} line @param {number} y @returns {boolean} */
  static #within(line, y) {
    const box = line.getBoundingClientRect();
    return y >= box.top && y <= box.bottom;
  }

  /** Sliding a line sideways with the finger uncovers its action; a tap anywhere else covers it again */
  #swipeable() {
    const element = this.element;
    element.classList.add('item-swipeable');
    /** @type {{line: HTMLElement, x: number, y: number, moved: boolean} | null} */
    let start = null;
    element.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'touch') return;
      const line = event.target instanceof Element ? /** @type {HTMLElement | null} */ (event.target.closest('li[data-key]')) : null;
      for (const open of this.#lines()) if (open !== line) open.classList.remove('item-swiped');
      start = line ? { line, x: event.clientX, y: event.clientY, moved: false } : null;
    });
    element.addEventListener('pointermove', event => {
      if (!start) return;
      const dx = event.clientX - start.x;
      // Only a slide that is more sideways than down: otherwise it is the list scrolling
      if (!start.moved && Math.abs(dx) < Math.abs(event.clientY - start.y) * 1.5) { if (Math.abs(event.clientY - start.y) > 10) start = null; return; }
      start.moved = true;
      start.line.style.transform = `translateX(${Math.min(0, dx)}px)`;
    });
    const end = (/** @type {PointerEvent} */ event) => {
      if (!start) return;
      const { line, x, moved } = start;
      start = null;
      line.style.transform = '';
      if (moved) line.classList.toggle('item-swiped', event.clientX - x < -48);
    };
    element.addEventListener('pointerup', end);
    element.addEventListener('pointercancel', end);
    element.addEventListener('click', event => {
      const button = event.target instanceof Element ? event.target.closest('.item-swipe') : null;
      if (!button) return;
      const line = /** @type {HTMLElement} */ (button.closest('li[data-key]'));
      this.#swipe?.action(/** @type {string} */ (line.dataset.key));
    });
  }

  /** @returns {HTMLElement[]} */
  #lines() {
    return /** @type {HTMLElement[]} */ ([...this.element.querySelectorAll('li[data-key]')]);
  }

  /** @param {Event} event */
  #click(event) {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest(ItemList.OWN)) return;
    const line = /** @type {HTMLElement | null} */ (target?.closest('li[data-key]') ?? null);
    if (!line || !this.element.contains(line)) return;
    const key = /** @type {string} */ (line.dataset.key);
    const mouse = /** @type {MouseEvent} */ (event);
    if (mouse.ctrlKey || mouse.metaKey || mouse.shiftKey) {
      if (!this.marked.delete(key)) this.marked.add(key);
      line.classList.toggle('item-marked', this.marked.has(key));
      this.#onMark([...this.marked], event);
      return;
    }
    const next = key === this.selected ? null : key;
    this.select(next);
    this.#onSelect(next, event);
  }
}
