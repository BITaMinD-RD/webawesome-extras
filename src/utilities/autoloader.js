// @ts-check
import { getBasePath } from './base-path.js';

/**
 * The autoloader of the `wax-*` elements, a copy of the one of Web Awesome (`utilities/autoloader` of its package) with the prefix of this package: it looks for the elements of the page that
 * start with `wax-` and are not defined yet, and imports the module of each one (`<base path>/components/<name>/<name>.js`), which defines it. It also watches the page, so an element
 * added later is loaded when it appears, and a page can ask for elements it does not have yet with `data-wax-preload="wax-combobox wax-ask-each"` on any element.
 *
 * Only the page: what an element has inside its shadow (a `wa-select`, another `wax-*`) is imported by the element itself.
 */

const observer = new MutationObserver(mutations => {
  for (const { addedNodes } of mutations) {
    for (const node of addedNodes) {
      if (node.nodeType === Node.ELEMENT_NODE) discover(/** @type {Element} */ (node));
    }
  }
});

/** Looks for the elements of the page that are not defined and loads them, and watches for the ones that come later */
export function startLoader() {
  discover(document);
  observer.observe(document.documentElement, { subtree: true, childList: true });
}

export function stopLoader() {
  observer.disconnect();
}

/**
 * Loads the `wax-*` elements that are in `root` (and `root` itself) and are not defined, and the ones its `data-wax-preload` asks for. When they are all defined it fires
 * `wax-discovery-complete` on `root` (it does not bubble).
 *
 * @param {Document | Element} root
 * @returns {Promise<void>}
 */
export async function discover(root) {
  const rootTagName = root instanceof Element ? root.tagName.toLowerCase() : '';
  const rootIsExtra = rootTagName.startsWith('wax-');
  const tags = [...root.querySelectorAll(':not(:defined)')].map(element => element.tagName.toLowerCase()).filter(tag => tag.startsWith('wax-'));
  if (rootIsExtra && !customElements.get(rootTagName)) tags.push(rootTagName);

  const preloadSelectors = root.querySelectorAll('[data-wax-preload]');
  const preloadRoots = root instanceof Element && root.hasAttribute('data-wax-preload') ? [root, ...preloadSelectors] : preloadSelectors;
  for (const element of preloadRoots) {
    tags.push(...(element.getAttribute('data-wax-preload') ?? '').split(/\s+/).filter(tag => tag.startsWith('wax-')));
  }

  const imports = await Promise.allSettled([...new Set(tags)].map(tagName => register(tagName)));
  for (const result of imports) {
    if (result.status === 'rejected') console.warn(result.reason);
  }
  await new Promise(requestAnimationFrame);
  root.dispatchEvent(new CustomEvent('wax-discovery-complete', { bubbles: false, cancelable: false, composed: true }));
}

/**
 * @param {string} tagName `wax-combobox`
 * @returns {Promise<void>} When its module is loaded
 */
function register(tagName) {
  if (customElements.get(tagName)) return Promise.resolve();
  const name = tagName.replace(/^wax-/i, '');
  const path = getBasePath(`components/${name}/${name}.js`);
  return new Promise((resolve, reject) => {
    import(/* @vite-ignore */ path).then(() => resolve()).catch(() => reject(new Error(`Unable to autoload <${tagName}> from ${path}`)));
  });
}
