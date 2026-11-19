// @ts-check

/**
 * The element is going to show. Cancellable: `preventDefault()` keeps it closed. What `detail` holds depends on the element. Bubbles and is composed, like the events of Web Awesome.
 *
 * @extends {CustomEvent<{anchor?: Element | null, pinned?: boolean, centered?: boolean}>}
 */
export class WaxShowEvent extends CustomEvent {
  /** @param {{anchor?: Element | null, pinned?: boolean, centered?: boolean}} [detail] */
  constructor(detail = {}) {
    super('wax-show', { detail, bubbles: true, composed: true, cancelable: true });
  }
}
