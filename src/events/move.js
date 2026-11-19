// @ts-check

/**
 * A line was moved; `keys` are all of them in their new order. Bubbles and is composed, like the events of Web Awesome.
 *
 * @extends {CustomEvent<{keys: string[]}>}
 */
export class WaxMoveEvent extends CustomEvent {
  /** @param {{keys: string[]}} detail */
  constructor(detail) {
    super('wax-move', { detail, bubbles: true, composed: true });
  }
}
