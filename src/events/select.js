// @ts-check

/**
 * A line was chosen; `key` is null when the selection was cleared. Bubbles and is composed, like the events of Web Awesome.
 *
 * @extends {CustomEvent<{key: string | null}>}
 */
export class WaxSelectEvent extends CustomEvent {
  /** @param {{key: string | null}} detail */
  constructor(detail) {
    super('wax-select', { detail, bubbles: true, composed: true });
  }
}
