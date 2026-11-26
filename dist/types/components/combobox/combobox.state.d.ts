/**
 * What `<wax-combobox>` decides without a DOM: how a text is compared with the labels of the choices (no capitals, no accents), which choices match what
 * was typed and in what order, and which option is the first one that can be taken. The element (`combobox.js`) only draws and listens; the rules are
 * here, so they run in Node and are tested there.
 *
 * @typedef {object} Choice
 * @property {string} value
 * @property {string} label
 */
export class ComboboxState {
    /**
     * Takes capitals and accents off.
     *
     * @param {string} text
     * @returns {string}
     */
    static normalize(text: string): string;
    /**
     * The ones that match what was typed: their label has all its words, no matter capitals or accents. The ones that start with what was typed come first.
     *
     * @param {Choice[]} choices
     * @param {string} query
     * @returns {Choice[]}
     */
    static filter(choices: Choice[], query: string): Choice[];
    /**
     * All the choices in the order they are drawn: the ones that match first, then the ones that do not (which are hidden).
     *
     * @param {Choice[]} choices
     * @param {string} query
     * @returns {{choice: Choice, shown: boolean}[]}
     */
    static arrange(choices: Choice[], query: string): {
        choice: Choice;
        shown: boolean;
    }[];
    /**
     * @param {Choice[]} choices
     * @param {string} value
     * @returns {string} `value` if it is one of the choices; if not, nothing (an empty string)
     */
    static valid(choices: Choice[], value: string): string;
}
/**
 * What `<wax-combobox>` decides without a DOM: how a text is compared with the labels of the choices (no capitals, no accents), which choices match what
 * was typed and in what order, and which option is the first one that can be taken. The element (`combobox.js`) only draws and listens; the rules are
 * here, so they run in Node and are tested there.
 */
export type Choice = {
    value: string;
    label: string;
};
