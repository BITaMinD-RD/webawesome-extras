/**
 * A box to choose from a list with a search box to filter it by typing: what a `<select>` with many options should be. It is a Web Awesome `wa-select` whose first child is a
 * search box (a `wa-input`): when it opens the focus goes to the box, typing hides the options that do not match, and the arrows pass from the box to the options that are seen. It is
 * used where a `<select>` would go: it has `value`, `disabled`, `name` and `required`, takes part in a form, and fires `change` when something is chosen. It chooses only among what it
 * has: what is typed is for searching, it is not kept. It knows nothing of what the choices are or of any language: everything comes by property. It imports the Web Awesome components it uses (`wa-select`, `wa-option`, `wa-input`).
 *
 * ```html
 * <wax-combobox placeholder="Pick one..." empty-text="Nothing matches"></wax-combobox>
 * ```
 * ```js
 * combo.choices = [{ value: 'es', label: 'España' }, { value: 'fr', label: 'Francia' }];   // before the value: a value that is not among the choices is dropped
 * combo.value = 'es';
 * combo.addEventListener('change', () => use(combo.value));
 * ```
 *
 * If the choices are not all there and have to be fetched as the user types, listen to `wax-query` and give the new `choices`.
 *
 * @summary A select with a search box that filters its options as you type.
 * @since 0.1.0
 *
 * @element wax-combobox
 *
 * @attr {string} label - What the box is called, written above it (like the `label` of a `wa-select`); a box with no visible label needs its `<label>` or an `aria-label` around it
 * @attr {string} placeholder - The title, grey while nothing is chosen
 * @attr {string} search-placeholder - What the search box says while it is empty (the term `waxSearch` of the language of the page when empty)
 * @attr {string} empty-label - If set, a first option «choose nothing» with this name (and it is the title if there is no `placeholder`)
 * @attr {string} empty-text - What it says if what was typed matches nothing (the term `waxNoMatches` when empty)
 * @attr {string} name - The name of the field in a form
 * @attr {boolean} required - The form is not sent without a choice
 * @attr {boolean} disabled - It cannot be used yet (another one has to be chosen first)
 * @attr {number} query-delay - Milliseconds without typing before `wax-query` (300)
 *
 * @prop {{value: string, label: string}[]} choices - What is offered. What was chosen stays if it is still there
 * @prop {string} value - What is chosen, empty for nothing. Only one of the choices: anything else leaves nothing chosen. Set `choices` first
 * @prop {string} label - What the box is called, written above it
 * @prop {string} placeholder - The title, grey while nothing is chosen
 * @prop {string} searchPlaceholder - What the search box says while it is empty, the term `waxSearch` when empty (attribute `search-placeholder`)
 * @prop {string | undefined} emptyLabel - If set, a first option «choose nothing» with this name (attribute `empty-label`)
 * @prop {string} emptyText - What it says if what was typed matches nothing (the term `waxNoMatches` when empty) (attribute `empty-text`)
 * @prop {string} name - The name of the field in a form
 * @prop {boolean} required - The form is not sent without a choice
 * @prop {boolean} disabled - It cannot be used yet
 * @prop {number} queryDelay - Milliseconds without typing before `wax-query` (attribute `query-delay`)
 *
 * @fires change - Something was chosen, with the mouse, the keys or Enter in the search box (like the `change` of a `wa-select`; the typing in the search box is not announced)
 * @fires wax-query - The user typed in the search box and stopped (`query-delay`), or the search was forgotten (`query` is empty): for whoever has to fetch the choices that match. `detail: { query }`
 *
 * @csspart select - The `wa-select`
 * @csspart search - The search box
 * @csspart option - One option. Also `empty`, for the «choose nothing» one, and `none`, for the notice that nothing matches
 *
 * @cssprop [--combobox-gap] - The space below it (`--wa-space-m`: the usual one between a control and what goes below it)
 */
export class WaxCombobox extends LitElement {
    static formAssociated: boolean;
    static shadowRootOptions: {
        delegatesFocus: boolean;
        mode: ShadowRootMode;
        slotAssignment?: SlotAssignmentMode;
    };
    static properties: {
        choices: {
            attribute: boolean;
        };
        value: {
            attribute: boolean;
        };
        label: {
            type: StringConstructor;
        };
        placeholder: {
            type: StringConstructor;
        };
        searchPlaceholder: {
            type: StringConstructor;
            attribute: string;
        };
        emptyLabel: {
            type: StringConstructor;
            attribute: string;
        };
        emptyText: {
            type: StringConstructor;
            attribute: string;
        };
        name: {
            type: StringConstructor;
            noAccessor: boolean;
        };
        required: {
            type: BooleanConstructor;
            reflect: boolean;
        };
        disabled: {
            type: BooleanConstructor;
            reflect: boolean;
        };
        queryDelay: {
            type: NumberConstructor;
            attribute: string;
        };
        _query: {
            state: boolean;
        };
        _formDisabled: {
            state: boolean;
        };
    };
    static styles: import("lit").CSSResult;
    label: string;
    placeholder: string;
    searchPlaceholder: string;
    /** @type {string | undefined} */
    emptyLabel: string | undefined;
    emptyText: string;
    required: boolean;
    disabled: boolean;
    queryDelay: number;
    /** @internal @type {string} What is typed in the search box */
    _query: string;
    /** @internal @type {boolean} Its form or fieldset is disabled: apart from `disabled`, which is the author's, so enabling the fieldset again leaves it as the author wanted */
    _formDisabled: boolean;
    /** @param {string} name The attribute at once, not when the element is next drawn: a form looks for its fields by `[name]` as soon as they are made */
    set name(name: string);
    /** @returns {string} */
    get name(): string;
    set choices(choices: {
        value: string;
        label: string;
    }[]);
    /** @returns {{value: string, label: string}[]} */
    get choices(): {
        value: string;
        label: string;
    }[];
    set value(value: string);
    /** @returns {string} */
    get value(): string;
    render(): import("lit-html").TemplateResult<1>;
    /**
     * Called by the form when it (or its fieldset) is disabled.
     *
     * @internal
     * @param {boolean} disabled
     */
    formDisabledCallback(disabled: boolean): void;
    /**
     * Called by the form when it is reset: nothing is chosen.
     *
     * @internal
     */
    formResetCallback(): void;
    #private;
}
import { LitElement } from 'lit';
