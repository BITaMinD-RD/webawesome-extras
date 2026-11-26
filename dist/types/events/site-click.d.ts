/**
 * A site drawn on a map was clicked. Bubbles and is composed, like the events of Web Awesome.
 *
 * @extends {CustomEvent<{key: string}>}
 */
export class WaxSiteClickEvent extends CustomEvent<{
    key: string;
}> {
    /** @param {{key: string}} detail */
    constructor(detail: {
        key: string;
    });
}
