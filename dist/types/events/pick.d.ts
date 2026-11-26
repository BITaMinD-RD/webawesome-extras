/**
 * The user picked a point on a map: clicked it or dropped the marker. Bubbles and is composed, like the events of Web Awesome.
 *
 * @extends {CustomEvent<{lat: number, lon: number}>}
 */
export class WaxPickEvent extends CustomEvent<{
    lat: number;
    lon: number;
}> {
    /** @param {{lat: number, lon: number}} detail */
    constructor(detail: {
        lat: number;
        lon: number;
    });
}
