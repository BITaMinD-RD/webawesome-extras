// @ts-check

/**
 * What `<wax-floating-card>` decides without a DOM: whether there is a mouse to peek with and whether showing the card again closes it. The element (`floating-card.js`) only draws, listens and sets the timers; the rules are here, so they run in Node and are tested there.
 */
export class FloatingCardState {
  /** Milliseconds the pointer has to stay before the card peeks */
  static DELAY = 400;

  /** Milliseconds after the pointer leaves before a peeking card goes: crossing the gap between the thing and the card does not close it */
  static GRACE = 150;

  /** The default space between the thing and the card (the `distance` of the card) */
  static GAP = 6;

  /** The space kept between the card and the edge of the window, when it flips, shifts or shrinks */
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
}
