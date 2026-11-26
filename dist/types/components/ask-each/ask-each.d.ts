/**
 * The usual question when something has to be decided about several things («overwrite this file?»): it asks about each one in a dialog, with the progress («2 of 5»), and the answer can be
 * «yes to all» (or «no to all») for the rest, or cancelling, so that nothing happens. It knows nothing of what it asks: whoever uses it gives the verbs (`labels`) and how each thing is named
 * (`describe`). It is a `wa-dialog` inside, so it opens and closes like one: the `open` property, `show()` and `hide()`, `light-dismiss`, Escape, and the events of Web Awesome that
 * its dialog fires, which come out of this element as they are (`wa-show`, `wa-after-show`, `wa-hide` and `wa-after-hide`, the first and the third cancellable). Enter is the first button (the positive verb). It knows nothing of the Back button: whoever wants Back to
 * cancel it listens to those events (`BackClose.bind` in webutils).
 *
 * ```html
 * <wax-ask-each label="Overwrite?" question="Overwrite"></wax-ask-each>
 * ```
 * ```js
 * askEach.describe = file => `«${file.name}»`;
 * askEach.labels = { yes: 'Overwrite', no: 'Skip', yesAll: 'Overwrite all', noAll: 'Skip all' };
 * const answers = await askEach.ask(files);   // an array of booleans in the order of the files (true is the positive verb), or null if it was cancelled
 * ```
 *
 * @summary A dialog that asks about each thing in turn, with "yes to all", "no to all" and cancel.
 * @since 0.1.0
 *
 * @element wax-ask-each
 *
 * @attr {boolean} open - It is open. Set from outside it opens or closes like a `wa-dialog` (cancelling what is being asked)
 * @attr {string} label - The title of the dialog; without it, the dialog has no header
 * @attr {string} question - The beginning of the question, which goes on with what `describe` says of each thing
 * @attr {boolean} light-dismiss - Clicking outside the dialog cancels it
 *
 * @prop {boolean} open - It is open
 * @prop {string} label - The title of the dialog
 * @prop {string} question - The beginning of the question
 * @prop {boolean} lightDismiss - Clicking outside the dialog cancels it (attribute `light-dismiss`)
 * @prop {(item: any) => string} describe - How each thing is named in the question
 * @prop {{yes?: string, no?: string, yesAll?: string, noAll?: string, cancel?: string, progress?: string}} labels - The verbs of the buttons and the progress (`{n} of {total}`); the ones not given are the terms `waxYes`, `waxNo`, `waxYesAll`, `waxNoAll`, `waxCancel` and `waxProgress` of the language of the page
 *
 * @fires {WaShowEvent} wa-show - It is going to open. Cancellable: `preventDefault()` keeps it closed and `ask()` gives null
 * @fires {WaAfterShowEvent} wa-after-show - It is open
 * @fires {WaHideEvent} wa-hide - It is going to close, because an answer ended the questions or it was dismissed (Escape, outside, its cross). Cancellable: `preventDefault()` keeps it open. `detail: { source }`
 * @fires {WaAfterHideEvent} wa-after-hide - It is closed, and `ask()` has its answer
 * @fires wax-answer - A question was answered (or the whole thing cancelled). `detail: { index, item, action }`, `action` is `yes`, `no`, `yesAll`, `noAll` or `cancel`
 * @fires wax-all - «Yes to all» or «no to all» was answered: for whoever goes on answering the same to what is asked later. `detail: { value }`
 *
 * @csspart dialog - The `wa-dialog` (and, through it, its `header`, `title`, `body`, `footer` and `close-button`)
 * @csspart progress - The line «2 of 5»
 * @csspart question - The question
 * @csspart button - Each of the buttons. Also `yes`, `no`, `yes-all`, `no-all` and `cancel`
 *
 * @cssprop [--ask-each-width] - The width of the dialog (`31rem`, the one of a `wa-dialog`)
 */
export class WaxAskEach extends LitElement {
    static properties: {
        open: {
            type: BooleanConstructor;
            reflect: boolean;
        };
        label: {
            type: StringConstructor;
        };
        question: {
            type: StringConstructor;
        };
        lightDismiss: {
            type: BooleanConstructor;
            attribute: string;
        };
        describe: {
            attribute: boolean;
        };
        labels: {
            attribute: boolean;
        };
        _index: {
            state: boolean;
        };
    };
    static styles: import("lit").CSSResult;
    open: boolean;
    label: string;
    question: string;
    lightDismiss: boolean;
    /** @type {(item: any) => string} */
    describe: (item: any) => string;
    /** @type {Record<string, string>} */
    labels: Record<string, string>;
    /** @internal @type {number} The question that is asked now */
    _index: number;
    /**
     * Asks about each thing in turn, in a dialog, and resolves when it has closed with what was answered for each one: booleans in the order of the items (`true` is the positive verb), `null` if it was cancelled, `[]` if there was nothing to ask.
     *
     * @template T
     * @param {T[]} items What is asked about
     * @returns {Promise<boolean[] | null>} What was answered for each one (`true` is the positive verb); `null` if it was cancelled. Nothing to ask, nothing answered: `[]`
     */
    ask<T>(items: T[]): Promise<boolean[] | null>;
    /** Opens it, like a `wa-dialog` (without anything to ask there is nothing to see: `ask()` is what opens it with questions) */
    show(): void;
    /** Closes it: what was being asked is cancelled */
    hide(): void;
    render(): import("lit-html").TemplateResult<1>;
    /** @param {import('lit').PropertyValues} changed */
    updated(changed: import('lit').PropertyValues): Promise<void>;
    #private;
}
import { LitElement } from 'lit';
