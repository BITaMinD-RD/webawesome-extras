// @ts-check

/**
 * A map could not be loaded: Leaflet did not arrive (there is no connection, or the address is wrong). Bubbles and is composed, like the events of Web Awesome.
 *
 * @extends {CustomEvent<{src: string}>}
 */
export class WaxMapErrorEvent extends CustomEvent {
  /** @param {{src: string}} detail */
  constructor(detail) {
    super('wax-map-error', { detail, bubbles: true, composed: true });
  }
}
