/**
 * Lines were marked or unmarked; `keys` are all the marked ones. Bubbles and is composed, like the events of Web Awesome.
 *
 * @extends {CustomEvent<{keys: string[]}>}
 */
export class WaxMarkEvent extends CustomEvent<{
    keys: string[];
}> {
    /** @param {{keys: string[]}} detail */
    constructor(detail: {
        keys: string[];
    });
}
