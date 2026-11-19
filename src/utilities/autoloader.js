// @ts-check

/**
 * The autoloader of the `wax-*` elements, like the one of Web Awesome for `wa-*`: it looks for the elements of this package that are in the page and not defined yet, and imports
 * the module of each one (`components/<name>/<name>.js`, next to this folder), which defines it. It also watches the page, so an element added later is loaded when it appears.
 *
 * Only the page: what an element has inside its shadow (a `wa-select`, another `wax-*`) is imported by the element itself.
 */

/** The folder of the components: the one next to this file, wherever the package is served from */
const COMPONENTS = new URL('../components/', import.meta.url);

/** @param {string} tag `wax-item-list` @returns {string} `item-list` */
const nameOf = tag => tag.replace(/^wax-/, '');

const observer = typeof MutationObserver === 'undefined' ? null : new MutationObserver(mutations => {
  for (const { addedNodes } of mutations) {
    for (const node of addedNodes) if (node.nodeType === Node.ELEMENT_NODE) discover(/** @type {Element} */ (node));
  }
});

/** Looks for the elements of the page that are not defined and loads them, and watches for the ones that come later */
export function startLoader() {
  discover(document);
  observer?.observe(document.documentElement, { subtree: true, childList: true });
}

export function stopLoader() {
  observer?.disconnect();
}

/**
 * Loads the `wax-*` elements that are in `root` (and `root` itself) and are not defined.
 *
 * @param {Document | Element} root
 * @returns {Promise<void>} When they are all defined
 */
export async function discover(root) {
  const tags = [...root.querySelectorAll(':not(:defined)')].map(element => element.localName);
  if (root instanceof Element && !customElements.get(root.localName)) tags.push(root.localName);
  const wanted = [...new Set(tags.filter(tag => tag.startsWith('wax-')))];
  const results = await Promise.allSettled(wanted.map(tag => import(new URL(`${nameOf(tag)}/${nameOf(tag)}.js`, COMPONENTS).href)));
  for (const result of results) if (result.status === 'rejected') console.warn(result.reason);
}
