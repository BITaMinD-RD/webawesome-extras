/**
 * What `<wax-ask-each>` decides without a DOM: which question is the current one, what each answer does («yes to all» answers the rest the same way, cancelling answers nothing,
 * not even what was answered already), and when it is over. The element (`ask-each.js`) only draws and listens; the rules are here, so they run in Node and are tested there.
 */
export class AskEachState {
    /**
     * @param {number} total Cuantas cosas se preguntan
     * @param {boolean | null} [preset] Si ya se contesto «a todos» antes: `true` o `false` contestan todo sin preguntar
     */
    constructor(total: number, preset?: boolean | null);
    get total(): number;
    /** @returns {number} La pregunta de ahora, desde 0; igual a `total` si ya no queda ninguna */
    get index(): number;
    get done(): boolean;
    get cancelled(): boolean;
    /** @returns {boolean} Si lo ultimo que se hizo fue contestar «a todos» (o, sin preguntar, por `preset`) */
    get all(): boolean;
    /**
     * @param {'yes' | 'no' | 'yesAll' | 'noAll' | 'cancel'} action
     * @returns {boolean} Si se ha terminado
     */
    answer(action: 'yes' | 'no' | 'yesAll' | 'noAll' | 'cancel'): boolean;
    /** @returns {boolean[] | null} Lo contestado, en orden; `null` si se cancelo o falta */
    get result(): boolean[];
    #private;
}
