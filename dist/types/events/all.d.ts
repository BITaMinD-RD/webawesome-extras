/**
 * «Yes to all» or «no to all» was answered. Bubbles and is composed, like the events of Web Awesome.
 *
 * @extends {CustomEvent<{value: boolean}>}
 */
export class WaxAllEvent extends CustomEvent<{
    value: boolean;
}> {
    /** @param {{value: boolean}} detail */
    constructor(detail: {
        value: boolean;
    });
}
