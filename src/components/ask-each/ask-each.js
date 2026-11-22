// @ts-check
import { LitElement, html } from 'lit';
import '@awesome.me/webawesome/dist/components/dialog/dialog.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import { LocalizeController, term } from '../../utilities/localize.js';
import { AskEachState } from './ask-each.state.js';
import styles from './ask-each.styles.js';
import { WaxAllEvent } from '../../events/all.js';
import { WaxAnswerEvent } from '../../events/answer.js';

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
  static properties = {
    open: { type: Boolean, reflect: true },
    label: { type: String },
    question: { type: String },
    lightDismiss: { type: Boolean, attribute: 'light-dismiss' },
    describe: { attribute: false },
    labels: { attribute: false },
    _index: { state: true }
  };

  static styles = styles;

  /** @type {any[]} */
  #items = [];

  #localize = new LocalizeController(this);

  /** @type {AskEachState | null} */
  #run = null;

  /** @type {((answers: boolean[] | null) => void) | null} */
  #resolve = null;

  /** Why the dialog is closing: `answered` and `cancelled` are decided here, `dismissed` is what the dialog does by itself */
  #reason = 'dismissed';

  constructor() {
    super();
    this.open = false;
    this.label = '';
    this.question = '';
    this.lightDismiss = false;
    /** @type {(item: any) => string} */
    this.describe = item => String(item);
    /** @type {Record<string, string>} */
    this.labels = {};
    /** @internal @type {number} The question that is asked now */
    this._index = 0;
  }

  /**
   * Asks about each thing in turn, in a dialog, and resolves when it has closed with what was answered for each one: booleans in the order of the items (`true` is the positive verb), `null` if it was cancelled, `[]` if there was nothing to ask.
   *
   * @template T
   * @param {T[]} items What is asked about
   * @returns {Promise<boolean[] | null>} What was answered for each one (`true` is the positive verb); `null` if it was cancelled. Nothing to ask, nothing answered: `[]`
   */
  ask(items) {
    this.#settle(null);
    if (!items.length) return Promise.resolve([]);
    this.#items = items;
    this.#run = new AskEachState(items.length);
    this._index = 0;
    this.#reason = 'dismissed';
    return new Promise(resolve => {
      this.#resolve = resolve;
      this.open = true;
    });
  }

  /** Opens it, like a `wa-dialog` (without anything to ask there is nothing to see: `ask()` is what opens it with questions) */
  show() {
    this.open = true;
  }

  /** Closes it: what was being asked is cancelled */
  hide() {
    this.open = false;
  }

  /** @returns {Record<string, any>} The texts: each one given in `labels`, or else the one of the language */
  get #text() {
    const { labels } = this;
    const localize = this.#localize;
    return {
      yes: labels.yes ?? term(localize, 'waxYes'),
      no: labels.no ?? term(localize, 'waxNo'),
      yesAll: labels.yesAll ?? term(localize, 'waxYesAll'),
      noAll: labels.noAll ?? term(localize, 'waxNoAll'),
      cancel: labels.cancel ?? term(localize, 'waxCancel'),
      progress: (/** @type {number} */ n, /** @type {number} */ total) => labels.progress === undefined ? term(localize, 'waxProgress', n, total) : labels.progress.replace('{n}', String(n)).replace('{total}', String(total))
    };
  }

  render() {
    const text = this.#text;
    const run = this.#run;
    const total = this.#items.length;
    const item = this.#items[Math.min(this._index, total - 1)];
    return html`<wa-dialog part="dialog" exportparts="dialog:dialog-base, header, title, body, footer, close-button" label=${this.label} ?without-header=${!this.label} ?light-dismiss=${this.lightDismiss}
        @wa-show=${(/** @type {Event} */ event) => this.#showing(event)} @wa-hide=${(/** @type {Event} */ event) => this.#hiding(event)} @wa-after-hide=${(/** @type {Event} */ event) => this.#hidden(event)}
        @keydown=${(/** @type {KeyboardEvent} */ event) => this.#key(event)}>
      <p part="progress" role="status">${run ? text.progress(this._index + 1, total) : ''}</p>
      <p part="question">${run ? `${this.question}${this.question ? ' ' : ''}${this.describe(item)}` : ''}</p>
      ${/** @type {const} */ ([['yes', 'brand', text.yes, 'yes'], ['no', 'neutral', text.no, 'no'], ['yesAll', 'neutral', text.yesAll, 'yes-all'], ['noAll', 'neutral', text.noAll, 'no-all'], ['cancel', 'neutral', text.cancel, 'cancel']])
        .map(([action, variant, label, name]) => html`<wa-button slot="footer" part="button ${name}" variant=${variant} appearance=${action === 'yes' ? 'accent' : 'plain'}
          @click=${() => this.#take(action)}>${label}</wa-button>`)}
    </wa-dialog>`;
  }

  /** @param {import('lit').PropertyValues} changed */
  async updated(changed) {
    // The dialog follows `open`; it tells back, in its events, when it really is open or closed. Once it has drawn itself the first time: before that, `open` would show it without a `wa-show`
    const dialog = /** @type {any} */ (this.renderRoot.querySelector('wa-dialog'));
    if (!changed.has('open') || !dialog) return;
    await dialog.updateComplete;
    if (dialog.open !== this.open) dialog.open = this.open;
  }

  /** @param {'yes' | 'no' | 'yesAll' | 'noAll' | 'cancel'} action */
  #take(action) {
    const run = this.#run;
    if (!run || run.done) return;
    const index = run.index;
    if (action === 'yesAll' || action === 'noAll') this.dispatchEvent(new WaxAllEvent({ value: action === 'yesAll' }));
    const done = run.answer(action);
    this.dispatchEvent(new WaxAnswerEvent({ index, item: this.#items[index], action }));
    if (!done) { this._index = run.index; return; }
    this.#reason = action === 'cancel' ? 'cancelled' : 'answered';
    this.open = false;
  }

  /** @param {KeyboardEvent} event Enter is the positive verb, unless the focus is on another button (there Enter presses that one) */
  #key(event) {
    if (event.key !== 'Enter' || (event.target instanceof HTMLElement && /^wa-button$/i.test(event.target.tagName))) return;
    event.preventDefault();
    this.#take('yes');
  }

  /** @param {Event} event The dialog begins to open. Its `wa-show` goes out as it is (from this element, for whoever listens), and can be cancelled there: then it does not open and there are no answers */
  #showing(event) {
    if (event.target !== event.currentTarget) return;
    // Whoever listens is called after this, in the same dispatch: when it returns, the event says if somebody cancelled it
    queueMicrotask(() => {
      if (!event.defaultPrevented) return;
      this.open = false;
      this.#settle(null);
    });
  }

  /** @param {Event} event The dialog begins to close (its `wa-hide` goes out as it is, and can be cancelled there: then it stays open) */
  #hiding(event) {
    if (event.target !== event.currentTarget) return;
    queueMicrotask(() => { if (event.defaultPrevented) this.open = true; });
  }

  /** @param {Event} event The dialog is closed: whoever asked gets the answers, or null if it was cancelled or dismissed */
  #hidden(event) {
    if (event.target !== event.currentTarget) return;
    this.open = false;
    const answers = this.#reason === 'answered' ? this.#run?.result ?? null : null;
    this.#run = null;
    this.#settle(answers);
  }

  /** @param {boolean[] | null} answers Gives the answer to whoever asked, once */
  #settle(answers) {
    const resolve = this.#resolve;
    this.#resolve = null;
    resolve?.(answers);
  }
}

if (!customElements.get('wax-ask-each')) customElements.define('wax-ask-each', WaxAskEach);
