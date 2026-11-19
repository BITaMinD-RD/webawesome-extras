// @ts-check

/**
 * The element is shown and its animation, if any, is over. Bubbles and is composed, like the events of Web Awesome.
 *
 * @extends {CustomEvent<{anchor?: Element | null}>}
 */
export class WaxAfterShowEvent extends CustomEvent {
  /** @param {{anchor?: Element | null}} [detail] */
  constructor(detail = {}) {
    super('wax-after-show', { detail, bubbles: true, composed: true });
  }
}
