/** Looks for the elements of the page that are not defined and loads them, and watches for the ones that come later */
export function startLoader(): void;
export function stopLoader(): void;
/**
 * Loads the `wax-*` elements that are in `root` (and `root` itself) and are not defined, and the ones its `data-wax-preload` asks for. When they are all defined it fires
 * `wax-discovery-complete` on `root` (it does not bubble).
 *
 * @param {Document | Element} root
 * @returns {Promise<void>}
 */
export function discover(root: Document | Element): Promise<void>;
