// @ts-check

/**
 * What `<wax-floating-card>` decides without a DOM: whether there is a mouse to peek with, whether showing the card again closes it, and where the card goes next to the
 * thing it talks about. The element (`WaxFloatingCard.js`) only draws, listens and sets the timers; the rules are here, so they run in Node and are tested there.
 */
export class FloatingCardState {
  /** Milliseconds the pointer has to stay before the card peeks */
  static DELAY = 400;

  /** Milliseconds after the pointer leaves before a peeking card goes: crossing the gap between the thing and the card does not close it */
  static GRACE = 150;

  /** The space between the thing and the card, and between the card and the edge of the window */
  static GAP = 6;

  static MARGIN = 8;

  /**
   * @param {{matchMedia: (query: string) => {matches: boolean}}} [window]
   * @returns {boolean} Whether there is a mouse to peek with and room to put the card next to things. Asked each time, not once: it can be tried without changing device
   */
  static hasMouse(window = /** @type {any} */ (globalThis.window)) {
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  /**
   * @param {boolean} open Whether the card is open now
   * @param {boolean} pinned Whether it is pinned (it stays until it is closed)
   * @param {unknown} current The thing it is next to now
   * @param {unknown} next The thing it is asked for now
   * @returns {boolean} Showing it pinned again next to the same thing closes it
   */
  static closesOnShow(open, pinned, current, next) {
    return open && pinned && current === next;
  }

  /**
   * Under what it talks about or, if it does not fit, above; and inside the window sideways.
   *
   * @param {{top: number, bottom: number, left: number}} box What it talks about, in the window
   * @param {{width: number, height: number}} card The real size of the card, the one the CSS gives
   * @param {{width: number, height: number}} view The window
   * @returns {{top: number, left: number}} In the window: whoever scrolls adds the scroll
   */
  static position(box, card, view) {
    const fitsBelow = box.bottom + card.height + 2 * FloatingCardState.GAP < view.height;
    const top = fitsBelow ? box.bottom + FloatingCardState.GAP : Math.max(FloatingCardState.MARGIN, box.top - card.height - FloatingCardState.GAP);
    const left = Math.max(FloatingCardState.MARGIN, Math.min(box.left, view.width - card.width - FloatingCardState.MARGIN));
    return { top, left };
  }
}
