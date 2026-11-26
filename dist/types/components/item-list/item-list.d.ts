/**
 * @typedef {Object} ListItem
 * @property {string} key Identifies the item: what `wax-select` and `wax-mark` give back
 * @property {string} name Plain text
 * @property {string} [icon] Plain text: an emoji
 * @property {string} [note] Plain text, smaller, after the name
 * @property {boolean} [faded] Struck through and paler (a site that has been vetoed, say)
 * @property {string} [html] Markup the application wrote, at the end of the line (a checkbox, a button): it goes into the page, not into the shadow of the list, so the page styles it
 *   and listens to it as to anything else
 */
/**
 * The usual list to choose from: icon, name and a note per line. One line is selected at a time (click it again to clear), and with Ctrl, Cmd or Shift + click
 * lines are marked, any number, for the application to do something with them (join them). It knows nothing about what the items are.
 *
 * ```html
 * <wax-item-list empty="Nothing here"></wax-item-list>
 * ```
 * ```js
 * list.items = sites.map(s => ({ key: s.id, icon: '🍺', name: s.name, note: `${s.meters} m`, faded: s.hidden }));
 * list.addEventListener('wax-select', event => open(event.detail.key));   // key is null when the selection is cleared
 * list.addEventListener('wax-mark', event => join(event.detail.keys));
 * ```
 *
 * Two things a list can also do, if asked:
 * - **Move** (`movable`): each line has a handle, dragged with mouse or finger, or moved with the arrow keys when it has the focus; the list gives back the keys in their
 *   new order (`wax-move`).
 * - **Swipe** (`swipe-label`): sliding a line sideways with the finger uncovers one action (Remove, Seen) instead of doing it straight away (`wax-swipe`).
 *
 * @summary A list to choose from, a line per item with icon, name and note, where you select, mark, move and swipe.
 * @since 0.1.0
 *
 * @element wax-item-list
 *
 * @attr {string} selected - The key of the selected line
 * @attr {string} empty - What it says with no items
 * @attr {boolean} movable - Lines have a handle to reorder them
 * @attr {string} swipe-label - The text of the action that a slid line uncovers; with it, lines can be slid
 *
 * @prop {ListItem[]} items - The lines. What was selected or marked stays so if its key is still there
 * @prop {Set<string>} marked - The keys marked with Ctrl, Cmd or Shift + click (`clearMarks()` empties it)
 * @prop {string | null} selected - The key of the selected line; `select(key, { scroll })` sets it without firing `wax-select`
 * @prop {string} empty - What it says with no items
 * @prop {boolean} movable - Lines have a handle to reorder them
 * @attr {string} handle-label - The name of the handle for who does not see it (the term `waxMove` of the language of the page when it is empty)
 * @attr {string} handle-title - The tooltip of the handle (the term `waxDrag` of the language of the page when it is empty)
 * @prop {string} handleLabel - The name of the handle (attribute `handle-label`)
 * @prop {string} handleTitle - The tooltip of the handle (attribute `handle-title`)
 * @prop {string} swipeLabel - The text of the action that a slid line uncovers (attribute `swipe-label`)
 *
 * @fires wax-select - A line was clicked (or Enter or Space on it). `detail: { key }`, `key` null when the selection was cleared. Not fired by `select()`
 * @fires wax-mark - A line was marked or unmarked with Ctrl, Cmd or Shift + click. `detail: { keys }`, all the marked ones
 * @fires wax-move - A line was moved (`movable`). `detail: { keys }`, all of them in their new order
 * @fires wax-swipe - The action of a slid line was pressed (`swipe-label`). `detail: { key }`
 *
 * @slot <key> - Own controls at the end of a line: a child with `slot="<key of the item>"`. (An item's `html` is put there for you.) What can go wrong with one tap (removing) is shown only when the line is under the mouse or has the focus: the control reads `--item-risky-visibility` and `--item-risky-width`
 *
 * @csspart list - The `ul`
 * @csspart line - One line. Also `selected`, `marked`, `faded` and `dragging` while they are so
 * @csspart handle - What moves a line
 * @csspart icon - The icon
 * @csspart name - The name
 * @csspart note - The note
 * @csspart empty - The text of an empty list
 * @csspart swipe - The action a slid line uncovers
 *
 * @cssprop [--item-border] - The line between lines (default `--wa-color-neutral-border-quiet`)
 * @cssprop [--item-hover] - A line under the pointer (`--wa-color-neutral-fill-quiet`)
 * @cssprop [--item-selected] - The selected line (`--wa-color-brand-fill-quiet`)
 * @cssprop [--item-accent] - The mark of the selected and marked lines (`--wa-color-brand-fill-loud`)
 * @cssprop [--item-muted] - Notes and the empty text (`--wa-color-text-quiet`)
 * @cssprop [--item-danger] - The swipe action (`--wa-color-danger-fill-loud`)
 * @cssprop --item-risky-visibility - Set by the list on its slots, for a control the page puts in a line to read (`visibility: var(--item-risky-visibility, visible)`): `hidden` until the line is under the mouse or has the focus, and always `hidden` on a touch screen with swiping
 * @cssprop --item-risky-width - Set by the list on its slots to `0` where a control is not shown at all (a touch screen with swiping), for the control to read as its `width`
 */
export class WaxItemList extends LitElement {
    /** Clicks on these inside a line belong to them, not to the list */
    static OWN: string;
    static properties: {
        selected: {
            type: StringConstructor;
            reflect: boolean;
        };
        empty: {
            type: StringConstructor;
        };
        movable: {
            type: BooleanConstructor;
        };
        swipeLabel: {
            type: StringConstructor;
            attribute: string;
        };
        handleLabel: {
            type: StringConstructor;
            attribute: string;
        };
        handleTitle: {
            type: StringConstructor;
            attribute: string;
        };
        _swiped: {
            state: boolean;
        };
        _dragging: {
            state: boolean;
        };
    };
    static styles: import("lit").CSSResult;
    /** @type {string | null} */
    selected: string | null;
    /** @type {string} */
    empty: string;
    /** @type {boolean} */
    movable: boolean;
    /** @type {string} */
    swipeLabel: string;
    /** @type {string} */
    handleLabel: string;
    /** @type {string} */
    handleTitle: string;
    /** @internal @type {string | null} The line slid sideways, whose action shows */
    _swiped: string | null;
    /** @internal @type {string | null} The line being dragged */
    _dragging: string | null;
    /** @param {ListItem[]} value */
    set items(value: ListItem[]);
    /** @returns {ListItem[]} */
    get items(): ListItem[];
    /** @returns {Set<string>} The keys marked with Ctrl, Cmd or Shift + click */
    get marked(): Set<string>;
    /**
     * Selects an item without telling anybody (the map chose it): `scroll` brings it into view.
     *
     * @param {string | null} key
     * @param {{scroll?: boolean}} [options]
     */
    select(key: string | null, { scroll }?: {
        scroll?: boolean;
    }): void;
    /** Clears the marks, without telling anybody */
    clearMarks(): void;
    render(): import("lit-html").TemplateResult<1> | typeof nothing;
    #private;
}
export type ListItem = {
    /**
     * Identifies the item: what `wax-select` and `wax-mark` give back
     */
    key: string;
    /**
     * Plain text
     */
    name: string;
    /**
     * Plain text: an emoji
     */
    icon?: string;
    /**
     * Plain text, smaller, after the name
     */
    note?: string;
    /**
     * Struck through and paler (a site that has been vetoed, say)
     */
    faded?: boolean;
    /**
     * Markup the application wrote, at the end of the line (a checkbox, a button): it goes into the page, not into the shadow of the list, so the page styles it
     * and listens to it as to anything else
     */
    html?: string;
};
import { LitElement } from 'lit';
import { nothing } from 'lit';
