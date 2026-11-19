// @ts-check

/**
 * The autoloader, like `webawesome.loader.js` of Web Awesome: load it with a script tag and the `wax-*` elements of the page are defined when they appear, with nothing else to import.
 * `data-webawesome-extras` says where the package is (the folder that has `components/`), as `data-webawesome` does for Web Awesome.
 *
 * ```html
 * <script type="module" data-webawesome-extras="lib/webawesome-extras" src="lib/webawesome-extras/webawesome-extras.loader.js"></script>
 * ```
 */
import { discover, startLoader, stopLoader } from './utilities/autoloader.js';
import { getBasePath, setBasePath } from './utilities/base-path.js';

startLoader();

export { discover, getBasePath, setBasePath, startLoader, stopLoader };
