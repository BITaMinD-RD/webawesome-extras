// @ts-check
import { LitElement, html, nothing } from 'lit';
import '@awesome.me/webawesome/dist/components/popup/popup.js';
import '@awesome.me/webawesome/dist/components/dialog/dialog.js';
import { LocalizeController } from '../../utilities/localize.js';
import { FloatingCardState } from './floating-card.state.js';
import styles from './floating-card.styles.js';
import { WaShowEvent } from '@awesome.me/webawesome/dist/events/show.js';
import { WaAfterShowEvent } from '@awesome.me/webawesome/dist/events/after-show.js';
import { WaHideEvent } from '@awesome.me/webawesome/dist/events/hide.js';
import { WaAfterHideEvent } from '@awesome.me/webawesome/dist/events/after-hide.js';

/**
 * A card that floats next to what was clicked: in a long list the thing it talks about may be far away, out of sight. With a mouse it can also peek: it shows a moment after the pointer
 * arrives (`peek`), goes when it leaves (`leave`), and stays once clicked (`show`); clicking the same thing again closes it (`toggle`). Without a mouse there is no "next to": it goes in the
 * middle, in a `wa-dialog` with the rest dimmed. Escape, a click outside and its × close it too.
 *
 * It opens and closes like a `wa-dialog`: the `open` property, `show()` and `hide()`, and the four events of Web Awesome (`wa-show`, `wa-after-show`, `wa-hide` and `wa-after-hide`, its own
 * classes). `wa-show` and `wa-hide` can be cancelled (`preventDefault()` keeps it as it was); at `wa-show` the element already has its `anchor` and its `centered`. It knows nothing of what it shows: the content is its children, which whoever opens it fills in the listener of
 * `wa-show` (and cancels it if there is nothing to say). It knows nothing of the Back button either: whoever wants Back to close it listens to its events.
 *
 * ```html
 * <wax-floating-card close-label="Cerrar"></wax-floating-card>
 * ```
 * ```js
 * card.addEventListener('wa-show', event => {                       // the content, when it is going to show (the events of what is inside come up here too: look at event.target)
 *   if (event.target === card) card.replaceChildren(dayView(card.anchor.dataset.day));
 * });
 * day.addEventListener('click', () => card.toggle(day));            // pinned, next to the day; the same day again closes it
 * day.addEventListener('mouseenter', () => card.peek(day));         // with a mouse, after a moment
 * day.addEventListener('mouseleave', () => card.leave());
 * ```
 *
 * With a mouse it is a `wa-popup` inside, anchored to the element it talks about: under it by default (`placement`), on the other side or moved along if it does not fit. It is where the `anchor` is wherever the card is in the page, so it can be a child of any element. Without one it is a `wa-dialog` (`light-dismiss`, without header: the × is its own), whose focus handling, Escape and click outside are the ones of the dialog; the events of the inner popup and dialog stay inside, and what comes out are the four of the card, once each.
 *
 * @summary A card next to what was clicked: it peeks with a mouse, is pinned by a click and sits in the middle without one.
 * @since 0.1.0
 *
 * @element wax-floating-card
 *
 * @attr {boolean} open - It is shown. Set from outside it shows (pinned, next to the `anchor`) or hides it, like the one of a `wa-dialog`
 * @attr {boolean} peeking - It only peeks (read only): it cannot be used until it is pinned with a click
 * @attr {boolean} centered - It is in the middle with the rest dimmed, because there is no mouse (read only)
 * @attr {string} close-label - What the close button (×) is called (the `close` term of Web Awesome, in the language of the page, when empty)
 * @attr {string} label - What the card is called for who does not see it (its `aria-label`)
 * @attr {number} delay - Milliseconds the pointer has to stay before it peeks (400)
 * @attr {string} placement - Where it goes with respect to the `anchor`, as in `wa-popup` (`bottom-start`); it flips to the other side and shifts if it does not fit
 * @attr {number} distance - Pixels between the `anchor` and the card (6)
 *
 * @prop {boolean} open - It is shown
 * @prop {Element | null} anchor - What it is next to; `show()` and `peek()` set it
 * @prop {boolean} peeking - It only peeks
 * @prop {boolean} centered - It is in the middle with the rest dimmed
 * @prop {string} closeLabel - What the close button is called (attribute `close-label`); the `close` term of Web Awesome, in the language of the page, when empty
 * @prop {string} label - What the card is called for who does not see it
 * @prop {number} delay - Milliseconds the pointer has to stay before it peeks (400 by default)
 * @prop {string} placement - Where it goes with respect to the `anchor`, as in `wa-popup` (`bottom-start` by default)
 * @prop {number} distance - Pixels between the `anchor` and the card (6 by default)
 *
 * @fires {WaShowEvent} wa-show - It is going to show. Cancellable: `preventDefault()` keeps it closed. The content goes in here; `anchor` and `centered` are already set
 * @fires {WaAfterShowEvent} wa-after-show - It is shown and in its place
 * @fires {WaHideEvent} wa-hide - It is going to hide. Cancellable: `preventDefault()` keeps it open. `detail: { source }`: the element that asked (the close button, what was clicked outside) or the card itself (Escape, `hide()`, the pointer leaving, another anchor, a click outside in the middle)
 * @fires {WaAfterHideEvent} wa-after-hide - It is hidden (it has no animation: it comes right after `wa-hide`)
 *
 * @slot - What it says. Whoever opens it puts it here, in the listener of `wa-show`
 *
 * @csspart card - The card next to its anchor, with a mouse: its border, its background, its shadow and its size
 * @csspart close-button - The × button, in the corner (hidden while it only peeks)
 * @csspart popup - The container the `wa-popup` positions, with a mouse (its `popup` part)
 * @csspart dialog - The `<dialog>` of the `wa-dialog`, without a mouse (its `dialog` part)
 * @csspart body - The body of the `wa-dialog`, without a mouse (its `body` part)
 *
 * @cssprop [--floating-card-shadow] - The shadow of a pinned card (`--wa-shadow-l`)
 * @cssprop [--floating-card-peek-shadow] - The shadow of one that only peeks (`--wa-shadow-m`)
 * @cssprop [--floating-card-width] - The width of the card (`400px`)
 */
export class WaxFloatingCard extends LitElement {
  static properties = {
    open: { type: Boolean, reflect: true },
    peeking: { type: Boolean, reflect: true },
    centered: { type: Boolean, reflect: true },
    closeLabel: { type: String, attribute: 'close-label' },
    label: { type: String },
    delay: { type: Number },
    placement: { type: String },
    distance: { type: Number }
  };

  static styles = styles;

  /** Whether it is really shown: `open` says what is asked, this what is so (like the dialog inside a `wa-dialog`) */
  #localize = new LocalizeController(this);

  #shown = false;

  #pinned = false;

  /** @type {Element | null} */
  #anchor = null;

  /** Counts the times it has been shown: only the last one says `wa-after-show` */
  #showing = 0;

  /** Whether the dialog of the middle is closing because it was told to or because it was asked to (its animation takes a moment): it must not be told again */
  #dialogClosing = false;

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  #peeking;

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  #hiding;

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  #listening;

  /** @param {Event} event A click: outside the card, it closes it */
  #outside = event => {
    if (!event.composedPath().includes(this)) this.#close(/** @type {Element} */ (event.target));
  };

  /** @param {KeyboardEvent} event */
  #escape = event => {
    if (event.key === 'Escape') this.#close();
  };

  constructor() {
    super();
    this.open = false;
    this.peeking = false;
    this.centered = false;
    this.closeLabel = '';
    this.label = '';
    this.delay = FloatingCardState.DELAY;
    this.placement = 'bottom-start';
    this.distance = FloatingCardState.GAP;
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
    this.requestUpdate();
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
    const close = html`<button type="button" part="close-button" aria-label=${this.closeLabel || this.#localize.term('close')} @click=${(/** @type {Event} */ event) => this.#close(/** @type {Element} */ (event.currentTarget))}>×</button>`;
    // Without a mouse, in the middle: a `wa-dialog` that dims the rest, closes with Escape and a click outside, and looks after the focus. Its events stay here: the card says its own
    if (this.centered) {
      return html`<wa-dialog exportparts="dialog, body" without-header light-dismiss label=${this.label || nothing}
          @wa-show=${this.#dialogEvent} @wa-after-show=${this.#dialogShown} @wa-hide=${this.#dialogHiding} @wa-after-hide=${this.#dialogHidden}>
        ${close}<slot></slot>
      </wa-dialog>`;
    }
    // With a mouse, a `wa-popup` next to the anchor: the same one for every anchor, active while it is shown
    return html`<wa-popup exportparts="popup" ?active=${this.open} .anchor=${this.#anchor} placement=${this.placement} distance=${this.distance}
        flip flip-padding=${FloatingCardState.MARGIN} shift shift-padding=${FloatingCardState.MARGIN} auto-size="vertical" auto-size-padding=${FloatingCardState.MARGIN} hover-bridge
        @wa-reposition=${this.#dialogEvent}>
      <div part="card" role="dialog" aria-label=${this.label || nothing}>${close}<slot></slot></div>
    </wa-popup>`;
  }

  /** @param {import('lit').PropertyValues} changed */
  updated(changed) {
    this.#syncDialog();
    if (changed.has('open') && changed.get('open') !== undefined) {
      // `open` set from outside, like the one of a `wa-dialog`: it shows or hides, and what was cancelled puts `open` back
      if (this.open && !this.#shown) this.show();
      else if (!this.open && this.#shown) { this.open = true; this.#close(); }
    }
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
    if (this.#shown && !this.#pinned) this.#hiding = setTimeout(() => { if (!this.#pinned) this.#close(); }, FloatingCardState.GRACE);
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
   * @returns {boolean} Whether it is shown: `wa-show` or the `wa-hide` of the one it replaced were not cancelled
   */
  show(anchor = this.#anchor, { pinned = true } = {}) {
    clearTimeout(this.#peeking);
    if (this.#shown && !this.#close()) return false;
    const centered = !FloatingCardState.hasMouse();
    // What a listener of `wa-show` needs to know (what it is next to, if it goes in the middle) is on the element before the event, as the event of Web Awesome has no detail
    this.#anchor = anchor;
    this.centered = centered;
    const event = new WaShowEvent();
    this.dispatchEvent(event);
    if (event.defaultPrevented) { this.#anchor = null; this.centered = false; this.open = false; return false; }
    this.#shown = true;
    this.#pinned = pinned;
    this.peeking = !pinned;
    this.open = true;
    if (!centered) {
      // After this click has finished: the click that opens it is not a click outside it. (In the middle, the `wa-dialog` does both)
      this.#listening = setTimeout(() => document.addEventListener('click', this.#outside), 0);
      document.addEventListener('keydown', this.#escape);
      const shown = ++this.#showing;
      this.#placed().then(() => {
        if (this.#shown && shown === this.#showing) this.dispatchEvent(new WaAfterShowEvent());
      });
    }
    return true;
  }

  /**
   * Hides it.
   *
   * @returns {boolean} Whether it is hidden: `wa-hide` was not cancelled
   */
  hide() {
    return this.#close();
  }

  /**
   * Puts it back next to its thing after what is inside has grown (something that came later from the network): it asks the `wa-popup` to reposition. In the middle, the CSS places it.
   */
  place() {
    if (!this.#shown || this.centered) return;
    /** @type {any} */ (this.renderRoot.querySelector('wa-popup'))?.reposition();
  }

  /** @param {Event} event What the inner `wa-popup` or `wa-dialog` says about itself: the card does not pass it on */
  #dialogEvent = event => {
    if (event.target === event.currentTarget) event.stopPropagation();
  };

  /** @param {Event} event The `wa-dialog` is open: the card says so */
  #dialogShown = event => {
    if (event.target !== event.currentTarget) return;
    event.stopPropagation();
    if (this.#shown && this.centered) this.dispatchEvent(new WaAfterShowEvent());
  };

  /** @param {Event} event The `wa-dialog` is asked to close (Escape, a click outside), unless it was the card that asked */
  #dialogHiding = event => {
    if (event.target !== event.currentTarget) return;
    event.stopPropagation();
    if (this.#dialogClosing) return;
    // Its source is its own `<dialog>` for Escape and a click outside: for the card, itself. If the card is told no, the dialog stays open
    const source = /** @type {CustomEvent} */ (event).detail?.source;
    if (this.#close(source instanceof HTMLDialogElement ? this : source)) this.#dialogClosing = true;
    else event.preventDefault();
  };

  /** @param {Event} event The `wa-dialog` has closed (the card said so when it was asked, as it has no animation of its own) */
  #dialogHidden = event => {
    if (event.target !== event.currentTarget) return;
    event.stopPropagation();
    this.#dialogClosing = false;
    this.#syncDialog();   // it was shown again while the dialog was closing
  };

  /** Opens or closes the `wa-dialog` of the middle as the card is: it follows `open`, and tells back in its events */
  async #syncDialog() {
    const dialog = /** @type {any} */ (this.renderRoot?.querySelector('wa-dialog'));
    if (!dialog) return;
    await dialog.updateComplete;
    const wanted = this.#shown && this.centered;
    if (wanted && !dialog.open) dialog.open = true;
    else if (!wanted && dialog.open && !this.#dialogClosing) { this.#dialogClosing = true; dialog.open = false; }
  }

  /** @returns {Promise<void>} Once what is shown is drawn and, next to its anchor, the popup has placed it */
  async #placed() {
    await this.updateComplete;
    const popup = /** @type {any} */ (this.renderRoot.querySelector('wa-popup'));
    if (!popup) return;
    await popup.updateComplete;
    await new Promise(resolve => requestAnimationFrame(resolve));
  }

  /**
   * @param {Element} [source] What asked (the close button, what was clicked outside); the card itself if nothing else (Escape, `hide()`, the pointer leaving, another anchor, a click outside in the middle)
   * @returns {boolean} Whether it is hidden
   */
  #close(source = this) {
    clearTimeout(this.#peeking);
    clearTimeout(this.#hiding);
    if (!this.#shown) return true;
    const event = new WaHideEvent({ source });
    this.dispatchEvent(event);
    if (event.defaultPrevented) { this.open = true; return false; }
    this.#shown = false;
    this.#pinned = false;
    this.#anchor = null;
    this.peeking = false;
    this.open = false;
    this.#unlisten();
    // It has no animation, so what comes after is right after: and a card that closes to open again (`replace`) finishes closing before it begins to open
    this.dispatchEvent(new WaAfterHideEvent());
    return true;
  }

  #unlisten() {
    clearTimeout(this.#listening);
    document.removeEventListener('click', this.#outside);
    document.removeEventListener('keydown', this.#escape);
  }
}

if (!customElements.get('wax-floating-card')) customElements.define('wax-floating-card', WaxFloatingCard);
