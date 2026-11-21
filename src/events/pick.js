// @ts-check

/**
 * The user picked a point on a map: clicked it or dropped the marker. Bubbles and is composed, like the events of Web Awesome.
 *
 * @extends {CustomEvent<{lat: number, lon: number}>}
 */
export class WaxPickEvent extends CustomEvent {
  /** @param {{lat: number, lon: number}} detail */
  constructor(detail) {
    super('wax-pick', { detail, bubbles: true, composed: true });
  }
}
