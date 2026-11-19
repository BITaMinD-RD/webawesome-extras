// @ts-check

/**
 * The «New» button was pressed. Bubbles and is composed, like the events of Web Awesome.
 *
 * @extends {CustomEvent<{}>}
 */
export class WaxNewEvent extends CustomEvent {
  /** @param {{}} [detail] */
  constructor(detail = {}) {
    super('wax-new', { detail, bubbles: true, composed: true });
  }
}
