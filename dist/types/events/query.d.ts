/**
 * What is typed in a search box changed (or stopped changing). Bubbles and is composed, like the events of Web Awesome.
 *
 * @extends {CustomEvent<{query: string}>}
 */
export class WaxQueryEvent extends CustomEvent<{
    query: string;
}> {
    /** @param {{query: string}} detail */
    constructor(detail: {
        query: string;
    });
}
