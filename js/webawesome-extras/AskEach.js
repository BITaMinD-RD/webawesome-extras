// @ts-check

/**
 * La pregunta de siempre cuando hay que decidir sobre varias cosas ("¿sobrescribir este fichero?"): se pregunta por cada una, y se puede contestar «a todos» para el resto o
 * cancelar para que no pase nada. No sabe de que se pregunta: quien la usa pone los verbos (`labels`) y como se nombra cada cosa (`describe`).
 *
 * La logica (`AskEach.Run`) no toca el DOM; `AskEach.ask` la pinta en un `wa-dialog` de Web Awesome (lib/webawesome) con el `document` que le den. Enter es el primer
 * boton (el verbo en positivo) y Esc cancela.
 *
 *   const answers = await AskEach.ask({ document, items, describe: f => `«${f.name}»`, labels: { yes: 'Sobrescribir', no: 'Omitir', yesAll: 'Sobrescribir todos', noAll: 'Omitir todos' } });
 *   // answers: boolean[] en el orden de items, o null si se cancelo
 */

import { BackClose } from './BackClose.js';

export class AskEach {
    /** Los verbos de los botones; «Cancelar» es fijo */
    static LABELS = { yes: 'Sí', no: 'No', yesAll: 'Sí a todos', noAll: 'No a todos' };

    /**
     * Una ronda de preguntas, sin pantalla: da la pregunta de ahora (`index`, de `total`), recoge cada contestacion y dice cuando ha terminado.
     */
    static Run = class {
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
    };

    /**
     * Pregunta por cada cosa en una ventana con el progreso («2 de 5»).
     *
     * @template T
     * @param {object} options
     * @param {Document} options.document
     * @param {T[]} options.items
     * @param {(item: T) => string} options.describe Como se nombra cada una en la pregunta
     * @param {Partial<typeof AskEach.LABELS>} [options.labels]
     * @param {string} [options.title]
     * @param {string} [options.question] El principio de la pregunta; sigue lo que dice `describe`
     * @param {(value: boolean) => void} [options.onAll] Se llama si se contesta «a todos», con lo contestado: para seguir contestando igual a lo que se pregunte despues
     * @returns {Promise<boolean[] | null>} Lo contestado por cada una (`true` es el verbo en positivo); `null` si se cancelo
     */
    static ask({ document, items, describe, labels = {}, title = '', question = '', onAll = () => {} }) {
        const text = { ...AskEach.LABELS, ...labels };
        if (!items.length) return Promise.resolve([]);
        const run = new AskEach.Run(items.length);
        const make = (/** @type {string} */ tag, /** @type {Record<string, string>} */ attributes, /** @type {string} */ content) => {
            const element = document.createElement(tag);
            for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
            element.textContent = content;
            return element;
        };
        const dialog = make('wa-dialog', { class: 'campos-orden-dialogo', ...(title ? { label: title } : { 'without-header': '' }) }, '');
        const progress = make('p', { class: 'calendario-nota', role: 'status' }, '');
        const ask = make('p', {}, '');
        const buttons = /** @type {const} */ ([
            ['yes', 'brand', text.yes], ['no', 'neutral', text.no], ['yesAll', 'neutral', text.yesAll], ['noAll', 'neutral', text.noAll], ['cancel', 'neutral', 'Cancelar']
        ]).map(([action, variant, label]) => ({ action, element: make('wa-button', { slot: 'footer', variant, ...(action === 'yes' ? {} : { appearance: 'plain' }) }, label) }));
        dialog.append(progress, ask, ...buttons.map(b => b.element));
        const show = () => {
            progress.textContent = `${run.index + 1} de ${run.total}`;
            ask.textContent = `${question}${question ? ' ' : ''}${describe(items[run.index])}`;
        };
        show();

        return new Promise(resolve => {
            let finished = false;
            let release = () => {};
            const finish = () => {
                if (finished) return;
                finished = true;
                release();
                resolve(run.result);
                /** @type {any} */ (dialog).open = false;
            };
            const take = (/** @type {'yes' | 'no' | 'yesAll' | 'noAll' | 'cancel'} */ action) => {
                if (finished) return;
                if (action === 'yesAll' || action === 'noAll') onAll(action === 'yesAll');
            if (run.answer(action)) finish(); else show();
            };
            for (const { action, element } of buttons) element.addEventListener('click', () => take(action));
            // Esc y pulsar fuera cierran la ventana: es cancelar
            dialog.addEventListener('wa-hide', event => { if (event.target === dialog) take('cancel'); });
            dialog.addEventListener('wa-after-hide', event => { if (event.target === dialog) dialog.remove(); });
            // Enter es el verbo en positivo, salvo que el foco este en otro boton (ahi Enter pulsa ese)
            dialog.addEventListener('keydown', (/** @type {Event} */ event) => {
                const key = /** @type {KeyboardEvent} */ (event);
                if (key.key !== 'Enter' || key.target instanceof document.defaultView.HTMLElement && /^wa-button$/i.test(key.target.tagName)) return;
                key.preventDefault();
                take('yes');
            });
            document.body.append(dialog);
            dialog.setAttribute('open', '');
            release = BackClose.push(() => take('cancel'));
        });
    }
}
