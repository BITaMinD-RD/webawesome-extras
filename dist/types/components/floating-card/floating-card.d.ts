/**
 * A card that floats next to what was clicked: in a long list the thing it talks about may be far away, out of sight. With a mouse it can also peek: it shows a moment after the pointer
 * arrives (`peek`), goes when it leaves (`leave`), and stays once clicked (`show`); clicking the same thing again closes it (`toggle`). Without a mouse there is no "next to": it goes in the
 * middle, in a `wa-dialog` with the rest dimmed. Escape, a click outside and its × close it too.
 *
 * It opens and closes like a `wa-dialog`: the `open` property, `show()` and `hide()`, and the four events of Web Awesome (`wa-show`, `wa-after-show`, `wa-hide` and `wa-after-hide`, its own
 * classes). `wa-show` and `wa-hide` can be cancelled (`preventDefault()` keeps it as it was); at `wa-show` the element already has its `anchor` and its `centered`. It knows nothing of what it shows: the content is its children, which whoever opens it fills in the listener of
 * `wa-show` (and cancels it if there is nothing to say). It knows nothing of the Back button either: whoever wants Back to close it listens to its events.
 *
 * ```html
 * <wax-floating-card close-label="Cerrar"></wax-floating-card>
 * ```
 * ```js
 * card.addEventListener('wa-show', event => {                       // the content, when it is going to show (the events of what is inside come up here too: look at event.target)
 *   if (event.target === card) card.replaceChildren(dayView(card.anchor.dataset.day));
 * });
 * day.addEventListener('click', () => card.toggle(day));            // pinned, next to the day; the same day again closes it
 * day.addEventListener('mouseenter', () => card.peek(day));         // with a mouse, after a moment
 * day.addEventListener('mouseleave', () => card.leave());
 * ```
 *
 * With a mouse it is a `wa-popup` inside, anchored to the element it talks about: under it by default (`placement`), on the other side or moved along if it does not fit. It is where the `anchor` is wherever the card is in the page, so it can be a child of any element. Without one it is a `wa-dialog` (`light-dismiss`, without header: the × is its own), whose focus handling, Escape and click outside are the ones of the dialog; the events of the inner popup and dialog stay inside, and what comes out are the four of the card, once each.
 *
 * @summary A card next to what was clicked: it peeks with a mouse, is pinned by a click and sits in the middle without one.
 * @since 0.1.0
 *
 * @element wax-floating-card
 *
 * @attr {boolean} open - It is shown. Set from outside it shows (pinned, next to the `anchor`) or hides it, like the one of a `wa-dialog`
 * @attr {boolean} peeking - It only peeks (read only): it cannot be used until it is pinned with a click
 * @attr {boolean} centered - It is in the middle with the rest dimmed, because there is no mouse (read only)
 * @attr {string} close-label - What the close button (×) is called (the `close` term of Web Awesome, in the language of the page, when empty)
 * @attr {string} label - What the card is called for who does not see it (its `aria-label`)
 * @attr {number} delay - Milliseconds the pointer has to stay before it peeks (400)
 * @attr {string} placement - Where it goes with respect to the `anchor`, as in `wa-popup` (`bottom-start`); it flips to the other side and shifts if it does not fit
 * @attr {number} distance - Pixels between the `anchor` and the card (6)
 *
 * @prop {boolean} open - It is shown
 * @prop {Element | null} anchor - What it is next to; `show()` and `peek()` set it
 * @prop {boolean} peeking - It only peeks
 * @prop {boolean} centered - It is in the middle with the rest dimmed
 * @prop {string} closeLabel - What the close button is called (attribute `close-label`); the `close` term of Web Awesome, in the language of the page, when empty
 * @prop {string} label - What the card is called for who does not see it
 * @prop {number} delay - Milliseconds the pointer has to stay before it peeks (400 by default)
 * @prop {string} placement - Where it goes with respect to the `anchor`, as in `wa-popup` (`bottom-start` by default)
 * @prop {number} distance - Pixels between the `anchor` and the card (6 by default)
 *
 * @fires {WaShowEvent} wa-show - It is going to show. Cancellable: `preventDefault()` keeps it closed. The content goes in here; `anchor` and `centered` are already set
 * @fires {WaAfterShowEvent} wa-after-show - It is shown and in its place
 * @fires {WaHideEvent} wa-hide - It is going to hide. Cancellable: `preventDefault()` keeps it open. `detail: { source }`: the element that asked (the close button, what was clicked outside) or the card itself (Escape, `hide()`, the pointer leaving, another anchor, a click outside in the middle)
 * @fires {WaAfterHideEvent} wa-after-hide - It is hidden (it has no animation: it comes right after `wa-hide`)
 *
 * @slot - What it says. Whoever opens it puts it here, in the listener of `wa-show`
 *
 * @csspart card - The card next to its anchor, with a mouse: its border, its background, its shadow and its size
 * @csspart close-button - The × button, in the corner (hidden while it only peeks)
 * @csspart popup - The container the `wa-popup` positions, with a mouse (its `popup` part)
 * @csspart dialog - The `<dialog>` of the `wa-dialog`, without a mouse (its `dialog` part)
 * @csspart body - The body of the `wa-dialog`, without a mouse (its `body` part)
 *
 * @cssprop [--floating-card-shadow] - The shadow of a pinned card (`--wa-shadow-l`)
 * @cssprop [--floating-card-peek-shadow] - The shadow of one that only peeks (`--wa-shadow-m`)
 * @cssprop [--floating-card-width] - The width of the card (`400px`)
 */
export class WaxFloatingCard extends LitElement {
    static properties: {
        open: {
            type: BooleanConstructor;
            reflect: boolean;
        };
        peeking: {
            type: BooleanConstructor;
            reflect: boolean;
        };
        centered: {
            type: BooleanConstructor;
            reflect: boolean;
        };
        closeLabel: {
            type: StringConstructor;
            attribute: string;
        };
        label: {
            type: StringConstructor;
        };
        delay: {
            type: NumberConstructor;
        };
        placement: {
            type: StringConstructor;
        };
        distance: {
            type: NumberConstructor;
        };
    };
    static styles: import("lit").CSSResult;
    open: boolean;
    peeking: boolean;
    centered: boolean;
    closeLabel: string;
    label: string;
    delay: number;
    placement: string;
    distance: number;
    set anchor(anchor: Element);
    /** @returns {Element | null} What it is next to */
    get anchor(): Element;
    firstUpdated(): void;
    render(): import("lit-html").TemplateResult<1>;
    /**
     * With a mouse, it peeks (shows without being pinned) a moment later; without one, nothing.
     *
     * @param {Element} anchor What it talks about
     */
    peek(anchor: Element): void;
    /** The pointer left: a card that only peeks goes, a moment later */
    leave(): void;
    /**
     * Shows it pinned next to `anchor`, or hides it if it was pinned next to the same thing.
     *
     * @param {Element} anchor
     */
    toggle(anchor: Element): void;
    /**
     * Shows it next to `anchor`. Pinned, it stays until it is closed. If it was open, it closes first (and either listener can cancel what it is asked).
     *
     * @param {Element | null} [anchor] What it talks about; by default, the one it has
     * @param {{pinned?: boolean}} [options]
     * @returns {boolean} Whether it is shown: `wa-show` or the `wa-hide` of the one it replaced were not cancelled
     */
    show(anchor?: Element | null, { pinned }?: {
        pinned?: boolean;
    }): boolean;
    /**
     * Hides it.
     *
     * @returns {boolean} Whether it is hidden: `wa-hide` was not cancelled
     */
    hide(): boolean;
    /**
     * Puts it back next to its thing after what is inside has grown (something that came later from the network): it asks the `wa-popup` to reposition. In the middle, the CSS places it.
     */
    place(): void;
    #private;
}
import { LitElement } from 'lit';
