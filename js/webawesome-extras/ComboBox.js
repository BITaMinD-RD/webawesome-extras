// @ts-check

/**
 * Un cuadro donde se elige de una lista con un buscador para filtrarla escribiendo: lo que un `<select>` con muchas opciones deberia ser. Es un `wa-select` de Web
 * Awesome (lib/webawesome) cuyo primer hijo es una caja de busqueda (un `wa-input`): al abrirlo el foco va a la caja, escribir esconde las opciones que no encajan y las
 * flechas pasan de la caja a las opciones que se ven. Se usa donde iria un `<select>`: tiene `value` (leer y poner), `disabled`, `hidden`, `name` y `required`, y manda
 * `change` cuando se elige algo. El titulo es el `placeholder`. No sabe de que son las opciones ni de que idioma: todo le llega por parametro. Solo elige entre lo que
 * hay: lo escrito en la caja es para buscar, no se queda como valor.
 *
 *   const combo = new ComboBox({ document, choices: [{ value: 'a', label: 'Uno' }], placeholder: 'Elige uno...', onChange: v => ... });
 *   parent.append(combo.element);
 *
 * Necesita Web Awesome cargado. Los estilos son `.combo` de controls.css y los de `wa-select`.
 */
export class ComboBox {
  /** @type {HTMLElement} El `wa-select`: lo que se pone en la pagina */
  element;

  /** @type {HTMLElement} La caja de busqueda, el primer hijo del `wa-select` */
  search;

  /** La opcion «no hay nada que encaje», escondida mientras haya alguna
   * @type {HTMLElement} */
  #none;

  /** Las opciones de ahora, por valor
   * @type {Map<string, HTMLElement>} */
  #items = new Map();

  /** La de «no elegir nada» (`emptyLabel`), si la hay
   * @type {HTMLElement | null} */
  #empty = null;

  /** @type {ComboBox.Choice[]} */
  #choices = [];

  /** @type {string} */
  #value = '';

  /** @type {ComboBox.Options} */
  #options;

  /** @type {Document} */
  #document;

  /** @param {ComboBox.Options} options */
  constructor(options) {
    this.#options = options;
    this.#document = options.document ?? globalThis.document;
    this.#choices = options.choices ?? [];
    this.#value = options.value ?? '';

    const doc = this.#document;
    // Los atributos y no las propiedades: el componente puede no haberse cargado todavia
    this.element = doc.createElement('wa-select');
    this.element.setAttribute('class', 'combo');
    this.element.setAttribute('placeholder', options.placeholder ?? options.emptyLabel ?? '');
    if (options.required === true) this.element.setAttribute('required', '');
    if (options.name) this.element.setAttribute('name', options.name);
    Object.defineProperty(this.element, 'combo', { value: this });

    this.search = doc.createElement('wa-input');
    this.search.setAttribute('type', 'search');
    // El valor, como atributo y como propiedad: si el componente aun no esta cargado, `value` se lee igual; y nunca sin valor, que vacia da `null` y no `''`
    this.search.setAttribute('value', '');
    /** @type {any} */ (this.search).value = '';
    this.search.setAttribute('placeholder', options.searchPlaceholder ?? 'Buscar...');
    this.search.setAttribute('with-clear', '');
    this.search.setAttribute('class', 'combo-search');
    this.search.setAttribute('autocomplete', 'off');
    // Lo que pasa en la caja es de la caja: sin esto, sus `input` y `change` suben hasta quien escucha el combo y creeria que se ha elegido algo
    for (const type of ['input', 'change']) this.search.addEventListener(type, event => event.stopPropagation());
    this.search.addEventListener('input', () => {
      const query = /** @type {any} */ (this.search).value ?? '';
      this.#filter(query);
      this.#ask(query);
    });
    this.search.addEventListener('keydown', event => this.#onSearchKey(event));

    this.#none = doc.createElement('wa-option');
    this.#none.setAttribute('class', 'combo-vacio');
    this.#none.setAttribute('disabled', '');
    this.#none.textContent = options.emptyText ?? '';
    this.#none.hidden = true;

    this.element.addEventListener('change', event => {
      if (event.target !== this.element) return;
      const value = String(/** @type {any} */ (this.element).value ?? '');
      if (value === this.#value) return;
      this.#value = value;
      this.#options.onChange?.(value);
    });
    // Recien abierto, todo y a escribir: el foco va a la caja en cuanto empieza a abrirse, que si no se pierden las primeras letras; al cerrar, la busqueda se olvida
    const focusSearch = () => /** @type {any} */ (this.search).focus?.();
    this.element.addEventListener('wa-show', event => {
      if (event.target !== this.element) return;
      this.#clearSearch();
      requestAnimationFrame(focusSearch);
    });
    this.element.addEventListener('wa-after-show', event => { if (event.target === this.element) focusSearch(); });
    this.element.addEventListener('wa-after-hide', event => { if (event.target === this.element) this.#clearSearch(); });

    this.#render();
  }

  /**
   * Quita las mayusculas y los acentos.
   *
   * @param {string} text
   * @returns {string}
   */
  static normalize(text) {
    return String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }

  /**
   * Las que encajan con lo escrito: contienen todas sus palabras, sin mayusculas ni acentos. Las que empiezan por lo escrito, primero.
   *
   * @param {ComboBox.Choice[]} choices
   * @param {string} query
   * @returns {ComboBox.Choice[]}
   */
  static filter(choices, query) {
    const words = ComboBox.normalize(query).split(/\s+/).filter(Boolean);
    if (!words.length) return choices;
    const found = choices.filter(c => words.every(w => ComboBox.normalize(c.label).includes(w)));
    const whole = words.join(' ');
    return [...found.filter(c => ComboBox.normalize(c.label).startsWith(whole)), ...found.filter(c => !ComboBox.normalize(c.label).startsWith(whole))];
  }

  /**
   * La posicion tras moverse por una lista, dando la vuelta al llegar al final.
   *
   * @param {number} index La de ahora; -1, ninguna
   * @param {number} delta
   * @param {number} count
   * @returns {number}
   */
  static step(index, delta, count) {
    if (!count) return -1;
    if (index < 0) return delta > 0 ? 0 : count - 1;
    return (index + delta + count) % count;
  }

  /** @returns {string} Lo elegido; vacio, nada */
  get value() {
    return this.#value;
  }

  /** @param {string} value Una que este entre las opciones; si no, nada */
  set value(value) {
    this.#value = this.#choices.some(c => c.value === value) ? value : '';
    /** @type {any} */ (this.element).value = this.#value;
  }

  /** @returns {boolean} */
  get disabled() {
    return this.element.hasAttribute('disabled');
  }

  /** @param {boolean} disabled Un cuadro que no se puede elegir todavia (falta elegir otro antes) se ve apagado */
  set disabled(disabled) {
    this.element.toggleAttribute('disabled', disabled);
    /** @type {any} */ (this.element).disabled = disabled;
  }

  /** @returns {ComboBox.Choice[]} */
  get choices() {
    return this.#choices;
  }

  /**
   * Cambia lo que se ofrece. Lo elegido se queda si sigue estando.
   *
   * @param {ComboBox.Choice[]} choices
   * @param {{placeholder?: string}} [extra]
   */
  setChoices(choices, { placeholder } = {}) {
    this.#choices = choices;
    if (placeholder !== undefined) this.element.setAttribute('placeholder', placeholder);
    if (!choices.some(c => c.value === this.#value)) this.#value = '';
    this.#render();
  }

  /** Las opciones del `wa-select`: la caja de busqueda, la de «no elegir nada» si la hay, una por cada una de las que se ofrecen y el aviso de que nada encaja */
  #render() {
    const doc = this.#document;
    this.#items = new Map(this.#choices.map(choice => {
      const item = doc.createElement('wa-option');
      item.setAttribute('value', choice.value);
      item.textContent = choice.label;
      return [choice.value, item];
    }));
    this.#empty = null;
    if (this.#options.emptyLabel !== undefined) {
      this.#empty = doc.createElement('wa-option');
      this.#empty.setAttribute('value', '');
      this.#empty.textContent = this.#options.emptyLabel;
    }
    // Si se escribia en la caja, al volver a ponerla no se pierde el foco (las opciones pueden cambiar mientras se escribe, con `onQuery`)
    const typing = this.#document.activeElement === this.search;
    this.element.replaceChildren(this.search, ...(this.#empty ? [this.#empty] : []), ...this.#items.values(), this.#none);
    if (typing) requestAnimationFrame(() => /** @type {any} */ (this.search).focus?.());
    this.#filter('');
    /** @type {any} */ (this.element).value = this.#value;
  }

  /** Esconde las opciones que no encajan con lo escrito y pone primero las que empiezan por ello; nada escrito, todas, y sin nada que encaje, el aviso
   * @param {string} query */
  #filter(query) {
    const found = ComboBox.filter(this.#choices, query);
    const shown = new Set(found.map(c => c.value));
    const ordered = [...found, ...this.#choices.filter(c => !shown.has(c.value))].map(c => /** @type {HTMLElement} */ (this.#items.get(c.value)));
    for (const [value, item] of this.#items) item.hidden = !shown.has(value);
    if (this.#empty) this.#empty.hidden = query.trim() !== '';
    this.#none.hidden = found.length > 0;
    this.element.append(...ordered, this.#none);
  }

  #clearSearch() {
    /** @type {any} */ (this.search).value = '';
    this.#filter('');
    if (this.#asked !== '') this.#ask('');   // al olvidar la busqueda, vuelve lo de siempre
  }

  /** Lo ultimo que se pidio a quien da las opciones (`onQuery`), para no pedir dos veces lo mismo
   * @type {string} */
  #asked = '';

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  #timer;

  /**
   * Si las opciones no estan todas en el cuadro y hay que ir a buscarlas (`onQuery`), se le dice a quien las da lo que se ha escrito, un momento despues de dejar de
   * escribir.
   *
   * @param {string} query
   */
  #ask(query) {
    const { onQuery, queryDelay = 300 } = this.#options;
    if (!onQuery) return;
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      const wanted = query.trim();
      if (wanted === this.#asked) return;
      this.#asked = wanted;
      onQuery(wanted);
    }, queryDelay);
  }

  /** Intro en la caja elige la primera que se ve, como el combo de siempre
   * @param {KeyboardEvent} event */
  #onSearchKey(event) {
    // Escribir es de la caja: si la tecla sube hasta el desplegable, este la toma por buscar una opcion y se lleva el foco a la primera que empieza por esa letra
    if (event.key.length === 1 || ['Backspace', 'Delete', 'Home', 'End', 'ArrowLeft', 'ArrowRight'].includes(event.key)) event.stopPropagation();
    if (event.key !== 'Enter') return;
    event.preventDefault();   // no envia el formulario: solo elige
    const first = [...this.element.querySelectorAll('wa-option')].find(item => !item.hidden && !item.hasAttribute('disabled'));
    if (!first) return;
    const value = first.getAttribute('value') ?? '';
    /** @type {any} */ (this.element).value = value;
    // Poner el valor desde el codigo no avisa: se avisa aqui, como cuando se elige con el raton
    this.element.dispatchEvent(new (this.#document.defaultView?.Event ?? Event)('change', { bubbles: true }));
    /** @type {any} */ (this.element).open = false;
  }
}

/**
 * @typedef {object} ComboBox.Choice
 * @property {string} value
 * @property {string} label
 */

/**
 * @typedef {object} ComboBox.Options
 * @property {Document} [document]
 * @property {ComboBox.Choice[]} [choices]
 * @property {string} [value] La elegida al principio
 * @property {string} [placeholder] El titulo, en gris mientras no haya nada elegido
 * @property {string} [searchPlaceholder] Lo que dice la caja de busqueda mientras esta vacia («Buscar...» si no se dice)
 * @property {string} [emptyLabel] Si lo hay, una primera opcion «no elegir nada» con este nombre (y es el titulo si no hay `placeholder`)
 * @property {string} [emptyText] Lo que se dice si lo escrito no encaja con nada
 * @property {string} [name] Si lo hay, un campo oculto con este nombre lleva lo elegido a un formulario
 * @property {boolean} [required] El formulario no se envia sin elegir
 * @property {(value: string) => void} [onChange]
 * @property {(query: string) => void} [onQuery] Si las opciones no estan todas aqui y hay que ir a buscarlas: se llama con lo escrito, un momento despues de dejar de escribir, y con
 *   una cadena vacia al olvidarse la busqueda. Quien la recibe pone las opciones nuevas con `setChoices`
 * @property {number} [queryDelay] Los milisegundos de espera antes de llamar a `onQuery` (300 si no se dice)
 */
