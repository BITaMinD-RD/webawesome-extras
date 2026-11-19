// @ts-check

/**
 * The autoloader, like `webawesome.loader.js` of Web Awesome: load it with a script tag and the `wax-*` elements of the page are defined when they appear, with nothing else to import.
 *
 * ```html
 * <script type="module" src="lib/webawesome-extras/webawesome-extras.loader.js"></script>
 * ```
 */
import { discover, startLoader, stopLoader } from './utilities/autoloader.js';

startLoader();

export { discover, startLoader, stopLoader };
