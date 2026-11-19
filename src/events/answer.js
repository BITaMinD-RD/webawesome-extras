// @ts-check

/**
 * A question was answered. Bubbles and is composed, like the events of Web Awesome.
 *
 * @extends {CustomEvent<{index: number, item: any, action: string}>}
 */
export class WaxAnswerEvent extends CustomEvent {
  /** @param {{index: number, item: any, action: string}} detail */
  constructor(detail) {
    super('wax-answer', { detail, bubbles: true, composed: true });
  }
}
