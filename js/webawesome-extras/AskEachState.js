// @ts-check

/**
 * What `<wax-ask-each>` decides without a DOM: which question is the current one, what each answer does («yes to all» answers the rest the same way, cancelling answers nothing,
 * not even what was answered already), and when it is over. The element (`WaxAskEach.js`) only draws and listens; the rules are here, so they run in Node and are tested there.
 */
export class AskEachState {
  /** @type {boolean[]} */
  #answers = [];
  #cancelled = false;
  #total;

  /**
   * @param {number} total Cuantas cosas se preguntan
   * @param {boolean | null} [preset] Si ya se contesto «a todos» antes: `true` o `false` contestan todo sin preguntar
   */
  constructor(total, preset = null) {
    this.#total = total;
    if (preset !== null) this.#answers = Array.from({ length: total }, () => preset);
  }

  get total() { return this.#total; }

  /** @returns {number} La pregunta de ahora, desde 0; igual a `total` si ya no queda ninguna */
  get index() { return this.#cancelled ? this.#total : this.#answers.length; }

  get done() { return this.#cancelled || this.#answers.length >= this.#total; }

  get cancelled() { return this.#cancelled; }

  /** @returns {boolean} Si lo ultimo que se hizo fue contestar «a todos» (o, sin preguntar, por `preset`) */
  get all() { return this.#all; }
  #all = false;

  /**
   * @param {'yes' | 'no' | 'yesAll' | 'noAll' | 'cancel'} action
   * @returns {boolean} Si se ha terminado
   */
  answer(action) {
    if (this.done) return true;
    if (action === 'cancel') { this.#cancelled = true; return true; }
    const value = action === 'yes' || action === 'yesAll';
    if (action === 'yesAll' || action === 'noAll') {
      this.#all = true;
      while (this.#answers.length < this.#total) this.#answers.push(value);
    } else {
      this.#answers.push(value);
    }
    return this.done;
  }

  /** @returns {boolean[] | null} Lo contestado, en orden; `null` si se cancelo o falta */
  get result() { return this.#cancelled || !this.done ? null : [...this.#answers]; }
}
