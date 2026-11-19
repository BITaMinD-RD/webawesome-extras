// @ts-check

/**
 * Puts the styles of a component into the page, once per document: for what the component builds in the light DOM (the `wa-select` of `ComboBox`, the card of
 * `FloatingCard`, the line of `ListManager`, the controls a line of `<wax-item-list>` holds), where its own shadow does not reach. It goes at the start of the
 * `<head>`, so any style sheet of the page that comes after it wins with the same specificity, as with a `<link>` placed before the others.
 *
 * It is how the components that are not custom elements yet carry their styles; when each one becomes an element (`wax-*`), its styles move into its shadow and
 * it stops calling this. Without a `<head>` (Node, the fake documents of the tests) it does nothing.
 */

/** @type {WeakMap<object, Set<string>>} */
const installed = new WeakMap();

/**
 * @param {Document | undefined} document
 * @param {string} name What the styles are of (`combo-box`), in `data-wax-styles`
 * @param {string} css
 */
export function installStyles(document, name, css) {
  const head = document?.head;
  if (!head || typeof head.prepend !== 'function' || typeof document.createElement !== 'function') return;
  const names = installed.get(document) ?? new Set();
  installed.set(document, names);
  if (names.has(name)) return;
  names.add(name);
  const style = document.createElement('style');
  style.setAttribute('data-wax-styles', name);
  style.textContent = css;
  head.prepend(style);
}
