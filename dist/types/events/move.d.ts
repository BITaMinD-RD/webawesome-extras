/**
 * A line was moved; `keys` are all of them in their new order. Bubbles and is composed, like the events of Web Awesome.
 *
 * @extends {CustomEvent<{keys: string[]}>}
 */
export class WaxMoveEvent extends CustomEvent<{
    keys: string[];
}> {
    /** @param {{keys: string[]}} detail */
    constructor(detail: {
        keys: string[];
    });
}
