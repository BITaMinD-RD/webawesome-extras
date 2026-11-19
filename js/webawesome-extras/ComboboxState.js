// @ts-check

/**
 * What `<wax-combobox>` decides without a DOM: how a text is compared with the labels of the choices (no capitals, no accents), which choices match what
 * was typed and in what order, and which option is the first one that can be taken. The element (`WaxCombobox.js`) only draws and listens; the rules are
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
  static normalize(text) {
    return String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }

  /**
   * The ones that match what was typed: their label has all its words, no matter capitals or accents. The ones that start with what was typed come first.
   *
   * @param {Choice[]} choices
   * @param {string} query
   * @returns {Choice[]}
   */
  static filter(choices, query) {
    const words = ComboboxState.normalize(query).split(/\s+/).filter(Boolean);
    if (!words.length) return choices;
    const found = choices.filter(c => words.every(w => ComboboxState.normalize(c.label).includes(w)));
    const whole = words.join(' ');
    return [...found.filter(c => ComboboxState.normalize(c.label).startsWith(whole)), ...found.filter(c => !ComboboxState.normalize(c.label).startsWith(whole))];
  }

  /**
   * All the choices in the order they are drawn: the ones that match first, then the ones that do not (which are hidden).
   *
   * @param {Choice[]} choices
   * @param {string} query
   * @returns {{choice: Choice, shown: boolean}[]}
   */
  static arrange(choices, query) {
    const found = ComboboxState.filter(choices, query);
    const shown = new Set(found.map(c => c.value));
    return [...found.map(choice => ({ choice, shown: true })), ...choices.filter(c => !shown.has(c.value)).map(choice => ({ choice, shown: false }))];
  }

  /**
   * @param {Choice[]} choices
   * @param {string} value
   * @returns {string} `value` if it is one of the choices; if not, nothing (an empty string)
   */
  static valid(choices, value) {
    return choices.some(c => c.value === value) ? value : '';
  }
}
