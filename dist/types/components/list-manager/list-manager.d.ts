/**
 * The block that repeats in the screens that edit things: the filters (if any), the search box, the «New» button and, below, the list of what there is, where one entry is chosen (clicking
 * the chosen one again does not clear it). The button is always above the list, in case it is long. It knows nothing of what the entries are or how they are filtered: whoever uses it gives
 * what is to be shown (`items`) when what is typed changes (`wax-query`). The list is a `<wax-item-list>`, whose parts are exported.
 *
 * ```html
 * <wax-list-manager search-placeholder="Search..." new-label="New" empty="Nothing here">
 *   <div slot="filters">...</div>
 * </wax-list-manager>
 * ```
 * ```js
 * manager.items = [{ key: 'a', name: 'One', icon: '🏆', note: 'a note' }];
 * manager.addEventListener('wax-select', event => open(event.detail.key));
 * manager.addEventListener('wax-new', () => openNew());
 * manager.addEventListener('wax-query', () => manager.items = filter(manager.query));
 * ```
 *
 * @summary The filters, the search box, the "New" button and an item list, for the screens that edit things.
 * @since 0.1.0
 *
 * @element wax-list-manager
 *
 * @attr {string} search-placeholder - What the search box says while it is empty (the term `waxSearch` of the language of the page when empty)
 * @attr {string} search-label - What the search box is called for who does not see it (the placeholder if it is not given)
 * @attr {string} new-label - The text of the button (the term `waxNew` when empty)
 * @attr {string} empty - What it says with nothing to show
 *
 * @prop {import('../item-list/item-list.js').ListItem[]} items - What is shown, each one a `ListItem` of `<wax-item-list>` (without `html`: the markup of a line goes to the light DOM of the list, which here is its shadow). The chosen entry stays chosen if it is still there
 * @prop {string} searchPlaceholder - What the search box says while it is empty (attribute `search-placeholder`)
 * @prop {string} searchLabel - What the search box is called for who does not see it (attribute `search-label`)
 * @prop {string} newLabel - The text of the button (attribute `new-label`)
 * @prop {string} empty - What it says with nothing to show
 * @prop {string} query - What is typed in the search box
 *
 * @fires wax-select - An entry was chosen by the user. `detail: { key }`. Not fired by `select()`
 * @fires wax-new - The «New» button was pressed
 * @fires wax-query - What is typed in the search box changed. `detail: { query }`
 *
 * @slot filters - What goes above the search box (comboboxes that filter)
 *
 * @csspart search - The search box
 * @csspart actions - The row of the «New» button
 * @csspart new-button - The «New» button
 * @csspart items - The list (a `<wax-item-list>`), which does not grow more than what fits
 * @csspart line - A line of the list. Also `selected`, `marked`, `faded`, `icon`, `name`, `note` and `empty`, those of `<wax-item-list>`
 */
export class WaxListManager extends LitElement {
    static properties: {
        items: {
            attribute: boolean;
        };
        searchPlaceholder: {
            type: StringConstructor;
            attribute: string;
        };
        searchLabel: {
            type: StringConstructor;
            attribute: string;
        };
        newLabel: {
            type: StringConstructor;
            attribute: string;
        };
        empty: {
            type: StringConstructor;
        };
    };
    static styles: import("lit").CSSResult;
    /** @type {import('../item-list/item-list.js').ListItem[]} */
    items: import('../item-list/item-list.js').ListItem[];
    searchPlaceholder: string;
    searchLabel: string;
    newLabel: string;
    empty: string;
    /** @returns {string} What is typed in the search box */
    get query(): string;
    /**
     * Chooses an entry without telling anybody (the application chose it).
     *
     * @param {string | null} key `null`, none
     */
    select(key: string | null): void;
    render(): import("lit-html").TemplateResult<1>;
    firstUpdated(): void;
    updated(): void;
    #private;
}
import { LitElement } from 'lit';
