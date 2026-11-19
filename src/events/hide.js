// @ts-check

/**
 * The element is going to hide. Cancellable: `preventDefault()` keeps it open. `source` is the element that asked and `reason` what it was (like the `source` of `wa-hide`). Bubbles and is composed, like the events of Web Awesome.
 *
 * @extends {CustomEvent<{source: Element, reason: string}>}
 */
export class WaxHideEvent extends CustomEvent {
  /** @param {{source: Element, reason: string}} detail */
  constructor(detail) {
    super('wax-hide', { detail, bubbles: true, composed: true, cancelable: true });
  }
}
