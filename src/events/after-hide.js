// @ts-check

/**
 * The element is hidden. Bubbles and is composed, like the events of Web Awesome.
 *
 * @extends {CustomEvent<{}>}
 */
export class WaxAfterHideEvent extends CustomEvent {
  /** @param {{}} [detail] */
  constructor(detail = {}) {
    super('wax-after-hide', { detail, bubbles: true, composed: true });
  }
}
