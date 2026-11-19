// @ts-check

/**
 * Lines were marked or unmarked; `keys` are all the marked ones. Bubbles and is composed, like the events of Web Awesome.
 *
 * @extends {CustomEvent<{keys: string[]}>}
 */
export class WaxMarkEvent extends CustomEvent {
  /** @param {{keys: string[]}} detail */
  constructor(detail) {
    super('wax-mark', { detail, bubbles: true, composed: true });
  }
}
