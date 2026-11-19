// @ts-check
import { LitElement, html, css, nothing } from 'lit';
import { FloatingCardState } from './FloatingCardState.js';

/**
 * A card that floats next to what was clicked: in a long list the thing it talks about may be far away, out of sight. With a mouse it can also peek: it shows a moment after the pointer
 * arrives (`peek`), goes when it leaves (`leave`), and stays once clicked (`show`); clicking the same thing again closes it (`toggle`). Without a mouse there is no "next to": it goes in the
 * middle with the rest dimmed. Escape, a click outside and its × close it too.
 *
 * It opens and closes like a `wa-dialog`: the `open` property, `show()` and `hide()`, and four events, `wax-show`, `wax-after-show`, `wax-hide` and `wax-after-hide`. `wax-show` and
 * `wax-hide` can be cancelled (`preventDefault()` keeps it as it was). It knows nothing of what it shows: the content is its children, which whoever opens it fills in the listener of
 * `wax-show` (and cancels it if there is nothing to say). It knows nothing of the Back button either: whoever wants Back to close it listens to its events.
 *
 * ```html
 * <wax-floating-card close-label="Cerrar"></wax-floating-card>   <!-- a child of the body -->
 * ```
 * ```js
 * card.addEventListener('wax-show', event => {                      // the content, when it is going to show
 *   card.replaceChildren(dayView(event.detail.anchor.dataset.day));
 * });
 * day.addEventListener('click', () => card.toggle(day));            // pinned, next to the day; the same day again closes it
 * day.addEventListener('mouseenter', () => card.peek(day));         // with a mouse, after a moment
 * day.addEventListener('mouseleave', () => card.leave());
 * ```
 *
 * It is placed with the coordinates of the page, so it has to be a child of the `body` (or of an element that is not positioned).
 *
 * @element wax-floating-card
 *
 * @attr {boolean} open - It is shown. Set from outside it shows (pinned, next to the `anchor`) or hides it, like the one of a `wa-dialog`
 * @attr {boolean} peeking - It only peeks (read only): it cannot be used until it is pinned with a click
 * @attr {boolean} centered - It is in the middle with the rest dimmed, because there is no mouse (read only)
 * @attr {string} close-label - What the close button (×) is called (`Close`)
 * @attr {string} label - What the card is called for who does not see it (its `aria-label`)
 * @attr {number} delay - Milliseconds the pointer has to stay before it peeks (400)
 *
 * @prop {boolean} open - It is shown
 * @prop {Element | null} anchor - What it is next to; `show()` and `peek()` set it
 * @prop {boolean} peeking - It only peeks
 * @prop {boolean} centered - It is in the middle with the rest dimmed
 * @prop {string} closeLabel - What the close button is called (attribute `close-label`)
 * @prop {string} label - What the card is called for who does not see it
 * @prop {number} delay - Milliseconds the pointer has to stay before it peeks
 *
 * @fires wax-show - It is going to show. Cancellable: `preventDefault()` keeps it closed. The content goes in here. `detail: { anchor, pinned, centered }`
 * @fires wax-after-show - It is shown and in its place, and the animation, if any, is over. `detail: { anchor }`
 * @fires wax-hide - It is going to hide. Cancellable: `preventDefault()` keeps it open. `detail: { source, reason }`: `source` is the element that asked (the close button, the backdrop, what was clicked outside, or the card itself) and `reason` is `escape`, `close-button`, `backdrop`, `outside`, `leave`, `replace` or `api`
 * @fires wax-after-hide - It is hidden (it has no animation: it comes right after `wax-hide`)
 *
 * @slot - What it says. Whoever opens it puts it here, in the listener of `wax-show`
 *
 * @csspart card - The card: its border, its background, its shadow and its size
 * @csspart close-button - The × button, in the corner (hidden while it only peeks)
 * @csspart backdrop - The dimmed page behind it, without a mouse
 *
 * @cssprop [--floating-card-shadow] - The shadow of a pinned card (`--wa-shadow-l`)
 * @cssprop [--floating-card-peek-shadow] - The shadow of one that only peeks (`--wa-shadow-m`)
 * @cssprop [--floating-card-centered-shadow] - The shadow of one in the middle (`--wa-shadow-l`)
 * @cssprop [--floating-card-backdrop] - The dimmed page behind a card in the middle (`rgba(0, 0, 0, .45)`)
 * @cssprop [--floating-card-width] - The width of the card (`400px`)
 */
export class WaxFloatingCard extends LitElement {
  static properties = {
    open: { type: Boolean, reflect: true },
    peeking: { type: Boolean, reflect: true },
    centered: { type: Boolean, reflect: true },
    closeLabel: { type: String, attribute: 'close-label' },
    label: { type: String },
    delay: { type: Number }
  };

  static styles = css`
    :host { display: none; position: absolute; z-index: 30; width: max-content; }
    :host([open]) { display: block; }
    :host([hidden]) { display: none; }
    [part~="card"] {
      position: relative; z-index: 1;
      box-sizing: border-box;
      width: var(--floating-card-width, 400px);
      max-width: 92vw;
      max-height: 70vh;
      max-height: 70dvh;
      overflow: auto;
      padding: 12px 14px;
      border: var(--wa-border-width-s, 1px) var(--wa-border-style, solid) var(--wa-color-surface-border);
      border-radius: var(--wa-border-radius-l);
      background: var(--wa-color-surface-default);
      box-shadow: var(--floating-card-shadow, var(--wa-shadow-l));
    }
    /* Only peeking, it cannot be used until it is pinned with a click */
    :host([peeking]) [part~="card"] { box-shadow: var(--floating-card-peek-shadow, var(--wa-shadow-m)); }
    :host([peeking]) [part~="close-button"] { display: none; }
    [part~="close-button"] {
      float: right;
      border: none;
      background: none;
      color: var(--wa-color-text-quiet);
      font-size: var(--wa-font-size-l);
      line-height: 1;
      cursor: pointer;
    }
    [part~="close-button"]:hover { color: var(--wa-color-text-normal); }
    [part~="close-button"]:focus-visible { outline: var(--wa-focus-ring); }
    /* Without a mouse: in the middle, and the rest dimmed */
    :host([centered]) { position: fixed; inset: 0; width: auto; }
    :host([centered][open]) { display: grid; place-items: center; }
    [part~="backdrop"] { position: absolute; inset: 0; background: var(--floating-card-backdrop, rgba(0, 0, 0, .45)); backdrop-filter: blur(2px); }
    :host([centered]) [part~="card"] {
      width: min(92vw, 560px);
      max-height: 80vh;
      max-height: calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
      box-shadow: var(--floating-card-centered-shadow, var(--wa-shadow-l));
    }
  `;

  /** Whether it is really shown: `open` says what is asked, this what is so (like the dialog inside a `wa-dialog`) */
  #shown = false;

  #pinned = false;

  /** @type {Element | null} */
  #anchor = null;

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  #peeking;

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  #hiding;

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  #listening;

  /** @param {Event} event A click: outside the card, it closes it */
  #outside = event => {
    if (!event.composedPath().includes(this)) this.#close('outside', /** @type {Element} */ (event.target));
  };

  /** @param {KeyboardEvent} event */
  #escape = event => {
    if (event.key === 'Escape') this.#close('escape');
  };

  constructor() {
    super();
    this.open = false;
    this.peeking = false;
    this.centered = false;
    this.closeLabel = 'Close';
    this.label = '';
    this.delay = FloatingCardState.DELAY;
    // Inside it, it stays still; when the pointer goes, it goes
    this.addEventListener('mouseenter', () => { clearTimeout(this.#peeking); clearTimeout(this.#hiding); });
    this.addEventListener('mouseleave', () => this.leave());
  }

  /** @returns {Element | null} What it is next to */
  get anchor() {
    return this.#anchor;
  }

  set anchor(anchor) {
    this.#anchor = anchor;
    if (this.#shown) this.place();
  }

  firstUpdated() {
    if (this.open && !this.#shown) this.show();   // born with `open`
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.#peeking);
    clearTimeout(this.#hiding);
    this.#unlisten();
  }

  render() {
    return html`${this.centered ? html`<div part="backdrop" @click=${(/** @type {Event} */ event) => this.#close('backdrop', /** @type {Element} */ (event.target))}></div>` : nothing}
      <div part="card" role="dialog" aria-label=${this.label || nothing}>
        <button type="button" part="close-button" aria-label=${this.closeLabel} @click=${(/** @type {Event} */ event) => this.#close('close-button', /** @type {Element} */ (event.currentTarget))}>×</button>
        <slot></slot>
      </div>`;
  }

  /** @param {import('lit').PropertyValues} changed */
  updated(changed) {
    if (changed.has('open') && changed.get('open') !== undefined) {
      // `open` set from outside, like the one of a `wa-dialog`: it shows or hides, and what was cancelled puts `open` back
      if (this.open && !this.#shown) this.show();
      else if (!this.open && this.#shown) { this.open = true; this.#close('api'); }
    }
    if (this.#shown) this.place();
  }

  /**
   * With a mouse, it peeks (shows without being pinned) a moment later; without one, nothing.
   *
   * @param {Element} anchor What it talks about
   */
  peek(anchor) {
    if (!FloatingCardState.hasMouse()) return;
    // If it was about to go (the pointer only crossed the edge between the thing and the card), it stays
    clearTimeout(this.#hiding);
    clearTimeout(this.#peeking);
    this.#peeking = setTimeout(() => this.show(anchor, { pinned: false }), this.delay);
  }

  /** The pointer left: a card that only peeks goes, a moment later */
  leave() {
    clearTimeout(this.#peeking);
    clearTimeout(this.#hiding);
    if (this.#shown && !this.#pinned) this.#hiding = setTimeout(() => { if (!this.#pinned) this.#close('leave'); }, FloatingCardState.GRACE);
  }

  /**
   * Shows it pinned next to `anchor`, or hides it if it was pinned next to the same thing.
   *
   * @param {Element} anchor
   */
  toggle(anchor) {
    if (FloatingCardState.closesOnShow(this.#shown, this.#pinned, this.#anchor, anchor)) this.hide();
    else this.show(anchor);
  }

  /**
   * Shows it next to `anchor`. Pinned, it stays until it is closed. If it was open, it closes first (and either listener can cancel what it is asked).
   *
   * @param {Element | null} [anchor] What it talks about; by default, the one it has
   * @param {{pinned?: boolean}} [options]
   * @returns {boolean} Whether it is shown: `wax-show` or the `wax-hide` of the one it replaced were not cancelled
   */
  show(anchor = this.#anchor, { pinned = true } = {}) {
    clearTimeout(this.#peeking);
    if (this.#shown && !this.#close('replace')) return false;
    const centered = !FloatingCardState.hasMouse();
    const event = new CustomEvent('wax-show', { detail: { anchor, pinned, centered }, bubbles: true, composed: true, cancelable: true });
    this.dispatchEvent(event);
    if (event.defaultPrevented) { this.open = false; return false; }
    this.#shown = true;
    this.#pinned = pinned;
    this.#anchor = anchor;
    this.peeking = !pinned;
    this.centered = centered;
    this.open = true;
    if (centered) { this.style.removeProperty('top'); this.style.removeProperty('left'); }
    // After this click has finished: the click that opens it is not a click outside it
    this.#listening = setTimeout(() => document.addEventListener('click', this.#outside), 0);
    document.addEventListener('keydown', this.#escape);
    this.updateComplete.then(() => {
      if (this.#shown) this.dispatchEvent(new CustomEvent('wax-after-show', { detail: { anchor }, bubbles: true, composed: true }));
    });
    return true;
  }

  /**
   * Hides it.
   *
   * @returns {boolean} Whether it is hidden: `wax-hide` was not cancelled
   */
  hide() {
    return this.#close('api');
  }

  /**
   * Puts it back next to its thing after what is inside has grown (something that came later from the network). In the middle, the CSS places it.
   */
  place() {
    const anchor = this.#anchor;
    if (!this.#shown || !anchor || this.centered) return;
    const card = /** @type {HTMLElement} */ (this.renderRoot.querySelector('[part~="card"]'));
    if (!card) return;
    const { width, height } = card.getBoundingClientRect();
    const { top, left } = FloatingCardState.position(anchor.getBoundingClientRect(), { width, height }, { width: window.innerWidth, height: window.innerHeight });
    this.style.top = `${top + window.scrollY}px`;
    this.style.left = `${left}px`;
  }

  /**
   * @param {'escape' | 'close-button' | 'backdrop' | 'outside' | 'leave' | 'replace' | 'api'} reason
   * @param {Element} [source] What asked; the card itself if nothing else
   * @returns {boolean} Whether it is hidden
   */
  #close(reason, source = this) {
    clearTimeout(this.#peeking);
    clearTimeout(this.#hiding);
    if (!this.#shown) return true;
    const event = new CustomEvent('wax-hide', { detail: { source, reason }, bubbles: true, composed: true, cancelable: true });
    this.dispatchEvent(event);
    if (event.defaultPrevented) { this.open = true; return false; }
    this.#shown = false;
    this.#pinned = false;
    this.#anchor = null;
    this.peeking = false;
    this.open = false;
    this.#unlisten();
    // It has no animation, so what comes after is right after: and a card that closes to open again (`replace`) finishes closing before it begins to open
    this.dispatchEvent(new CustomEvent('wax-after-hide', { bubbles: true, composed: true }));
    return true;
  }

  #unlisten() {
    clearTimeout(this.#listening);
    document.removeEventListener('click', this.#outside);
    document.removeEventListener('keydown', this.#escape);
  }
}

if (!customElements.get('wax-floating-card')) customElements.define('wax-floating-card', WaxFloatingCard);
