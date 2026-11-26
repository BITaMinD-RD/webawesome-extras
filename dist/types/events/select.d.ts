/**
 * A line was chosen; `key` is null when the selection was cleared. Bubbles and is composed, like the events of Web Awesome.
 *
 * @extends {CustomEvent<{key: string | null}>}
 */
export class WaxSelectEvent extends CustomEvent<{
    key: string | null;
}> {
    /** @param {{key: string | null}} detail */
    constructor(detail: {
        key: string | null;
    });
}
