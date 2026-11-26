/**
 * The action of a slid line was pressed. Bubbles and is composed, like the events of Web Awesome.
 *
 * @extends {CustomEvent<{key: string}>}
 */
export class WaxSwipeEvent extends CustomEvent<{
    key: string;
}> {
    /** @param {{key: string}} detail */
    constructor(detail: {
        key: string;
    });
}
