// @ts-check

import { BackClose } from './BackClose.js';

/**
 * A card that floats next to what was clicked: in a long list the thing it talks about may be far away, out of sight. With a mouse it can
 * also peek: it shows a moment after the pointer arrives (`peek`), goes when it leaves (`leave`), and stays once clicked (`show`); clicking
 * the same thing again closes it. Without a mouse there is no "next to": it goes in the middle with the rest dimmed, and the back button of
 * the phone closes it (`BackClose`) instead of leaving the page. Escape and a click outside close it too.
 *
 * It knows nothing of what it shows: the content comes as HTML, as a node, or as a function that paints into a container it is given (so
 * whoever draws with a library, such as a template that renders into an element, does it without this knowing the library), and `onShow` is
 * called each time it changes, for whoever needs to fill or listen to something inside.
 *
 * Classes: `.floating-card` (and the `className` given), `.peeking` while it only peeks, `.centered` without a mouse, the close button
 * `.floating-card-close`, the container given to a function `.floating-card-body` (it takes no room: `display: contents`), and the dimmed
 * page behind `.floating-card-backdrop` (controls.css).
 *
 * @typedef {string | Node | ((body: HTMLElement) => string | Node | void)} FloatingCard.Content What goes inside. A function is called when it
 *   is shown, with a container to paint into; it can also give back a string or a node instead. If it comes to nothing (an empty string, or
 *   nothing painted), nothing is shown.
 */
export class FloatingCard {
  /** Milliseconds the pointer has to stay before it peeks */
  static DELAY = 400;

  /** Milliseconds after the pointer leaves before a peeking card goes: crossing the gap between the thing and the card does not close it */
  static GRACE = 150;

  /** @type {HTMLElement | null} */
  #card = null;

  /** @type {HTMLElement | null} */
  #backdrop = null;

  /** @type {Element | null} What it was shown next to */
  #near = null;

  #pinned = false;

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  #peeking;

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  #hiding;

  /** @type {(() => void) | null} Gives back the step of the history it took (`BackClose`) */
  #release = null;

  /** @param {Event} event A click: outside the card, it closes it */
  #outside = event => {
    if (this.#card && !this.#card.contains(/** @type {Node} */ (event.target))) this.close();
  };

  /** @param {KeyboardEvent} event */
  #escape = event => {
    if (event.key === 'Escape') this.close();
  };

  /** @type {{document: Document, className: string, closeLabel: string, delay: number, onShow?: (card: HTMLElement) => void}} */
  #options;

  /**
   * @param {{document?: Document, className?: string, closeLabel?: string, delay?: number, onShow?: (card: HTMLElement) => void}} [options]
   *   `className`: more classes for the card; `closeLabel`: what the close button (×) is called; `onShow`: after each content is in
   */
  constructor({ document = globalThis.document, className = '', closeLabel = 'Close', delay = FloatingCard.DELAY, onShow } = {}) {
    this.#options = { document, className, closeLabel, delay, onShow };
    this.close = this.close.bind(this);
  }

  /**
   * @param {Window} [window]
   * @returns {boolean} Whether there is a mouse to peek with and room to put the card next to things. Asked each time, not once: it can be
   *   tried without changing device
   */
  static hasMouse(window = globalThis.window) {
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  /** @returns {HTMLElement | null} The card, while it is open */
  get element() {
    return this.#card;
  }

  /**
   * With a mouse, shows it a moment later without pinning it; without one, nothing.
   *
   * @param {FloatingCard.Content} content Asked when it shows
   * @param {Element} near
   */
  peek(content, near) {
    if (!FloatingCard.hasMouse(this.#window)) return;
    // If it was about to go (the pointer only crossed the edge between the thing and the card), it stays
    clearTimeout(this.#hiding);
    clearTimeout(this.#peeking);
    this.#peeking = setTimeout(() => this.show(content, near, { pinned: false }), this.#options.delay);
  }

  /** The pointer left: a card that only peeks goes, a moment later */
  leave() {
    clearTimeout(this.#peeking);
    clearTimeout(this.#hiding);
    if (this.#card && !this.#pinned) this.#hiding = setTimeout(() => { if (!this.#pinned) this.close(); }, FloatingCard.GRACE);
  }

  /**
   * Shows it next to `near`. Pinned, it stays until it is closed, and showing it pinned again next to the same thing closes it.
   *
   * @param {FloatingCard.Content} content Empty, nothing is shown
   * @param {Element} near
   * @param {{pinned?: boolean}} [options]
   * @returns {HTMLElement | null} The card
   */
  show(content, near, { pinned = true } = {}) {
    clearTimeout(this.#peeking);
    if (pinned && this.#card && this.#pinned && this.#near === near) {
      this.close();
      return null;
    }
    this.close();

    const filled = this.#resolve(content);
    if (!filled) return null;

    const doc = this.#options.document;
    const card = doc.createElement('div');
    card.className = ['floating-card', this.#options.className].filter(Boolean).join(' ');
    if (!pinned) card.classList.add('peeking');
    this.#card = card;
    this.#pinned = pinned;
    this.#near = near;

    if (!FloatingCard.hasMouse(this.#window)) {
      card.classList.add('centered');
      const backdrop = doc.createElement('div');
      backdrop.className = 'floating-card-backdrop';
      backdrop.addEventListener('click', this.close);
      doc.body.appendChild(backdrop);
      this.#backdrop = backdrop;
      this.#release = BackClose.push(this.close);
    }

    // Inside it, it stays still; when the pointer goes, it goes
    card.addEventListener('mouseenter', () => {
      clearTimeout(this.#peeking);
      clearTimeout(this.#hiding);
    });
    card.addEventListener('mouseleave', () => this.leave());

    doc.body.appendChild(card);
    this.#set(filled);
    // After this click has finished: the click that opens it is not a click outside it
    setTimeout(() => doc.addEventListener('click', this.#outside), 0);
    doc.addEventListener('keydown', this.#escape);
    return card;
  }

  /**
   * @param {FloatingCard.Content} content
   * @returns {string | Node | null} What it comes to; null if nothing
   */
  #resolve(content) {
    if (typeof content !== 'function') return content || null;
    const body = this.#options.document.createElement('div');
    body.className = 'floating-card-body';
    const made = content(body);
    if (made) return made;
    return body.children.length > 0 || (body.textContent ?? '').trim() !== '' ? body : null;
  }

  /**
   * Another content in the same card, without closing it: on a phone, opening it took a step of the history, and closing it to open
   * another would give it back too late.
   *
   * @param {FloatingCard.Content} content
   */
  replace(content) {
    if (this.#card) this.#set(this.#resolve(content) ?? '');
  }

  /** @param {string | Node} filled */
  #set(filled) {
    const card = /** @type {HTMLElement} */ (this.#card);
    card.innerHTML = '';
    const close = this.#options.document.createElement('button');
    close.type = 'button';
    close.className = 'floating-card-close';
    close.setAttribute('aria-label', this.#options.closeLabel);
    close.textContent = '×';
    close.addEventListener('click', this.close);
    card.append(close);
    if (typeof filled === 'string') card.insertAdjacentHTML('beforeend', filled); else card.append(filled);
    this.#options.onShow?.(card);
    this.place();
  }

  /**
   * Puts it under what it was shown next to or, if it does not fit, above. Again after what is inside has grown (something that came
   * later from the network). Centered, the CSS places it.
   */
  place() {
    const card = this.#card;
    if (!card || !this.#near || card.classList.contains('centered')) return;
    const window = this.#window;
    const box = this.#near.getBoundingClientRect();
    // The real width, the one the CSS gives (max-width included), not a number guessed
    const { width, height } = card.getBoundingClientRect();
    const fitsBelow = box.bottom + height + 12 < window.innerHeight;
    const top = fitsBelow ? box.bottom + 6 : Math.max(8, box.top - height - 6);
    card.style.top = `${top + window.scrollY}px`;
    card.style.left = `${Math.max(8, Math.min(box.left, window.innerWidth - width - 8))}px`;
  }

  close() {
    clearTimeout(this.#peeking);
    if (!this.#card) return;
    this.#card.remove();
    this.#card = null;
    this.#pinned = false;
    this.#near = null;
    this.#backdrop?.remove();
    this.#backdrop = null;
    // If it took a step of the history, it is given back (and if Back closed it, it is already gone)
    this.#release?.();
    this.#release = null;
    this.#options.document.removeEventListener('click', this.#outside);
    this.#options.document.removeEventListener('keydown', this.#escape);
  }

  /** @returns {Window} */
  get #window() {
    return /** @type {Window} */ (this.#options.document.defaultView ?? globalThis.window);
  }

}
