// @ts-check

/**
 * Que el boton Atras del navegador cierre lo que esta abierto encima de la pagina (una ventana, un panel, una ficha) en vez de sacar de la pagina. Abrir esas cosas no cambia la
 * direccion, asi que para el navegador no ha pasado nada y Atras se iria a donde estabas antes; pero para quien usa la aplicacion si es un paso, sobre todo en el movil, donde Atras
 * es un gesto del sistema.
 *
 * Mientras algo esta abierto hay una entrada de mas en el historial, para gastarla. Si se cierra de otra forma (Esc, un aspa, pulsar fuera) tambien se gasta, o luego Atras haria falta
 * dos veces. Se pueden abrir varias a la vez (una ventana sobre un panel): Atras cierra la ultima.
 *
 *   const release = BackClose.push(() => cerrar());   // al abrir: lo que hace Atras
 *   ...
 *   release();                                        // al cerrar, sea como sea
 */
export class BackClose {
  /** Donde estan `history` y los eventos
   * @type {{history: History, addEventListener: (type: string, listener: () => void) => void}} */
  static host = /** @type {any} */ (globalThis);

  /**
   * Cambia donde estan `history` y los eventos, y empieza de cero: para las pruebas.
   *
   * @param {typeof BackClose.host} host
   */
  static use(host) {
    BackClose.host = host;
    BackClose.#stack = [];
    BackClose.#deferred = [];
    BackClose.#ignore = 0;
    BackClose.#listening = false;
  }

  /** @type {{id: number, close: () => void, pushed: boolean}[]} */
  static #stack = [];

  /** Los que se abrieron mientras un Atras de los nuestros aun no habia llegado: su entrada se mete cuando llegue, o ese Atras se llevaria la nueva
   * @type {{id: number, close: () => void, pushed: boolean}[]} */
  static #deferred = [];

  static #counter = 0;

  /** Cuantos `popstate` son de una entrada que acabamos de gastar nosotros y no de un Atras de quien usa la pagina */
  static #ignore = 0;

  static #listening = false;

  /**
   * Anota algo que se acaba de abrir.
   *
   * @param {() => void} close Lo que hace Atras: cerrarlo
   * @returns {() => void} Hay que llamarla al cerrarlo, de la forma que sea; si ya lo cerro Atras, no hace nada
   */
  static push(close) {
    const host = BackClose.host;
    if (!BackClose.#listening) {
      host.addEventListener('popstate', () => BackClose.#onPop());
      BackClose.#listening = true;
    }
    const entry = { id: ++BackClose.#counter, close, pushed: false };
    BackClose.#stack.push(entry);
    if (BackClose.#ignore > 0) BackClose.#deferred.push(entry);
    else BackClose.#add(entry);
    return () => BackClose.#release(entry.id);
  }

  /** @param {{id: number, pushed: boolean}} entry */
  static #add(entry) {
    BackClose.host.history.pushState({ backClose: entry.id }, '');
    entry.pushed = true;
  }

  /** @param {number} id */
  static #release(id) {
    const at = BackClose.#stack.findIndex(entry => entry.id === id);
    if (at < 0) return;   // ya lo cerro Atras
    const [entry] = BackClose.#stack.splice(at, 1);
    if (!entry.pushed) {   // aun no tenia entrada en el historial: no hay nada que gastar
      BackClose.#deferred = BackClose.#deferred.filter(e => e !== entry);
      return;
    }
    // Se gasta su entrada del historial, si es la de ahora
    if (BackClose.host.history.state?.backClose === id) {
      BackClose.#ignore++;
      BackClose.host.history.back();
    }
  }

  static #onPop() {
    if (BackClose.#ignore > 0) {
      BackClose.#ignore--;
      if (BackClose.#ignore === 0) {   // llego el Atras de los nuestros: ahora se meten las entradas que esperaban
        for (const entry of BackClose.#deferred.splice(0)) BackClose.#add(entry);
      }
      return;
    }
    BackClose.#stack.pop()?.close();
  }
}
