/**
 * A question was answered. Bubbles and is composed, like the events of Web Awesome.
 *
 * @extends {CustomEvent<{index: number, item: any, action: string}>}
 */
export class WaxAnswerEvent extends CustomEvent<{
    index: number;
    item: any;
    action: string;
}> {
    /** @param {{index: number, item: any, action: string}} detail */
    constructor(detail: {
        index: number;
        item: any;
        action: string;
    });
}
